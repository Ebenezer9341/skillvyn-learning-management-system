import User from "../models/User.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";
import { logActivity } from "../utils/logger.js";
import Email from "../utils/email.js";
import crypto from "crypto";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";

/**
 * @desc Get current user details
 */
export const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return next(new AppError("User not found", httpStatus.NOT_FOUND));
    }

    let stats = {};

    if (user.role === 'mentor') {
        const [courseCount, students] = await Promise.all([
            Course.countDocuments({ instructor: user._id, isActive: true }),
            Enrollment.find({ instructor: user._id })
        ]);

        const ratedStudents = students.filter(s => s.rating);
        const totalRating = ratedStudents.reduce((acc, curr) => acc + curr.rating, 0);

        stats = {
            courseCount,
            totalStudents: students.length,
            averageRating: ratedStudents.length > 0 ? (totalRating / ratedStudents.length).toFixed(1) : 0
        };
    } else if (user.role === 'candidate') {
        const enrollments = await Enrollment.find({ candidate: user._id });

        stats = {
            enrolledCount: enrollments.length,
            completedCount: enrollments.filter(e => e.status === 'completed').length,
            certificateCount: enrollments.filter(e => e.certificationTracking?.isCertified).length
        };
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            user,
            stats
        }
    });
});

/**
 * @desc Update current user profile
 */
export const updateProfile = catchAsync(async (req, res, next) => {
    // Only allow updating specific fields
    const allowedFields = [
        'firstName',
        'lastName',
        'bio',
        'phone',
        'location',
        'specialty',
        'avatar',
        'cover',
        'socialLinks',
        'dateOfBirth',
        'notificationSettings'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = req.body[key];
        }
    });

    const user = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { returnDocument: 'after', runValidators: true }
    );

    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'PROFILE',
        resourceId: user._id,
        details: {
            updatedFields: Object.keys(updateData)
        }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            user
        }
    });
});


/**
 * @desc Get all users (with role-based visibility)
 */
export const getAllUsers = catchAsync(async (req, res, next) => {
    const requesterRole = req.user.role;
    let query = {};

    if (requesterRole === 'superuser') {
        // Superuser can see everyone except other superusers (or as needed)
        query = { role: { $ne: 'superuser' } };
    } else if (requesterRole === 'admin') {
        // Admin can only see mentors and candidates
        query = { role: { $in: ['mentor', 'candidate'] } };
    } else {
        // Other roles might not have permission to view all users at all
        return next(new AppError('You do not have permission to view user lists', httpStatus.FORBIDDEN));
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});


/**
 * @desc Create a new user (Candidate, Mentor, or Admin)
 */
export const createUser = catchAsync(async (req, res, next) => {
    const { firstName, lastName, dateOfBirth, email, password, role } = req.body;

    // RBAC: Only superuser can create admins or other superusers
    if ((role === 'admin' || role === 'superuser') && req.user.role !== 'superuser') {
        return next(new AppError('Only superusers can create administrative roles', httpStatus.FORBIDDEN));
    }

    const assignedRole = role || 'candidate';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('User with this email already exists', httpStatus.BAD_REQUEST));
    }

    const newUser = await User.create({
        firstName,
        lastName,
        dateOfBirth,
        email,
        password,       // still needed to satisfy the required field
        role: assignedRole,
        isEmailVerified: true  // Admin-created accounts are pre-trusted; they use the password-setup flow
    });

    // Generate a password setup token (same pattern as forgotPassword)
    const setupToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(setupToken).digest('hex');

    newUser.passwordResetToken = hashedToken;
    newUser.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await newUser.save({ validateBeforeSave: false });

    newUser.password = undefined;

    // Record Audit Log
    await logActivity({
        userId: req.user._id,
        action: 'CREATE',
        resource: 'USER',
        resourceId: newUser._id,
        details: {
            email: newUser.email,
            role: newUser.role
        }
    }, req);

    // Send Staff Welcome Email (Don't await, let it happen in background)
    if (newUser.notificationSettings?.emailAlerts) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // ✅ Fixed
        const setupUrl = `${frontendUrl}/reset-password?token=${setupToken}`;
        new Email(newUser, setupUrl).sendStaffWelcome().catch(err => {
            console.error("Staff welcome email failed:", err);
        });
    }

    res.status(httpStatus.CREATED).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});

/**
 * @desc Update user details
 */
export const updateUser = catchAsync(async (req, res, next) => {
    const { firstName, lastName, dateOfBirth, role, isActive } = req.body;

    // RBAC: Only superuser can assign admin or superuser roles
    if (role && (role === 'admin' || role === 'superuser') && req.user.role !== 'superuser') {
        return next(new AppError('Only superusers can assign administrative roles', httpStatus.FORBIDDEN));
    }

    // RBAC: Admins can only edit Mentors and Candidates
    if (req.user.role === 'admin') {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return next(new AppError('No user found with that ID', httpStatus.NOT_FOUND));
        }
        if (!['mentor', 'candidate'].includes(targetUser.role)) {
            return next(new AppError('Admins can only manage Mentors and Candidates', httpStatus.FORBIDDEN));
        }
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, dateOfBirth, role, isActive },
        { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
        return next(new AppError('No user found with that ID', httpStatus.NOT_FOUND));
    }

    // Record Audit Log
    await logActivity({
        userId: req.user._id,
        action: 'UPDATE',
        resource: 'USER',
        resourceId: user._id,
        details: {
            updatedFields: Object.keys(req.body).filter(k => req.body[k] !== undefined)
        }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc Upload Profile Avatar
 */
export const uploadAvatar = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload an image file', httpStatus.BAD_REQUEST));
    }

    const imageUrl = `/uploads/profiles/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: imageUrl },
        { returnDocument: 'after' }
    );

    // Record Activity
    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'PROFILE_AVATAR',
        resourceId: user._id,
        details: { imageUrl }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc Upload Profile Cover
 */
export const uploadCover = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Please upload an image file', httpStatus.BAD_REQUEST));
    }

    const imageUrl = `/uploads/profiles/covers/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { cover: imageUrl },
        { returnDocument: 'after' }
    );

    // Record Activity
    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'PROFILE_COVER',
        resourceId: user._id,
        details: { imageUrl }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc Get a specific user's detailed profile (for Admin/Superuser)
 */
export const getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError("No user found with that ID", httpStatus.NOT_FOUND));
    }

    // RBAC check: Admin can only view mentors and candidates
    if (req.user.role === 'admin' && !['mentor', 'candidate'].includes(user.role)) {
        return next(new AppError('Admins can only view detail profiles of Mentors and Candidates', httpStatus.FORBIDDEN));
    }

    let stats = {};

    if (user.role === 'mentor') {
        const [courseCount, students] = await Promise.all([
            Course.countDocuments({ instructor: user._id, isActive: true }),
            Enrollment.find({ instructor: user._id })
        ]);

        const ratedStudents = students.filter(s => s.rating);
        const totalRating = ratedStudents.reduce((acc, curr) => acc + curr.rating, 0);

        stats = {
            courseCount,
            totalStudents: students.length,
            averageRating: ratedStudents.length > 0 ? (totalRating / ratedStudents.length).toFixed(1) : 0
        };
    } else if (user.role === 'candidate') {
        const enrollments = await Enrollment.find({ candidate: user._id });

        stats = {
            enrolledCount: enrollments.length,
            completedCount: enrollments.filter(e => e.status === 'completed').length,
            certificateCount: enrollments.filter(e => e.certificationTracking?.isCertified).length
        };
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            user,
            stats
        }
    });
});

export default {
    getAllUsers,
    createUser,
    updateUser,
    getMe,
    updateProfile,
    uploadAvatar,
    uploadCover,
    getUser
};