import catchAsync from "../utils/catchAsync.js";
import httpStatus from "../utils/httpStatus.js";
import User from "../models/User.model.js";
import Course from "../models/Course.model.js";
import AppError from "../utils/appError.js";

/**
 * @desc Get all mentors (with search and filter)
 * @queryString specialty: Filter by specialty
 * @queryString search: Search in name or bio
 */
export const getMentors = catchAsync(async (req, res, next) => {
    const { specialty, search } = req.query;
    
    // Default filter: all mentors
    let query = { role: 'mentor' };

    // 1. Filter by specialty
    if (specialty) {
        query.specialty = { $regex: specialty, $options: 'i' };
    }

    // 2. Search by name or bio
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { bio: { $regex: search, $options: 'i' } }
        ];
    }

    const mentors = await User.find(query)
        .select('firstName lastName email avatar bio specialty socialLinks isActive createdAt')
        .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: mentors.length,
        data: {
            mentors
        }
    });
});

/**
 * @desc Get single mentor's public profile and courses
 */
export const getMentorDetail = catchAsync(async (req, res, next) => {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor', isActive: true })
        .select('firstName lastName avatar bio cover specialty socialLinks createdAt location');

    if (!mentor) {
        return next(new AppError("No mentor found with that ID", httpStatus.NOT_FOUND));
    }

    // Get their published courses
    const courses = await Course.find({ instructor: mentor._id, status: 'published' })
        .select('title category thumbnail price averageRating enrollmentCount difficulty level')
        .sort({ createdAt: -1 });

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            mentor,
            courses
        }
    });
});


/**
 * @desc Get global metrics for mentors (Admin/Superuser)
 */
export const getMentorStats = catchAsync(async (req, res, next) => {
    const { status } = req.query;

    const baseMatch = { role: 'mentor' };
    
    // Basic stats: total, active, new this month
    const totalMentors = await User.countDocuments(baseMatch);
    const activeMentors = await User.countDocuments({ ...baseMatch, isActive: { $ne: false } });
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newMentorsCount = await User.countDocuments({ role: 'mentor', createdAt: { $gte: startOfMonth } });

    // Growth trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const growthQuery = { ...baseMatch };
    if (status && status !== 'All') {
        if (status === 'active') growthQuery.isActive = { $ne: false };
        if (status === 'inactive') growthQuery.isActive = false;
    }

    const growthData = await User.aggregate([
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

    // Daily growth (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyGrowthData = await User.aggregate([
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
            totalMentors,
            activeMentors,
            newMentors: newMentorsCount,
            growth,
            dailyGrowth
        }
    });
});

export default {
    getMentors,
    getMentorDetail,
    getMentorStats
};