import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [metadata, setMetadata] = useState({ total: 0, pages: 1, page: 1 });
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
        if (!user) return;
        try {
            const response = await api.get(`/api/notifications?page=${page}&limit=${limit}`);
            setNotifications(response.data.data.notifications);
            setUnreadCount(response.data.unreadCount);
            setMetadata({
                total: response.data.total,
                pages: response.data.pages,
                page: response.data.page
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Initial fetch
        fetchNotifications();

        // Connect to socket and join the user's private room
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:8080', {
            withCredentials: true
        });

        socket.emit('join', user._id);

        // When a new notification arrives, prepend it to the list
        socket.on('notification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);                 // ← removed polling interval, socket handles it now

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await api.patch('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            metadata,
            fetchNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};