import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, BookOpen, Star, Clock, ChevronRight, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import logo from '../assets/images/Skillvyn logo/PNG/horizontal.png';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Development', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Development', 'Other'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function CourseCatalog() {
    const { user } = useAuth();
    const { addToCart, isInCart } = useCart();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [level, setLevel] = useState('All');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('-createdAt');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 12, sort });
            if (search) params.append('search', search);
            if (category !== 'All') params.append('category', category);
            if (level !== 'All') params.append('level', level);
            if (maxPrice) params.append('maxPrice', maxPrice);

            const response = await api.get(`/api/courses?${params}`);
            setCourses(response.data.data.courses);
            setPagination(response.data.pagination);
        } catch (err) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    }, [search, category, level, maxPrice, sort, page]);

    useEffect(() => {
        setPage(1);
    }, [search, category, level, maxPrice, sort]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary selection:text-white pb-20">
            {/* Public Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center group cursor-pointer h-10">
                        <img src={logo} alt="Skillvyn Logo" className="h-full w-auto object-contain group-hover:scale-[1.02] transition-transform duration-300" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Home</Link>
                        <Link to="/course-catalog" className="text-sm font-bold text-primary transition-colors">Courses</Link>
                        <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Sign In</Link>
                        <Link to="/register" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-sm font-semibold text-white rounded-full shadow-lg shadow-primary/25 transition-all active:scale-95">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Header Hero */}
            <header className="pt-32 pb-14 px-6 relative overflow-hidden bg-white border-b border-slate-100">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black text-secondary tracking-tight mb-4"
                    >
                        Explore the <span className="text-primary italic">Catalog</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
                    >
                        Unlock your potential with expert-led courses across programming, design, and business. Start your journey today.
                    </motion.p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-10">
                {/* Search & Filters Toolbar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="What do you want to learn?"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-medium transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto">
                        <select value={category} onChange={e => setCategory(e.target.value)}
                            className="flex-1 md:w-40 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>

                        <select value={level} onChange={e => setLevel(e.target.value)}
                            className="flex-1 md:w-36 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                            {LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>

                        <div className="relative flex-1 md:w-36">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
                            <input
                                type="number"
                                placeholder="Max Price"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-slate-100 transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-2 border-l border-slate-100 flex-1 md:w-auto">
                            <SlidersHorizontal size={18} className="text-slate-400" />
                            <select value={sort} onChange={e => setSort(e.target.value)}
                                className="bg-transparent border-none text-sm font-semibold text-slate-600 focus:outline-none cursor-pointer">
                                <option value="-createdAt">Newest</option>
                                <option value="-enrollmentCount">Most Popular</option>
                                <option value="-averageRating">Top Rated</option>
                                <option value="price">Price: Low to High</option>
                                <option value="-price">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-secondary">All Courses</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-slate-200/50 px-3 py-1 rounded-full">
                        {pagination.total} result{pagination.total !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Course Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-2xl h-[380px] border border-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center mt-8">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <BookOpen size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-secondary">No perfect match discovered.</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            Try adjusting your filters, trying broader search terms, or checking back later for new content.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setCategory('All'); setLevel('All'); setMaxPrice(''); }}
                            className="mt-8 px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map((course, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={course._id}
                                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                                onClick={() => navigate(`/courses/view/${course._id}`)}
                            >
                                {/* Thumbnail */}
                                <div className="h-44 relative overflow-hidden bg-slate-100">
                                    <img
                                        src={course.thumbnail && course.thumbnail !== 'default-course.jpg' ? course.thumbnail : 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80'}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60" />

                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                        <span className="text-[10px] font-black text-primary bg-white px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                                            {course.category}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-600 bg-white/90 backdrop-blur px-2 py-1 rounded-md uppercase tracking-widest">
                                            {course.level}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-secondary text-lg leading-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-4">
                                        {course.instructor?.avatar ? (
                                            <img src={course.instructor.avatar} alt="Instructor" className="w-6 h-6 rounded-full object-cover bg-slate-100" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User size={12} className="text-primary" />
                                            </div>
                                        )}
                                        <span className="text-xs font-semibold text-slate-500 truncate">
                                            {course.instructor?.firstName} {course.instructor?.lastName}
                                        </span>
                                    </div>

                                    <div className="mt-auto">
                                        {/* Stats Row */}
                                        <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                <span className="text-slate-700">{course.averageRating?.toFixed(1) || 'NEW'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{course.duration || '0m'}</span>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-xl font-black text-secondary">
                                                    {course.price === 0 ? 'Free' : `₹${course.price}`}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!user) {
                                                        toast.info('Please log in to add courses to your cart');
                                                        navigate('/login');
                                                        return;
                                                    }
                                                    addToCart(course);
                                                    toast.success('Added to cart!');
                                                }}
                                                disabled={isInCart(course._id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${isInCart(course._id)
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-95'
                                                    }`}
                                            >
                                                {isInCart(course._id) ? 'In Cart' : 'Enlist'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-12 pb-10">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${page === p
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}