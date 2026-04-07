import Coupon from '../models/Coupon.model.js';
import Transaction from '../models/Transaction.model.js';

export const checkAndUpdateCouponStatus = async (coupon) => {
    if (!coupon) return null;

    let needsSave = false;

    if (coupon.expiryDate && coupon.expiryDate < new Date() && coupon.status === 'active') {
        coupon.status = 'expired';
        needsSave = true;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit && coupon.status === 'active') {
        coupon.status = 'exhausted';
        needsSave = true;
    }

    if (needsSave) {
        await coupon.save();
    }

    return coupon;
};

export const validateCouponForUse = async (code, candidateId = null) => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'active' });

    if (!coupon) {
        const expiredCoupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'expired' });
        if (expiredCoupon) {
            return { valid: false, error: 'expired', coupon: expiredCoupon };
        }
        const exhaustedCoupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'exhausted' });
        if (exhaustedCoupon) {
            return { valid: false, error: 'exhausted', coupon: exhaustedCoupon };
        }
        return { valid: false, error: 'invalid', coupon: null };
    }

    const updatedCoupon = await checkAndUpdateCouponStatus(coupon);

    if (updatedCoupon.status !== 'active') {
        return { valid: false, error: updatedCoupon.status, coupon: updatedCoupon };
    }

    if (candidateId) {
        const userUsageCount = await Transaction.countDocuments({
            candidate: candidateId,
            couponCode: coupon.code,
            status: { $ne: 'failed' }
        });

        if (coupon.usageLimitPerUser && userUsageCount >= coupon.usageLimitPerUser) {
            return { valid: false, error: 'user_limit_reached', coupon };
        }
    }

    return { valid: true, coupon: updatedCoupon };
};

export default {
    checkAndUpdateCouponStatus,
    validateCouponForUse
};
