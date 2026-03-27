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
    
    // Default filter: only active mentors
    let query = { role: 'mentor', isActive: true };

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
        .select('firstName lastName avatar bio specialty socialLinks')
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

export default {
    getMentors,
    getMentorDetail
};