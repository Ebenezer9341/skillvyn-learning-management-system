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
    ChevronRight
} from 'lucide-react';
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

    const stats = [
        {
            label: 'Total Bundles',
            value: bundles.length.toString(),
            icon: Layers,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            change: 'Created'
        },
        {
            label: 'Active Packages',
            value: bundles.filter(b => b.status === 'published').length.toString(),
            icon: CheckCircle,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
            change: 'Live for sale'
        },
        {
            label: 'Total Customers',
            value: bundles.reduce((acc, curr) => acc + (curr.enrollmentCount || 0), 0).toLocaleString(),
            icon: Users,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50',
            change: 'Purchased bundles'
        },
        {
            label: 'Avg. Profit',
            value: `₹${(bundles.reduce((acc, curr) => acc + (curr.price || 0), 0) / (bundles.length || 1)).toFixed(0)}`,
            icon: IndianRupee,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            change: 'Per bundle'
        }
    ];

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-xl m-8">
                <Shield className="mx-auto text-rose-500 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 mb-2">Access Control Error</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button 
                    onClick={fetchBundles}
                    className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all font-black uppercase tracking-widest text-[10px]"
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
                        <Layers className="text-emerald-600" size={24} />
                        {title || (mode === 'mentor' ? 'My Course Bundles' : 'Platform Course Bundles')}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-bold">
                        {description || 'Pack multiple courses together to offer discounted paths'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl transition-all font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Create New Bundle</span>
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
                                <Loader2 size={18} className="text-emerald-600 animate-spin" />
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

            {/* Bundles Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden text-sans">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center inner-shadow">
                                <Layers size={20} />
                            </div>
                            {mode === 'mentor' ? 'My Bundle Inventory' : 'Global Bundles'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search bundles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 transition-all text-sm font-bold inner-shadow"
                                />
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                    showFilters ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
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
                                        className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm"
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
                                        <td className="px-8 py-7"><div className="h-10 w-64 bg-slate-100 rounded-xl"></div></td>
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
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner inner-shadow border border-emerald-100/50">
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
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center w-max ${
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
                                             <div className="flex items-center gap-2 text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl w-max">
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
                                                        className="p-2 bg-slate-50 text-slate-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                                        title="Edit Bundle"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                
                                                {bundle.status === 'archived' ? (
                                                    (currentUser?.role === 'admin' || currentUser?.role === 'superuser') && (
                                                        <button 
                                                            onClick={() => handleRestore(bundle._id)}
                                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                                            title="Restore Bundle"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )
                                                ) : (
                                                    <button 
                                                        onClick={() => handleDelete(bundle._id)}
                                                        className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
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
                                            <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center border border-emerald-100 text-emerald-300 mx-auto mb-6">
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
                            Showing <span className="text-emerald-600">{(currentPage - 1) * pagination.limit + 1}</span> to <span className="text-emerald-600">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of <span className="text-emerald-600">{pagination.total}</span> bundles
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchBundles(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all bg-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {[...Array(pagination.pages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => fetchBundles(i + 1)}
                                        disabled={loading}
                                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                                            currentPage === i + 1
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                onClick={() => fetchBundles(currentPage + 1)}
                                disabled={currentPage === pagination.pages || loading}
                                className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all bg-white"
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
