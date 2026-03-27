import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, X } from 'lucide-react';

const LessonDeleteConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    lessonTitle 
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                    >
                        <div className="p-10 text-center relative">
                            <button 
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                                <Trash2 className="text-rose-500" size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Remove Lesson?</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                You're about to remove <span className="text-slate-900 font-bold">"{lessonTitle || 'this lesson'}"</span>. This will delete all video links, text content, and quizzes within this unit.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <button
                                    onClick={onClose}
                                    className="py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-sans uppercase text-[11px] tracking-widest"
                                >
                                    Keep Lesson
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2 font-sans uppercase text-[11px] tracking-widest"
                                >
                                    <Trash2 size={18} />
                                    Delete Now
                                </button>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-rose-400">
                                <AlertCircle size={12} /> Irreversible Action
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LessonDeleteConfirmModal;
