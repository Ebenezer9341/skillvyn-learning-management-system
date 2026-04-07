import { io } from '../index.js';

/**
 * Creates a DB notification AND pushes it instantly via Socket.io
 * to the target user's private room.
 */
export const sendNotification = async (Notification, { userId, type, title, message, link }) => {
    const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        link
    });

    // Push to the user's socket room in real time
    io.to(userId.toString()).emit('notification', notification);

    return notification;
};