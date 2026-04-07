import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Download,
    CheckCircle,
    BookOpen,
    TrendingUp,
    MessageSquare,
    ExternalLink,
    RefreshCw,
    Loader2,
    Award,
    Github,
    XCircle,
    Activity,
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
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

const StudentRowActions = ({ enrollment, mode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
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

    const handleAction = (path) => {
        setIsOpen(false);
        const prefix = location.pathname.split('/')[1];
        navigate(`/${prefix}${path}/${enrollment.candidate?._id}`);
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
                                className="w-44 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-1.5 text-left overflow-hidden ring-4 ring-slate-900/5"
                            >
                                <button
                                    onClick={() => handleAction('/user')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-all duration-200"
                                >
                                    <ExternalLink size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">View Profile</span>
                                </button>
                                
                            </motion.div>
                        </FloatingFocusManager>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </>
    );
};

const Students = ({ 
    mode = 'all', // 'all' for admin/superuser, 'mentor' for mentors
    title = 'Global Student Directory',
    description = 'Platform-wide overview of candidate progress and engagement'
}) => {
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        completedStudents: 0,
        avgProgress: 0
    });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [reviewingEnrollment, setReviewingEnrollment] = useState(null);
    const [statsView, setStatsView] = useState('month'); // 'month' or 'day'
    const [activeStatsFilter, setActiveStatsFilter] = useState('All');
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const { user: currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterCourse, setFilterCourse] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDate, setFilterDate] = useState('All');

    const statsEndpoint = mode === 'mentor' ? '/api/enrollments/mentor/student-stats' : '/api/enrollments/all-student-stats';
    const studentsEndpoint = mode === 'mentor' ? '/api/enrollments/mentor/students' : '/api/enrollments/all-students';

    const fetchStats = async (status = 'All') => {
        setStatsLoading(true);
        setActiveStatsFilter(status);
        try {
            const response = await api.get(`${statsEndpoint}?status=${status}`);
            setStats(response.data.data);
        } catch (err) {
            console.error('Stats fetch error:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchStudents = async (currentPage = 1) => {
        setLoading(true);
        try {
            const response = await api.get(studentsEndpoint, {
                params: { page: currentPage, limit: 10 }
            });
            setStudents(response.data.data.enrollments);
            setPagination(response.data.pagination);
            setPage(currentPage);
        } catch (err) {
            toast.error(`Failed to load ${mode === 'mentor' ? 'your students' : 'student directory'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewSubmit = async (status) => {
        if (!reviewingEnrollment) return;
        
        setIsReviewSubmitting(true);
        try {
            await api.patch('/api/enrollments/review-project', {
                enrollmentId: reviewingEnrollment._id,
                status,
                feedback: reviewFeedback
            });
            toast.success(`Project ${status === 'approved' ? 'Approved' : 'Rejected'}`);
            setReviewingEnrollment(null);
            setReviewFeedback('');
            fetchStudents(page);
        } catch (err) {
            toast.error('Failed to submit review');
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchStudents();
    }, [mode]);

    const uniqueCourses = ['All', ...new Set(students.map(s => s.course?.title).filter(Boolean))];

    const filteredStudents = students.filter(enrollment => {
        const name = `${enrollment.candidate?.firstName} ${enrollment.candidate?.lastName}`.toLowerCase();
        const course = enrollment.course?.title || '';
        const status = enrollment.status || '';
        const enrolledDate = new Date(enrollment.enrolledAt);
        const query = searchQuery.toLowerCase();

        const matchesSearch = name.includes(query) || course.toLowerCase().includes(query) || enrollment.candidate?.email?.toLowerCase().includes(query);
        const matchesCourse = filterCourse === 'All' || course === filterCourse;
        const matchesStatus = filterStatus === 'All' || status === filterStatus;
        
        let matchesDate = true;
        if (filterDate !== 'All') {
            const today = new Date();
            const diffTime = Math.abs(today - enrolledDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (filterDate === 'today') matchesDate = diffDays <= 1;
            else if (filterDate === 'week') matchesDate = diffDays <= 7;
            else if (filterDate === 'month') matchesDate = diffDays <= 30;
        }

        return matchesSearch && matchesCourse && matchesStatus && matchesDate;
    });

    const statCards = [
        {
            label: mode === 'mentor' ? 'Your Students' : 'Platform Students',
            value: stats.totalStudents,
            icon: Users,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/10',
            change: 'Lifetime enrollment'
        },
        {
            label: 'Active Learners',
            value: stats.activeStudents,
            icon: TrendingUp,
            colorClass: 'text-accent',
            bgClass: 'bg-accent/10',
            change: 'Currently learning'
        },
        {
            label: 'Total Completed',
            value: stats.completedStudents,
            icon: CheckCircle,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            change: 'Alumni count'
        }
    ];

    const chartData = {
        labels: statsView === 'month' 
            ? (stats.growth?.map(g => g.label) || ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'])
            : (stats.dailyGrowth?.map(g => g.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        datasets: [
            {
                label: statsView === 'month' ? 'Monthly Enrollments' : 'Daily Enrollments',
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
                callbacks: { label: (context) => `${context.parsed.y} Candidates` }
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

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{title}</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">{description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={mode === 'mentor' ? "Search for candidates..." : "Search candidates..."}
                            className="block w-full md:w-80 pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-medium shadow-sm placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {/* Implement CSV download logic */}}
                            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-50 transition-all font-semibold shadow-sm text-sm active:scale-95 whitespace-nowrap"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Export Data</span>
                        </button>
                        
                        {mode === 'mentor' && (
                            <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-2xl transition-all font-semibold shadow-lg shadow-primary/20 text-sm active:scale-95 whitespace-nowrap">
                                <MessageSquare size={18} />
                                <span className="hidden sm:inline">Bulk Message</span>
                            </button>
                        )}
                    </div>
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
                                Candidates Analytics
                            </h2>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-slate-500 font-medium mt-2 text-sm max-w-xl">
                                Real-time algorithmic breakdown of candidate engagement, learning progress, and platform progression statistics.
                            </p>
                        </div>
                        {statsLoading && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border" style={{ color: '#05C4FE', backgroundColor: 'rgba(5,196,254,0.1)', borderColor: 'rgba(5,196,254,0.2)' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Syncing</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        {/* Stats left column */}
                        <div className="lg:col-span-1 flex flex-col justify-between gap-6 md:gap-8 min-h-[300px]">
                            {statCards.map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => {
                                        let newStatus = 'All';
                                        if (stat.label.toLowerCase().includes('active')) {
                                            newStatus = 'active';
                                        } else if (stat.label.toLowerCase().includes('completed')) {
                                            newStatus = 'completed';
                                        }
                                        fetchStats(newStatus);
                                    }}
                                    className={`relative group p-5 rounded-2xl transition-all border cursor-pointer flex-1 flex flex-col justify-center ${
                                        (stat.label.toLowerCase().includes('active') && activeStatsFilter === 'active') ||
                                        (stat.label.toLowerCase().includes('completed') && activeStatsFilter === 'completed') ||
                                        ((stat.label.toLowerCase().includes('your') || stat.label.toLowerCase().includes('platform')) && activeStatsFilter === 'All')
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
                                </div>
                            ))}
                        </div>

                        {/* Chart right column */}
                        <div className="lg:col-span-2 min-h-[300px] w-full border rounded-2xl p-6 relative flex flex-col bg-slate-50/50 border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-secondary text-sm font-bold flex items-center gap-2">
                                    <Activity size={16} className="text-primary" /> Enrollment Trends
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

            {/* Students Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sans shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center inner-shadow">
                                <Users size={20} />
                            </div>
                            {mode === 'mentor' ? 'My Students' : 'Platform Candidates'}
                        </h2>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                showFilters ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Filter size={14} />
                            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50/50 border-b border-slate-100"
                        >
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Enrolled Course</label>
                                    <select 
                                        value={filterCourse}
                                        onChange={(e) => setFilterCourse(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 outline-none active:scale-95 transition-all shadow-sm"
                                    >
                                        {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Learning Status</label>
                                    <select 
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 outline-none active:scale-95 transition-all shadow-sm"
                                    >
                                        <option value="All">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Date Joined</label>
                                    <select 
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 outline-none active:scale-95 transition-all shadow-sm"
                                    >
                                        <option value="All">All time</option>
                                        <option value="today">Joined Today</option>
                                        <option value="week">Past 7 Days</option>
                                        <option value="month">Past 30 Days</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="overflow-x-auto premium-scroll">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrolled Course</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Certification</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Joined</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-6"><div className="h-10 w-40 bg-slate-50 rounded-xl"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 w-32 bg-slate-50 rounded-lg"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 w-16 bg-slate-50 rounded-full"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 w-16 bg-slate-50 rounded-full"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 w-20 bg-slate-50 rounded"></div></td>
                                        <td className="px-8 py-6"><div className="h-8 w-8 bg-slate-50 rounded bg-slate-50 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((enrollment) => (
                                    <tr key={enrollment._id} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="min-w-0">
                                                <button 
                                                    onClick={() => navigate(`/${currentUser?.role || location.pathname.split('/')[1]}/user/${enrollment.candidate?._id}`)}
                                                    className="text-sm font-black text-slate-900 truncate hover:text-primary transition-colors text-left cursor-pointer"
                                                >
                                                    {enrollment.candidate?.firstName} {enrollment.candidate?.lastName}
                                                </button>
                                                <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5 uppercase tracking-widest">{enrollment.candidate?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-inner-sm">
                                                    <BookOpen size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                                                    {enrollment.course?.title || 'Unknown Course'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${enrollment.status === 'completed' ? 'bg-accent' : 'bg-primary animate-pulse'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${enrollment.status === 'completed' ? 'text-accent' : 'text-primary'}`}>
                                                    {enrollment.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase ${
                                                enrollment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                enrollment.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-rose-50 text-rose-700 border border-rose-100'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                    enrollment.status === 'completed' ? 'bg-accent' :
                                                    enrollment.status === 'active' ? 'bg-primary' : 'bg-rose-500'
                                                }`}></span>
                                                {enrollment.status}
                                            </span>
                                        </td>
                                         <td className="px-8 py-6">
                                            {enrollment.certificationTracking?.isCertified ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                                    <Award size={14} /> Certified
                                                </span>
                                            ) : enrollment.certificationTracking?.projectStatus === 'submitted' ? (
                                                <button 
                                                    onClick={() => setReviewingEnrollment(enrollment)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/5 text-secondary rounded-2xl text-[9px] font-black uppercase tracking-widest border border-secondary/10 hover:bg-secondary/10 transition-all animate-pulse"
                                                >
                                                    <Award size={14} /> Review Project
                                                </button>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] italic leading-tight">In Progress</span>
                                                    {enrollment.certificationTracking?.mcqStatus === 'passed' && (
                                                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">MCQ Cleared</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                                            {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end">
                                                <StudentRowActions enrollment={enrollment} mode={mode} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-200">
                                                <Users size={40} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No Results Found</p>
                                                <p className="text-xs text-slate-300 font-medium mt-1">Try adjusting your search criteria or the filters.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                        Showing {filteredStudents.length} of {pagination.total} candidates
                    </p>
                    <div className="flex gap-3">
                        <button 
                            disabled={page === 1 || loading}
                            onClick={() => fetchStudents(page - 1)}
                            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            Back
                        </button>
                        <button 
                            disabled={page >= pagination.pages || loading}
                            onClick={() => fetchStudents(page + 1)}
                            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            Forward
                        </button>
                    </div>
                </div>
            </div>

            {/* Project Review Modal */}
            <AnimatePresence>
                {reviewingEnrollment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 md:p-12">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-secondary/5 text-secondary flex items-center justify-center shadow-inner-sm">
                                            <Award size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">Project Verification</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reviewing: {reviewingEnrollment.candidate?.firstName} {reviewingEnrollment.candidate?.lastName}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setReviewingEnrollment(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                                        <RefreshCw size={20} className="rotate-45" />
                                    </button>
                                </div>
 
                                <div className="space-y-8">
                                    <div className="bg-slate-50 p-7 rounded-2xl border border-slate-100 shadow-inner-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Submitted Repository URL</p>
                                        <a 
                                            href={reviewingEnrollment.certificationTracking?.projectUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-blue-600 font-black hover:underline break-all bg-white p-4 rounded-xl border border-slate-200 shadow-sm group"
                                        >
                                            <Github size={20} className="text-slate-900" />
                                            <span className="flex-1 text-sm">{reviewingEnrollment.certificationTracking?.projectUrl}</span>
                                            <ExternalLink size={16} className="text-slate-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </a>
                                    </div>
 
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none italic">Review Notes / Feedback</label>
                                        <textarea 
                                            rows="4"
                                            value={reviewFeedback}
                                            onChange={(e) => setReviewFeedback(e.target.value)}
                                            placeholder="Provide technical feedback for the candidate. If rejected, they will need to address these points before resubmitting."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium focus:ring-8 focus:ring-accent/10 outline-none transition-all placeholder:text-slate-300 shadow-inner-sm"
                                        />
                                    </div>
 
                                    <div className="grid grid-cols-2 gap-5 pt-4 text-sans">
                                        <button 
                                            onClick={() => handleReviewSubmit('rejected')}
                                            disabled={isReviewSubmitting}
                                            className="py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 border border-rose-100 shadow-sm"
                                        >
                                            <XCircle size={18} /> Reject Submission
                                        </button>
                                        <button 
                                            onClick={() => handleReviewSubmit('approved')}
                                            disabled={isReviewSubmitting}
                                            className="py-5 bg-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            {isReviewSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                            Approve & Certify
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Students;
