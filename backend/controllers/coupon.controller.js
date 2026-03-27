import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";
import Coupon from "../models/Coupon.model.js";
import Course from "../models/Course.model.js";
import Bundle from "../models/Bundle.model.js";
import Transaction from "../models/Transaction.model.js";

/**
 * @desc Create a new coupon
 */
export const createCoupon = catchAsync(async (req, res, next) => {
    const { 
        code, 
        discountType, 
        discountValue, 
        applicableTo, 
        specificItems, 
        itemModel,
        expiryDate, 
        usageLimit,
        minOrderValue,
        maxDiscount,
        description
    } = req.body;

    // Check if code exists globally
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
        return next(new AppError("This coupon code is already taken. Please choose another one.", httpStatus.CONFLICT));
    }

    const newCouponData = {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        applicableTo: applicableTo || 'all',
        specificItems,
        itemModel,
        expiryDate,
        usageLimit,
        minOrderValue: minOrderValue || 0,
        maxDiscount,
        description,
        createdBy: req.user._id,
        creatorRole: req.user.role
    };

    // If a mentor creates it, it automatically only applies to their courses/bundles
    if (req.user.role === 'mentor') {
        newCouponData.instructor = req.user._id;
    }

    const coupon = await Coupon.create(newCouponData);

    res.status(httpStatus.CREATED).json({
        status: 'success',
        data: { coupon }
    });
});

/**
 * @desc Get all coupons (filtered by role)
 */
export const listCoupons = catchAsync(async (req, res, next) => {
    let query = {};

    // Mentors only see their own coupons
    if (req.user.role === 'mentor') {
        query.createdBy = req.user._id;
    }

    const coupons = await Coupon.find(query).sort('-createdAt');

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: coupons.length,
        data: { coupons }
    });
});

/**
 * @desc Validate a coupon during checkout
 */
export const validateCoupon = catchAsync(async (req, res, next) => {
    const { code, cartItems } = req.body; // cartItems is array of { id, type: 'Course'|'Bundle', price }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'active' });

    if (!coupon) {
        return next(new AppError("Invalid or expired coupon code", httpStatus.NOT_FOUND));
    }

    // Check expiry
    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
        coupon.status = 'expired';
        await coupon.save();
        return next(new AppError("This coupon has expired", httpStatus.BAD_REQUEST));
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return next(new AppError("This coupon has reached its maximum usage limit", httpStatus.BAD_REQUEST));
    }

    // Check usage limit per user
    if (coupon.usageLimitPerUser) {
        const userUsageCount = await Transaction.countDocuments({
            candidate: req.user._id,
            couponCode: coupon.code,
            status: { $ne: 'failed' }
        });
        if (userUsageCount >= coupon.usageLimitPerUser) {
            return next(new AppError("You have already used this coupon the maximum number of times", httpStatus.BAD_REQUEST));
        }
    }

    // Filter cart items that are applicable
    let discountableItems = [];
    let totalPriceOfApplicableItems = 0;

    for (const item of cartItems) {
        let isApplicable = false;

        // 1. Basic Type Check
        if (coupon.applicableTo === 'all' || 
           (coupon.applicableTo === 'courses' && item.type === 'Course') ||
           (coupon.applicableTo === 'bundles' && item.type === 'Bundle')) {
            isApplicable = true;
        }

        // 2. Instructor Check (If mentor coupon)
        if (isApplicable && coupon.instructor) {
            // Need to verify item belongs to this instructor
            let itemData;
            if (item.type === 'Course') {
                itemData = await Course.findById(item.id);
            } else {
                itemData = await Bundle.findById(item.id);
            }

            if (!itemData || itemData.instructor.toString() !== coupon.instructor.toString()) {
                isApplicable = false;
            }
        }

        // 3. Specific Items Check
        if (isApplicable && coupon.specificItems?.length > 0) {
            if (!coupon.specificItems.some(id => id.toString() === item.id.toString())) {
                isApplicable = false;
            }
        }

        if (isApplicable) {
            discountableItems.push(item);
            totalPriceOfApplicableItems += item.price;
        }
    }

    if (discountableItems.length === 0) {
        return next(new AppError("This coupon is not applicable to the items in your cart", httpStatus.BAD_REQUEST));
    }

    // Check min order value
    if (coupon.minOrderValue > totalPriceOfApplicableItems) {
        return next(new AppError(`This coupon requires a minimum subtotal of ₹${coupon.minOrderValue}`, httpStatus.BAD_REQUEST));
    }

    // Calculate total discount
    let totalDiscount = 0;
    if (coupon.discountType === 'percentage') {
        totalDiscount = (totalPriceOfApplicableItems * coupon.discountValue) / 100;
        if (coupon.maxDiscount && totalDiscount > coupon.maxDiscount) {
            totalDiscount = coupon.maxDiscount;
        }
    } else {
        totalDiscount = coupon.discountValue;
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            code: coupon.code,
            discountAmount: totalDiscount,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        }
    });
});

/**
 * @desc Get coupon detail
 */
export const getCoupon = catchAsync(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new AppError("Coupon not found", httpStatus.NOT_FOUND));
    }

    // Permission check
    if (req.user.role === 'mentor' && coupon.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError("You don't have permission to view this coupon", httpStatus.FORBIDDEN));
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: { coupon }
    });
});

/**
 * @desc Update coupon
 */
export const updateCoupon = catchAsync(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new AppError("Coupon not found", httpStatus.NOT_FOUND));
    }

    if (req.user.role === 'mentor' && coupon.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError("You don't have permission to edit this coupon", httpStatus.FORBIDDEN));
    }

    // Cleanup empty strings for optional numeric fields to ensure they are unset/null in DB
    const updateData = { ...req.body };
    ['maxDiscount', 'usageLimit', 'minOrderValue', 'usageLimitPerUser'].forEach(field => {
        if (updateData[field] === "" || updateData[field] === null) {
            updateData[field] = null; // Explicitly set to null to remove limit in DB
        }
    });

    // Prevent Changing the code if already shared? Maybe allow but careful.
    // For now, allow everything except changing creator fields
    const updatedCoupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { ...updateData, createdBy: coupon.createdBy, creatorRole: coupon.creatorRole },
        { new: true, runValidators: true }
    );

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: { coupon: updatedCoupon }
    });
});

/**
 * @desc Delete coupon
 */
export const deleteCoupon = catchAsync(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        return next(new AppError("Coupon not found", httpStatus.NOT_FOUND));
    }

    if (req.user.role === 'mentor' && coupon.createdBy.toString() !== req.user._id.toString()) {
        return next(new AppError("You don't have permission to delete this coupon", httpStatus.FORBIDDEN));
    }

    if (coupon.usageCount > 0) {
        return next(new AppError("You cannot delete a coupon that has already been used. Please pause it instead to prevent further use while preserving historical data.", httpStatus.BAD_REQUEST));
    }

    await coupon.deleteOne();

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: "Coupon deleted successfully"
    });
});
