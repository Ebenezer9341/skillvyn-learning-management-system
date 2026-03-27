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

    const newUser = await User.create({
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        role: "candidate"
    });

    const accessToken = signAccessToken(newUser._id);
    const refreshToken = signRefreshToken(newUser._id);

    // Store hashed refresh token server-side for invalidation
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    newUser.refreshToken = hashedToken;
    await newUser.save({ validateBeforeSave: false });

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

    // Send Welcome Email (Don't await, let it happen in background)
    if (newUser.notificationSettings?.emailAlerts) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const loginUrl = `${frontendUrl}/login`;
        new Email(newUser, loginUrl).sendWelcome().catch(err => {
            console.error("Welcome email failed:", err);
        });
    }

    res.status(httpStatus.CREATED).json({
        status: "success",
        accessToken,
        refreshToken,
        data: {
            user: newUser
        }
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
        if (!user || user.refreshToken !== hashedIncoming) {
            // OPTIONAL: If we detect a reuse of an old refresh token, 
            // it could mean a theft attempt. We could invalidate ALL tokens for this user.
            // For now, just reject it.
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

export default {
    login,
    register,
    refresh,
    logout
};
