import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Calendar, Monitor, Globe, User, Activity } from 'lucide-react';

const LogDetailsModal = ({ isOpen, onClose, log }) => {
    if (!log) return null;

    const dateObj = new Date(log.createdAt);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
                    >
                        {/* Header */}
                        <div className="relative p-6 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Activity Details</h2>
                                    <p className="text-xs text-slate-500 font-medium tracking-wide">ID: {log._id}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Summary Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Activity size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Action</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700">{log.action}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Info size={12} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Resource</span>
                                </div>
                                <div className="text-sm font-bold text-slate-700">{log.resource}</div>
                            </div>
                        </div>

                        {/* User Profile Info */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Performer</h3>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/5">
                                    {log.userId?.firstName?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">
                                        {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System / Internal'}
                                    </div>
                                    <div className="text-xs text-slate-500">{log.userId?.email || 'No email associated'}</div>
                                    <div className="mt-1">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 capitalize">
                                            Role: {log.userId?.role || 'Service'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Metadata */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Technical Data</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                                    <Calendar className="text-slate-400" size={16} />
                                    <div className="text-sm text-slate-600">
                                        <span className="font-bold">Timestamp:</span> {dateObj.toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                                    <Globe className="text-slate-400" size={16} />
                                    <div className="text-sm text-slate-600">
                                        <span className="font-bold">IP Address:</span> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">{log.ipAddress || 'Internal'}</code>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 overflow-hidden">
                                    <Monitor className="text-slate-400 mt-0.5 flex-shrink-0" size={16} />
                                    <div className="text-sm text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap" title={log.userAgent}>
                                        <span className="font-bold">User Agent:</span> <span className="text-xs text-slate-500">{log.userAgent || 'Not available'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extended Details */}
                        {log.details && Object.keys(log.details).length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Extended Metadata</h3>
                                <div className="p-4 rounded-2xl bg-slate-900 overflow-x-auto border border-slate-800 shadow-inner">
                                    <pre className="text-[11px] text-emerald-400 font-mono leading-relaxed">
                                        {JSON.stringify(log.details, null, 4)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                        >
                            Close Overlay
                        </button>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
};

export default LogDetailsModal;
