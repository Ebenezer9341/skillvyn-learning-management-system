import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BookOpen,
    TrendingUp,
    DollarSign,
    ChevronRight,
    MoreVertical,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const getRelativeTime = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
        case 'LOGIN': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'CREATE': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'UPDATE': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/dashboard/admin-stats');
            setData(response.data.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const stats = [
        { 
            label: 'Total Users', 
            value: data?.stats?.totalUsers?.toLocaleString() || '0', 
            icon: Users, 
            change: `+${data?.stats?.newUsersThisWeek || 0}`, 
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50' 
        },
        { 
            label: 'Active Courses', 
            value: data?.stats?.totalCourses || '0', 
            icon: BookOpen, 
            change: 'Live', 
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50' 
        },
        { 
            label: 'Mentors', 
            value: data?.stats?.totalMentors || '0', 
            icon: UserCheck, 
            change: 'Verified', 
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50' 
        },
        { 
            label: 'Candidates', 
            value: data?.stats?.totalCandidates || '0', 
            icon: ShieldCheck, 
            change: 'Active', 
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50' 
        },
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <button 
                    onClick={fetchDashboardData}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 group"
                    title="Refresh Stats"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-active:rotate-180 transition-transform'} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bgClass} p-3 rounded-xl flex items-center justify-center`}>
                                <stat.icon size={24} className={stat.colorClass} />
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Activity Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        Recent System Activity
                    </h2>
                    <button 
                        onClick={() => navigate('/admin/auditLog')}
                        className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                    >
                        View All <ChevronRight size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded-lg"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-slate-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : data?.recentActivity?.length > 0 ? (
                                data.recentActivity.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200">
                                                    {log.userId?.firstName?.charAt(0) || 'S'}
                                                    {log.userId?.lastName?.charAt(0) || ''}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-700">
                                                    {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-[11px] text-slate-500 font-medium">
                                                    in {log.resource}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-[11px] text-slate-400 font-medium">
                                            {getRelativeTime(log.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-400 text-sm">
                                        No recent activity recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;