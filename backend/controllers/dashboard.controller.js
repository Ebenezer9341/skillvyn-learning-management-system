import User from "../models/User.model.js";
import Course from "../models/Course.model.js";
import AuditLog from "../models/AuditLog.model.js";
import Enrollment from "../models/Enrollment.model.js";
import catchAsync from "../utils/catchAsync.js";
import httpStatus from "../utils/httpStatus.js";

/**
 * @desc Get high-level stats and recent activity for the Superuser Dashboard
 */
/**
 * @desc Get stats and recent activity for the Admin Dashboard
 */
export const getAdminStats = catchAsync(async (req, res, next) => {
    // 1. Fetch totals in parallel
    const [
        totalUsers,
        totalCourses,
        totalMentors,
        totalCandidates,
        recentActivity
    ] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        User.countDocuments({ role: 'mentor' }),
        User.countDocuments({ role: 'candidate' }),
        AuditLog.find({
            $or: [
                { userRole: { $in: ['mentor', 'candidate'] } },
                { userId: req.user._id }
            ]
        })
            .populate('userId', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .limit(5)
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            stats: {
                totalUsers,
                totalCourses,
                totalMentors,
                totalCandidates,
                newUsersThisWeek
            },
            recentActivity
        }
    });
});

/**
 * @desc Get high-level stats and recent activity for the Superuser Dashboard
 */
export const getSuperuserStats = catchAsync(async (req, res, next) => {
    // 1. Fetch totals in parallel for speed
    const [
        totalUsers,
        totalCourses,
        totalMentors,
        totalCandidates,
        recentActivity
    ] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        User.countDocuments({ role: 'mentor' }),
        User.countDocuments({ role: 'candidate' }),
        AuditLog.find()
            .populate('userId', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .limit(5) // Showing 5 for a clean, minimal dashboard list
    ]);

    // 2. Fetch some growth data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            stats: {
                totalUsers,
                totalCourses,
                totalMentors,
                totalCandidates,
                newUsersThisWeek
            },
            recentActivity
        }
    });
});

/**
 * @desc Get stats and recent activity for the Mentor Dashboard
 */
export const getMentorStats = catchAsync(async (req, res, next) => {
    const instructorId = req.user._id;

    // 1. Fetch mentor specific data
    const [
        myCourses,
        recentActivity,
        enrollmentData,
        recentReviews
    ] = await Promise.all([
        Course.find({ instructor: instructorId, isActive: true }),
        AuditLog.find({ userId: instructorId })
            .sort({ createdAt: -1 })
            .limit(5),
        Enrollment.find({ instructor: instructorId }),
        Enrollment.find({ 
            instructor: instructorId, 
            rating: { $exists: true } 
        })
        .populate('candidate', 'firstName lastName avatar')
        .populate('course', 'title')
        .sort({ ratedAt: -1 })
        .limit(5)
    ]);

    // 2. Aggregate stats
    const stats = {
        totalCourses: myCourses.length,
        activeCourses: myCourses.filter(c => c.status === 'published').length,
        totalStudents: enrollmentData.length,
        averageRating: myCourses.length > 0 
            ? (myCourses.reduce((acc, curr) => acc + (curr.averageRating || 0), 0) / myCourses.length).toFixed(1)
            : 0
    };

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            stats,
            recentCourses: myCourses.slice(0, 4), // Latest 4 courses
            recentActivity,
            recentReviews
        }
    });
});

export default {
    getAdminStats,
    getSuperuserStats,
    getMentorStats
};
