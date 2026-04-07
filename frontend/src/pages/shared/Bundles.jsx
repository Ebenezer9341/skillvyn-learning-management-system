import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers,
    Users,
    IndianRupee,
    Search,
    Filter,
    FileText,
    Plus,
    Loader2,
    Shield,
    BookOpen,
    Trash2,
    CheckCircle,
    LayoutDashboard,
    Edit,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Activity
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
import CreateBundleModal from '../../components/shared/CreateBundleModal';
import EditBundleModal from '../../components/shared/EditBundleModal';
import PriceDisplay from '../../components/ui/PriceDisplay';

const Bundles = ({ 
    mode = 'all', // 'all' for admin/superuser, 'mentor' for mentors
    title,
    description 
}) => {
    const { user: currentUser } = useAuth();
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 10
    });
    
    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    
    const navigate = useNavigate();

    // Analytics State
    const [stats, setStats] = useState({ totalBundles: 0, activeBundles: 0, draftBundles: 0, totalEnrollments: 0, growth: [], dailyGrowth: [] });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsView, setStatsView] = useState('month'); // 'month' or 'day'
    const [activeStatsFilter, setActiveStatsFilter] = useState('All'); // New state for chart only

    const fetchStats = async (status = 'All') => {
        setStatsLoading(true);
        setActiveStatsFilter(status); // Track which card is powering the graph
        try {
            const response = await api.get(`/api/bundles/stats?status=${status}`);
            setStats(response.data.data);
        } catch (err) {
            console.error('Error fetching bundle stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchBundles = async (page = 1) => {
        setLoading(true);
        setError(null);
        const endpoint = mode === 'mentor' ? '/api/bundles/my-bundles' : '/api/bundles/manage';
        try {
            const response = await api.get(`${endpoint}?page=${page}&limit=10`);
            setBundles(response.data.data.bundles || []);
            
            if (response.data.pagination) {
                setPagination(response.data.pagination);
                setCurrentPage(response.data.pagination.page);
            }
        } catch (err) {
            console.error('Error fetching bundles:', err);
            setError(`Failed to load ${mode === 'mentor' ? 'your bundles' : 'platform bundles'}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchBundles(1);
        fetchStats();
    }, [mode]);

    const handleDelete = async (bundleId) => {
        if (!window.confirm("Are you sure you want to delete this bundle? If students are enrolled, it will be archived instead.")) return;
        
        try {
            await api.delete(`/api/bundles/${bundleId}`);
            toast.success("Bundle removed successfully");
            fetchBundles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete bundle');
        }
    };

    const handleRestore = async (bundleId) => {
        if (!window.confirm("Restore this bundle as a draft? You can republish it once verified.")) return;
        
        try {
            await api.patch(`/api/bundles/${bundleId}`, { status: 'draft', isActive: true });
            toast.success("Bundle restored as draft");
            fetchBundles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to restore bundle');
        }
    };

    const filteredBundles = bundles.filter(bundle => {
        const titleMatch = bundle.title.toLowerCase().includes(searchQuery.toLowerCase());
        const statusMatch = filterStatus === 'All' || bundle.status === filterStatus;
        return titleMatch && statusMatch;
    });

    const statCards = [
        {
            label: 'Total Bundles',
            value: stats.totalBundles,
            icon: Layers,
            change: 'Global inventory'
        },
        {
            label: 'Active Packages',
            value: stats.activeBundles,
            icon: CheckCircle,
            change: 'Live for sale'
        },
        {
            label: 'Draft Projects',
            value: stats.draftBundles,
            icon: BookOpen,
            change: 'In development'
        },
        {
            label: 'Purchased',
            value: stats.totalEnrollments,
            icon: Users,
            change: 'Bundle enrollments'
        }
    ];

    const chartData = {
        labels: statsView === 'month' 
            ? (stats.growth?.map(g => g.label) || ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'])
            : (stats.dailyGrowth?.map(g => g.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        datasets: [
            {
                label: statsView === 'month' ? 'Monthly Growth' : 'Daily Growth',
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
                callbacks: { label: (context) => `${context.parsed.y} Bundles` }
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
                    onClick={fetchBundles}
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
                        <Layers className="text-primary" size={24} />
                        {title || (mode === 'mentor' ? 'My Course Bundles' : 'Platform Course Bundles')}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-bold">
                        {description || 'Pack multiple courses together to offer discounted paths'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Create New Bundle</span>
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
                                Bundle Analytics
                            </h2>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-slate-500 font-medium mt-2 text-sm max-w-xl">
                                Real-time algorithmic breakdown of bundle engagement, sales performance, and platform growth metrics.
                            </p>
                        </div>
                        {statsLoading && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border" style={{ color: '#006CFA', backgroundColor: 'rgba(0,108,250,0.05)', borderColor: 'rgba(0,108,250,0.1)' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Syncing</span>
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
                                        if (stat.label.toLowerCase().includes('active')) {
                                            newStatus = 'published';
                                        } else if (stat.label.toLowerCase().includes('draft')) {
                                            newStatus = 'draft';
                                        } else if (stat.label.toLowerCase().includes('purchased')) {
                                            newStatus = 'purchased';
                                        }
                                        fetchStats(newStatus);
                                    }}
                                    className={`relative group p-5 rounded-2xl transition-all border cursor-pointer flex-1 flex flex-col justify-center ${
                                        (stat.label.toLowerCase().includes('active') && activeStatsFilter === 'published') ||
                                        (stat.label.toLowerCase().includes('draft') && activeStatsFilter === 'draft') ||
                                        (stat.label.toLowerCase().includes('total') && activeStatsFilter === 'All') ||
                                        (stat.label.toLowerCase().includes('purchased') && activeStatsFilter === 'purchased')
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
                                    <Activity size={16} className="text-primary" /> Bundle Activity
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

            {/* Bundles Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden text-sans">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                             <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center inner-shadow">
                                <Layers size={20} />
                            </div>
                            {mode === 'mentor' ? 'My Bundle Inventory' : 'Global Bundles'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search bundles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary transition-all text-sm font-bold inner-shadow"
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
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
                                    <select 
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none shadow-sm"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="draft">Draft Content</option>
                                        <option value="published">Platform Live</option>
                                        <option value="archived">Archived/Hidden</option>
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
                                <th className="px-8 py-5">Bundle Overview</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Included Items</th>
                                <th className="px-8 py-5">Customers</th>
                                <th className="px-8 py-5">Pricing</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                             {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-7"><div className="h-10 w-64 bg-slate-100 rounded-2xl"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-16 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-7"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-7"><div className="h-6 w-24 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-8 py-7"></td>
                                    </tr>
                                ))
                            ) : filteredBundles.length > 0 ? (
                                filteredBundles.map((bundle) => (
                                    <tr key={bundle._id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner inner-shadow border border-primary/10">
                                                    <Layers size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{bundle.title}</p>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-bold">
                                                        {mode !== 'mentor' && (
                                                            <span className="text-secondary">Instructor: {bundle.instructor?.firstName} {bundle.instructor?.lastName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center w-max ${
                                                bundle.status === 'published' 
                                                    ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50' 
                                                    : bundle.status === 'archived'
                                                    ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100/50'
                                                    : 'bg-slate-100 text-slate-500 shadow-sm border border-slate-200/50'
                                            }`}>
                                                {bundle.status || 'draft'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                             <div className="flex items-center gap-2 text-sm font-black text-primary bg-primary/5 px-3 py-1.5 rounded-2xl w-max">
                                                 <BookOpen size={14} />
                                                 {bundle.courses?.length || 0} Courses
                                             </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-sm font-black text-slate-700">
                                                    <Users size={14} className="text-slate-400" />
                                                    {(bundle.enrollmentCount || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <PriceDisplay 
                                                    price={bundle.price} 
                                                    originalPrice={bundle.originalPrice} 
                                                    size="small"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {bundle.status !== 'archived' && (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingBundle(bundle);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-2 bg-slate-50 text-slate-500 hover:bg-primary hover:text-white rounded-2xl transition-all"
                                                        title="Edit Bundle"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                
                                                {bundle.status === 'archived' ? (
                                                    (currentUser?.role === 'admin' || currentUser?.role === 'superuser') && (
                                                        <button 
                                                            onClick={() => handleRestore(bundle._id)}
                                                            className="p-2 bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all"
                                                            title="Restore Bundle"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )
                                                ) : (
                                                    <button 
                                                        onClick={() => handleDelete(bundle._id)}
                                                        className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                                                        title="Archive/Delete Bundle"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto text-slate-400">
                                            <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 text-primary mx-auto mb-6">
                                                <Layers size={40} strokeWidth={1.5} />
                                            </div>
                                            <p className="font-black text-sm uppercase tracking-widest">No bundles discovered</p>
                                            <p className="text-xs font-bold mt-2 opacity-60">Try adjusting your filters or create a new bundle.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="bg-white border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-primary">{(currentPage - 1) * pagination.limit + 1}</span> to <span className="text-primary">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of <span className="text-primary">{pagination.total}</span> bundles
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchBundles(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                className="p-2.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all bg-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {[...Array(pagination.pages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => fetchBundles(i + 1)}
                                        disabled={loading}
                                        className={`w-10 h-10 rounded-2xl font-black text-xs transition-all ${
                                            currentPage === i + 1
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-primary shadow-sm border border-slate-100'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                onClick={() => fetchBundles(currentPage + 1)}
                                disabled={currentPage === pagination.pages || loading}
                                className="p-2.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/20 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all bg-white"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateBundleModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchBundles}
                mode={mode}
            />

            <EditBundleModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingBundle(null);
                }} 
                onSuccess={fetchBundles}
                initialBundle={editingBundle}
                mode={mode}
            />
        </div>
    );
};

export default Bundles;
