import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';
import Coupon from '../models/Coupon.model.js';

dotenv.config();

const cleanupExpiredCoupons = async () => {
    try {
        const result = await Coupon.updateMany(
            {
                expiryDate: { $lt: new Date() },
                status: 'active'
            },
            {
                $set: { status: 'expired' }
            }
        );

        console.log(`[CouponCron] Marked ${result.modifiedCount} coupons as expired`);
        return result.modifiedCount;
    } catch (error) {
        console.error('[CouponCron] Error:', error.message);
        throw error;
    }
};

export const startCouponCronJob = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[CouponCron] Running nightly coupon expiration check...');
        await cleanupExpiredCoupons();
    });

    console.log('[CouponCron] Scheduled nightly coupon expiration check (runs at midnight)');
};

const runStandalone = async () => {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
        throw new Error('MONGO_URL not found in environment variables');
    }

    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB for coupon cleanup...');

    await cleanupExpiredCoupons();

    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
};

if (import.meta.url === `file://${process.argv[1]}`) {
    runStandalone();
}

export default startCouponCronJob;
