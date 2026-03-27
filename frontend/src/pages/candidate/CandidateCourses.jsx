import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, BookOpen, ChevronRight, Award, Loader2, Star, X, MessageSquare, Sparkles, MessageCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CandidateCourses = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingModal, setRatingModal] = useState({ show: false, course: null });
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const navigate = useNavigate();

    const fetchMyEnrollments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/enrollments/my-enrollments');
            setEnrollments(response.data.data.enrollments);
        } catch (err) {
            toast.error('Failed to load your courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyEnrollments();
    }, []);

    const handleRatingSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a star rating');
            return;
        }

        setSubmittingRating(true);
        try {
            await api.post('/api/enrollments/rate', {
                courseId: ratingModal.course?._id,
                rating,
                review
            });
            toast.success('Thank you for rating this course!');
            setRatingModal({ show: false, course: null });
            setRating(0);
            setReview('');
            fetchMyEnrollments(); // Refresh to show the rating
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit rating');
        } finally {
            setSubmittingRating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={40} className="text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Preparing your learning path...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-secondary tracking-tight">My courses</h1>
                <p className="text-slate-500 mt-2 font-medium">Continue learning and track your course completion progress.</p>
            </header>

            {enrollments.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <BookOpen size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary">No Courses Enrolled Yet</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Explore our curriculum catalog and start your learning journey today!
                    </p>
                    <button 
                        onClick={() => navigate('/candidate')}
                        className="mt-8 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                    >
                        Browse Curriculums
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment, index) => {
                        const course = enrollment.course;
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                key={enrollment._id}
                                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative"
                            >
                                {/* Status Badge */}
                                {enrollment?.certificationTracking?.isCertified && (
                                    <div className="absolute top-4 right-4 z-10 bg-emerald-500 text-white p-2 rounded-full shadow-lg" title="Officially Certified">
                                        <Award size={20} />
                                    </div>
                                )}

                                {/* Image Header */}
                                <div className="h-44 relative overflow-hidden bg-slate-100">
                                    <img 
                                        src={course.thumbnail && course.thumbnail !== 'default-course.jpg' ? course.thumbnail : 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600'} 
                                        alt={course.title} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                                    
                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button 
                                            onClick={() => navigate(`/courses/view/${course._id}`)}
                                            className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50 hover:bg-primary hover:border-primary transition-colors cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.2)]"
                                        >
                                            <PlayCircle size={32} className="ml-1" />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 focus:outline-none">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                                            {course.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-secondary mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                        {course.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden">
                                            {course.instructor?.avatar ? (
                                                <img src={course.instructor.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                    {course.instructor?.firstName?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">
                                            {course.instructor?.firstName} {course.instructor?.lastName}
                                        </span>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="mt-auto mb-6">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Clock size={14} />
                                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                                    {course.duration}
                                                </span>
                                            </div>
                                            <span className={`text-sm font-black ${enrollment.progress === 100 ? 'text-emerald-500' : 'text-primary'}`}>
                                                {enrollment.progress}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${enrollment.progress}%` }}
                                                transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                                                className={`h-full rounded-full relative ${enrollment.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                                            >
                                                {enrollment.progress < 100 && (
                                                    <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Footer Action */}
                                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        {enrollment?.certificationTracking?.isCertified && (
                                            <button 
                                                onClick={() => navigate(`/courses/certificate/${course._id}`)}
                                                className="w-full py-3 px-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                                            >
                                                <Award size={18} />
                                                <span>View Certificate</span>
                                            </button>
                                        )}
                                        {enrollment.progress < 100 ? (
                                            <button 
                                                onClick={() => navigate(`/courses/view/${course._id}`)}
                                                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                                            >
                                                <span>Continue Course</span>
                                                <ChevronRight size={18} />
                                            </button>
                                        ) : (
                                            !enrollment?.certificationTracking?.isCertified && (
                                                <button 
                                                    onClick={() => navigate(`/courses/view/${course._id}`)}
                                                    className="w-full py-3 px-4 border-2 border-primary/20 text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
                                                >
                                                    <span>Review Course</span>
                                                </button>
                                            )
                                        )}
                                        
                                        {/* Rating & Forum Button Row */}
                                        <div className="flex gap-2">
                                            {enrollment.progress > 0 && (
                                                enrollment.rating ? (
                                                    <button 
                                                        onClick={() => {
                                                            setRatingModal({ show: true, course: course });
                                                            setRating(enrollment.rating);
                                                            setReview(enrollment.review || '');
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-50 rounded-xl hover:bg-amber-50 group/rate transition-colors border border-transparent hover:border-amber-100"
                                                    >
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    size={10} 
                                                                    fill={i < enrollment.rating ? "#fbbf24" : "transparent"} 
                                                                    className={i < enrollment.rating ? "text-amber-400" : "text-slate-200"} 
                                                                />
                                                            ))}
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            setRatingModal({ show: true, course: course });
                                                            setRating(0);
                                                            setReview('');
                                                        }}
                                                        className="flex-1 py-2.5 px-4 border border-amber-100 text-amber-600 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-50 transition-all active:scale-[0.98]"
                                                    >
                                                        <Star size={14} />
                                                        <span>Rate</span>
                                                    </button>
                                                )
                                            )}
                                            
                                            <button 
                                                onClick={() => navigate(`/candidate/course/forum/${course._id}`)}
                                                className="flex-1 py-2.5 px-4 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all shadow-sm active:scale-95"
                                            >
                                                <MessageCircle size={14} />
                                                <span>Forum</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Rating Modal */}
            <AnimatePresence>
                {ratingModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !submittingRating && setRatingModal({ show: false, course: null })}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                            <Sparkles size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Rate Course</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ratingModal.course?.title}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setRatingModal({ show: false, course: null })}
                                        disabled={submittingRating}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Star Rating */}
                                    <div className="flex flex-col items-center gap-4 py-4 bg-slate-50/50 rounded-3xl border border-slate-100">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">How was your experience?</p>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                    className="transition-transform active:scale-90 hover:scale-110"
                                                >
                                                    <Star 
                                                        size={40} 
                                                        fill={(hoverRating || rating) >= star ? "#fbbf24" : "transparent"} 
                                                        className={(hoverRating || rating) >= star ? "text-amber-400" : "text-slate-200"} 
                                                        strokeWidth={2}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-sm font-black text-amber-600 h-5">
                                            {rating === 1 && "Could be better"}
                                            {rating === 2 && "It's okay"}
                                            {rating === 3 && "Good course"}
                                            {rating === 4 && "Great learning!"}
                                            {rating === 5 && "Absolutely Amazing!"}
                                        </span>
                                    </div>

                                    {/* Review Text */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <MessageSquare size={14} className="text-slate-400" />
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add a review (Optional)</label>
                                        </div>
                                        <textarea 
                                            value={review}
                                            onChange={(e) => setReview(e.target.value)}
                                            placeholder="Tell others what you think about this course..."
                                            className="w-full h-32 p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
                                            maxLength={500}
                                        />
                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-bold text-slate-300">{review.length}/500</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleRatingSubmit}
                                        disabled={submittingRating || rating === 0}
                                        className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black shadow-xl shadow-primary/20 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                                    >
                                        {submittingRating ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Submit Feedback</span>
                                                <ChevronRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CandidateCourses;