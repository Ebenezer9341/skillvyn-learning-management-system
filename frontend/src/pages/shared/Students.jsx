import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Download,
    CheckCircle,
    CheckCircle2,
    Clock,
    BookOpen,
    TrendingUp,
    MessageSquare,
    ExternalLink,
    RefreshCw,
    Loader2,
    Award,
    Github,
    XCircle,
    ReceiptText
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
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
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all duration-200"
                                >
                                    <ExternalLink size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">View Profile</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                
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
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterCourse, setFilterCourse] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDate, setFilterDate] = useState('All');

    const statsEndpoint = mode === 'mentor' ? '/api/enrollments/mentor/student-stats' : '/api/enrollments/all-student-stats';
    const studentsEndpoint = mode === 'mentor' ? '/api/enrollments/mentor/students' : '/api/enrollments/all-students';

    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const response = await api.get(statsEndpoint);
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
            colorClass: 'text-indigo-600',
            bgClass: 'bg-indigo-50',
            change: 'Lifetime enrollment'
        },
        {
            label: 'Active Learners',
            value: stats.activeStudents,
            icon: TrendingUp,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            change: 'Currently learning'
        },
        {
            label: 'Avg. Progress',
            value: `${stats.avgProgress}%`,
            icon: BookOpen,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50',
            change: 'Course completion health'
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

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{title}</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm text-sm">
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    {mode === 'mentor' && (
                        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-indigo-200 text-sm">
                            <MessageSquare size={18} />
                            <span>Bulk Message</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 text-sans">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        {statsLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <Loader2 size={18} className="text-blue-500 animate-spin" />
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bgClass} p-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner-sm inner-shadow`}>
                                <stat.icon size={24} className={stat.colorClass} />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none outline-none">{stat.label}</h3>
                        <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                        <p className="text-[10px] mt-2 font-black text-slate-400 uppercase tracking-tight leading-none italic">
                            {stat.change}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Students Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sans shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center inner-shadow">
                                <Users size={20} />
                            </div>
                            {mode === 'mentor' ? 'My Students' : 'Platform Candidates'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={mode === 'mentor' ? "Search for candidates by name..." : "Search by candidate name or email..."}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400 transition-all text-sm font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                    showFilters ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Filter size={14} />
                                <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
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
                            className="overflow-hidden bg-slate-50/50 border-b border-slate-100"
                        >
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Enrolled Course</label>
                                    <select 
                                        value={filterCourse}
                                        onChange={(e) => setFilterCourse(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100/50 outline-none active:scale-95 transition-all shadow-sm"
                                    >
                                        {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none">Learning Status</label>
                                    <select 
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100/50 outline-none active:scale-95 transition-all shadow-sm"
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
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-100/50 outline-none active:scale-95 transition-all shadow-sm"
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
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Learning Progress</th>
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
                                        <td className="px-8 py-6"><div className="h-4 w-24 bg-slate-50 rounded-full"></div></td>
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
                                                    onClick={() => navigate(`/${user.role}/user/${enrollment.candidate?._id}`)}
                                                    className="text-sm font-black text-slate-900 truncate hover:text-blue-600 transition-colors text-left cursor-pointer"
                                                >
                                                    {enrollment.candidate?.firstName} {enrollment.candidate?.lastName}
                                                </button>
                                                <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5 uppercase tracking-widest">{enrollment.candidate?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner-sm">
                                                    <BookOpen size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                                                    {enrollment.course?.title || 'Unknown Course'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 w-32">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${enrollment.progress}%` }}
                                                        transition={{ duration: 1, delay: 0.2 }}
                                                        className={`h-full rounded-full ${
                                                            enrollment.progress > 80 ? 'bg-emerald-500' :
                                                            enrollment.progress > 40 ? 'bg-blue-500' : 'bg-amber-500'
                                                        }`}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900">{enrollment.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.1em] uppercase ${
                                                enrollment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                enrollment.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-rose-50 text-rose-700 border border-rose-100'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                    enrollment.status === 'completed' ? 'bg-emerald-500' :
                                                    enrollment.status === 'active' ? 'bg-blue-500' : 'bg-rose-500'
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
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all animate-pulse"
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
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 text-slate-200">
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
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 md:p-12">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner-sm">
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
                                    <div className="bg-slate-50 p-7 rounded-[2rem] border border-slate-100 shadow-inner-sm">
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
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:ring-8 focus:ring-indigo-100/50 outline-none transition-all placeholder:text-slate-300 shadow-inner-sm"
                                        />
                                    </div>
 
                                    <div className="grid grid-cols-2 gap-5 pt-4 text-sans">
                                        <button 
                                            onClick={() => handleReviewSubmit('rejected')}
                                            disabled={isReviewSubmitting}
                                            className="py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 border border-rose-100 shadow-sm"
                                        >
                                            <XCircle size={18} /> Reject Submission
                                        </button>
                                        <button 
                                            onClick={() => handleReviewSubmit('approved')}
                                            disabled={isReviewSubmitting}
                                            className="py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
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
