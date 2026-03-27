import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Archive, AlertCircle, RefreshCw, X } from 'lucide-react';

const CourseDeleteConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    courseTitle, 
    enrollmentCount = 0, 
    isLoading = false 
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

                            {enrollmentCount > 0 ? (
                                <>
                                    <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-amber-100">
                                        <Archive className="text-amber-500" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3">Archive Course?</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        Students are currently enrolled in <span className="text-slate-900 font-bold">"{courseTitle}"</span>. Archiving will hide it from the catalog but maintain access for existing students.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
                                        <Trash2 className="text-rose-500" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-3">Permanent Delete?</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        You're about to remove <span className="text-slate-900 font-bold">"{courseTitle}"</span>. This action cannot be undone and all data will be lost.
                                    </p>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-sans uppercase text-[11px] tracking-widest"
                                >
                                    Keep Course
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`py-4 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 font-sans uppercase text-[11px] tracking-widest ${
                                        enrollmentCount > 0
                                        ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                                        : 'bg-rose-500 shadow-rose-200 hover:bg-rose-600'
                                    }`}
                                >
                                    {isLoading ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        enrollmentCount > 0 ? <Archive size={18} /> : <Trash2 size={18} />
                                    )}
                                    {isLoading ? 'Processing...' : (enrollmentCount > 0 ? 'Archive Now' : 'Delete Now')}
                                </button>
                            </div>
                        </div>

                        {/* Footer Status Bar */}
                        <div className={`p-4 border-t ${enrollmentCount > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${enrollmentCount > 0 ? 'text-amber-500' : 'text-rose-400'}`}>
                                <AlertCircle size={12} /> {enrollmentCount > 0 ? 'Protective Action' : 'Irreversible Action'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CourseDeleteConfirmModal;