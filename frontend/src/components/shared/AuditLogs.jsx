import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, History, Download, User, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import LogDetailsModal from './LogDetailsModal';
import { useAuth } from '../../context/AuthContext';

const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
        case 'LOGIN': return 'bg-accent/10 text-accent border-accent/20';
        case 'LOGOUT': return 'bg-slate-50 text-slate-400 border-slate-100';
        case 'CREATE': return 'bg-primary/10 text-primary border-primary/20';
        case 'UPDATE': return 'bg-highlight/10 text-highlight border-highlight/20';
        case 'DELETE': return 'bg-secondary/10 text-secondary border-secondary/20';
        case 'RATE': return 'bg-primary/10 text-primary border-primary/20';
        case 'ARCHIVE': return 'bg-slate-100 text-slate-500 border-slate-200';
        case 'ENROLL': return 'bg-secondary/10 text-secondary border-secondary/20';
        default:
            return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState('All');
    const [selectedResource, setSelectedResource] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All');
    const { user } = useAuth();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const limit = 15;

    // Modal State
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/audit-logs', {
                params: {
                    page,
                    limit,
                    action: selectedAction,
                    resource: selectedResource,
                    role: selectedRole,
                    search: searchTerm // Server-side search
                }
            });
            setLogs(response.data.data.logs);
            setTotalPages(response.data.pagination.pages);
            setTotalResults(response.data.pagination.total);
            setCurrentPage(response.data.pagination.page);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to load audit logs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(1);
        }, 500); // Wait 500ms after user stops typing
        return () => clearTimeout(timer);
    }, [searchTerm, selectedAction, selectedResource, selectedRole]);

    // Set default role for mentors
    useEffect(() => {
        if (user?.role === 'mentor' && selectedRole === 'All') {
            setSelectedRole('mentor');
        }
    }, [user, selectedRole]);

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        return logs.filter(log => {
            const userName = `${log.userId?.firstName || 'System'} ${log.userId?.lastName || ''}`.toLowerCase();
            const userEmail = (log.userId?.email || '').toLowerCase();
            
            return userName.includes(searchTerm.toLowerCase()) ||
                userEmail.includes(searchTerm.toLowerCase()) ||
                (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.resource || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [logs, searchTerm]);

    const handleExport = () => {
        if (filteredLogs.length === 0) {
            toast.info('No logs to export.');
            return;
        }

        const headers = ['User', 'Email', 'Role', 'Action', 'Resource', 'IP Address', 'Date', 'Time'];
        const csvRows = [
            headers.join(','),
            ...filteredLogs.map(log => {
                const dateObj = new Date(log.createdAt);
                return [
                    `${log.userId?.firstName || 'System'} ${log.userId?.lastName || ''}`,
                    log.userId?.email || 'system@internal',
                    log.userRole || 'System',
                    log.action,
                    log.resource,
                    log.ipAddress || 'Internal',
                    dateObj.toLocaleDateString(),
                    dateObj.toLocaleTimeString()
                ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `skillvyn_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Audit logs exported successfully!');
    };

    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setIsDetailsModalOpen(true);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Error Loading Logs</h3>
                <p className="text-slate-500 mb-6 text-center max-w-md">{error}</p>
                <button onClick={fetchLogs} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-secondary flex items-center gap-2">
                        <History size={24} className="text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Monitor all administrative and system activities.</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <Download size={16} />
                    <span>Export Data</span>
                </button>
            </div>

            {/* Main Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Search and Filters Section */}
                <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search logs by user, action or resource..."
                                className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <select
                                className="bg-white border border-slate-200 py-2.5 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm cursor-pointer flex-1 lg:flex-none"
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                            >
                                <option value="All">All Actions</option>
                                <option value="Login">Login</option>
                                <option value="Logout">Logout</option>
                                <option value="Create">Create</option>
                                <option value="Update">Update</option>
                                <option value="Delete">Delete</option>
                                <option value="Rate">Rate</option>
                                <option value="Archive">Archive</option>
                                <option value="Enroll">Enroll</option>
                            </select>
                            <select
                                className="bg-white border border-slate-200 py-2.5 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm cursor-pointer flex-1 lg:flex-none"
                                value={selectedResource}
                                onChange={(e) => setSelectedResource(e.target.value)}
                            >
                                <option value="All">All Resources</option>
                                <option value="System">System</option>
                                <option value="User">User</option>
                                <option value="Profile">Profile</option>
                                <option value="Course">Course</option>
                            </select>
                            <select
                                className="bg-white border border-slate-200 py-2.5 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm cursor-pointer flex-1 lg:flex-none"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                {user?.role === 'mentor' ? (
                                    <option value="mentor">Mentor</option>
                                ) : (
                                    <>
                                        <option value="All">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="mentor">Mentor</option>
                                        <option value="candidate">Candidate</option>
                                        {user?.role === 'superuser' && <option value="superuser">Superuser</option>}
                                    </>
                                )}
                            </select>
                            <button onClick={() => fetchLogs(1)} className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Resource</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-full"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                                    <div className="h-3 w-32 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="h-6 w-16 bg-slate-100 rounded-2xl"></div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="h-4 w-20 bg-slate-100 rounded"></div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="h-6 w-20 bg-slate-100 rounded-2xl"></div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-2">
                                                <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                                <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="h-8 w-8 bg-slate-50 rounded-2xl ml-auto"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log, index) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        key={log._id} 
                                        className="hover:bg-slate-50/50 transition-colors group text-sm"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 border border-slate-200 text-xs font-bold">
                                                    {log.userId?.firstName?.charAt(0) || 'S'}
                                                    {log.userId?.lastName?.charAt(0) || ''}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-secondary group-hover:text-primary transition-colors">
                                                        {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'System'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">{log.userId?.email || 'internal@system'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-medium text-xs">{log.resource}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                                {log.userRole || 'System'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-slate-700 font-medium">
                                                {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => handleViewDetails(log)}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <History size={32} className="text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium font-bold">No logs found</p>
                                            <p className="text-slate-400 text-xs">Try adjusting your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer & Pagination */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold order-2 sm:order-1">
                        {loading ? 'Fetching logs...' : `Showing page ${currentPage} of ${totalPages} (${totalResults} total activities)`}
                    </p>
                    
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                        <button 
                            disabled={currentPage === 1 || loading}
                            onClick={() => fetchLogs(currentPage - 1)}
                            className="px-4 py-1.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                // Simple sliding window logic for page numbers
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchLogs(pageNum)}
                                        className={`w-8 h-8 rounded-2xl text-xs font-bold flex items-center justify-center transition-all ${
                                            currentPage === pageNum 
                                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                            : 'text-slate-500 hover:bg-white hover:text-primary'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button 
                            disabled={currentPage === totalPages || loading}
                            onClick={() => fetchLogs(currentPage + 1)}
                            className="px-4 py-1.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Log Details Modal */}
            <LogDetailsModal 
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                log={selectedLog}
            />
        </div>
    );
};

export default AuditLogs;
