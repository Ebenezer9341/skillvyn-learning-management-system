import Notification from "../models/Notification.model.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import httpStatus from "../utils/httpStatus.js";

/**
 * @desc Get all notifications for current user with pagination
 */
export const getMyNotifications = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Notification.countDocuments({ user: req.user._id }),
        Notification.countDocuments({ user: req.user._id, isRead: false })
    ]);

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        results: notifications.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        unreadCount,
        data: {
            notifications
        }
    });
});

/**
 * @desc Mark a notification as read
 */
export const markAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { isRead: true },
        { new: true, runValidators: true }
    );

    if (!notification) {
        return next(new AppError('Notification not found or unauthorized', httpStatus.NOT_FOUND));
    }

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        data: {
            notification
        }
    });
});

/**
 * @desc Mark all notifications as read
 */
export const markAllAsRead = catchAsync(async (req, res, next) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(httpStatus.SUCCESS).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
