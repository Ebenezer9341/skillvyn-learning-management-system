import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Layers, 
    BookOpen, 
    ArrowRight,
    Loader2, 
    Star, 
    Search, 
    Sparkles, 
    Shield,
    X,
    Check
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import PriceDisplay from '../../components/ui/PriceDisplay';

const CandidateBundles = () => {
    const [bundles, setBundles] = useState([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bundlesRes, enrollRes] = await Promise.all([
                api.get('/api/bundles'),
                api.get('/api/enrollments/my-enrollments')
            ]);
            
            // Only show published bundles
            setBundles(bundlesRes.data.data.bundles.filter(b => b.status === 'published'));

            // Map enrolled courses into a Set for fast lookup
            const enrollments = enrollRes.data.data.enrollments || [];
            const courseIds = new Set(enrollments.map(e => e.course._id || e.course));
            setEnrolledCourseIds(courseIds);

        } catch (err) {
            toast.error('Failed to load bundle catalog');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredBundles = bundles.filter(bundle => 
        bundle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bundle.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePurchase = (bundle) => {
        setShowDetailModal(false);
        navigate('/candidate/payment', { 
            state: { 
                bundleId: bundle._id, 
                courseTitle: bundle.title,
                price: bundle.price,
                originalPrice: bundle.originalPrice
            } 
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold mt-6 tracking-widest uppercase text-xs">Loading Bundles...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-8">
            {/* Header section with search */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mb-4">
                            <Sparkles size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Limited Edition Bundles</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Expand Your <span className="text-emerald-600">Skillset</span></h1>
                        <p className="text-slate-500 font-medium mt-2">Get full access to multiple courses at a significantly discounted rate.</p>
                    </div>
                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                        <input 
                            type="text"
                            placeholder="Search bundles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Bundle Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBundles.map((bundle, idx) => (
                    <motion.div
                        key={bundle._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden hover:scale-[1.02] transition-all cursor-pointer group"
                        onClick={() => { setSelectedBundle(bundle); setShowDetailModal(true); }}
                    >
                        <div className="h-48 bg-gradient-to-br from-emerald-600/10 to-teal-600/5 relative flex items-center justify-center">
                            <Layers size={64} className="text-emerald-600/20 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
                            <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                                {Math.round((1 - bundle.price / bundle.originalPrice) * 100)}% OFF
                            </div>
                        </div>
                        <div className="p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1">{bundle.title}</h3>
                            <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6">{bundle.description}</p>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600">
                                    <BookOpen size={16} />
                                    <span className="text-xs font-black">{bundle.courses?.length || 0} Courses</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-500">
                                    <Star size={14} fill="currentColor" />
                                    <span className="text-xs font-black">{bundle.averageRating || 'New'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <PriceDisplay price={bundle.price} originalPrice={bundle.originalPrice} size="medium" />
                                <button className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 group-hover:px-6 flex items-center gap-2">
                                    <span className="hidden group-hover:block text-xs font-black uppercase tracking-widest">View Bundle</span>
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetailModal && selectedBundle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDetailModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <button 
                                onClick={() => setShowDetailModal(false)}
                                className="absolute top-8 right-8 z-10 p-3 bg-white/80 hover:bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-10 pb-0 bg-gradient-to-r from-emerald-50 to-teal-50">
                                <div className="space-y-2 mb-8">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-emerald-100">
                                        <Layers size={12} /> Bundle Details
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{selectedBundle.title}</h3>
                                </div>
                            </div>

                            <div className="p-10 overflow-y-auto premium-scroll flex-1 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Included Courses</h4>
                                    <div className="space-y-3">
                                        {selectedBundle.courses?.map((course, idx) => (
                                            <div key={course._id || idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 flex-shrink-0">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-slate-800 truncate">{course.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{course.level || 'Beginner'}</p>
                                                </div>
                                                <Check className="text-emerald-500" size={20} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-emerald-600 text-white p-8 rounded-[2rem] shadow-xl shadow-emerald-500/20">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Unlock everything for</p>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-4xl font-black">₹{selectedBundle.price?.toLocaleString()}</span>
                                                <span className="text-lg font-bold opacity-50 line-through">₹{selectedBundle.originalPrice?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">You Save</p>
                                            <span className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-black">₹{Math.max(0, selectedBundle.originalPrice - selectedBundle.price).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    {(() => {
                                        const bundleCourseIds = selectedBundle.courses?.map(c => c._id || c) || [];
                                        const isFullyEnrolled = bundleCourseIds.length > 0 && bundleCourseIds.every(id => enrolledCourseIds.has(id));

                                        if (isFullyEnrolled) {
                                            return (
                                                <button 
                                                    disabled
                                                    className="w-full h-16 bg-white/20 text-white rounded-2xl font-black uppercase tracking-widest mt-8 flex items-center justify-center gap-3 cursor-not-allowed border-2 border-white/20"
                                                >
                                                    <Check size={20} />
                                                    <span>Already Owned</span>
                                                </button>
                                            );
                                        }

                                        return (
                                            <button 
                                                onClick={() => handlePurchase(selectedBundle)}
                                                className="w-full h-16 bg-white text-emerald-600 rounded-2xl font-black uppercase tracking-widest mt-8 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 shadow-lg"
                                            >
                                                <span>Unlock Bundle Access</span>
                                                <ArrowRight size={20} />
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CandidateBundles;
