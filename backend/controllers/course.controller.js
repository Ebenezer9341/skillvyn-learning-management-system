import mongoose from "mongoose";
import Course from "../models/Course.model.js";
import User from "../models/User.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Transaction from "../models/Transaction.model.js";
import AuditLog from "../models/AuditLog.model.js";
import Notification from "../models/Notification.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";
import { logActivity } from "../utils/logger.js";

/**
 * @desc Create a new course
 */
export const createCourse = catchAsync(async (req, res, next) => {
    const { title, description, category, level, price, originalPrice, duration, thumbnail, instructor } = req.body;

    const creatorId = req.user._id;
    let instructorId;

    if (req.user.role === 'mentor') {
        instructorId = creatorId;
    } else if (req.user.role === 'admin' || req.user.role === 'superuser') {
        instructorId = instructor || creatorId;
    } else {
        instructorId = creatorId;
    }

    const isMentor = req.user.role === 'mentor';

    // Safety check: Mentors cannot set price during creation
    const finalPrice = isMentor ? 0 : price;
    const finalOriginalPrice = isMentor ? 0 : originalPrice;

    const newCourse = await Course.create({
        title,
        description,
        category,
        level,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        duration,
        thumbnail,
        instructor: instructorId,
        createdBy: creatorId
    });

    await logActivity({
        userId: creatorId,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'COURSE',
        resourceId: newCourse._id,
        details: {
            title: newCourse.title,
            instructorId: instructorId
        }
    }, req);

    res.status(httpStatus.CREATED).json({
        status: 'success',
        data: {
            course: newCourse
        }
    });
});

/**
 * @desc Get all courses
 */
export const getAllCourses = catchAsync(async (req, res, next) => {
    // 1. Filtering
    const { category, level, search, sort, page = 1, limit = 10 } = req.query;
    const { minPrice, maxPrice } = req.query;

    const query = { isActive: true, status: 'published' }; // Only show published courses by default

    // Basic filters
    if (category) query.category = category;
    if (level) query.level = level;

    // Add price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Search query using text index
    if (search) {
        query.$text = { $search: search };
    }

    // 2. Build Query
    let courseQuery = Course.find(query);

    // 3. Sorting
    if (sort) {
        const sortBy = sort.split(',').join(' ');
        courseQuery = courseQuery.sort(sortBy);
    } else {
        // Default sort (newest, but if search is active, sort by relevance score)
        if (search) {
            courseQuery = courseQuery
                .select({ score: { $meta: "textScore" } })
                .sort({ score: { $meta: "textScore" } });
        } else {
            courseQuery = courseQuery.sort("-createdAt");
        }
    }

    // 4. Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Course.countDocuments(query);

    const courses = await courseQuery
        .populate("instructor", "firstName lastName email avatar")
        .skip(skip)
        .limit(parseInt(limit));

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: courses.length,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        },
        data: {
            courses
        }
    });
});

/**
 * @desc Get all courses for current mentor
 */
export const getMentorCourses = catchAsync(async (req, res, next) => {
    const courses = await Course.find({
        instructor: req.user._id,
        isActive: true
    }).sort("-createdAt");

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: courses.length,
        data: {
            courses
        }
    });
});

/**
 * @desc Get single course
 */
export const getCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.id)
        .populate("instructor", "firstName lastName email")
        .populate("createdBy", "firstName lastName email");

    if (!course) {
        return next(new AppError("Course not found", httpStatus.NOT_FOUND));
    }

    // If candidate is requesting, find their enrollment progress
    let enrollment = null;
    if (req.user && req.user.role === 'candidate') {
        enrollment = await mongoose.model('Enrollment').findOne({
            candidate: req.user._id,
            course: course._id
        }).populate('candidate', 'firstName lastName avatar email');
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            course,
            enrollment
        }
    });
});

/**
 * @desc Update course
 */
export const updateCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError("Course not found", httpStatus.NOT_FOUND));
    }

    // Authorization check: Superuser/Admin can edit any, Mentor can only edit their own
    if (req.user.role === 'mentor' && course.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError("You only have permission to edit your own courses", httpStatus.FORBIDDEN));
    }

    // Role hierarchy check: Admin CANNOT edit superuser courses
    const instructor = await User.findById(course.instructor);
    if (req.user.role === 'admin' && instructor?.role === 'superuser') {
        return next(new AppError("Administrators cannot modify courses created by a superuser.", httpStatus.FORBIDDEN));
    }

    // Restricted fields check: Mentor cannot update price
    if (req.user.role === 'mentor') {
        delete req.body.price;
        delete req.body.originalPrice;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after', runValidators: true }
    ).populate('instructor', 'firstName lastName');

    // Notification Logic for Mentor Status Requests
    if (req.body.status === 'pending') {
        const superusers = await User.find({ role: 'superuser' });
        const notifications = superusers.map(su => ({
            user: su._id,
            type: 'info',
            title: 'New Verification Request',
            message: `Mentor ${updatedCourse.instructor?.firstName} ${updatedCourse.instructor?.lastName} has requested to ${req.body.approvalRequest?.requestedStatus} the course "${updatedCourse.title}".`,
            link: '/superuser/courses/approvals'
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    }

    // Notification Logic for Admin/Superuser Approval Decisions
    if ((req.user.role === 'admin' || req.user.role === 'superuser') && req.body.approvalRequest?.processedAt) {
        const isApproved = req.body.status !== 'draft';

        await sendNotification(Notification, {
            userId: updatedCourse.instructor._id,
            type: isApproved ? 'success' : 'warning',
            title: isApproved ? 'Course Authorized' : 'Revision Required',
            message: `Your request to ${updatedCourse.status} the course "${updatedCourse.title}" was ${isApproved ? 'authorized' : 'returned to draft'} by administration. Remark: ${req.body.approvalRequest.adminRemark}`,
            link: isApproved ? `/courses/view/${updatedCourse._id}` : `/mentor/course/${updatedCourse._id}`
        });
    }

    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'UPDATE',
        resource: 'COURSE',
        resourceId: updatedCourse._id,
        details: {
            title: updatedCourse.title,
            updatedFields: Object.keys(req.body)
        }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            course: updatedCourse
        }
    });
});

/**
 * @desc Delete course (Soft Delete)
 */
export const deleteCourse = catchAsync(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new AppError("Course not found", httpStatus.NOT_FOUND));
    }

    // Authorization: Only Superuser/Admin or the Instructor themselves
    if (req.user.role === 'mentor' && course.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError("You only have permission to delete your own courses", httpStatus.FORBIDDEN));
    }

    const hasEnrollments = course.enrollmentCount > 0;

    if (hasEnrollments) {
        // Soft delete/Archive if there are students
        course.isActive = false;
        course.status = 'archived';
        await course.save();
    } else {
        // Permanent delete if no students
        await Course.findByIdAndDelete(req.params.id);
    }

    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: hasEnrollments ? 'ARCHIVE' : 'DELETE',
        resource: 'COURSE',
        resourceId: course._id,
        details: {
            title: course.title,
            method: hasEnrollments ? 'SOFT_DELETE' : 'HARD_DELETE'
        }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: hasEnrollments ? 'Course archived successfully' : 'Course deleted successfully'
    });
});

/**
 * @desc Upload course video
 */
export const uploadCourseVideo = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError("Please upload a video file", httpStatus.BAD_REQUEST));
    }

    // In a production environment, you would upload this to S3/Cloudinary.
    // Here we return the local path or a relative URL.
    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            url: videoUrl
        }
    });
});

/**
 * @desc Upload course asset
 */
export const uploadCourseAsset = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError("Please upload an asset file", httpStatus.BAD_REQUEST));
    }

    const assetUrl = `${req.protocol}://${req.get('host')}/uploads/assets/${req.file.filename}`;

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            url: assetUrl,
            name: req.file.originalname
        }
    });
});

/**
 * @desc Upload course thumbnail
 */
export const uploadCourseThumbnail = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError("Please upload an image file", httpStatus.BAD_REQUEST));
    }

    const thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/thumbnails/${req.file.filename}`;

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            url: thumbnailUrl
        }
    });
});

/**
 * @desc Get all courses for management (Superuser/Admin)
 */
export const getManageCourses = catchAsync(async (req, res, next) => {
    const { category, level, status, instructor, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (status) query.status = status;
    if (instructor) query.instructor = instructor;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Course.countDocuments(query);

    const courses = await Course.find(query)
        .populate("instructor", "firstName lastName email role")
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit));

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: courses.length,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        },
        data: {
            courses
        }
    });
});

/**
 * @desc Get Course Analytics (Superuser/Admin/Mentor)
 */
export const getCourseAnalytics = catchAsync(async (req, res, next) => {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate('instructor', 'firstName lastName role');

    if (!course) {
        return next(new AppError("Course not found", httpStatus.NOT_FOUND));
    }

    // Role check: Mentors can only see their own course analytics
    if (req.user.role === 'mentor' && course.instructor._id.toString() !== req.user._id.toString()) {
        return next(new AppError("You only have permission to view analytics for your own courses", httpStatus.FORBIDDEN));
    }

    // 1. Basic Stats
    const totalStudents = course.enrollmentCount || 0;

    // 2. Enrollment Growth — filtered by date range from query params
    const queryStart = req.query.startDate ? new Date(req.query.startDate) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
    const queryEnd = req.query.endDate ? new Date(req.query.endDate) : new Date();
    // Ensure end covers the full day
    queryEnd.setHours(23, 59, 59, 999);

    const enrollments = await Enrollment.aggregate([
        {
            $match: {
                course: new mongoose.Types.ObjectId(courseId),
                enrolledAt: { $gte: queryStart, $lte: queryEnd }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // 3. Status Distribution
    const statusStats = await Enrollment.aggregate([
        { $match: { course: new mongoose.Types.ObjectId(courseId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 4. Progress Stats
    const progressStats = await Enrollment.aggregate([
        { $match: { course: new mongoose.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: null,
                avgProgress: { $avg: "$progress" },
                completionRate: {
                    $avg: { $cond: [{ $eq: ["$status", "completed"] }, 100, 0] }
                }
            }
        }
    ]);

    // 5. Rating Data
    const ratings = await Enrollment.aggregate([
        { $match: { course: new mongoose.Types.ObjectId(courseId), rating: { $exists: true } } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { "_id": -1 } }
    ]);

    // 6. Revenue Analytics (Transaction model)
    const revenueStats = await Transaction.aggregate([
        {
            $match: {
                course: new mongoose.Types.ObjectId(courseId),
                status: 'success'
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalTransactions: { $sum: 1 },
                avgTransactionValue: { $avg: '$amount' }
            }
        }
    ]);

    // Revenue timeline (filtered by same date range as enrollments)
    const revenueTimeline = await Transaction.aggregate([
        {
            $match: {
                course: new mongoose.Types.ObjectId(courseId),
                status: 'success',
                createdAt: { $gte: queryStart, $lte: queryEnd }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                revenue: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // Payment status breakdown
    const paymentStatusBreakdown = await Transaction.aggregate([
        { $match: { course: new mongoose.Types.ObjectId(courseId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const revenue = revenueStats[0] || { totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 };

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            title: course.title,
            isFree: course.price === 0,
            instructor: course.instructor,
            stats: {
                totalStudents,
                avgProgress: progressStats[0]?.avgProgress || 0,
                completionRate: progressStats[0]?.completionRate || 0,
                avgRating: course.averageRating || 0,
                totalRevenue: revenue.totalRevenue,
                totalTransactions: revenue.totalTransactions,
                avgRevenuePerStudent: revenue.totalTransactions > 0
                    ? Math.round(revenue.totalRevenue / revenue.totalTransactions)
                    : 0,
            },
            timeline: enrollments,
            revenueTimeline,
            paymentStatusBreakdown,
            statusDistribution: statusStats,
            ratings
        }
    });
});

/**
 * @desc Get global platform-wide statistics (Superuser/Admin)
 */
export const getGlobalPlatformStats = catchAsync(async (req, res, next) => {
    // 1. Total Stats
    const totalStats = await Course.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalCourses: { $sum: 1 },
                totalEnrollments: { $sum: "$enrollmentCount" },
                avgRating: { $avg: "$averageRating" }
            }
        }
    ]);

    const transactionStats = await Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);

    // 2. Timeline Stats (Last 30 days aggregated)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrollmentTimeline = await Enrollment.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const revenueTimeline = await Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                amount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // 3. Category Breakdown
    const categoryBreakdown = await Course.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: "$category",
                courses: { $sum: 1 },
                enrollments: { $sum: "$enrollmentCount" }
            }
        }
    ]);

    // 4. Top Performing Courses (By Revenue)
    const topRevenueCourses = await Transaction.aggregate([
        { $match: { status: 'success' } },
        {
            $group: {
                _id: "$course",
                revenue: { $sum: "$amount" },
                salesCount: { $sum: 1 }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "courses",
                localField: "_id",
                foreignField: "_id",
                as: "courseInfo"
            }
        },
        { $unwind: "$courseInfo" },
        {
            $project: {
                title: "$courseInfo.title",
                thumbnail: "$courseInfo.thumbnail",
                category: "$courseInfo.category",
                revenue: 1,
                salesCount: 1
            }
        }
    ]);

    // 5. Top Performing Courses (By Enrollment)
    const topEnrollmentCourses = await Course.find({ isActive: true })
        .sort("-enrollmentCount")
        .limit(5)
        .select("title enrollmentCount thumbnail category price averageRating");

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            overview: {
                totalCourses: totalStats[0]?.totalCourses || 0,
                totalEnrollments: totalStats[0]?.totalEnrollments || 0,
                totalRevenue: transactionStats[0]?.totalRevenue || 0,
                avgRating: totalStats[0]?.avgRating?.toFixed(1) || 0
            },
            timelines: {
                enrollment: enrollmentTimeline,
                revenue: revenueTimeline
            },
            categoryBreakdown,
            leaderboards: {
                byRevenue: topRevenueCourses,
                byEnrollment: topEnrollmentCourses
            }
        }
    });
});

/**
 * @desc Get platform/mentor course metrics
 */
export const getCourseStats = catchAsync(async (req, res, next) => {
    const isMentor = req.user.role === 'mentor';
    const { status } = req.query;
    const baseQuery = isMentor ? { instructor: req.user._id } : {};

    const totalCourses = await Course.countDocuments(baseQuery);
    const activeCourses = await Course.countDocuments({ ...baseQuery, status: 'published' });
    const draftCourses = await Course.countDocuments({ ...baseQuery, status: 'draft' });
    const totalEnrollments = await Course.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: "$enrollmentCount" } } }
    ]).then(res => res[0]?.total || 0);

    // Growth trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    let growthData = [];
    let dailyGrowthData = [];

    if (status === 'purchased') {
        // Use AuditLog for a unified view of ALL enrollments (Free + Paid)
        const logQuery = {
            action: 'ENROLL',
            resource: 'COURSE',
            createdAt: { $gte: sixMonthsAgo }
        };

        if (isMentor) {
            // Find courses belonging to mentor to filter logs
            const mentorCourses = await Course.find({ instructor: req.user._id }).select('_id');
            const courseIdsStr = mentorCourses.map(c => c._id.toString());
            logQuery.resourceId = { $in: courseIdsStr };
        }

        growthData = await AuditLog.aggregate([
            { $match: logQuery },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const logDailyQuery = { ...logQuery, createdAt: { $gte: sevenDaysAgo } };

        dailyGrowthData = await AuditLog.aggregate([
            { $match: logDailyQuery },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);
    } else {
        const growthQuery = { ...baseQuery };
        if (status && status !== 'All') {
            growthQuery.status = status;
        }

        growthData = await Course.aggregate([
            {
                $match: {
                    ...growthQuery,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        dailyGrowthData = await Course.aggregate([
            {
                $match: {
                    ...growthQuery,
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const growth = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const monthPoint = growthData.find(g => g._id.month === month && g._id.year === year);
        growth.push({ label: monthNames[month - 1], count: monthPoint ? monthPoint.count : 0 });
    }

    const dailyGrowth = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const dayPoint = dailyGrowthData.find(g => g._id.day === day && g._id.month === month && g._id.year === year);
        dailyGrowth.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: dayPoint ? dayPoint.count : 0 });
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            totalCourses,
            activeCourses,
            draftCourses,
            totalEnrollments,
            growth,
            dailyGrowth,
            growthSource: status === 'purchased' ? 'enrollment' : 'content'
        }
    });
});

export default {
    createCourse,
    getManageCourses,
    getCourseAnalytics,
    getAllCourses,
    getMentorCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    uploadCourseVideo,
    uploadCourseAsset,
    uploadCourseThumbnail,
    getGlobalPlatformStats,
    getCourseStats
};
