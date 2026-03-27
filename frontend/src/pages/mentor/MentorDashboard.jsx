import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Users,
    Star,
    TrendingUp,
    ChevronRight,
    MoreVertical,
    Clock,
    CheckCircle,
    User,
    RefreshCw,
    MessageSquareQuote
} from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const MentorDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/dashboard/mentor-stats');
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
            label: 'My Courses',
            value: data?.stats?.totalCourses || '0',
            icon: BookOpen,
            change: 'Lifetime',
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
            suffix: 'Total courses'
        },
        {
            label: 'Total Students',
            value: data?.stats?.totalStudents || '0',
            icon: Users,
            change: 'All time',
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            suffix: 'enrolled students'
        },
        {
            label: 'Avg. Rating',
            value: data?.stats?.averageRating || '0.0',
            icon: Star,
            change: 'Feedback',
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            suffix: '/ 5.0 rating'
        },
        {
            label: 'Active Courses',
            value: data?.stats?.activeCourses || '0',
            icon: CheckCircle,
            change: 'Live',
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50',
            suffix: 'published currently'
        },
    ];

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">Mentor Dashboard</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Welcome back! Here's an overview of your teaching activity.</p>
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
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{stat.suffix}</p>
                    </motion.div>
                ))}
            </div>

            {/* Three-column layout: My Courses + Student Reviews + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* My Courses */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={18} className="text-blue-500" />
                            My Courses
                        </h2>
                        <button 
                            onClick={() => navigate('/mentor/courses')}
                            className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                        >
                            View All
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-slate-50 rounded"></div>
                                        <div className="h-3 w-20 bg-slate-50 rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : data?.recentCourses?.length > 0 ? (
                            data.recentCourses.map((course, idx) => (
                                <div key={idx} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/courses/edit/${course._id}`)}>
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <BookOpen size={18} className="text-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{course.title}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                                <Users size={11} /> {(course.enrollmentCount || 0)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                                <Star size={11} className="text-amber-400 fill-amber-400" /> {(course.averageRating || 0).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            course.status === 'published'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                            {course.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-12 text-center text-slate-400 text-sm">
                                No courses created yet.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Latest Student Reviews */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquareQuote size={18} className="text-amber-500" />
                            Latest Reviews
                        </h2>
                        <button 
                            onClick={() => navigate('/mentor/reviews')}
                            className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                        >
                            View All
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="p-6 animate-pulse space-y-3">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-50"></div>
                                        <div className="h-4 w-24 bg-slate-50 rounded"></div>
                                    </div>
                                    <div className="h-10 w-full bg-slate-50 rounded"></div>
                                </div>
                            ))
                        ) : data?.recentReviews?.length > 0 ? (
                            data.recentReviews.map((review, idx) => (
                                <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/5 uppercase overflow-hidden">
                                                {review.candidate?.avatar ? (
                                                    <img src={review.candidate.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    review.candidate?.firstName?.charAt(0)
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{review.candidate?.firstName}</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={10} 
                                                    className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-2 line-clamp-1">
                                        Course: <span className="text-slate-600">{review.course?.title}</span>
                                    </p>
                                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed line-clamp-2 italic">
                                        "{review.review || 'No written review'}"
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <Star size={32} className="text-slate-100 mx-auto mb-3" />
                                <p className="text-slate-400 text-xs font-medium">No reviews received yet.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Clock size={18} className="text-emerald-500" />
                            System Activity
                        </h2>
                        <button 
                            onClick={() => navigate('/mentor/audit-logs')}
                            className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                        >
                            History
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="px-6 py-4 animate-pulse flex gap-3">
                                    <div className="w-9 h-9 bg-slate-50 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-40 bg-slate-50 rounded"></div>
                                        <div className="h-3 w-24 bg-slate-50 rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : data?.recentActivity?.length > 0 ? (
                            data.recentActivity.map((log, idx) => (
                                <div key={idx} className="px-6 py-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold text-[10px] uppercase border border-slate-100">
                                        {log.action.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">
                                            {log.action} {log.resource.toLowerCase()}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                        log.action === 'CREATE' ? 'bg-blue-50 text-blue-700' : 
                                        log.action === 'UPDATE' ? 'bg-amber-50 text-amber-700' :
                                        'bg-slate-50 text-slate-700'
                                    }`}>
                                        {log.action}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-12 text-center text-slate-400 text-sm">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MentorDashboard;