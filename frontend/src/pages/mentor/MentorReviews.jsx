import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Search,
    Filter,
    MessageSquare,
    TrendingUp,
    Users,
    CheckCircle,
    Calendar,
    Loader2,
    BookOpen,
    Quote
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const MentorReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [totalStats, setTotalStats] = useState({ totalReviews: 0, averageRating: '0.0', fiveStarCount: 0, monthlyReviews: 0 });
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterCourse, setFilterCourse] = useState('All');
    const [filterRating, setFilterRating] = useState('All');

    const fetchReviews = async (currentPage = 1) => {
        setLoading(true);
        try {
            const response = await api.get('/api/enrollments/mentor/reviews', {
                params: { page: currentPage, limit: 10 }
            });
            setReviews(response.data.data.reviews);
            setPagination(response.data.pagination);
            setTotalStats(response.data.data.stats);
            setPage(currentPage);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            toast.error('Failed to load course reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const uniqueCourses = ['All', ...new Set(reviews.map(r => r.course?.title).filter(Boolean))];

    const filteredReviews = reviews.filter(review => {
        const candidateName = `${review.candidate?.firstName} ${review.candidate?.lastName}`.toLowerCase();
        const courseTitle = review.course?.title.toLowerCase();
        const content = review.review?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();

        const matchesSearch = candidateName.includes(query) || courseTitle.includes(query) || content.includes(query);
        const matchesCourse = filterCourse === 'All' || review.course?.title === filterCourse;
        const matchesRating = filterRating === 'All' || review.rating === parseInt(filterRating);

        return matchesSearch && matchesCourse && matchesRating;
    });

    const stats = [
        {
            label: 'Total Reviews',
            value: totalStats.totalReviews,
            icon: MessageSquare,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            change: 'Lifetime feedback'
        },
        {
            label: 'Average Rating',
            value: totalStats.averageRating,
            icon: Star,
            colorClass: 'text-accent',
            bgClass: 'bg-accent/10',
            change: 'Course satisfaction'
        },
        {
            label: '5-Star Ratings',
            value: totalStats.fiveStarCount,
            icon: CheckCircle,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            change: 'Excellent feedback'
        },
        {
            label: 'Reviews This Month',
            value: totalStats.monthlyReviews,
            icon: Calendar,
            colorClass: 'text-secondary',
            bgClass: 'bg-secondary/10',
            change: 'Recent momentum'
        }
    ];

    return (
        <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Course Reviews</h1>
                <p className="text-base text-slate-500 font-medium">Hear what your students have to say about your curriculums</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bgClass} p-3 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} className={stat.colorClass} />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-sm font-bold">{stat.label}</h3>
                        <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest leading-none">
                            {stat.change}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by student, course, or review content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                                showFilters ? 'bg-primary/5 border-primary/20 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Filter size={18} />
                            <span>{showFilters ? 'Hide Filters' : 'Filter Feedback'}</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50/50 border-b border-slate-100 overflow-hidden"
                        >
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">By Course</label>
                                    <select 
                                        value={filterCourse}
                                        onChange={(e) => setFilterCourse(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10"
                                    >
                                        {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">By Rating</label>
                                    <select 
                                        value={filterRating}
                                        onChange={(e) => setFilterRating(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/10"
                                    >
                                        <option value="All">All Ratings</option>
                                        <option value="5">5 Stars</option>
                                        <option value="4">4 Stars</option>
                                        <option value="3">3 Stars</option>
                                        <option value="2">2 Stars</option>
                                        <option value="1">1 Star</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-slate-500 font-bold">Fetching reviews...</p>
                    </div>
                ) : filteredReviews.length > 0 ? (
                    filteredReviews.map((review, idx) => (
                        <motion.div
                            key={review._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:shadow-md transition-shadow"
                        >
                            {/* Course Badge */}
                            <div className="absolute top-0 right-0 p-6 flex flex-col items-end">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <BookOpen size={12} />
                                    {review.course?.title}
                                </div>
                            </div>

                            {/* Candidate Info */}
                            <div className="flex items-start gap-4 min-w-[200px]">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white border-4 border-white shadow-xl flex-shrink-0">
                                    {review.candidate?.avatar ? (
                                        <img src={review.candidate.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-black text-lg uppercase">
                                            {review.candidate?.firstName?.charAt(0)}
                                            {review.candidate?.lastName?.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-black text-slate-900 truncate">
                                        {review.candidate?.firstName} {review.candidate?.lastName}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 font-bold text-xs text-accent">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                className={i < review.rating ? "fill-accent text-accent" : "text-slate-200"} 
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(review.ratedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="flex-1 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 relative">
                                <Quote className="absolute top-4 right-4 text-primary/10 rotate-180" size={32} />
                                <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed relative z-10 italic">
                                    {review.review || "No written feedback provided."}
                                </p>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900">No reviews found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">
                    Showing <span className="text-secondary">{filteredReviews.length}</span> results 
                    <span className="text-slate-200 mx-3">|</span> 
                    Total <span className="text-primary">{pagination.total}</span> reviews
                </p>
                <div className="flex gap-3">
                    <button 
                        disabled={page === 1 || loading}
                        onClick={() => fetchReviews(page - 1)}
                        className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button 
                        disabled={page >= pagination.pages || loading}
                        onClick={() => fetchReviews(page + 1)}
                        className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MentorReviews;
