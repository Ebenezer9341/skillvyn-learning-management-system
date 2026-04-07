import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Search, 
    Filter, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    Pause, 
    Play, 
    Percent, 
    CheckCircle2, 
    Clock, 
    Users, 
    AlertCircle,
    Loader2,
    Calendar,
    IndianRupee,
    Tag,
    X,
    AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import CreateCouponModal from '../../../components/shared/Coupons/CreateCouponModal';
import EditCouponModal from '../../../components/shared/Coupons/EditCouponModal';
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

const CouponRowActions = ({ coupon, onEdit, onDelete, onToggleStatus }) => {
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <>
            <button 
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`w-12 h-12 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                    isOpen ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`} 
                title="More actions"
            >
                <MoreVertical size={20} />
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
                                className="w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 text-left overflow-hidden ring-4 ring-slate-900/5"
                            >
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onEdit(coupon);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-all duration-200 group"
                                >
                                    <Edit2 size={16} className="opacity-70 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Edit Details</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onToggleStatus(coupon);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                        coupon.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-accent hover:bg-accent/5'
                                    }`}
                                >
                                    {coupon.status === 'active' ? (
                                        <>
                                            <Pause size={16} className="opacity-70 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Pause Promotion</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={16} className="opacity-70 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Start Promotion</span>
                                        </>
                                    )}
                                </button>

                                <div className="h-px bg-slate-50 my-1 mx-2" />

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onDelete(coupon._id);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200 group"
                                >
                                    <Trash2 size={16} className="opacity-70 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Delete Coupon</span>
                                </button>
                            </motion.div>
                        </FloatingFocusManager>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </>
    );
};

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeCardFilter, setActiveCardFilter] = useState('all');

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/coupons');
            setCoupons(res.data.data.coupons);
        } catch (err) {
            toast.error('Failed to fetch coupons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = (id) => {
        setCouponToDelete(id);
    };

    const confirmDelete = async () => {
        if (!couponToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/coupons/${couponToDelete}`);
            toast.success('Coupon deleted successfully');
            setCouponToDelete(null);
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete coupon');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async (coupon) => {
        const newStatus = coupon.status === 'active' ? 'paused' : 'active';
        try {
            await api.patch(`/api/coupons/${coupon._id}`, { status: newStatus });
            toast.success(`Coupon ${newStatus === 'active' ? 'activated' : 'paused'}`);
            fetchCoupons();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const filteredCoupons = coupons.filter(c => {
        const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCard = activeCardFilter === 'all' || 
                           (activeCardFilter === 'active' && c.status === 'active' && (!c.expiryDate || new Date(c.expiryDate) >= new Date())) ||
                           (activeCardFilter === 'paused' && c.status === 'paused' && (!c.expiryDate || new Date(c.expiryDate) >= new Date())) ||
                           (activeCardFilter === 'expired' && c.expiryDate && new Date(c.expiryDate) < new Date()) ||
                           (activeCardFilter === 'used' && c.usageCount > 0);

        return matchesSearch && matchesCard;
    });

    const stats = {
        total: coupons.length,
        active: coupons.filter(c => c.status === 'active' && (!c.expiryDate || new Date(c.expiryDate) >= new Date())).length,
        paused: coupons.filter(c => c.status === 'paused' && (!c.expiryDate || new Date(c.expiryDate) >= new Date())).length,
        expired: coupons.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length,
        used: coupons.reduce((sum, c) => sum + c.usageCount, 0)
    };

    const statCards = [
        { id: 'all', label: 'Total Coupons', value: stats.total, icon: Tag, color: 'text-primary', bg: 'bg-primary/10', sub: 'Global count' },
        { id: 'active', label: 'Live Deals', value: stats.active, icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', sub: 'Ready for use' },
        { id: 'paused', label: 'Paused', value: stats.paused, icon: Pause, color: 'text-amber-500', bg: 'bg-amber-50', sub: 'Inactive now' },
        { id: 'expired', label: 'Expired', value: stats.expired, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50', sub: 'Promotion ended' },
        { id: 'used', label: 'Total Usage', value: stats.used, icon: Users, color: 'text-secondary', bg: 'bg-secondary/10', sub: 'Platform usage' }
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 min-h-screen bg-slate-50 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight">Coupon Management</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base font-medium flex items-center gap-2">
                        Configure promotion strategies and track redemption health
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="h-14 px-8 bg-primary text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/20"
                >
                    <Plus size={20} />
                    Create New Coupon
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {statCards.map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label} 
                        onClick={() => setActiveCardFilter(activeCardFilter === stat.id ? 'all' : stat.id)}
                        className={`p-8 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md ${
                            activeCardFilter === stat.id 
                            ? 'bg-white border-primary/20 ring-4 ring-primary/5' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                    >
                        {activeCardFilter === stat.id && (
                            <motion.div 
                                layoutId="active-card-indicator"
                                className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full flex items-center justify-center pl-4 pb-4"
                            >
                                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,108,250,0.5)]" />
                            </motion.div>
                        )}
                        <div className="flex justify-between items-start">
                            <div className={`${stat.bg} p-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner-sm inner-shadow`}>
                                <stat.icon size={28} className={stat.color} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none outline-none">{stat.label}</p>
                            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                            <p className="text-[10px] mt-2 font-black text-slate-400 uppercase tracking-tight leading-none italic">{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sans shadow-slate-200/50">
                {/* Table Toolbar */}
                <div className="p-8 border-b border-slate-50 bg-slate-50/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center inner-shadow">
                                <Tag size={20} />
                            </div>
                            Platform Discounts
                        </h2>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by code or description..."
                                className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 font-bold text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto premium-scroll">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Coupon Code</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Value & Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usage Health</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiry Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-6"><div className="h-8 w-32 bg-slate-50 rounded-xl"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 w-24 bg-slate-50 rounded-lg"></div></td>
                                        <td className="px-8 py-6"><div className="h-4 w-40 bg-slate-50 rounded-full"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 w-16 bg-slate-50 rounded-full"></div></td>
                                        <td className="px-8 py-6"><div className="h-6 w-20 bg-slate-50 rounded-full"></div></td>
                                        <td className="px-8 py-6 text-right"><div className="h-8 w-24 bg-slate-50 rounded-xl ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredCoupons.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <AlertCircle size={48} />
                                            <p className="font-bold text-slate-400">No coupons found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon._id} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                                                    {coupon.code}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 italic">{coupon.description || 'No description provided'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-accent/5 text-accent flex items-center justify-center shadow-inner-sm inner-shadow flex-shrink-0">
                                                    {coupon.discountType === 'percentage' ? <Percent size={18} /> : <IndianRupee size={18} />}
                                                </div>
                                                <span className="text-sm font-black text-slate-700">
                                                    {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' OFF'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4 min-w-[150px]">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner flex-shrink-0">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${coupon.usageLimit ? Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100) : 0}%` }}
                                                        className={`h-full ${coupon.usageLimit && (coupon.usageCount / coupon.usageLimit) > 0.8 ? 'bg-amber-500' : 'bg-primary'}`}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 whitespace-nowrap">
                                                    {coupon.usageCount} / {coupon.usageLimit || '∞'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={14} className="text-slate-300" />
                                                <span className="text-xs font-bold text-slate-700">
                                                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No expiry'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                {(() => {
                                                    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                                                    if (isExpired) {
                                                        return (
                                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm shadow-rose-100/50">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                                                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.15em]">Expired</span>
                                                            </div>
                                                        );
                                                    }
                                                    if (coupon.status === 'active') {
                                                        return (
                                                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-accent/5 border border-accent/10 shadow-sm shadow-accent/5">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(5,196,254,0.5)]" />
                                                                <span className="text-[10px] font-black text-accent uppercase tracking-[0.15em]">Live</span>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm shadow-amber-100/50">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
                                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.15em]">Paused</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-3">
                                                <CouponRowActions 
                                                    coupon={coupon}
                                                    onEdit={(c) => {
                                                        setSelectedCoupon(c);
                                                        setIsEditOpen(true);
                                                    }}
                                                    onDelete={handleDelete}
                                                    onToggleStatus={handleToggleStatus}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer and Pagination placeholder if needed */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                        Total {filteredCoupons.length} coupons configured
                    </p>
                </div>
            </div>

            {/* Modals */}
            <CreateCouponModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                onSuccess={fetchCoupons} 
            />
            {selectedCoupon && (
                <EditCouponModal 
                    isOpen={isEditOpen} 
                    onClose={() => {
                        setIsEditOpen(false);
                        setSelectedCoupon(null);
                    }} 
                    onSuccess={fetchCoupons}
                    couponData={selectedCoupon}
                />
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {couponToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner-sm animate-pulse-slow">
                                    <AlertTriangle size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">Wait, are you sure?</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-4">
                                    Deleting this coupon will permanently remove it from the system. This action cannot be undone.
                                </p>
                                
                                <div className="mt-10 flex gap-4">
                                    <button 
                                        onClick={() => setCouponToDelete(null)}
                                        className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="flex-1 h-14 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-200 disabled:opacity-70"
                                    >
                                        {isDeleting ? <Loader2 size={24} className="animate-spin" /> : 'Delete Item'}
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

export default Coupons;