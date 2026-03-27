import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Users,
    IndianRupee,
    CheckCircle,
    Search,
    Filter,
    Star,
    Clock,
    Shield,
    BarChart2,
    Eye,
    Plus,
    LayoutDashboard,
    Loader2,
    AlertCircle,
    ChevronRight,
    Edit3,
    MoreVertical,
    MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CreateCourseModal from '../../components/shared/CreateCourseModal';
import PriceDisplay from '../../components/ui/PriceDisplay';
import { 
    useFloating, 
    autoUpdate, 
    offset, 
    flip, 
    shift, 
    useInteractions, 
    useDismiss, 
    useRole, 
    useClick,
    FloatingPortal, 
    FloatingFocusManager 
} from '@floating-ui/react';

const CourseRowActions = ({ course, mode, currentUser }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const { x, y, strategy, refs, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'end' }),
            shift({ padding: 10 })
        ],
        whileElementsMounted: autoUpdate,
        placement: 'bottom-end'
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role
    ]);

    const canEdit = mode === 'mentor' || currentUser?.role === 'superuser' || (currentUser?.role === 'admin' && course.instructor?.role !== 'superuser');

    const handleAction = (path, restricted = false) => {
        setIsOpen(false);
        if (restricted) {
            toast.error('Restricted: Managed by Superuser');
            return;
        }
        navigate(`/${currentUser.role}${path}/${course._id}`);
    };

    return (
        <>
            <button 
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                    isOpen ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="More actions"
            >
                <MoreVertical size={18} />
            </button>

            <FloatingPortal>
                <AnimatePresence>
                    {isOpen && (
                        <FloatingFocusManager context={context} modal={false}>
                            <motion.div
                                ref={refs.setFloating}
                                style={{
                                    position: strategy,
                                    top: y ?? 0,
                                    left: x ?? 0,
                                    width: 'max-content',
                                    zIndex: 9999
                                }}
                                {...getFloatingProps()}
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="w-52 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-1.5 text-left overflow-hidden ring-4 ring-slate-900/5"
                            >
                                <button
                                    onClick={() => handleAction('/course/analytics')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200"
                                >
                                    <BarChart2 size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">View Analytics</span>
                                </button>
                                
                                <div className="h-px bg-slate-50 my-1 mx-2" />

                                <button
                                    onClick={() => handleAction('/course', !canEdit)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                        canEdit ? 'text-slate-600 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'
                                    }`}
                                >
                                    <Edit3 size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {canEdit ? 'Edit Course' : 'Restricted'}
                                    </span>
                                </button>

                                <div className="h-px bg-slate-50 my-1 mx-2" />

                                <button
                                    onClick={() => handleAction('/course/forum')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200"
                                >
                                    <MessageSquare size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Course Forum</span>
                                </button>
                            </motion.div>
                        </FloatingFocusManager>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </>
    );
};

const Courses = ({ 
    mode = 'all', // 'all' for admin/superuser, 'mentor' for mentors
    title,
    description 
}) => {
    const { user: currentUser } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterLevel, setFilterLevel] = useState('All');
    
    const navigate = useNavigate();

    const fetchCourses = async () => {
        setLoading(true);
        setError(null);
        const endpoint = mode === 'mentor' ? '/api/courses/my-courses' : '/api/courses/manage';
        try {
            const response = await api.get(endpoint);
            setCourses(response.data.data.courses);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(`Failed to load ${mode === 'mentor' ? 'your courses' : 'platform curriculum'}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [mode]);


    const filteredCourses = courses.filter(course => {
        const title = course.title.toLowerCase();
        const category = course.category || '';
        const status = course.status || '';
        const level = course.level || '';
        const instructorName = course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}`.toLowerCase() : '';
        const query = searchQuery.toLowerCase();

        const matchesSearch = title.includes(query) || category.toLowerCase().includes(query) || instructorName.includes(query);
        const matchesCategory = filterCategory === 'All' || category === filterCategory;
        const matchesStatus = filterStatus === 'All' || status === filterStatus;
        const matchesLevel = filterLevel === 'All' || level === filterLevel;

        return matchesSearch && matchesCategory && matchesStatus && matchesLevel;
    });

    const stats = mode === 'mentor' ? [
        {
            label: 'Total Courses',
            value: courses.length.toString(),
            icon: BookOpen,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
            change: 'Lifetime uploads'
        },
        {
            label: 'Active Courses',
            value: courses.filter(c => c.status === 'published').length.toString(),
            icon: CheckCircle,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            change: 'Live on platform'
        },
        {
            label: 'Total Students',
            value: courses.reduce((acc, curr) => acc + (curr.enrollmentCount || 0), 0).toLocaleString(),
            icon: Users,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50',
            change: 'Across all items'
        },
        {
            label: 'Average Rating',
            value: (courses.reduce((acc, curr) => acc + (curr.averageRating || 0), 0) / (courses.length || 1)).toFixed(1),
            icon: Star,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            change: 'Learner feedback'
        }
    ] : [
        {
            label: 'Platform Courses',
            value: courses.length.toString(),
            icon: BookOpen,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
            change: 'Global catalog'
        },
        {
            label: 'Live Content',
            value: courses.filter(c => c.status === 'published').length.toString(),
            icon: CheckCircle,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            change: 'Active & searchable'
        },
        {
            label: 'Draft Projects',
            value: courses.filter(c => c.status === 'draft').length.toString(),
            icon: Clock,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            change: 'Pending completion'
        },
        {
            label: 'Archived',
            value: courses.filter(c => c.status === 'archived').length.toString(),
            icon: Shield,
            colorClass: 'text-slate-600',
            bgClass: 'bg-slate-100',
            change: 'Soft-deleted items'
        }
    ];

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-xl m-8">
                <Shield className="mx-auto text-rose-500 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 mb-2">Access Control Error</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button 
                    onClick={fetchCourses}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all font-black uppercase tracking-widest text-[10px]"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <BarChart2 className="text-primary" size={24} />
                        {title || (mode === 'mentor' ? 'My Curriculum Portfolio' : 'Global Course Management')}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-bold">{description || (mode === 'mentor' ? 'Manage and monitor your educational modules' : 'Audit and oversee all educational content across the platform')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {mode !== 'mentor' && (
                        <button 
                            onClick={() => navigate(`/${currentUser.role}/analytics/platform`)}
                            className="flex items-center justify-center gap-2 bg-white border border-slate-100 hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200/50 hover:scale-105 active:scale-95 group"
                        >
                            <LayoutDashboard size={18} className="text-primary group-hover:rotate-12 transition-transform" />
                            <span>Platform Insights</span>
                        </button>
                    )}
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Create New Course</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 text-sans">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all relative overflow-hidden group"
                    >
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <Loader2 size={18} className="text-primary animate-spin" />
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bgClass} p-3 rounded-2xl flex items-center justify-center shadow-inner inner-shadow`}>
                                <stat.icon size={24} className={stat.colorClass} />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
                        <div className="flex items-end gap-2 mt-1">
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-2 italic">{stat.change}</p>
                    </motion.div>
                ))}
            </div>

            {/* Courses Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden text-sans">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                             <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center inner-shadow">
                                <BookOpen size={20} />
                            </div>
                            {mode === 'mentor' ? 'My Curriculum List' : 'Platform Curriculum Portfolios'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder={mode === 'mentor' ? "Search your courses..." : "Search by title, category, or instructor..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary transition-all text-sm font-bold inner-shadow"
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                    showFilters ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <Filter size={16} />
                                <span>{showFilters ? 'Hide' : 'Filters'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50/50 border-b border-slate-50"
                        >
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Domain</label>
                                    <select 
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:ring-4 focus:ring-primary/5 outline-none shadow-sm"
                                    >
                                        <option value="All">All Categories</option>
                                        <option value="Development">Development</option>
                                        <option value="Design">Design</option>
                                        <option value="Business">Business</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Data Science">Data Science</option>
                                        <option value="Personal Development">Personal Development</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
                                    <select 
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:ring-4 focus:ring-primary/5 outline-none shadow-sm"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="draft">Draft Content</option>
                                        <option value="published">Platform Live</option>
                                        <option value="archived">Archived/Hidden</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curriculum Level</label>
                                    <select 
                                        value={filterLevel}
                                        onChange={(e) => setFilterLevel(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:ring-4 focus:ring-primary/5 outline-none shadow-sm"
                                    >
                                        <option value="All">All Complexity Levels</option>
                                        <option value="Beginner">Fundamental</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced Pro</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="overflow-x-auto premium-scroll">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50 uppercase tracking-[0.15em] text-[10px] font-black text-slate-400">
                                <th className="px-8 py-5">{mode === 'mentor' ? 'Module Title' : 'Course / Instructor'}</th>
                                <th className="px-8 py-5">Participation</th>
                                <th className="px-8 py-5">Market Value</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                             {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-7"><div className="h-10 w-64 bg-slate-100 rounded-xl"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-7"><div className="h-6 w-24 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-8 py-7"></td>
                                    </tr>
                                ))
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <tr key={course._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-inner inner-shadow">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{course.title}</p>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-bold">
                                                        {mode !== 'mentor' && (
                                                            <>
                                                                <span className="text-secondary">by {course.instructor?.firstName} {course.instructor?.lastName}</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                            </>
                                                        )}
                                                        <span className="text-primary">{course.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <span className="flex items-center gap-1 text-amber-500">
                                                            <Star size={10} className="fill-amber-500" /> {course.averageRating?.toFixed(1) || '0.0'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-sm font-black text-slate-700">
                                                    <Users size={14} className="text-slate-400" />
                                                    {(course.enrollmentCount || 0).toLocaleString()}
                                                </div>
                                                <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest mt-0.5">Students</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <PriceDisplay 
                                                    price={course.price} 
                                                    originalPrice={course.originalPrice} 
                                                    size="small"
                                                />
                                                <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest mt-0.5">Revenue Unit</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                                                course.status === 'published'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : course.status === 'draft'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                    course.status === 'published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : course.status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'
                                                }`}></span>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end">
                                                <CourseRowActions course={course} mode={mode} currentUser={currentUser} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto text-slate-400">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 text-slate-200 mx-auto mb-6">
                                                <BookOpen size={40} strokeWidth={1.5} />
                                            </div>
                                            <p className="font-black text-sm uppercase tracking-widest">No matching modules discovered</p>
                                            <p className="text-xs font-bold mt-2 opacity-60">Try adjusting your filters or search parameters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Module Inventory: {filteredCourses.length} of {courses.length} educational modules
                    </p>
                    <div className="flex gap-4">
                        <button className="px-8 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed shadow-xl shadow-slate-100 active:scale-95 transition-all">
                            Prior Log
                        </button>
                        <button className="px-8 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200/20">
                            Next Record
                        </button>
                    </div>
                </div>
            </div>

            <CreateCourseModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchCourses}
            />
        </div>
    );
};

export default Courses;
