import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import httpStatus from "../utils/httpStatus.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logActivity } from "../utils/logger.js";
import Email from "../utils/email.js";
import crypto from "crypto";

const signAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "15m" // Short lived access token
    });
};

const signRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_SECRET_KEY, {
        expiresIn: "7d" // Long lived refresh token
    });
};

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isActive || !(await user.comparePassword(password))) {
        return next(new AppError("Incorrect email or password", httpStatus.UNAUTHORIZED));
    }

    if (!user.isEmailVerified) {
        return next(new AppError("Please verify your email address before logging in. Check your inbox for the verification link.", httpStatus.FORBIDDEN));
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store hashed refresh token server-side for invalidation
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    user.refreshToken = hashedToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;

    // Record Audit Log
    await logActivity({
        userId: user._id,
        userRole: user.role,
        action: 'LOGIN',
        resource: 'SYSTEM',
        details: { email: user.email }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: "success",
        accessToken,
        refreshToken,
        data: {
            user
        }
    });
});

const register = catchAsync(async (req, res, next) => {
    const { firstName, lastName, email, password, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError("Email is already registered! Please use a different email or login.", httpStatus.BAD_REQUEST));
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        role: "candidate",
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    newUser.password = undefined;

    // Record Audit Log
    await logActivity({
        userId: newUser._id,
        userRole: newUser.role,
        action: 'CREATE',
        resource: 'USER',
        resourceId: newUser._id,
        details: { type: 'SELF_REGISTER', email: newUser.email }
    }, req);

    // Send Verification Email (Don't await, let it happen in background)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    new Email(newUser, verifyUrl).sendVerificationEmail().catch(err => {
        console.error("Verification email failed:", err);
    });

    res.status(httpStatus.CREATED).json({
        status: "success",
        message: "Registration successful! Please check your email to verify your account before logging in.",
        data: {
            user: { _id: newUser._id, email: newUser.email }
        }
    });
});

const verifyEmail = catchAsync(async (req, res, next) => {
    const { token } = req.body;
    
    if (!token) {
        return next(new AppError("Verification token is required", httpStatus.BAD_REQUEST));
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError("Token is invalid or has expired", httpStatus.BAD_REQUEST));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    await logActivity({
        userId: user._id,
        userRole: user.role,
        action: 'EMAIL_VERIFIED',
        resource: 'USER',
        details: { email: user.email }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: "success",
        message: "Email successfully verified. You can now log in."
    });
});

const resendVerificationEmail = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError("Email address is required", httpStatus.BAD_REQUEST));
    }

    const user = await User.findOne({ email });

    // Generic response to prevent email enumeration:
    // Only act if the user exists AND is not yet verified.
    if (user && !user.isEmailVerified) {
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

        user.emailVerificationToken = hashedVerificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        new Email(user, verifyUrl).sendVerificationEmail().catch(err => {
            console.error("Resend verification email failed:", err);
        });

        // Log resend activity
        await logActivity({
            userId: user._id,
            userRole: user.role,
            action: 'VERIFICATION_SENT',
            resource: 'USER',
            details: { type: 'RESEND', email: user.email }
        }, req);
    }

    // Always return success to avoid leaking whether an account exists
    res.status(httpStatus.SUCCESS).json({
        status: "success",
        message: "If that email is registered and unverified, a new verification link has been sent."
    });
});

const refresh = catchAsync(async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return next(new AppError("Refresh token is required!", httpStatus.BAD_REQUEST));
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET_KEY);

        // Hash the incoming token to compare with the stored hash
        const hashedIncoming = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findById(decoded.id).select("+refreshToken");
        
        if (!user) {
            return next(new AppError("User no longer exists.", httpStatus.UNAUTHORIZED));
        }

        // Token Reuse Detection (Theft mitigation)
        if (user.refreshToken && user.refreshToken !== hashedIncoming) {
            // A cryptographically valid but OUTDATED token was presented.
            // This strongly implies an old token was stolen and reused.
            // Action: Invalidate the current active token to force re-login globally.
            user.refreshToken = null;
            await user.save({ validateBeforeSave: false });

            // Log this critical security event
            await logActivity({
                userId: user._id,
                userRole: user.role,
                action: 'WARNING',
                resource: 'SYSTEM',
                details: { event: "REFRESH_TOKEN_REUSE", message: "Suspicious token reuse detected. All sessions invalidated." }
            }, req);

            return next(new AppError("Security alert: Suspicious session activity detected. Please securely log in again.", httpStatus.UNAUTHORIZED));
        }

        if (!user.refreshToken) {
            // Logged out or manually invalidated
            return next(new AppError("Invalid or expired session. Please log in again.", httpStatus.UNAUTHORIZED));
        }

        const accessToken = signAccessToken(user._id);
        const newRefreshToken = signRefreshToken(user._id);

        // ROTATION: Store the new hashed refresh token and invalidate the old one
        const newHashedToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
        user.refreshToken = newHashedToken;
        await user.save({ validateBeforeSave: false });

        res.status(httpStatus.SUCCESS).json({
            status: "success",
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        return next(new AppError("Invalid or expired refresh token", httpStatus.UNAUTHORIZED));
    }
});

const logout = catchAsync(async (req, res, next) => {
    if (req.user) {
        // Invalidate token server-side
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

        await logActivity({
            userId: req.user._id,
            action: 'LOGOUT',
            resource: 'SYSTEM',
            details: { email: req.user.email }
        }, req);
    }

    res.status(httpStatus.SUCCESS).json({
        status: "success",
        message: "Logged out successfully"
    });
});

const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return generic message to prevent email enumeration
    if (!user) {
        return res.status(httpStatus.SUCCESS).json({
            status: "success",
            message: "If that email is registered, you'll receive a password reset link"
        });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
        await new Email(user, resetUrl).sendPasswordReset();

        // Log password reset request
        await logActivity({
            userId: user._id,
            userRole: user.role,
            action: 'VERIFICATION_SENT',
            resource: 'USER',
            details: { type: 'FORGOT_PASSWORD', email: user.email }
        }, req);
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Email could not be sent. Please try again.", httpStatus.INTERNAL_SERVER_ERROR));
    }

    res.status(httpStatus.SUCCESS).json({
        status: "success",
        message: "Password reset link sent to email"
    });
});

const resetPassword = catchAsync(async (req, res, next) => {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError("Invalid or expired reset token", httpStatus.BAD_REQUEST));
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await logActivity({
        userId: user._id,
        userRole: user.role,
        action: 'PASSWORD_RESET',
        resource: 'USER',
        details: { email: user.email }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: "success",
        message: "Password reset successful"
    });
});

export default {
    login,
    register,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
};
