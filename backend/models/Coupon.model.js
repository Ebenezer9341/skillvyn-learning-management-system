import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: [true, 'Discount type is required']
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: [0, 'Discount value cannot be negative']
    },
    applicableTo: {
        type: String,
        enum: ['all', 'courses', 'bundles'],
        default: 'all'
    },
    specificItems: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'itemModel'
    }],
    itemModel: {
        type: String,
        enum: ['Course', 'Bundle']
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number
    },
    expiryDate: {
        type: Date
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    usageCount: {
        type: Number,
        default: 0
    },
    usageLimitPerUser: {
        type: Number,
        default: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorRole: {
        type: String,
        enum: ['mentor', 'admin', 'superuser'],
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'expired'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Note: Status and Expiry are handled in the controllers to ensure historical records are visible in management views
const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
