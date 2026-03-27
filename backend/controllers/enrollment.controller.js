import Enrollment from "../models/Enrollment.model.js";
import Course from "../models/Course.model.js";
import Bundle from "../models/Bundle.model.js";
import Transaction from "../models/Transaction.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";
import { logActivity } from "../utils/logger.js";
import crypto from "crypto";
import Coupon from "../models/Coupon.model.js";
import Email from "../utils/email.js";

// Helper to generate a professional unique certificate ID
const generateCertificateId = () => {
    const prefix = "SKV";
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${year}-${random}`;
};

/**
 * @desc Get all students enrolled in courses taught by the logged-in mentor
 */
export const getMentorStudents = catchAsync(async (req, res, next) => {
    const instructorId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { instructor: instructorId };

    // Search by candidate name or email (needs population or aggregation)
    // For now, simple fetch with population
    const total = await Enrollment.countDocuments(query);
    const enrollments = await Enrollment.find(query)
        .populate("candidate", "firstName lastName email avatar")
        .populate("course", "title category thumbnail")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: enrollments.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: {
            enrollments
        }
    });
});

/**
 * @desc Get stats for mentor's students
 */
export const getMentorStudentStats = catchAsync(async (req, res, next) => {
    const instructorId = req.user._id;

    const statsData = await Enrollment.aggregate([
        { $match: { instructor: instructorId } },
        {
            $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                activeStudents: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                completedStudents: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                avgProgress: { $avg: "$progress" }
            }
        }
    ]);

    const stats = statsData.length > 0 ? statsData[0] : {
        totalStudents: 0,
        activeStudents: 0,
        completedStudents: 0,
        avgProgress: 0
    };

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            completedStudents: stats.completedStudents,
            avgProgress: parseFloat(stats.avgProgress || 0).toFixed(1)
        }
    });
});

/**
 * @desc Get all students across the entire platform (Superuser/Admin)
 */
export const getAllStudents = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    const total = await Enrollment.countDocuments(query);
    const enrollments = await Enrollment.find(query)
        .populate("candidate", "firstName lastName email avatar")
        .populate("course", "title category thumbnail")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: enrollments.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: {
            enrollments
        }
    });
});

/**
 * @desc Get global stats for all students (Superuser/Admin)
 */
export const getAllStudentStats = catchAsync(async (req, res, next) => {
    const statsData = await Enrollment.aggregate([
        {
            $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                activeStudents: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                completedStudents: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                avgProgress: { $avg: "$progress" }
            }
        }
    ]);

    const stats = statsData.length > 0 ? statsData[0] : {
        totalStudents: 0,
        activeStudents: 0,
        completedStudents: 0,
        avgProgress: 0
    };

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            completedStudents: stats.completedStudents,
            avgProgress: parseFloat(stats.avgProgress || 0).toFixed(1)
        }
    });
});

/**
 * @desc Enroll in a course (Candidate)
 */
export const enrollInCourse = catchAsync(async (req, res, next) => {
    const { courseId, couponCode } = req.body;
    const candidateId = req.user._id;

    // 1. Check if course exists and is published
    const course = await Course.findById(courseId).populate('instructor', 'email firstName lastName');
    if (!course || course.status !== 'published') {
        return next(new AppError('Course not found or not available for enrollment', httpStatus.NOT_FOUND));
    }

    // 2. Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ candidate: candidateId, course: courseId });
    if (existingEnrollment) {
        return next(new AppError('You are already enrolled in this course', httpStatus.BAD_REQUEST));
    }

    // 3. Handle Coupon if provided
    let coupon = null;
    if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
        if (!coupon) return next(new AppError("Invalid or expired coupon code", httpStatus.NOT_FOUND));
        if (coupon.expiryDate && coupon.expiryDate < new Date()) return next(new AppError("This coupon has expired", httpStatus.BAD_REQUEST));
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return next(new AppError("This coupon has reached its maximum usage limit", httpStatus.BAD_REQUEST));
        if (coupon.usageLimitPerUser) {
        if (coupon.usageLimitPerUser) {
            // Smart Usage Counting: Group transactions by "Time Clouds" (2-second windows)
            // This counts any transactions created in the same loop/bundle as ONE use.
            const userTransactions = await Transaction.find({
                candidate: candidateId,
                couponCode: coupon.code,
                status: { $ne: 'failed' }
            }).sort('createdAt').select('createdAt');

            if (userTransactions.length > 0) {
                let uniquePurchaseEvents = 0;
                let lastTxTime = 0;

                userTransactions.forEach(tx => {
                    const currentTime = new Date(tx.createdAt).getTime();
                    // If this transaction is more than 2 seconds after the last one, it's a new "Use"
                    if (currentTime - lastTxTime > 2000) {
                        uniquePurchaseEvents++;
                        lastTxTime = currentTime;
                    }
                });

                if (uniquePurchaseEvents >= coupon.usageLimitPerUser) {
                    return next(new AppError("You have already used this coupon the maximum number of times", httpStatus.BAD_REQUEST));
                }
            }
        }
        }
    }

    let finalPrice = course.price;
    let appliedDiscount = 0;
    if (coupon) {
        let isApplicable = true;
        if (!(coupon.applicableTo === 'all' || coupon.applicableTo === 'courses')) isApplicable = false;
        if (isApplicable && coupon.instructor && coupon.instructor.toString() !== course.instructor.toString()) isApplicable = false;
        if (isApplicable && coupon.specificItems?.length > 0 && !coupon.specificItems.some(id => id.toString() === courseId.toString())) isApplicable = false;

        if (isApplicable) {
            if (coupon.discountType === 'percentage') {
                appliedDiscount = (course.price * coupon.discountValue) / 100;
                if (coupon.maxDiscount && appliedDiscount > coupon.maxDiscount) appliedDiscount = coupon.maxDiscount;
            } else {
                appliedDiscount = Math.min(coupon.discountValue, course.price);
            }
            finalPrice = Math.max(0, course.price - appliedDiscount);
        } else if (couponCode) {
             return next(new AppError("This coupon is not applicable to this course", httpStatus.BAD_REQUEST));
        }
    }

    // 4. Create enrollment
    // Initialize certification tracking based on course settings
    const enrollment = await Enrollment.create({
        candidate: candidateId,
        course: courseId,
        instructor: course.instructor,
        progress: 0,
        status: 'active',
        certificationTracking: {
            mcqStatus: course.certification?.mcqEnabled ? 'pending' : 'na',
            projectStatus: course.certification?.projectEnabled ? 'pending' : 'na',
            isCertified: false
        }
    });

    // 4.1 Create Transaction if course is paid
    let transaction = null;
    if (finalPrice > 0 || (course.price > 0 && finalPrice === 0)) {
        transaction = await Transaction.create({
            enrollment: enrollment._id,
            candidate: candidateId,
            course: courseId,
            instructor: course.instructor._id,
            amount: finalPrice,
            discount: course.price - finalPrice,
            couponCode: coupon ? coupon.code : undefined,
            billingDetails: {
                name: `${req.user.firstName} ${req.user.lastName}`,
                email: req.user.email
            }
        });
    }

    // 5. Increment counts
    course.enrollmentCount += 1;
    await course.save();

    if (coupon && appliedDiscount > 0) {
        coupon.usageCount += 1;
        await coupon.save();
    }

    // 6. Log activity
    await logActivity({
        userId: candidateId,
        userRole: 'candidate',
        action: 'ENROLL',
        resource: 'COURSE',
        resourceId: courseId,
        details: { courseTitle: course.title, amount: course.price, discountedAmount: finalPrice }
    }, req);

    res.status(httpStatus.CREATED).json({
        status: 'success',
        data: {
            enrollment
        }
    });

    // Send Enrollment Email in background
    if (req.user.notificationSettings?.emailAlerts) {
        new Email(req.user).sendEnrollmentConfirmation(
            course.title, 
            transaction?.invoiceNumber, 
            transaction?.amount
        ).catch(err => {
            console.error("Enrollment email failed:", err);
        });
    }

    // Notify Instructor in background
    if (course.instructor?.email) {
        new Email(course.instructor).sendMentorEnrollmentNotification(
            `${req.user.firstName} ${req.user.lastName}`, 
            course.title
        ).catch(err => {
            console.error("Mentor notification email failed:", err);
        });
    }
});

/**
 * @desc Get currently logged-in candidate's enrollments
 */
export const getMyEnrollments = catchAsync(async (req, res, next) => {
    const enrollments = await Enrollment.find({ candidate: req.user._id })
        .populate({
            path: 'course',
            select: 'title description category level thumbnail duration enrollmentCount averageRating syllabus',
            populate: { path: 'instructor', select: 'firstName lastName avatar' }
        })
        .sort('-createdAt');

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: enrollments.length,
        data: {
            enrollments
        }
    });
});

/**
 * @desc Update course progress (Candidate)
 */
export const updateProgress = catchAsync(async (req, res, next) => {
    const { courseId, lessonIdx, completed } = req.body;
    const candidateId = req.user._id;

    // 1. Find the enrollment
    const enrollment = await Enrollment.findOne({ candidate: candidateId, course: courseId });
    if (!enrollment) {
        return next(new AppError('Enrollment not found', httpStatus.NOT_FOUND));
    }

    // 2. Get course to find total lessons
    const course = await Course.findById(courseId);
    const totalLessons = course.syllabus.length;

    // 3. Update completedLessons array
    let completedSet = new Set(enrollment.completedLessons || []);
    if (completed) {
        completedSet.add(lessonIdx);
    } else {
        completedSet.delete(lessonIdx);
    }
    
    enrollment.completedLessons = Array.from(completedSet);

    // 4. Calculate progress percentage
    enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);

    // 5. Update status if finished
    if (enrollment.progress === 100 && enrollment.status !== 'completed') {
        enrollment.status = 'completed';
        enrollment.completedAt = Date.now();
    } else if (enrollment.progress < 100) {
        enrollment.status = 'active';
    }

    enrollment.lastAccessed = Date.now();
    await enrollment.save();

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons,
            status: enrollment.status
        }
    });
});

/**
 * @desc Submit certification exam (Candidate)
 */
export const submitCertificationExam = catchAsync(async (req, res, next) => {
    const { courseId, answers } = req.body;
    const candidateId = req.user._id;

    const enrollment = await Enrollment.findOne({ candidate: candidateId, course: courseId }).populate('course');
    if (!enrollment) {
        return next(new AppError('Enrollment not found', httpStatus.NOT_FOUND));
    }

    if (!enrollment.course.certification?.mcqEnabled) {
        return next(new AppError('Certification MCQ is not enabled for this course', httpStatus.BAD_REQUEST));
    }

    const questions = enrollment.course.certification.questions;
    let score = 0;
    questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) score++;
    });

    const percent = Math.round((score / questions.length) * 100);
    const passingScore = enrollment.course.certification.mcqPassingScore || 70;

    enrollment.certificationTracking.mcqScore = percent;
    enrollment.certificationTracking.mcqStatus = percent >= passingScore ? 'passed' : 'failed';

    // Check if fully certified now
    const isProjectDone = enrollment.certificationTracking.projectStatus === 'na' || enrollment.certificationTracking.projectStatus === 'approved';
    if (enrollment.certificationTracking.mcqStatus === 'passed' && isProjectDone) {
        enrollment.certificationTracking.isCertified = true;
        enrollment.certificationTracking.issuedAt = Date.now();
        enrollment.certificationTracking.certificateId = generateCertificateId();
    }

    await enrollment.save();

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            score: percent,
            passed: percent >= passingScore,
            isCertified: enrollment.certificationTracking.isCertified
        }
    });

    // Send Certification Email if just earned
    if (enrollment.certificationTracking.isCertified && req.user.notificationSettings?.emailAlerts) {
        new Email(req.user).sendCertificationEmail(
            enrollment.course.title, 
            enrollment.certificationTracking.certificateId
        ).catch(err => {
            console.error("Certification email failed:", err);
        });
    }
});

/**
 * @desc Submit capstone project link (Candidate)
 */
export const submitCapstoneProject = catchAsync(async (req, res, next) => {
    const { courseId, projectUrl } = req.body;
    const candidateId = req.user._id;

    const enrollment = await Enrollment.findOne({ candidate: candidateId, course: courseId });
    if (!enrollment) {
        return next(new AppError('Enrollment not found', httpStatus.NOT_FOUND));
    }

    enrollment.certificationTracking.projectUrl = projectUrl;
    enrollment.certificationTracking.projectStatus = 'submitted';
    await enrollment.save();

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: 'Project submitted successfully'
    });
});

/**
 * @desc Review capstone project (Mentor)
 */
export const reviewCapstoneProject = catchAsync(async (req, res, next) => {
    const { enrollmentId, status, feedback } = req.body; // status: approved, rejected

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
        return next(new AppError('Enrollment not found', httpStatus.NOT_FOUND));
    }

    // Ensure only the instructor can review
    if (enrollment.instructor.toString() !== req.user._id.toString()) {
        return next(new AppError('You are not authorized to review this project', httpStatus.UNAUTHORIZED));
    }

    enrollment.certificationTracking.projectStatus = status;
    enrollment.certificationTracking.projectFeedback = feedback;

    // Check if fully certified now
    const isMcqDone = enrollment.certificationTracking.mcqStatus === 'na' || enrollment.certificationTracking.mcqStatus === 'passed';
    if (status === 'approved' && isMcqDone) {
        enrollment.certificationTracking.isCertified = true;
        enrollment.certificationTracking.issuedAt = Date.now();
        enrollment.certificationTracking.certificateId = generateCertificateId();
    }

    await enrollment.save();

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: `Project ${status} successfully`
    });

    // Send Certification Email if just earned
    if (enrollment.certificationTracking.isCertified) {
        // Find the candidate's email (enrollment only has ID)
        const EnrollmentWithUser = await Enrollment.findById(enrollmentId).populate('candidate').populate('course');
        if (EnrollmentWithUser.candidate?.notificationSettings?.emailAlerts) {
            new Email(EnrollmentWithUser.candidate).sendCertificationEmail(
                EnrollmentWithUser.course.title, 
                enrollment.certificationTracking.certificateId
            ).catch(err => {
                console.error("Certification email failed (Review process):", err);
            });
        }
    }
});

/**
 * @desc Rate and review a course (Candidate)
 */
export const rateCourse = catchAsync(async (req, res, next) => {
    const { courseId, rating, review } = req.body;
    const candidateId = req.user._id;

    // 1. Find enrollment
    const enrollment = await Enrollment.findOne({ candidate: candidateId, course: courseId });
    if (!enrollment) {
        return next(new AppError('You must be enrolled in this course to rate it', httpStatus.BAD_REQUEST));
    }

    // 2. Update enrollment with rating and review
    enrollment.rating = rating;
    enrollment.review = review;
    enrollment.ratedAt = Date.now();
    await enrollment.save();

    // 3. Recalculate course average rating
    const allRatings = await Enrollment.find({ course: courseId, rating: { $exists: true } }, 'rating');
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((acc, curr) => acc + curr.rating, 0) / allRatings.length)
        : 0;

    await Course.findByIdAndUpdate(courseId, { averageRating: avgRating });

    // 4. Log activity
    await logActivity({
        userId: candidateId,
        userRole: 'candidate',
        action: 'RATE',
        resource: 'COURSE',
        resourceId: courseId,
        details: { rating, hasReview: !!review }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: 'Thank you for your feedback!',
        data: {
            averageRating: avgRating
        }
    });
});

/**
 * @desc Get all reviews for courses taught by the logged-in mentor
 */
export const getMentorReviews = catchAsync(async (req, res, next) => {
    const instructorId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { 
        instructor: instructorId, 
        rating: { $exists: true } 
    };

    const total = await Enrollment.countDocuments(query);
    const reviews = await Enrollment.find(query)
        .populate('candidate', 'firstName lastName avatar')
        .populate('course', 'title category thumbnail')
        .sort('-ratedAt')
        .skip(skip)
        .limit(limit);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Get summary stats for the entire pool (not just the page)
    const statsData = await Enrollment.aggregate([
        { $match: query },
        { 
            $group: { 
                _id: null, 
                avgRating: { $avg: "$rating" },
                fiveStarCount: { 
                    $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } 
                },
                monthlyCount: {
                    $sum: { $cond: [{ $gte: ["$ratedAt", firstDayOfMonth] }, 1, 0] }
                }
            } 
        }
    ]);

    const averageRating = statsData.length > 0 ? statsData[0].avgRating.toFixed(1) : "0.0";
    const fiveStarCount = statsData.length > 0 ? statsData[0].fiveStarCount : 0;
    const monthlyReviews = statsData.length > 0 ? statsData[0].monthlyCount : 0;

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: reviews.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: {
            reviews,
            stats: {
                totalReviews: total,
                averageRating,
                fiveStarCount,
                monthlyReviews
            }
        }
    });
});

/**
 * @desc Enroll in multiple courses at once (Candidate Cart Checkout)
 */
export const enrollBatch = catchAsync(async (req, res, next) => {
    const { courseIds, couponCode } = req.body;
    const candidateId = req.user._id;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        return next(new AppError('No courses provided', httpStatus.BAD_REQUEST));
    }

    let coupon = null;
    if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });

        if (!coupon) {
            return next(new AppError("Invalid or expired coupon code", httpStatus.NOT_FOUND));
        }

        // Basic re-validation (expiry, usage, etc.)
        if (coupon.expiryDate && coupon.expiryDate < new Date()) {
            return next(new AppError("This coupon has expired", httpStatus.BAD_REQUEST));
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return next(new AppError("This coupon has reached its maximum usage limit", httpStatus.BAD_REQUEST));
        }

        // Enforce per-user usage limit
        if (coupon.usageLimitPerUser) {
            const userUsageCount = await Transaction.countDocuments({
                candidate: candidateId,
                couponCode: coupon.code,
                status: { $ne: 'failed' }
            });
            if (userUsageCount >= coupon.usageLimitPerUser) {
                return next(new AppError("You have already used this coupon the maximum number of times", httpStatus.BAD_REQUEST));
            }
        }
    }

    const results = [];
    const errors = [];
    const successfulCourseTitles = [];
    let couponActuallyUsed = false;
    let totalPaidBatch = 0;

    // 1. Identify all eligible courses and calculate the total potential discount pool
    // We process unique IDs to avoid duplicate enrollment attempts in the same batch
    const uniqueCourseIds = [...new Set(courseIds)];
    const itemsToProcess = [];
    let totalPotentialDiscount = 0;

    for (const id of uniqueCourseIds) {
        try {
            const course = await Course.findById(id);
            if (!course || course.status !== 'published') {
                errors.push({ courseId: id, message: 'Course not found or not available' });
                continue;
            }

            const existingEnrollment = await Enrollment.findOne({ candidate: candidateId, course: id });
            if (existingEnrollment) {
                errors.push({ courseId: id, message: 'Already enrolled' });
                continue;
            }

            let isApplicable = false;
            let potential = 0;

            if (coupon) {
                isApplicable = true;
                // Type Check
                if (!(coupon.applicableTo === 'all' || coupon.applicableTo === 'courses')) isApplicable = false;
                // Instructor Check
                if (isApplicable && coupon.instructor && coupon.instructor.toString() !== course.instructor.toString()) isApplicable = false;
                // Specific Items Check
                if (isApplicable && coupon.specificItems?.length > 0 && !coupon.specificItems.some(item => item.toString() === id.toString())) isApplicable = false;

                if (isApplicable) {
                    if (coupon.discountType === 'percentage') {
                        potential = (course.price * coupon.discountValue) / 100;
                    } else {
                        potential = course.price; // For fixed pool, we weigh by price
                    }
                }
            }

            itemsToProcess.push({ course, isApplicable, potential });
            totalPotentialDiscount += potential;
        } catch (err) {
            errors.push({ courseId: id, message: `Validation error: ${err.message}` });
        }
    }

    // 2. Calculate the global discount ratio (cap enforcement)
    let discountRatio = 1;
    if (coupon && totalPotentialDiscount > 0) {
        if (coupon.discountType === 'percentage') {
            // Apply maxDiscount cap to the total potential pool
            let finalTotalDiscount = totalPotentialDiscount;
            if (coupon.maxDiscount && finalTotalDiscount > coupon.maxDiscount) {
                finalTotalDiscount = coupon.maxDiscount;
            }
            discountRatio = finalTotalDiscount / totalPotentialDiscount;
        } else {
            // For Fixed coupons, distribute the fixed value proportionally across the applicable items
            const totalFixedToGive = Math.min(coupon.discountValue, totalPotentialDiscount);
            discountRatio = totalFixedToGive / totalPotentialDiscount;
        }
    }

    // 3. Process the Actual Enrollments and Transactions
    for (const item of itemsToProcess) {
        const { course, isApplicable, potential } = item;
        try {
            // 3.1 Create enrollment
            const enrollment = await Enrollment.create({
                candidate: candidateId,
                course: course._id,
                instructor: course.instructor,
                progress: 0,
                status: 'active',
                certificationTracking: {
                    mcqStatus: course.certification?.mcqEnabled ? 'pending' : 'na',
                    projectStatus: course.certification?.projectEnabled ? 'pending' : 'na',
                    isCertified: false
                }
            });

            // 3.2 Calculate final price for this item
            let appliedDiscount = 0;
            if (isApplicable) {
                appliedDiscount = potential * discountRatio;
                if (appliedDiscount > 0) couponActuallyUsed = true;
            }
            const finalPrice = Math.max(0, course.price - appliedDiscount);

            // 3.3 Create Transaction
            if (finalPrice > 0 || (course.price > 0 && finalPrice === 0)) {
                totalPaidBatch += finalPrice;
                await Transaction.create({
                    enrollment: enrollment._id,
                    candidate: candidateId,
                    course: course._id,
                    instructor: course.instructor,
                    amount: parseFloat(finalPrice.toFixed(2)),
                    discount: parseFloat((course.price - finalPrice).toFixed(2)),
                    couponCode: (isApplicable && appliedDiscount > 0) ? coupon.code : undefined,
                    billingDetails: {
                        name: `${req.user.firstName || 'User'} ${req.user.lastName || ''}`,
                        email: req.user.email
                    }
                });
            }

            // 3.4 Increment counts
            course.enrollmentCount += 1;
            await course.save();

            // 3.5 Log activity
            await logActivity({
                userId: candidateId,
                userRole: 'candidate',
                action: 'ENROLL',
                resource: 'COURSE',
                resourceId: course._id,
                details: { courseTitle: course.title, amount: course.price, batch: true }
            }, req);

            results.push({ courseId: course._id, status: 'success' });
            successfulCourseTitles.push(course.title);
        } catch (err) {
            console.error(`[EnrollBatch] Processing failed for ${course._id}:`, err);
            errors.push({ courseId: course._id, message: err.message });
        }
    }

    // Increment coupon usage count once for the entire batch if any discount was applied
    if (coupon && couponActuallyUsed && results.length > 0) {
        coupon.usageCount += 1;
        await coupon.save();
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            processed: results.length,
            failed: errors.length,
            results,
            errors
        }
    });

    // Send Batch Enrollment Email in background
    if (successfulCourseTitles.length > 0 && req.user.notificationSettings?.emailAlerts) {
        new Email(req.user).sendBatchEnrollmentConfirmation(
            successfulCourseTitles, 
            totalPaidBatch.toFixed(2)
        ).catch(err => {
            console.error("Batch enrollment email failed:", err);
        });
    }

    // Notify Mentors in background
    // We can notify each mentor once (even if they have multiple courses in this batch)
    const uniqueInstructors = [...new Set(itemsToProcess.map(i => i.course.instructor))];
    for (const instructorId of uniqueInstructors) {
        try {
            const instructor = await User.findById(instructorId);
            if (instructor?.email) {
                // Find courses in this batch belonging to this instructor
                const instructorCourses = itemsToProcess
                    .filter(i => i.course.instructor.toString() === instructorId.toString())
                    .map(i => i.course.title);

                new Email(instructor).sendMentorEnrollmentNotification(
                    `${req.user.firstName} ${req.user.lastName}`,
                    instructorCourses.join(", ")
                ).catch(err => console.error("Mentor batch notification failed:", err));
            }
        } catch (err) {
            console.error("Failed to notify mentor in batch:", err);
        }
    }
});

/**
 * @desc Enroll in a Bundle (Candidate Checkout)
 */
export const enrollBundle = catchAsync(async (req, res, next) => {
    const { bundleId, couponCode } = req.body;
    const candidateId = req.user._id;

    if (!bundleId) {
        return next(new AppError('Bundle ID is required', httpStatus.BAD_REQUEST));
    }

    const bundle = await Bundle.findById(bundleId).populate('courses');
    if (!bundle || bundle.status !== 'published') {
        return next(new AppError('Bundle not found or not available', httpStatus.NOT_FOUND));
    }

    if (!bundle.courses || bundle.courses.length === 0) {
        return next(new AppError('This bundle has no courses', httpStatus.BAD_REQUEST));
    }

    // 2. Handle Coupon if provided
    let coupon = null;
    if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
        if (!coupon) return next(new AppError("Invalid or expired coupon code", httpStatus.NOT_FOUND));
        if (coupon.expiryDate && coupon.expiryDate < new Date()) return next(new AppError("This coupon has expired", httpStatus.BAD_REQUEST));
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return next(new AppError("This coupon has reached its maximum usage limit", httpStatus.BAD_REQUEST));
        if (coupon.usageLimitPerUser) {
        if (coupon.usageLimitPerUser) {
            // Smart Usage Counting: Group transactions by "Time Clouds" (2-second windows)
            // This counts any transactions created in the same loop/bundle as ONE use.
            const userTransactions = await Transaction.find({
                candidate: candidateId,
                couponCode: coupon.code,
                status: { $ne: 'failed' }
            }).sort('createdAt').select('createdAt');

            if (userTransactions.length > 0) {
                let uniquePurchaseEvents = 0;
                let lastTxTime = 0;

                userTransactions.forEach(tx => {
                    const currentTime = new Date(tx.createdAt).getTime();
                    // If this transaction is more than 2 seconds after the last one, it's a new "Use"
                    if (currentTime - lastTxTime > 2000) {
                        uniquePurchaseEvents++;
                        lastTxTime = currentTime;
                    }
                });

                if (uniquePurchaseEvents >= coupon.usageLimitPerUser) {
                    return next(new AppError("You have already used this coupon the maximum number of times", httpStatus.BAD_REQUEST));
                }
            }
        }
        }
    }

    let finalBundlePrice = bundle.price;
    let appliedDiscount = 0;
    if (coupon) {
        let isApplicable = true;
        if (!(coupon.applicableTo === 'all' || coupon.applicableTo === 'bundles')) isApplicable = false;
        if (isApplicable && coupon.instructor && coupon.instructor.toString() !== bundle.instructor.toString()) isApplicable = false;
        if (isApplicable && coupon.specificItems?.length > 0 && !coupon.specificItems.some(id => id.toString() === bundleId.toString())) isApplicable = false;

        if (isApplicable) {
            if (coupon.discountType === 'percentage') {
                appliedDiscount = (bundle.price * coupon.discountValue) / 100;
                if (coupon.maxDiscount && appliedDiscount > coupon.maxDiscount) appliedDiscount = coupon.maxDiscount;
            } else {
                appliedDiscount = Math.min(coupon.discountValue, bundle.price);
            }
            finalBundlePrice = Math.max(0, bundle.price - appliedDiscount);
        } else if (couponCode) {
            return next(new AppError("This coupon is not applicable to this bundle", httpStatus.BAD_REQUEST));
        }
    }

    // 3. Prorate the final bundle price across all the courses inside it
    const courseCount = bundle.courses.length;
    const proratedAmount = parseFloat((finalBundlePrice / courseCount).toFixed(2));
    const proratedDiscount = parseFloat((appliedDiscount / courseCount).toFixed(2));

    const results = [];
    const errors = [];
    const successfulCourseTitles = [];
    let totalPaidBundle = 0;

    // We generate a "Shared Payment ID" for all courses in this bundle purchase.
    // This allows accurate coupon-usage tracking (counting this bundle as ONE use).
    const sharedPaymentId = `pay_${Math.random().toString(36).substr(2, 9)}`;

    // Process each course in the bundle
    for (const course of bundle.courses) {
        try {
            if (course.status !== 'published') {
                errors.push({ courseId: course._id, message: 'Course is not currently published' });
                continue;
            }

            // Check if already enrolled
            const existingEnrollment = await Enrollment.findOne({ candidate: candidateId, course: course._id });
            if (existingEnrollment) {
                // We'll mark it as a harmless skip rather than a critical error
                errors.push({ courseId: course._id, message: 'Already enrolled' });
                continue;
            }

            // Create enrollment
            const enrollment = await Enrollment.create({
                candidate: candidateId,
                course: course._id,
                instructor: course.instructor,
                progress: 0,
                status: 'active',
                certificationTracking: {
                    mcqStatus: course.certification?.mcqEnabled ? 'pending' : 'na',
                    projectStatus: course.certification?.projectEnabled ? 'pending' : 'na',
                    isCertified: false
                }
            });

            // Create prorated Transaction for the instructor
            if (proratedAmount > 0) {
                try {
                    totalPaidBundle += proratedAmount;
                    await Transaction.create({
                        enrollment: enrollment._id,
                        candidate: candidateId,
                        course: course._id,
                        bundle: bundle._id, // Group line-items by bundle
                        instructor: course.instructor, 
                        amount: proratedAmount,
                        discount: proratedDiscount,
                        paymentId: sharedPaymentId, // One checkout ID for all courses in this bundle
                        couponCode: coupon ? coupon.code : undefined,
                        billingDetails: {
                            name: `${req.user.firstName || 'User'} ${req.user.lastName || ''}`,
                            email: req.user.email
                        }
                    });
                } catch (txErr) {
                    console.error(`[EnrollBundle] TRANSACTION FAILED for course ${course._id}:`, txErr);
                    errors.push({ courseId: course._id, message: `Transaction failed: ${txErr.message}` });
                    continue; // Skip the rest of analytics increments if tx failed? Usually it's fine
                }
            }

            // Increment course enrollment count
            course.enrollmentCount += 1;
            await course.save();

            // Log activity
            await logActivity({
                userId: candidateId,
                userRole: 'candidate',
                action: 'ENROLL',
                resource: 'BUNDLE',
                resourceId: bundleId,
                details: { bundleTitle: bundle.title, courseEnrolled: course.title, proratedAmount }
            }, req);

            results.push({ courseId: course._id, title: course.title, status: 'success' });
            successfulCourseTitles.push(course.title);
        } catch (err) {
            errors.push({ courseId: course._id, message: err.message });
        }
    }

    // Increment overall Bundle enrollment
    if (results.length > 0) {
        bundle.enrollmentCount += 1;
        await bundle.save();

        if (coupon && appliedDiscount > 0) {
            coupon.usageCount += 1;
            await coupon.save();
        }
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            bundleId: bundle._id,
            bundleTitle: bundle.title,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        }
    });

    // Send Batch Enrollment Email
    if (successfulCourseTitles.length > 0 && req.user.notificationSettings?.emailAlerts) {
        new Email(req.user).sendBatchEnrollmentConfirmation(
            successfulCourseTitles, 
            totalPaidBundle.toFixed(2)
        ).catch(err => {
            console.error("Bundle enrollment email failed:", err);
        });
    }

    // Notify Mentors (Bundle Instructor + Course Instructors)
    const instructorsToNotify = [...new Set([
        bundle.instructor.toString(), 
        ...bundle.courses.map(c => c.instructor.toString())
    ])];

    for (const instId of instructorsToNotify) {
        try {
            const inst = await User.findById(instId);
            if (inst?.email) {
                new Email(inst).sendMentorEnrollmentNotification(
                    `${req.user.firstName} ${req.user.lastName}`,
                    bundle.title
                ).catch(err => console.error("Mentor bundle notification failed:", err));
            }
        } catch (err) {
            console.error("Failed to notify mentor in bundle:", err);
        }
    }
});

/**
 * @desc Get all reviews across the entire platform (Superuser/Admin)
 */
export const getAllReviews = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { rating: { $exists: true } };

    const total = await Enrollment.countDocuments(query);
    const reviews = await Enrollment.find(query)
        .populate('candidate', 'firstName lastName avatar email')
        .populate({
            path: 'course',
            select: 'title category thumbnail instructor',
            populate: { path: 'instructor', select: 'firstName lastName' }
        })
        .sort('-ratedAt')
        .skip(skip)
        .limit(limit);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const statsData = await Enrollment.aggregate([
        { $match: query },
        { 
            $group: { 
                _id: null, 
                avgRating: { $avg: "$rating" },
                fiveStarCount: { 
                    $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } 
                },
                monthlyCount: {
                    $sum: { $cond: [{ $gte: ["$ratedAt", firstDayOfMonth] }, 1, 0] }
                }
            } 
        }
    ]);

    const averageRating = statsData.length > 0 ? statsData[0].avgRating.toFixed(1) : "0.0";
    const fiveStarCount = statsData.length > 0 ? statsData[0].fiveStarCount : 0;
    const monthlyReviews = statsData.length > 0 ? statsData[0].monthlyCount : 0;

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: reviews.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
        data: {
            reviews,
            stats: {
                totalReviews: total,
                averageRating,
                fiveStarCount,
                monthlyReviews
            }
        }
    });
});

/**
 * @desc Delete (Reset) a specific review (Superuser/Admin)
 */
export const deleteReview = catchAsync(async (req, res, next) => {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
        return next(new AppError('Review/Enrollment not found', httpStatus.NOT_FOUND));
    }

    const courseId = enrollment.course;

    // Reset rating and review fields
    enrollment.rating = undefined;
    enrollment.review = undefined;
    enrollment.ratedAt = undefined;
    await enrollment.save();

    // Recalculate course average rating
    const allRatings = await Enrollment.find({ course: courseId, rating: { $exists: true } }, 'rating');
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((acc, curr) => acc + curr.rating, 0) / allRatings.length)
        : 0;

    await Course.findByIdAndUpdate(courseId, { averageRating: avgRating });

    // Log activity
    await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'DELETE',
        resource: 'COURSE',
        resourceId: courseId,
        details: { enrollmentId: enrollment._id, courseId: courseId, reason: 'Admin intervention' }
    }, req);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: 'Review successfully deleted (reset)',
        data: {
            averageRating: avgRating
        }
    });
});

export default {
    getMentorStudents,
    getMentorStudentStats,
    enrollInCourse,
    enrollBatch,
    enrollBundle,
    getMyEnrollments,
    updateProgress,
    submitCertificationExam,
    submitCapstoneProject,
    reviewCapstoneProject,
    rateCourse,
    getMentorReviews,
    getAllReviews,
    deleteReview,
    getAllStudents,
    getAllStudentStats
};
