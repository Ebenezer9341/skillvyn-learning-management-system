import Bundle from "../models/Bundle.model.js";
import Course from "../models/Course.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";
import { logActivity } from "../utils/logger.js";

/**
 * @desc Create a new bundle
 */
export const createBundle = catchAsync(async (req, res, next) => {
    const { title, description, courses, price, thumbnail, status } = req.body;
    const instructorId = req.user._id;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return next(new AppError("A bundle must contain at least one course", httpStatus.BAD_REQUEST));
    }

    // Verify all courses exist and calculate originalPrice
    let originalPrice = 0;
    const existingCourses = await Course.find({ _id: { $in: courses }, isActive: true });

    if (existingCourses.length !== courses.length) {
        return next(new AppError("One or more selected courses do not exist or are inactive", httpStatus.BAD_REQUEST));
    }

    // Verify ownership for mentors
    if (req.user.role === 'mentor') {
        const notOwned = existingCourses.some(c => c.instructor.toString() !== req.user._id.toString());
        if (notOwned) {
            return next(new AppError("Mentors can only bundle their own courses", httpStatus.FORBIDDEN));
        }
    }

    // Auto-calculate the original price
    existingCourses.forEach(course => {
        originalPrice += (course.price || 0);
    });

    if (Number(price) >= originalPrice) {
        return next(new AppError(`Bundle price (₹${price}) must be less than the combined original price of its courses (₹${originalPrice}). Bundles must offer a discount.`, httpStatus.BAD_REQUEST));
    }

    const newBundle = await Bundle.create({
        title,
        description,
        courses,
        instructor: instructorId,
        createdBy: instructorId, // Both set to the current mentor/admin
        price,
        originalPrice, // Savin auto-calculated sum
        thumbnail,
        status: status || "draft"
    });

    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'CREATE',
        resource: 'BUNDLE',
        resourceId: newBundle._id,
        details: { title: newBundle.title, courseCount: courses.length }
    }, req);

    res.status(httpStatus.CREATED).json({
        status: 'success',
        data: { bundle: newBundle }
    });
});

/**
 * @desc Get all published bundles (public)
 */
export const getAllBundles = catchAsync(async (req, res, next) => {
    const { search, sort, page = 1, limit = 10 } = req.query;
    const query = { isActive: true, status: 'published' };

    if (search) {
        query.$text = { $search: search };
    }

    let bundleQuery = Bundle.find(query);

    if (sort) {
        const sortBy = sort.split(',').join(' ');
        bundleQuery = bundleQuery.sort(sortBy);
    } else if (search) {
        bundleQuery = bundleQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
    } else {
        bundleQuery = bundleQuery.sort("-createdAt");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Bundle.countDocuments(query);
    
    // Populate the first 3 courses just for preview
    // Populate courses and their ratings for calculations
    const bundles = await bundleQuery
        .populate("instructor", "firstName lastName avatar")
        .populate({ path: "courses", select: "title thumbnail price averageRating", options: { limit: 10 } })
        .skip(skip)
        .limit(parseInt(limit));

    // Calculate dynamic average rating for each bundle in memory
    const processedBundles = bundles.map(bundle => {
        const b = bundle.toObject();
        const ratedCourses = bundle.courses?.filter(c => c.averageRating > 0) || [];
        
        if (ratedCourses.length > 0) {
            const avg = ratedCourses.reduce((sum, c) => sum + c.averageRating, 0) / ratedCourses.length;
            b.averageRating = avg.toFixed(1);
        } else {
            b.averageRating = "New"; // Default for unrated content
        }
        return b;
    });

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: processedBundles.length,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        },
        data: { bundles: processedBundles }
    });
});

/**
 * @desc Get all bundles for management (Superuser/Admin)
 */
export const getManageBundles = catchAsync(async (req, res, next) => {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Bundle.countDocuments(query);
    
    const bundles = await Bundle.find(query)
        .populate("instructor", "firstName lastName email")
        .populate({ path: "courses", select: "title price default" })
        .sort("-createdAt")
        .skip(skip)
        .limit(parseInt(limit));

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: bundles.length,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        },
        data: { bundles }
    });
});

/**
 * @desc Get Mentor's bundles
 */
export const getMentorBundles = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Bundle.countDocuments({ instructor: req.user._id });

    const bundles = await Bundle.find({ 
        instructor: req.user._id
    })
    .populate({ path: "courses", select: "title price default" })
    .sort("-createdAt")
    .skip(skip)
    .limit(parseInt(limit));

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: bundles.length,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        },
        data: { bundles }
    });
});

/**
 * @desc Get single bundle details
 */
export const getBundle = catchAsync(async (req, res, next) => {
    // Attempting to find by ID or slug
    const param = req.params.id;
    const isObjectId = param.match(/^[0-9a-fA-F]{24}$/);
    
    const query = isObjectId ? { _id: param } : { slug: param };

    const bundle = await Bundle.findOne(query)
        .populate("instructor", "firstName lastName avatar bio")
        .populate({
            path: "courses",
            select: "title thumbnail description price level duration category averageRating enrollmentCount"
        });

    if (!bundle || (!bundle.isActive && req.user?.role === 'candidate')) {
        return next(new AppError("Bundle not found", httpStatus.NOT_FOUND));
    }

    // Calculate dynamic average rating
    const b = bundle.toObject();
    const ratedCourses = bundle.courses?.filter(c => c.averageRating > 0) || [];
    
    if (ratedCourses.length > 0) {
        const avg = ratedCourses.reduce((sum, c) => sum + c.averageRating, 0) / ratedCourses.length;
        b.averageRating = avg.toFixed(1);
    } else {
        b.averageRating = "New";
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: { bundle: b }
    });
});

/**
 * @desc Update a bundle
 */
export const updateBundle = catchAsync(async (req, res, next) => {
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
        return next(new AppError("Bundle not found", httpStatus.NOT_FOUND));
    }

    if (req.user.role === 'mentor' && bundle.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError("You only have permission to edit your own bundles", httpStatus.FORBIDDEN));
    }

    const updates = { ...req.body };

    // If courses are being updated, we must recalculate originalPrice
    if (updates.courses && Array.isArray(updates.courses)) {
        const existingCourses = await Course.find({ _id: { $in: updates.courses }, isActive: true });
        
        if (existingCourses.length !== updates.courses.length) {
            return next(new AppError("One or more selected courses do not exist or are inactive", httpStatus.BAD_REQUEST));
        }

        // Verify ownership for mentors
        if (req.user.role === 'mentor') {
            const notOwned = existingCourses.some(c => c.instructor.toString() !== req.user._id.toString());
            if (notOwned) {
                return next(new AppError("Mentors can only bundle their own courses", httpStatus.FORBIDDEN));
            }
        }

        let newOriginalPrice = 0;
        existingCourses.forEach(c => {
            newOriginalPrice += (c.price || 0);
        });
        updates.originalPrice = newOriginalPrice;
    }

    // Validate pricing integrity during an update if either field is changed
    const finalPrice = updates.price !== undefined ? Number(updates.price) : Number(bundle.price);
    const finalOriginalPrice = updates.originalPrice !== undefined ? updates.originalPrice : bundle.originalPrice;

    if (finalPrice >= finalOriginalPrice) {
        return next(new AppError(`Bundle price (₹${finalPrice}) must be less than the combined original price of its courses (₹${finalOriginalPrice}). Bundles must offer a discount.`, httpStatus.BAD_REQUEST));
    }

    const updatedBundle = await Bundle.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    ).populate('courses', 'title price');

    const isRestoring = bundle.status === 'archived' && updates.status && updates.status !== 'archived';

    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: isRestoring ? 'RESTORE' : 'UPDATE',
        resource: 'BUNDLE',
        resourceId: updatedBundle._id,
        details: { title: updatedBundle.title, status: updatedBundle.status }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: { bundle: updatedBundle }
    });
});

/**
 * @desc Delete a bundle (Soft delete)
 */
export const deleteBundle = catchAsync(async (req, res, next) => {
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
        return next(new AppError("Bundle not found", httpStatus.NOT_FOUND));
    }

    if (req.user.role === 'mentor' && bundle.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError("You only have permission to delete your own bundles", httpStatus.FORBIDDEN));
    }

    if (bundle.enrollmentCount > 0) {
        // Soft delete
        bundle.isActive = false;
        bundle.status = 'archived';
        await bundle.save();
    } else {
        // Hard delete
        await Bundle.findByIdAndDelete(req.params.id);
    }

    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: bundle.enrollmentCount > 0 ? 'ARCHIVE' : 'DELETE',
        resource: 'BUNDLE',
        resourceId: bundle._id,
        details: { title: bundle.title, method: bundle.enrollmentCount > 0 ? 'SOFT_DELETE' : 'HARD_DELETE' }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: bundle.enrollmentCount > 0 ? "Bundle archived successfully" : "Bundle deleted successfully"
    });
});
