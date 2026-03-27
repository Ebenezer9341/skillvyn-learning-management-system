import { motion } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

const DeleteReviewModal = ({ isOpen, onClose, onConfirm, review, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 relative z-10"
            >
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                        <Trash2 size={32} className="text-rose-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Delete Review?</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4 font-medium">
                        You are about to remove <span className="text-slate-900 font-bold">{review?.candidate?.firstName}'s</span> feedback for <span className="text-slate-900 font-bold">{review?.course?.title}</span>.
                        <br /><br />
                        <span className="text-rose-500/80 text-[11px] uppercase tracking-widest font-black italic">This action cannot be undone.</span>
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="w-full py-4 bg-rose-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.15em] hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-200 active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Permanently Delete'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Cancel Intervention
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DeleteReviewModal;