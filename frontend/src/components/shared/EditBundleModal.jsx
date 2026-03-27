import React, { useState, useEffect } from 'react';
import {
    X,
    BookOpen,
    FileText,
    IndianRupee,
    Zap,
    Save,
    Layout,
    CheckSquare,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EditBundleModal = ({ isOpen, onClose, onSuccess, initialBundle, mode }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        status: 'draft',
        courses: []
    });
    
    const [availableCourses, setAvailableCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCourses, setIsFetchingCourses] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && initialBundle) {
            setFormData({
                title: initialBundle.title,
                description: initialBundle.description,
                price: initialBundle.price,
                status: initialBundle.status || 'draft',
                courses: initialBundle.courses?.map(c => c._id || c) || []
            });
            fetchAvailableCourses();
        }
    }, [isOpen, initialBundle]);

    const fetchAvailableCourses = async () => {
        setIsFetchingCourses(true);
        try {
            // Updated to fetch all published courses if admin
            let endpoint = mode === 'all' 
                ? '/api/courses/manage?status=published&limit=100' 
                : '/api/courses/my-courses';

            const response = await api.get(endpoint);
            // Only allow bundling published courses
            const courses = response.data.data.courses.filter(c => c.status === 'published');
            setAvailableCourses(courses);
        } catch (err) {
            console.error('Failed to fetch courses for bundling', err);
            toast.error('Failed to load courses for selection.');
        } finally {
            setIsFetchingCourses(false);
        }
    };

    const toggleCourseSelection = (courseId) => {
        setFormData(prev => {
            const isSelected = prev.courses.includes(courseId);
            if (isSelected) {
                return { ...prev, courses: prev.courses.filter(id => id !== courseId) };
            } else {
                return { ...prev, courses: [...prev.courses, courseId] };
            }
        });
    };

    const toggleStatus = () => {
        setFormData(prev => ({ ...prev, status: prev.status === 'published' ? 'draft' : 'published' }));
    };

    const currentOriginalSum = availableCourses
        .filter(c => formData.courses.includes(c._id))
        .reduce((sum, c) => sum + (c.price || 0), 0);
        
    const isPriceInvalid = formData.courses.length > 0 && Number(formData.price) >= currentOriginalSum;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.courses.length < 2) {
            setError('A bundle must contain at least 2 courses.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.patch(`/api/bundles/${initialBundle._id}`, formData);
            if (response.data.status === 'success') {
                toast.success('Course bundle updated successfully!');
                setIsLoading(false);
                onSuccess(); // Refresh the parent list
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update bundle');
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white relative">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Save className="bg-white/20 p-1 rounded-lg" size={28} />
                                    Edit Course Bundle
                                </h2>
                                <p className="text-emerald-100 text-sm mt-1">Modify pricing, status, or courses in this bundle.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                                    <Zap size={14} />
                                    {error}
                                </div>
                            )}

                            {/* Section: Basic Info */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <BookOpen size={14} /> Bundle Title
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Full Stack Developer Masterclass Bundle"
                                        className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-700"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <FileText size={14} /> Description
                                    </label>
                                    <textarea
                                        required
                                        rows="3"
                                        placeholder="Describe the value of this bundle..."
                                        className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-700 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                            <IndianRupee size={14} /> Disounted Price
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                            <input
                                                required
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 border border-slate-100 py-3.5 pl-8 pr-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-700"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[10px] text-slate-400 font-bold ml-1 italic">
                                                Original combined cost: ₹{currentOriginalSum.toLocaleString()}
                                            </p>
                                            {isPriceInvalid && (
                                                <p className="text-[10px] text-red-500 font-black">Must be strictly less than original price!</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 opacity-0 hidden md:block">Status</label>
                                        <button
                                            type="button"
                                            onClick={toggleStatus}
                                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl w-full border transition-all ${
                                                formData.status === 'published' 
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <span className="text-sm font-bold uppercase tracking-wider">{formData.status}</span>
                                            {formData.status === 'published' ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-slate-400" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Select Courses */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <CheckSquare size={14} /> Update Courses
                                </label>
                                
                                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                                    {isFetchingCourses ? (
                                        <div className="p-8 text-center text-slate-400 text-sm font-bold flex justify-center items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-emerald-500 animate-spin"></div> Loading published courses...
                                        </div>
                                    ) : availableCourses.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {availableCourses.map(course => (
                                                <label 
                                                    key={course._id} 
                                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white transition-colors"
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                                        checked={formData.courses.includes(course._id)}
                                                        onChange={() => toggleCourseSelection(course._id)}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-800">{course.title}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold">Individual Price: ₹{course.price}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-sm font-bold">
                                            No published courses available to bundle. Create and publish courses first.
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest ml-1">
                                    Selected: {formData.courses.length} courses
                                </p>
                            </div>

                            <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-[2rem] p-5 flex items-start gap-4">
                                <div className="bg-emerald-500/10 p-2.5 rounded-2xl">
                                    <Layout size={20} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-900 leading-tight">Editing Impact</p>
                                    <p className="text-xs text-emerald-700 mt-1.5 leading-relaxed font-medium">
                                        Modifying this bundle will update its details for all future candidates. Past purchases will not be affected. Original combined price is auto-recalculated if you change the courses.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || formData.courses.length < 2 || isPriceInvalid}
                                    className="flex-[2] py-4 px-6 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={20} className="group-hover:scale-110 transition-transform" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditBundleModal;
