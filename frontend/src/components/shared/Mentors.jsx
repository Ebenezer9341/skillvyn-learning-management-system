import React, { useState, useEffect } from 'react';
import { Search, Mail, User, ShieldCheck, MoreVertical, RefreshCw, AlertCircle, Calendar, X, Filter, UserCheck, Download, TrendingUp, Users, Activity, Loader2, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    useFloating, 
    autoUpdate, 
    offset, 
    flip, 
    shift, 
    useInteractions, 
    useDismiss, 
    useRole, 
    useClick,
    FloatingPortal, 
    FloatingFocusManager
} from '@floating-ui/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Filler,
  Legend
);

import api from '../../services/api';
import { toast } from 'react-toastify';

const MentorRowActions = ({ mentor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user: currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const { x, y, strategy, refs, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'end' }),
            shift({ padding: 10 })
        ],
        whileElementsMounted: autoUpdate,
        placement: 'bottom-end'
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role
    ]);

    const handleAction = (path) => {
        setIsOpen(false);
        const prefix = location.pathname.split('/')[1];
        navigate(`/${prefix}${path}/${mentor._id}`);
    };

    return (
        <>
            <button 
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                    isOpen ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`} 
                title="More actions"
            >
                <MoreVertical size={18} />
            </button>

            <FloatingPortal>
                <AnimatePresence>
                    {isOpen && (
                        <FloatingFocusManager context={context} modal={false}>
                            <motion.div
                                ref={refs.setFloating}
                                style={{
                                    position: strategy,
                                    top: y ?? 0,
                                    left: x ?? 0,
                                    width: 'max-content',
                                    zIndex: 9999
                                }}
                                {...getFloatingProps()}
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="w-48 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-1.5 text-left overflow-hidden ring-4 ring-slate-900/5"
                            >
                                <button
                                    onClick={() => handleAction('/user')}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-xl transition-all duration-200"
                                >
                                    <UserCircle2 size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">View Profile</span>
                                </button>
                            </motion.div>
                        </FloatingFocusManager>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </>
    );
};

const Mentors = () => {
    const { user: currentUser } = useAuth();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Advanced Filters State
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Analytics State
    const [stats, setStats] = useState({ totalMentors: 0, activeMentors: 0, newMentors: 0, growth: [], dailyGrowth: [] });
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsView, setStatsView] = useState('month'); // 'month' or 'day'
    const [activeStatsFilter, setActiveStatsFilter] = useState('All');

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

    const fetchStats = async (status = 'All') => {
        setStatsLoading(true);
        setActiveStatsFilter(status);
        try {
            const response = await api.get(`/api/mentors/stats?status=${status}`);
            setStats(response.data.data);
        } catch (err) {
            console.error('Error fetching mentor stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
        fetchStats();
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
            ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
            : 'bg-slate-100 text-slate-400 border-slate-200';
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Mentors',
            value: stats.totalMentors,
            icon: Users,
            change: 'Lifetime registrations'
        },
        {
            label: 'Active Mentors',
            value: stats.activeMentors,
            icon: UserCheck,
            change: 'Available for guidance'
        },
        {
            label: 'Onboarded',
            value: stats.newMentors,
            icon: TrendingUp,
            change: 'New this month'
        }
    ];

    const chartData = {
        labels: statsView === 'month' 
            ? (stats.growth?.map(g => g.label) || ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'])
            : (stats.dailyGrowth?.map(g => g.label) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        datasets: [
            {
                label: statsView === 'month' ? 'Monthly Onboarding' : 'Daily Onboarding',
                data: statsView === 'month' 
                    ? (stats.growth?.map(g => g.count) || [0, 0, 0, 0, 0, 0])
                    : (stats.dailyGrowth?.map(g => g.count) || [0, 0, 0, 0, 0, 0, 0]),
                borderColor: '#05C4FE',
                backgroundColor: 'rgba(5, 196, 254, 0.15)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#006CFA',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#001988',
                titleColor: '#fff',
                bodyColor: '#A8EBFF',
                padding: 12,
                displayColors: false,
                callbacks: { label: (context) => `${context.parsed.y} Mentors` }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748b', font: { size: 10, family: 'Inter, sans-serif' } }
            },
            y: {
                grid: { color: '#f1f5f9', drawBorder: false, borderDash: [5, 5] },
                ticks: { color: '#64748b', font: { size: 10, family: 'Inter, sans-serif' }, maxTicksLimit: 5 }
            }
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-secondary flex items-center gap-2">
                        <UserCheck size={24} className="text-primary" />
                        Mentors Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and view all registered mentors in the system.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search mentors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full md:w-80 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
                        />
                    </div>

                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export Data</span>
                    </button>
                </div>
            </div>

            {/* Analytics Block */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontFamily: 'Graphik, sans-serif' }}
                className="bg-white rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm text-slate-800 border border-slate-100"
            >
                {/* Abstract gradients strictly using brand colors - subtler for light mode */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3 pointer-events-none" style={{ backgroundColor: '#05C4FE', opacity: 0.05 }} />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" style={{ backgroundColor: '#006CFA', opacity: 0.08 }} />
                
                <div className="relative z-10">
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8" style={{ borderBottomColor: '#f1f5f9', borderBottomWidth: '1px' }}>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight flex items-center gap-3">
                                <TrendingUp size={28} className="text-primary" />
                                Mentor Analytics
                            </h2>
                            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-slate-500 font-medium mt-2 text-sm max-w-xl">
                                Detailed breakdown of mentor onboarding trends, activity distributions, and professional growth metrics.
                            </p>
                        </div>
                        {statsLoading && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border" style={{ color: '#05C4FE', backgroundColor: 'rgba(5,196,254,0.1)', borderColor: 'rgba(5,196,254,0.2)' }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Syncing</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        {/* Stats left column */}
                        <div className="lg:col-span-1 flex flex-col justify-between gap-6 md:gap-8 min-h-[300px]">
                            {statCards.map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => {
                                        let newStatus = 'All';
                                        if (stat.label.toLowerCase().includes('active')) {
                                            newStatus = 'active';
                                        } else if (stat.label.toLowerCase().includes('onboarded')) {
                                            newStatus = 'onboarded';
                                        }
                                        
                                        // Fetch 'All' data (holistic growth) for both Total and Onboarded
                                        const apiStatus = (newStatus === 'onboarded') ? 'All' : newStatus;
                                        fetchStats(apiStatus);
                                        setActiveStatsFilter(newStatus); // Distinct filter for UI highlighting
                                    }}
                                    className={`relative group p-5 rounded-2xl transition-all border cursor-pointer flex-1 flex flex-col justify-center ${
                                        (stat.label.toLowerCase().includes('active') && activeStatsFilter === 'active') ||
                                        (stat.label.toLowerCase().includes('total') && activeStatsFilter === 'All') ||
                                        (stat.label.toLowerCase().includes('onboarded') && activeStatsFilter === 'onboarded')
                                        ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10'
                                        : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm bg-white border-slate-100">
                                            <stat.icon size={18} className="text-primary" />
                                        </div>
                                        <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight text-slate-400 flex-1">
                                            {stat.label}
                                        </h3>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <div className="text-4xl lg:text-5xl font-black tracking-tighter text-secondary ml-1">
                                            {statsLoading ? '-' : stat.value}
                                        </div>
                                    </div>
                                    <div className="mt-4 inline-flex items-center gap-2 ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span style={{ fontFamily: 'Inter, sans-serif' }} className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart right column */}
                        <div className="lg:col-span-2 min-h-[300px] w-full border rounded-2xl p-6 relative flex flex-col bg-slate-50/50 border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 style={{ fontFamily: 'Inter, sans-serif' }} className="text-secondary text-sm font-bold flex items-center gap-2">
                                    <Activity size={16} className="text-primary" /> Onboarding Activity
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                    <button 
                                        onClick={() => setStatsView('month')}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statsView === 'month' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Month
                                    </button>
                                    <button 
                                        onClick={() => setStatsView('day')}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statsView === 'day' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Day
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-full relative min-h-[250px]">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                        className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-2xl focus:outline-none hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
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
                                className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold pl-9 pr-3 py-2 rounded-2xl focus:outline-none shadow-sm w-36"
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
                                className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold pl-9 pr-3 py-2 rounded-2xl focus:outline-none shadow-sm w-36"
                                placeholder="To Date"
                            />
                        </div>
                    </div>

                    {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold text-xs ml-auto transition-colors"
                        >
                            <X size={14} />
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="w-full overflow-visible">
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
                                                <div className="w-10 h-10 bg-slate-100 rounded-2xl"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><div className="h-4 w-40 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-100 rounded-2xl"></div></td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="h-8 w-8 bg-slate-50 rounded-2xl ml-auto"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredMentors.length > 0 ? (
                                filteredMentors.map((mentor) => (
                                    <tr key={mentor._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold border border-primary/10 shadow-inner">
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
                                            <span className={`px-2.5 py-1 rounded-2xl text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(mentor.isActive)}`}>
                                                {mentor.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right relative">
                                            <div className="flex items-center justify-end">
                                                <MentorRowActions mentor={mentor} />
                                            </div>
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