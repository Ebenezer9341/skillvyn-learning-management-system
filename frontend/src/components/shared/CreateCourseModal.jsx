import React, { useState } from 'react';
import {
    X,
    BookOpen,
    FileText,
    Layers,
    Clock,
    IndianRupee,
    Zap,
    Plus,
    Target,
    Layout
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CreateCourseModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Development',
        level: 'Beginner',
        price: '',
        originalPrice: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        "Development", 
        "Design", 
        "Business", 
        "Marketing", 
        "Data Science", 
        "Personal Development",
        "Other"
    ];

    const levels = ["Beginner", "Intermediate", "Advanced"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/api/courses', formData);
            if (response.data.status === 'success') {
                toast.success('Course created successfully! You can now add your syllabus.');
                setIsLoading(false);
                onSuccess(); // Refresh the parent list
                onClose();
                setFormData({
                    title: '',
                    description: '',
                    category: 'Development',
                    level: 'Beginner',
                    price: '',
                    originalPrice: '',
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create course');
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Plus className="bg-white/20 p-1 rounded-lg" size={28} />
                                    Launch New Course
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">Fill in the core details to start building your educational path.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                            {/* Decorative bubbles */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
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
                                        <BookOpen size={14} /> Course Title
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Master React in 30 Days"
                                        className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <FileText size={14} /> Catchy Description
                                    </label>
                                    <textarea
                                        required
                                        rows="3"
                                        placeholder="Briefly describe what students will learn..."
                                        className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Section: Grid Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <Layers size={14} /> Category
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <Target size={14} /> Skill Level
                                    </label>
                                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-1">
                                        {levels.map(lvl => (
                                            <button
                                                key={lvl}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, level: lvl })}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                    formData.level === lvl 
                                                    ? 'bg-white text-blue-600 shadow-sm' 
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <IndianRupee size={14} /> Course Price (Sale ₹)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            required
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 border border-slate-100 py-3.5 pl-8 pr-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <IndianRupee size={14} /> Original Price (Anchor ₹)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold opacity-50">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Optional"
                                            className="w-full bg-slate-50 border border-slate-100 py-3.5 pl-8 pr-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-400 italic"
                                            value={formData.originalPrice}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {formData.originalPrice && Number(formData.originalPrice) < Number(formData.price) && (
                                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-2 px-2">
                                    <Zap size={12} strokeWidth={3} /> Warning: Sale price is higher than original price
                                </p>
                            )}

                            <div className="bg-blue-50/70 border border-blue-100/50 rounded-[2rem] p-5 flex items-start gap-4">
                                <div className="bg-blue-500/10 p-2.5 rounded-2xl">
                                    <Layout size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-blue-900 leading-tight">Wait, we're almost there!</p>
                                    <p className="text-xs text-blue-600 mt-1.5 leading-relaxed font-medium">
                                        By clicking create, your course shell will be generated. You can then add lesson modules, videos, and quizzes in the course editor.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    Maybe Later
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                            <span>Generate Course</span>
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

export default CreateCourseModal;
