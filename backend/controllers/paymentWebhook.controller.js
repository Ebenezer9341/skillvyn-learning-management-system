import crypto from 'crypto';
import Transaction from '../models/Transaction.model.js';
import Enrollment from '../models/Enrollment.model.js';
import Course from '../models/Course.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import httpStatus from '../utils/httpStatus.js';
import { logActivity } from '../utils/logger.js';
import Email from '../utils/email.js';
import Notification from '../models/Notification.model.js';
import { sendNotification } from '../utils/socketNotify.js';
import User from '../models/User.model.js';

const verifyWebhookSignature = (payload, signature, secret) => {
    if (!signature) return false;
    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        // timingSafeEqual requires equal-length buffers — if lengths differ,
        // the signature is definitively invalid, no need to compare
        if (sigBuffer.length !== expectedBuffer.length) return false;

        return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
        return false;
    }
};

export const handlePaymentWebhook = catchAsync(async (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return next(new AppError('Webhook secret not configured', httpStatus.INTERNAL_SERVER_ERROR));
    }

    const payload = JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(payload, signature, webhookSecret);

    if (!isValid) {
        return next(new AppError('Invalid webhook signature', httpStatus.UNAUTHORIZED));
    }

    const { event, paymentId, status, enrollmentId } = req.body;

    if (event !== 'payment.success' && event !== 'payment.failed') {
        return res.status(200).json({ status: 'success', message: 'Event ignored' });
    }

    const transaction = await Transaction.findOne({ paymentId });
    if (!transaction) {
        return next(new AppError('Transaction not found', httpStatus.NOT_FOUND));
    }

    const enrollment = await Enrollment.findById(enrollmentId || transaction.enrollment);
    if (!enrollment) {
        return next(new AppError('Enrollment not found', httpStatus.NOT_FOUND));
    }

    if (event === 'payment.success' && status === 'success') {
        transaction.status = 'success';
        await transaction.save();

        enrollment.status = 'active';
        await enrollment.save();

        await logActivity({
            userId: enrollment.candidate,
            userRole: 'candidate',
            action: 'PAYMENT_CONFIRMED',
            resource: 'ENROLLMENT',
            resourceId: enrollment._id,
            details: { paymentId, transactionId: transaction._id }
        }, req);

        const course = await Course.findById(enrollment.course).populate('instructor', 'email firstName lastName');
        const user = await User.findById(enrollment.candidate);

        if (!user) {
            console.error(`Webhook error: Candidate ${enrollment.candidate} not found for enrollment ${enrollment._id}`);
            return res.status(200).json({ status: 'success', message: 'User not found' });
        }

        if (user?.notificationSettings?.emailAlerts) {
            new Email(user).sendEnrollmentConfirmation(
                course.title,
                transaction.invoiceNumber,
                transaction.amount
            ).catch(err => console.error("Enrollment email failed:", err));
        }

        if (course.instructor?.email) {
            new Email(course.instructor).sendMentorEnrollmentNotification(
                `${user.firstName} ${user.lastName}`,
                course.title
            ).catch(err => console.error("Mentor notification failed:", err));
        }

        // Internal Database Notifications
        await sendNotification(Notification, {
            userId: user._id,
            type: 'success',
            title: 'Enrollment Successful!',
            message: `You have successfully enrolled in ${course.title}. Happy Learning!`,
            link: '/candidate/courses'
        });

        if (course.instructor?._id) {
            await sendNotification(Notification, {
                userId: course.instructor._id,
                type: 'info',
                title: 'New Student!',
                message: `${user.firstName} ${user.lastName} just enrolled in ${course.title}.`,
                link: '/mentor/students'
            });
        }
    } else if (event === 'payment.failed' || status === 'failed') {
        transaction.status = 'failed';
        await transaction.save();

        enrollment.status = 'dropped';
        await enrollment.save();

        await logActivity({
            userId: enrollment.candidate,
            userRole: 'candidate',
            action: 'PAYMENT_FAILED',
            resource: 'ENROLLMENT',
            resourceId: enrollment._id,
            details: { paymentId, transactionId: transaction._id }
        }, req);
    }

    res.status(200).json({ status: 'success' });
});

export default {
    handlePaymentWebhook
};
