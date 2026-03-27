import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Percent, IndianRupee, Calendar, Users, HelpCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';

const CreateCouponModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [fetchingItems, setFetchingItems] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        applicableTo: 'all',
        specificItems: [],
        itemModel: 'Course',
        minOrderValue: 0,
        maxDiscount: '',
        expiryDate: '',
        usageLimit: ''
    });

    useEffect(() => {
        if (isOpen && (formData.applicableTo === 'courses' || formData.applicableTo === 'bundles')) {
            fetchItems();
        }
    }, [isOpen, formData.applicableTo]);

    const fetchItems = async () => {
        setFetchingItems(true);
        try {
            if (formData.applicableTo === 'courses') {
                const endpoint = isAdmin ? '/api/courses/manage' : '/api/courses/my-courses';
                const res = await api.get(endpoint);
                setCourses(res.data.data.courses);
            } else if (formData.applicableTo === 'bundles') {
                const endpoint = isAdmin ? '/api/bundles/manage' : '/api/bundles/my-bundles';
                const res = await api.get(endpoint);
                setBundles(res.data.data.bundles);
            }
        } catch (err) {
            console.error('Failed to fetch items:', err);
        } finally {
            setFetchingItems(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/coupons', formData);
            toast.success('Coupon created successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create coupon');
        } finally {
            setLoading(false);
        }
    };

    const toggleItemSelection = (id) => {
        setFormData(prev => {
            const specificItems = prev.specificItems.includes(id)
                ? prev.specificItems.filter(i => i !== id)
                : [...prev.specificItems, id];
            return { ...prev, specificItems };
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
                >
                    {/* Header */}
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Coupon</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure your new platform discount offer</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:shadow-md"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                        {/* Code and Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none italic">Coupon Code</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. SUMMER50"
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-primary/5 transition-all uppercase shadow-inner-sm"
                                    value={formData.code}
                                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none italic">Description</label>
                                <textarea 
                                    placeholder="Short summary of the offer"
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-6 font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-inner-sm resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Discount Config */}
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-8 shadow-inner-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none italic">Discount Type</label>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, discountType: 'percentage'})}
                                            className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${formData.discountType === 'percentage' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                        >
                                            <Percent size={14} />
                                            Percentage
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, discountType: 'fixed'})}
                                            className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${formData.discountType === 'fixed' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                        >
                                            <IndianRupee size={14} />
                                            Fixed Amount
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-none italic">
                                        {formData.discountType === 'percentage' ? 'Percentage Off (%)' : 'Discount Amount (₹)'}
                                    </label>
                                    <input 
                                        required
                                        type="number" 
                                        min="0"
                                        max={formData.discountType === 'percentage' ? "100" : undefined}
                                        placeholder={formData.discountType === 'percentage' ? '10' : '500'}
                                        className="w-full h-12 bg-white border border-slate-100 rounded-xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-8 focus:ring-primary/5 transition-all shadow-inner-sm"
                                        value={formData.discountValue}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            if (formData.discountType === 'percentage') {
                                                if (value > 100) value = 100;
                                                if (value < 0) value = 0;
                                            }
                                            setFormData({...formData, discountValue: value});
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        Min Order Value (₹)
                                        <div className="group relative">
                                            <HelpCircle size={10} className="text-slate-300" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-900 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-32 text-center uppercase leading-tight">
                                                Coupon only valid if applicable items subtotal is above this value
                                            </div>
                                        </div>
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full h-12 bg-white border border-slate-100 rounded-xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        value={formData.minOrderValue}
                                        onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                                    />
                                </div>
                                {formData.discountType === 'percentage' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                            Max Discount (₹)
                                            <div className="group relative">
                                                <HelpCircle size={10} className="text-slate-300" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-900 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-32 text-center uppercase leading-tight">
                                                    Cap the discount amount for high-value orders
                                                </div>
                                            </div>
                                        </label>
                                        <input 
                                            type="number" 
                                            placeholder="Leave empty for no limit"
                                            className="w-full h-12 bg-white border border-slate-100 rounded-xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={formData.maxDiscount}
                                            onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Applicability */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicable To</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['all', 'courses', 'bundles'].map((type) => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, applicableTo: type, specificItems: [], itemModel: type === 'bundles' ? 'Bundle' : 'Course'})}
                                            className={`px-6 h-12 rounded-xl font-black text-xs uppercase transition-all ${formData.applicableTo === type ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Specific Items Selection */}
                            {(formData.applicableTo === 'courses' || formData.applicableTo === 'bundles') && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Select Specific {formData.applicableTo === 'courses' ? 'Courses' : 'Bundles'} (Optional)
                                    </label>
                                    <div className="bg-slate-100/30 border border-slate-100 rounded-[2rem] p-6 max-h-[250px] overflow-y-auto space-y-3 scrollbar-hide shadow-inner-sm">
                                        {fetchingItems ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-3">
                                                <Loader2 size={28} className="animate-spin text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Indexing items...</span>
                                            </div>
                                        ) : (
                                            (formData.applicableTo === 'courses' ? courses : bundles).map((item) => (
                                                <div 
                                                    key={item._id}
                                                    onClick={() => toggleItemSelection(item._id)}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.specificItems.includes(item._id) ? 'bg-white border-primary shadow-lg shadow-primary/5' : 'bg-white/50 border-transparent hover:bg-white hover:border-slate-100'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${formData.specificItems.includes(item._id) ? 'bg-primary border-primary shadow-sm shadow-primary/20' : 'bg-white border-slate-200'}`}>
                                                        {formData.specificItems.includes(item._id) && <X size={12} className="text-white rotate-45" />}
                                                    </div>
                                                    <span className={`text-sm font-black transition-colors ${formData.specificItems.includes(item._id) ? 'text-slate-900' : 'text-slate-500'}`}>{item.title}</span>
                                                </div>
                                            ))
                                        )}
                                        {((formData.applicableTo === 'courses' ? courses : bundles).length === 0 && !fetchingItems) && (
                                            <p className="text-center py-4 text-xs font-medium text-slate-400">No {formData.applicableTo} found.</p>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">If none selected, it applies to all {formData.applicableTo}.</p>
                                </div>
                            )}
                        </div>

                        {/* Constraints */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    Expiry Date
                                    <Calendar size={12} />
                                </label>
                                <input 
                                    type="date" 
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    Usage Limit
                                    <Users size={12} />
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="e.g. 100 uses"
                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                                />
                                <p className="text-[9px] text-slate-400 font-medium ml-1">Total times this coupon can be used. Empty for unlimited.</p>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-14 bg-white border border-slate-100 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200 disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : (
                                <>
                                    <Save size={20} />
                                    <span>Save Coupon</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateCouponModal;
