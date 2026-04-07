import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    Search, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    XCircle,
    Loader2,
    CheckCheck,
    ChevronLeft, 
    ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNotification } from '../../context/NotificationContext';

const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };
    
    for (const [unit, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
};

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, metadata } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchNotifications(page, limit);
            setLoading(false);
        };
        load();
    }, [fetchNotifications, page]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= metadata.pages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={20} />;
            case 'error': return <XCircle className="text-rose-500" size={20} />;
            default: return <Info className="text-blue-500" size={20} />;
        }
    };

    const handleAction = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
    };

    const filteredNotifications = notifications.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 min-h-screen bg-slate-50 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">
                        <Bell size={14} /> Communication Hub
                    </div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight">Platform Notifications</h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium flex items-center gap-2 italic">
                        Stay updated with curriculum requests, system alerts, and platform activity
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <CheckCheck size={16} className="group-hover:scale-110 transition-transform" />
                        <span>Mark All Read</span>
                    </button>
                    <div className="bg-white border border-slate-100 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Unread</p>
                            <p className="text-xl font-black text-secondary leading-none mt-1">{unreadCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center inner-shadow">
                            <Bell size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden shadow-slate-200/50">
                {/* Toolbar */}
                <div className="p-8 border-b border-slate-50 bg-slate-50/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center inner-shadow">
                                <Clock size={20} />
                            </div>
                            Recent Activity
                        </h2>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search notifications..."
                                className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 font-bold text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <Loader2 size={40} className="text-primary animate-spin" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Synchronizing Notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-300">
                                <Bell size={64} className="opacity-20 translate-y-2" />
                                <div className="space-y-1">
                                    <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Clear Workspace</p>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">You have no active notifications at this time</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div 
                                key={notification._id}
                                className={`group p-8 transition-all hover:bg-slate-50/50 flex items-start gap-6 ${!notification.isRead ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-transparent opacity-80'}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110 ${!notification.isRead ? 'bg-white' : 'bg-slate-50'}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h3 className={`text-sm font-black truncate ${!notification.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.isRead && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {getTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!notification.isRead && (
                                        <button 
                                            onClick={() => markAsRead(notification._id)}
                                            className="px-4 h-12 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all font-black text-[9px] uppercase tracking-widest border border-transparent hover:border-emerald-100"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {metadata?.pages > 1 && (
                    <div className="p-8 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Displaying {(page - 1) * limit + 1}-{Math.min(page * limit, metadata.total)} of {metadata.total} alerts
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="w-12 h-12 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:text-primary hover:border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            
                            {[...Array(metadata.pages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`w-12 h-12 rounded-xl font-black text-xs transition-all shadow-sm ${page === i + 1 
                                        ? 'bg-secondary text-white shadow-secondary/20' 
                                        : 'bg-white border border-slate-100 text-slate-500 hover:border-primary/20 hover:text-primary'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button 
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === metadata.pages}
                                className="w-12 h-12 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:text-primary hover:border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/20">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none italic">
                        * Stay updated with platform activity and curriculum status requests through this centralized communication hub.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
