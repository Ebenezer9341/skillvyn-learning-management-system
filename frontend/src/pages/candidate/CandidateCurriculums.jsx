import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    Clock, 
    CheckCircle, 
    Plus, 
    ArrowRight,
    Loader2, 
    Star, 
    Search, 
    Filter, 
    Sparkles, 
    CircleUser,
    PlayCircle,
    Eye,
    Shield,
    X,
    Lock,
    Ticket,
    ShoppingCart,
    Check
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useCart } from '../../context/CartContext';
import PriceDisplay from '../../components/ui/PriceDisplay';

const CandidateCurriculums = () => {
    const { cart, addToCart, removeFromCart, isInCart } = useCart();
    const [courses, setCourses] = useState([]);
    const [myEnrollments, setMyEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    const categories = ['All', 'Development', 'Design', 'Business', 'Marketing', 'Data Science', 'Other'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, enrollmentsRes] = await Promise.all([
                api.get('/api/courses'),
                api.get('/api/enrollments/my-enrollments')
            ]);
            
            // Only show published courses for discovery
            const publishedCourses = coursesRes.data.data.courses.filter(c => c.status === 'published');
            setCourses(publishedCourses);
            setMyEnrollments(enrollmentsRes.data.data.enrollments);
        } catch (err) {
            toast.error('Failed to load course catalog');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEnrollClick = (course) => {
        setSelectedCourse(course);
        setShowEnrollModal(true);
    };

    const confirmEnrollment = async () => {
        if (!selectedCourse) return;
        
        if (selectedCourse.price > 0) {
            setShowEnrollModal(false);
            navigate('/candidate/payment', { 
                state: { 
                    courseId: selectedCourse._id, 
                    courseTitle: selectedCourse.title,
                    price: selectedCourse.price,
                    originalPrice: selectedCourse.originalPrice
                } 
            });
            return;
        }

        setEnrollingId(selectedCourse._id);
        try {
            await api.post('/api/enrollments/enroll', { courseId: selectedCourse._id });
            toast.success('Successfully enrolled in course!');
            setShowEnrollModal(false);
            fetchData(); 
        } catch (err) {
            toast.error(err.response?.data?.message || 'Enrollment failed');
        } finally {
            setEnrollingId(null);
        }
    };

    const isEnrolled = (courseId) => {
        return myEnrollments.some(e => e.course?._id === courseId || e.course === courseId);
    };

    // Filtered courses logic
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 course.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [courses, searchQuery, activeCategory]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={20} />
                </div>
                <p className="text-slate-500 font-bold mt-6 tracking-widest uppercase text-xs">Fetching Curriculums...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Hero Section */}
            <div className="bg-white border-b border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                            <Sparkles size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Premium Learning Hub</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            Master Your Path with <span className="text-primary">Expert</span> Guidance
                        </h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10 max-w-2xl">
                            Discover curated paths led by world-class mentors. From initial steps to expert execution, we help you bridge the gap in your career journey.
                        </p>

                        {/* Search Bar */}
                        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input 
                                    type="text"
                                    placeholder="What do you want to learn today?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm group-hover:bg-white"
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                                    activeCategory === cat 
                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                        <Filter size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Showing {filteredCourses.length} Courses</span>
                    </div>
                </div>

                {/* Course Grid */}
                <AnimatePresence mode="popLayout">
                    {filteredCourses.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-2xl p-20 text-center border border-slate-100 shadow-sm flex flex-col items-center"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center mb-8">
                                <Search size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">No results found</h3>
                            <p className="text-slate-500 mt-3 max-w-sm mx-auto font-medium">
                                We couldn't find any courses matching your criteria. Try adjusting your filters or search query.
                            </p>
                            <button 
                                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                className="mt-8 text-primary font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8"
                            >
                                Reset all filters
                            </button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
                            {filteredCourses.map((course, index) => {
                                const enrolled = isEnrolled(course._id);
                                return (
                                    <motion.div
                                        layout
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        whileHover="hover"
                                        onClick={() => navigate(`/courses/view/${course._id}`)}
                                        variants={{
                                            initial: { opacity: 0, scale: 0.9 },
                                            animate: { opacity: 1, scale: 1 },
                                            exit: { opacity: 0, scale: 0.9 }
                                        }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        key={course._id}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full active:scale-[0.98] p-3 relative cursor-pointer"
                                    >
                                        <div className="flex flex-col h-full overflow-hidden rounded-2xl">
                                        {/* Image Header */}
                                        <div className="h-48 relative overflow-hidden bg-slate-100 rounded-2xl">
                                            <img 
                                                src={course.thumbnail && course.thumbnail !== 'default-course.jpg' ? course.thumbnail : 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600'} 
                                                alt={course.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-60" />
                                            
                                            {/* Top Overlay Badges */}
                                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                                                <div className="bg-white/95 backdrop-blur shadow-sm rounded-2xl px-2.5 py-1 flex items-center gap-1.5 border border-slate-100">
                                                    <BookOpen size={10} className="text-primary" />
                                                    <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider">
                                                        {course.category}
                                                    </span>
                                                </div>
                                                <div className="bg-secondary/80 backdrop-blur rounded-2xl px-2.5 py-1 flex items-center gap-1.5 border border-white/10">
                                                    <Clock size={10} className="text-primary" />
                                                    <span className="text-[9px] font-black uppercase text-white tracking-wider">
                                                        {course.duration || '0m'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Overlay Badge - DIFFICULTY LEVEL */}
                                            <div className="absolute bottom-4 left-4 pointer-events-none">
                                                <div className="bg-primary/20 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-2xl border border-white/20 uppercase tracking-[0.15em]">
                                                    {course.level}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Area */}
                                        <div className="p-5 flex-1 flex flex-col space-y-4">
                                            {/* 1. Course Title */}
                                            <h5 className="text-md font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[1.5rem]">
                                                {course.title}
                                            </h5>

                                            {/* 2. Mentor & Rating Row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold overflow-hidden border border-primary/5">
                                                        {course.instructor?.avatar ? (
                                                            <img src={course.instructor.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <CircleUser size={14} />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-700 whitespace-nowrap truncate max-w-[120px]">
                                                        {course.instructor?.firstName} {course.instructor?.lastName || 'Mentor'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 bg-slate-50/80 px-2 py-1 rounded-2xl border border-slate-100/50">
                                                    <Star size={10} fill="#fbbf24" className="text-amber-400" />
                                                    <span className="text-[10px] font-black text-slate-900 tracking-tight">{course.averageRating || '0.0'}</span>
                                                    <div className="w-[1px] h-2 bg-slate-200" />
                                                    <span className="text-[9px] font-bold text-slate-500 tracking-tight">{course.enrollmentCount || 0} reviews</span>
                                                </div>
                                            </div>

                                            {/* 3. Add to Cart & Price Row */}
                                            <div className="flex items-center justify-between py-0.5 min-h-[40px]">
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none mb-1">Investment</span>
                                                    {course.price > 0 ? (
                                                        <PriceDisplay 
                                                            price={course.price} 
                                                            originalPrice={course.originalPrice} 
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <p className="text-lg font-black tracking-tighter text-accent mt-1">
                                                            FREE
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {!enrolled && course.price > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isInCart(course._id)) {
                                                                removeFromCart(course._id);
                                                                toast.info('Removed from cart');
                                                            } else {
                                                                addToCart(course);
                                                                toast.success('Added to cart');
                                                            }
                                                        }}
                                                        className={`h-9 px-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest ${
                                                            isInCart(course._id)
                                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                            : 'bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/40'
                                                        }`}
                                                    >
                                                        {isInCart(course._id) ? <Check size={12} /> : <ShoppingCart size={12} />}
                                                        <span>{isInCart(course._id) ? 'In Cart' : 'Cart'}</span>
                                                    </button>
                                                )}
                                            </div>

                                            {/* 4. Preview and Join Path Row */}
                                            <div className={`grid ${enrolled ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5 pt-1 mt-auto`}>
                                                {!enrolled && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/courses/view/${course._id}`); }}
                                                        className="h-11 rounded-2xl border border-slate-100 bg-white text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2 group/prev"
                                                    >
                                                        <Eye size={14} className="group-hover/prev:scale-110 transition-transform" />
                                                        Preview
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        enrolled ? navigate(`/courses/view/${course._id}`) : handleEnrollClick(course);
                                                    }}
                                                    disabled={enrollingId === course._id}
                                                    className={`h-11 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${
                                                        enrolled 
                                                        ? 'bg-accent/5 text-accent border border-accent/10 hover:bg-accent/10' 
                                                        : 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90'
                                                    }`}
                                                >
                                                    {enrollingId === course._id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : enrolled ? (
                                                        <>
                                                            <PlayCircle size={14} />
                                                            <span>Resume Curriculum</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Join Path</span>
                                                            <ArrowRight size={14} />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            </div>
                                        </div>
                                        {/* Floating Intelligence Hint */}
                                        <div className="absolute left-0 right-0 top-0 z-50 pointer-events-none px-4">
                                            <motion.div 
                                                variants={{
                                                    initial: { opacity: 0, y: 15, scale: 0.9 },
                                                    hover: { opacity: 1, y: -80, scale: 1 }
                                                }}
                                                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                                                className="bg-secondary/95 backdrop-blur-xl p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex flex-col gap-4 w-full max-w-[280px] mx-auto relative group-hover:pointer-events-auto"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-0.5">
                                                        <span className="text-primary text-[8px] font-black uppercase tracking-[0.2em]">Quick Peek</span>
                                                        <h4 className="text-white font-black text-[13px] tracking-tight line-clamp-2">{course.title}</h4>
                                                    </div>
                                                    <div className="bg-white/10 text-white px-1.5 py-0.5 rounded-md text-[7px] font-bold border border-white/5 uppercase">
                                                        {course.level}
                                                    </div>
                                                </div>

                                                <p className="text-slate-300 text-[10px] leading-relaxed font-medium line-clamp-4">
                                                    {course.description}
                                                </p>

                                                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen size={10} className="text-primary" />
                                                        <span className="text-white text-[9px] font-black">{course.syllabus?.length || 0} Lessons</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CircleUser size={10} className="text-primary" />
                                                        <span className="text-white text-[9px] font-black">{course.enrollmentCount || 0} Candidates</span>
                                                    </div>
                                                </div>

                                                {/* Tooltip Triangle */}
                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-secondary/95 rotate-45 border-r border-b border-white/10" />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Footer space */}
            <div className="py-20" />

            {/* Enrollment Confirmation Modal */}
            <AnimatePresence>
                {showEnrollModal && selectedCourse && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEnrollModal(false)}
                            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-10 pb-0 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                        <Shield size={14} /> Path Enrollment
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ready to start?</h3>
                                </div>
                                <button 
                                    onClick={() => setShowEnrollModal(false)}
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-10 space-y-10">
                                {/* Course Preview Card */}
                                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex gap-6">
                                    <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center text-primary relative overflow-hidden">
                                        {selectedCourse.thumbnail ? (
                                            <img src={selectedCourse.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="bg-primary/5 w-full h-full flex items-center justify-center">
                                                <BookOpen size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-black text-slate-900 leading-tight line-clamp-2">{selectedCourse.title}</h4>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {selectedCourse.syllabus?.length || 0} Lessons</span>
                                            <span className="flex items-center gap-1.5 flex-nowrap"><Star size={12} className="text-amber-400" /> 4.9 Rating</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm font-bold text-slate-500">Access Type</span>
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Lifetime Access</span>
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between px-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Investment</span>
                                            {selectedCourse.price > 0 ? (
                                                <PriceDisplay 
                                                    price={selectedCourse.price} 
                                                    originalPrice={selectedCourse.originalPrice} 
                                                    size="large"
                                                />
                                            ) : (
                                                <p className="text-3xl font-black text-accent tracking-tight mt-2">FREE</p>
                                            )}
                                        </div>
                                        {selectedCourse.price > 0 ? (
                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100/50">
                                                <Lock size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Paid Tier</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-accent bg-accent/5 px-4 py-2 rounded-2xl border border-accent/10">
                                                <Ticket size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Free Access</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button 
                                    onClick={confirmEnrollment}
                                    disabled={enrollingId === selectedCourse._id}
                                    className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${
                                        selectedCourse.price > 0 
                                        ? 'bg-secondary text-white hover:bg-secondary/90 shadow-secondary/20' 
                                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                                    }`}
                                >
                                    {enrollingId === selectedCourse._id ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>{selectedCourse.price > 0 ? 'Proceed to Payment' : 'Confirm Enrollment'}</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                                
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                                    By joining, you agree to our terms of learning & service.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CandidateCurriculums;