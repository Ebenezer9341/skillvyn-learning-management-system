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
    Eye,
    Plus,
    Shield,
    LayoutDashboard,
    Loader2,
    AlertCircle,
    ChevronRight,
    Edit3,
    MoreVertical,
    MessageSquare,
    TrendingUp,
    Activity,
    BarChart2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Filler,
  Legend
);
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
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all duration-200"
                                >
                                    <BarChart2 size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">View Analytics</span>
                                </button>
                                
                                <div className="h-px bg-slate-50 my-1 mx-2" />

                                <button
                                    onClick={() => handleAction('/course', !canEdit)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                                        canEdit ? 'text-slate-600 hover:bg-primary/5 hover:text-primary' : 'text-slate-300 cursor-not-allowed'
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
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all duration-200"
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

    // Analytics State
    const [stats, setStats] = useState({ totalCourses: 0, activeCourses: 0, draftCourses: 0, totalEnrollments: 0, growth: [], dailyGrowth: [] });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsView, setStatsView] = useState('month'); // 'month' or 'day'
    const [activeStatsFilter, setActiveStatsFilter] = useState('All');

    const fetchStats = async (status = 'All') => {
        setStatsLoading(true);
        setActiveStatsFilter(status);
        try {
            const response = await api.get(`/api/courses/stats?status=${status}`);
            setStats(response.data.data);
        } catch (err) {
            console.error('Error fetching course stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

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
        fetchStats();
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

    const statCards = mode === 'mentor' ? [
        {
            label: 'Total Courses',
            value: stats.totalCourses,
            icon: BookOpen,
            change: 'Lifetime uploads'
        },
        {
            label: 'Active Courses',
            value: stats.activeCourses,
            icon: CheckCircle,
            change: 'Live on platform'
        },
        {
            label: 'Total Students',
            value: stats.totalEnrollments,
            icon: Users,
            change: 'Across all items'
        },
        {
            label: 'Draft Projects',
            value: stats.draftCourses,
            icon: Clock,
            change: 'In development'
        }
    ] : [
        {
            label: 'Platform Courses',
            value: stats.totalCourses,
            icon: BookOpen,
            change: 'Global catalog'
        },
        {
            label: 'Live Content',
            value: stats.activeCourses,
            icon: CheckCircle,
            change: 'Active & searchable'
        },
        {
            label: 'Draft Projects',
            value: stats.draftCourses,
            icon: Clock,
            change: 'Pending completion'
        }
    ];

    const chartData = {
        labels: statsView === 'month' 
            ? (stats.growth?.map(g => g.label) || ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'])
            : (stats.dailyGrowth?.map(g => g.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        datasets: [
            {
                label: statsView === 'month' ? 'Growth Trend' : 'Daily Activity',
                data: statsView === 'month' 
                    ? (stats.growth?.map(g => g.count) || [0, 0, 0, 0, 0, 0])
                    : (stats.dailyGrowth?.map(g => g.count) || [0, 0, 0, 0, 0, 0, 0]),
                borderColor: '#05C4FE',
                backgroundColor: 'rgba(5, 196, 254, 0.15)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#006CFA',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#001988',
                titleColor: '#fff',
                bodyColor: '#A8EBFF',
                padding: 12,
                displayColors: false,
                callbacks: { label: (context) => `${context.parsed.y} Courses` }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10, family: 'Inter, sans-serif' } }
            },
            y: {
                grid: { color: '#f1f5f9', drawBorder: false, borderDash: [5, 5] },
                ticks: { color: '#64748b', font: { size: 10, family: 'Inter, sans-serif' }, maxTicksLimit: 5 }
            }
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-xl m-8">
                <Shield className="mx-auto text-rose-500 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 mb-2">Access Control Error</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button 
                    onClick={fetchCourses}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all font-black uppercase tracking-widest text-[10px]"
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
                        <>
                            <button 
                                onClick={() => navigate(`/${currentUser.role}/courses/approvals`)}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-100 hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200/50 hover:scale-105 active:scale-95 group"
                            >
                                <Shield size={18} className="text-secondary group-hover:rotate-12 transition-transform" />
                                <span>Course Approvals</span>
                            </button>
                            <button 
                                onClick={() => navigate(`/${currentUser.role}/analytics/platform`)}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-100 hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200/50 hover:scale-105 active:scale-95 group"
                            >
                                <LayoutDashboard size={18} className="text-primary group-hover:rotate-12 transition-transform" />
                                <span>Platform Insights</span>
                            </button>
                        </>
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

            {/* Analytics Block */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontFamily: 'Graphik, sans-serif' }}
                className="bg-white rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden shadow-sm text-slate-800 border border-slate-100"
            >
                {/* Abstract gradients strictly using brand colors - subtler for light mode */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3 pointer-events-none" style={{ backgroundColor: '#05C4FE', opacity: 0.05 }} />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" style={{ backgroundColor: '#006CFA', opacity: 0.08 }} />
                
                <div className="relative z-10">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8" style={{ borderBottomColor: '#f1f5f9', borderBottomWidth: '1px' }}>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight flex items-center gap-3">
                                <TrendingUp size={28} className="text-primary" />
                                Curriculum Analytics
                            </h2>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-slate-500 font-medium mt-2 text-sm max-w-xl">
                                Strategic curriculum overview analyzing content lifecycle, student engagement, and platform development velocity.
                            </p>
                        </div>
                        {statsLoading && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border" style={{ color: '#006CFA', backgroundColor: 'rgba(0,108,250,0.05)', borderColor: 'rgba(0,108,250,0.1)' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Processing</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        {/* Stats left column */}
                        <div className="lg:col-span-1 flex flex-col justify-between gap-6 md:gap-8 min-h-[300px]">
                            {statCards.map((stat, idx) => (
                                <motion.div 
                                    key={idx} 
                                    onClick={() => {
                                        let newStatus = 'All';
                                        if (stat.label.toLowerCase().includes('active') || stat.label.toLowerCase().includes('live')) {
                                            newStatus = 'published';
                                            setFilterStatus('published');
                                            setShowFilters(true);
                                        } else if (stat.label.toLowerCase().includes('draft')) {
                                            newStatus = 'draft';
                                            setFilterStatus('draft');
                                            setShowFilters(true);
                                        } else if (stat.label.toLowerCase().includes('total') || stat.label.toLowerCase().includes('platform')) {
                                            newStatus = 'All';
                                            setFilterStatus('All');
                                        }
                                        fetchStats(newStatus);
                                    }}
                                    className={`relative group p-5 rounded-2xl transition-all border cursor-pointer flex-1 flex flex-col justify-center ${
                                        ((stat.label.toLowerCase().includes('active') || stat.label.toLowerCase().includes('live')) && activeStatsFilter === 'published') ||
                                        (stat.label.toLowerCase().includes('draft') && activeStatsFilter === 'draft') ||
                                        ((stat.label.toLowerCase().includes('total') || stat.label.toLowerCase().includes('platform')) && activeStatsFilter === 'All')
                                        ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                                        : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm bg-white border-slate-100">
                                            <stat.icon size={18} className="text-primary" />
                                        </div>
                                        <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight text-slate-400 flex-1">
                                            {stat.label}
                                        </h3>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <div className="text-4xl lg:text-5xl font-black tracking-tighter text-secondary ml-1">
                                            {statsLoading ? '-' : stat.value}
                                        </div>
                                    </div>
                                    <div className="mt-4 inline-flex items-center gap-2 ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                            {stat.change}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Chart right column */}
                        <div className="lg:col-span-2 min-h-[300px] w-full border rounded-2xl p-6 relative flex flex-col bg-slate-50/50 border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-secondary text-sm font-bold flex items-center gap-2">
                                    <Activity size={16} className="text-primary" /> Velocity Trend
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                    <button 
                                        onClick={() => setStatsView('month')}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statsView === 'month' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Month
                                    </button>
                                    <button 
                                        onClick={() => setStatsView('day')}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statsView === 'day' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Day
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-full relative min-h-[250px]">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Courses Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden text-sans">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                             <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center inner-shadow">
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
                                        <td className="px-8 py-7"><div className="h-10 w-64 bg-slate-100 rounded-2xl"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-20 bg-slate-100 rounded-2xl"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-24 bg-slate-100 rounded-2xl"></div></td>
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
                                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-200 mx-auto mb-6">
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
                            Previous Page
                        </button>
                        <button className="px-8 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200/20">
                            Next Page
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
