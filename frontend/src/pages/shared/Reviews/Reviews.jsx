import React, { useState, useEffect } from 'react';
import {
    Star,
    Trash2,
    MessageSquare,
    Search,
    Filter,
    Calendar,
    User,
    BookOpen,
    Loader2,
    RefreshCw,
    AlertCircle,
    Award,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api'
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import DeleteReviewModal from './DeleteReviewModal';

const Reviews = () => {
    const { user: currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRating, setSelectedRating] = useState('All');

    // Modal State
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchReviews = async (page = 1) => {
        setLoading(true);
        try {
            const endpoint = (currentUser.role === 'admin' || currentUser.role === 'superuser')
                ? '/api/enrollments/all-reviews'
                : '/api/enrollments/mentor/reviews';

            const response = await api.get(endpoint, {
                params: { page, limit }
            });

            setReviews(response.data.data.reviews);
            setTotalPages(response.data.pagination.pages);
            setCurrentPage(response.data.pagination.page);

            if (response.data.data.stats) {
                setStats(response.data.data.stats);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            toast.error('Failed to load platform reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const confirmDelete = async () => {
        if (!reviewToDelete) return;

        setActionLoading(true);
        try {
            await api.delete(`/api/enrollments/review/${reviewToDelete._id}`);
            toast.success('Review purged successfully');
            setIsDeleteModalOpen(false);
            setReviewToDelete(null);
            fetchReviews(currentPage);
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.message || 'Moderation action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (review) => {
        setReviewToDelete(review);
        setIsDeleteModalOpen(true);
    };

    const filteredReviews = reviews.filter(rev => {
        const matchesSearch =
            rev.candidate?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rev.candidate?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rev.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rev.review?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRating = selectedRating === 'All' || rev.rating === parseInt(selectedRating);

        return matchesSearch && matchesRating;
    });

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                ))}
            </div>
        );
    };

    if (loading && currentPage === 1) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-4 animate-pulse">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Filtering Platform Feedback...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 space-y-10 animate-in fade-in duration-700 bg-slate-50/30 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-4 font-bold">
                        <MessageSquare size={12} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Moderation Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Platform Reviews</h1>
                    <p className="text-slate-400 font-medium max-w-lg text-sm">Audit and moderate global student feedback across all specialized curriculums.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search feedback context..."
                            className="pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 w-full transition-all font-medium placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2 w-full sm:w-auto">
                        <Filter size={16} className="text-slate-400 shrink-0" />
                        <select
                            className="bg-transparent border-none py-2 rounded-2xl text-xs font-black text-slate-700 focus:ring-0 cursor-pointer w-full"
                            value={selectedRating}
                            onChange={(e) => setSelectedRating(e.target.value)}
                        >
                            <option value="All">All Ratings</option>
                            {[5, 4, 3, 2, 1].map(r => (
                                <option key={r} value={r}>{r} Stars</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => fetchReviews(currentPage)}
                        className="p-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Avg Platform Rating', value: stats.averageRating, sub: 'Global Feedback', icon: Star, color: 'amber' },
                        { label: 'Total Reviews', value: stats.totalReviews, sub: 'Platform-wide', icon: MessageSquare, color: 'indigo' },
                        { label: '5-Star Excellence', value: stats.fiveStarCount, sub: 'Top-tier Satisfaction', icon: Award, color: 'emerald' },
                        { label: 'Monthly Growth', value: stats.monthlyReviews, sub: 'Last 30 Days', icon: Calendar, color: 'primary' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                                    <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-widest">{stat.sub}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform inner-shadow font-bold`}>
                                    <stat.icon className={`text-primary`} size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table View */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference Course</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Pulse</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Feedback Archive</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReviews.map((rev, idx) => (
                                <tr key={rev._id} className="group hover:bg-slate-50/30 transition-colors">
                                    {/* Student */}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                                {rev.candidate?.avatar ? (
                                                    <img src={rev.candidate.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate tracking-tight">{rev.candidate?.firstName} {rev.candidate?.lastName}</h4>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Mail size={12} />
                                                    <p className="text-[10px] font-bold truncate tracking-wide lowercase">{rev.candidate?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Course */}
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                                {rev.course?.thumbnail ? (
                                                    <img src={rev.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen size={16} /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 max-w-[200px]">
                                                <p className="text-[11px] font-bold text-slate-800 truncate" title={rev.course?.title}>{rev.course?.title}</p>
                                                <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                                                    Inst. {rev.course?.instructor?.firstName} {rev.course?.instructor?.lastName}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Rating */}
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            {renderStars(rev.rating)}
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {rev.ratedAt ? new Date(rev.ratedAt).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Content */}
                                    <td className="px-8 py-6 max-w-sm">
                                        <p className="text-sm text-slate-500 line-clamp-2 italic font-medium">
                                            "{rev.review || 'No written feedback provided.'}"
                                        </p>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-8 py-6 text-right">
                                        {(currentUser.role === 'admin' || currentUser.role === 'superuser') && (
                                            <button
                                                onClick={() => handleDeleteClick(rev)}
                                                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                                title="Delete Review"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredReviews.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                                            <div className="p-6 bg-slate-50 rounded-full mb-6">
                                                <AlertCircle size={48} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Archive Empty</h3>
                                            <p className="text-slate-400 mt-2 text-sm font-medium">No system reviews found matching your current filter parameters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="px-8 py-8 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Page {currentPage} of {totalPages} Archive
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchReviews(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all disabled:opacity-50"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => fetchReviews(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${currentPage === i + 1
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white text-slate-400 hover:text-primary'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => fetchReviews(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-all disabled:opacity-50"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <DeleteReviewModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={confirmDelete}
                        review={reviewToDelete}
                        loading={actionLoading}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reviews;