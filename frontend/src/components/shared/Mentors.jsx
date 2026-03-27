import React, { useState, useEffect } from 'react';
import { Search, Mail, User, ShieldCheck, MoreVertical, RefreshCw, AlertCircle, Calendar, X, Filter, UserCheck, Download } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const Mentors = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Advanced Filters State
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchMentors = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/mentors');
            setMentors(response.data.data.mentors);
        } catch (err) {
            console.error('Error fetching mentors:', err);
            setError('Failed to load mentors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    const filteredMentors = mentors.filter(mentor => {
        const matchesSearch = `${mentor.firstName} ${mentor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mentor.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Status Filter
        const isActive = mentor.isActive !== false;
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && isActive) || 
                            (statusFilter === 'inactive' && !isActive);
        
        // Date Filter
        const joinedDate = new Date(mentor.createdAt);
        const matchesStartDate = !startDate || joinedDate >= new Date(startDate);
        const matchesEndDate = !endDate || joinedDate <= new Date(endDate + 'T23:59:59');

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });

    const getStatusColor = (isActive) => {
        return isActive 
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
            : 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const handleExport = () => {
        if (filteredMentors.length === 0) {
            toast.info('No mentors to export.');
            return;
        }

        const headers = ['Name', 'Email', 'Joined Date', 'Status'];
        const csvRows = [
            headers.join(','),
            ...filteredMentors.map(mentor => {
                return [
                    `${mentor.firstName} ${mentor.lastName}`,
                    mentor.email,
                    new Date(mentor.createdAt).toLocaleDateString(),
                    mentor.isActive !== false ? 'Active' : 'Inactive'
                ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
            })
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `skillvyn_mentors_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Mentors list exported successfully!');
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
                <p className="text-slate-500 mb-6 text-center max-w-md">{error}</p>
                <button 
                    onClick={fetchMentors}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-secondary flex items-center gap-2">
                        <UserCheck size={24} className="text-primary" />
                        Mentors
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and view all registered mentors in the system.</p>
                </div>
                
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search mentors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full md:w-80 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
                    />
                </div>

                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <Download size={16} />
                    <span>Export Mentors</span>
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                        <Filter size={14} />
                        <span>FILTERS:</span>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                    {/* Status Dropdown */}
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>

                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                    {/* Date Pickers */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold pl-9 pr-3 py-2 rounded-xl focus:outline-none shadow-sm w-36"
                                placeholder="From Date"
                            />
                        </div>
                        <span className="text-slate-300 text-xs">-</span>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold pl-9 pr-3 py-2 rounded-xl focus:outline-none shadow-sm w-36"
                                placeholder="To Date"
                            />
                        </div>
                    </div>

                    {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold text-xs ml-auto transition-colors"
                        >
                            <X size={14} />
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mentor</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Joined Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><div className="h-4 w-40 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-5 text-right"><div className="h-8 w-8 bg-slate-50 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredMentors.length > 0 ? (
                                filteredMentors.map((mentor) => (
                                    <tr key={mentor._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold border border-primary/10 shadow-inner inner-shadow">
                                                    {mentor.firstName.charAt(0)}{mentor.lastName.charAt(0)}
                                                </div>
                                                <div className="font-semibold text-slate-700">
                                                    {mentor.firstName} {mentor.lastName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Mail size={14} className="text-slate-400" />
                                                <span>{mentor.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-500 text-sm">
                                            {new Date(mentor.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(mentor.isActive)}`}>
                                                {mentor.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="More Options">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <User size={32} className="text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-500 font-bold">No mentors found</p>
                                                <p className="text-slate-400 text-xs">Try adjusting your filters or search query.</p>
                                            </div>
                                            <button 
                                                onClick={clearFilters}
                                                className="mt-2 text-primary text-xs font-bold hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Mentors;