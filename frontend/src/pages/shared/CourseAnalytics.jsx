import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    TrendingUp,
    Star,
    ArrowLeft,
    Download,
    Calendar,
    ChevronDown,
    Shield,
    Award,
    IndianRupee,
    X
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── Helpers ────────────────────────────────────────────────────────────────
const toYMD = (date) => date.toISOString().split('T')[0];

const subtractDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
};

const fmtDisplay = (ymd) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[+m - 1]} ${+d}, ${y}`;
};

// ──────────────────────────────────────────────────────────────────────────
const CourseAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Date filter
    const [showDatePanel, setShowDatePanel] = useState(false);
    const [activePreset, setActivePreset] = useState('last30');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [appliedStart, setAppliedStart] = useState(toYMD(subtractDays(30)));
    const [appliedEnd, setAppliedEnd] = useState(toYMD(new Date()));
    const [appliedLabel, setAppliedLabel] = useState('Last 30 Days');
    const dateRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dateRef.current && !dateRef.current.contains(e.target)) {
                setShowDatePanel(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchAnalytics = async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/courses/analytics/${id}`, {
                params: { startDate: start, endDate: end }
            });
            setData(response.data.data);
        } catch (err) {
            console.error('Analytics Fetch Error:', err);
            setError(err.response?.data?.message || 'Failed to load analytics');
            toast.error('Unable to synchronize data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(appliedStart, appliedEnd);
    }, [id]);

    const applyPreset = (days, label) => {
        const start = toYMD(subtractDays(days));
        const end = toYMD(new Date());
        setActivePreset(`last${days}`);
        setAppliedStart(start);
        setAppliedEnd(end);
        setAppliedLabel(label);
        setShowDatePanel(false);
        fetchAnalytics(start, end);
    };

    const applyCustom = () => {
        if (!customStart || !customEnd) {
            toast.error('Please select both a start and end date');
            return;
        }
        if (new Date(customStart) > new Date(customEnd)) {
            toast.error('Start date cannot be after end date');
            return;
        }
        setActivePreset('custom');
        setAppliedStart(customStart);
        setAppliedEnd(customEnd);
        setAppliedLabel(`${fmtDisplay(customStart)} → ${fmtDisplay(customEnd)}`);
        setShowDatePanel(false);
        fetchAnalytics(customStart, customEnd);
    };

    // ── PDF Export ─────────────────────────────────────────────────────────
    const handleExportPDF = async () => {
        if (!data) return;
        setIsExporting(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const margin = 18;
            const contentW = pageW - margin * 2;
            let y = 0;

            // Header banner
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 0, pageW, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('Course Analytics Report', margin, 16);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 23);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            const titleStr = doc.splitTextToSize(data.title, contentW);
            doc.text(titleStr[0], margin, 33);
            y = 50;

            // Period label
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text(`Period: ${appliedLabel}`, margin, y);
            y += 10;

            // ── Key Metrics ──────────────────────────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text('Key Metrics', margin, y);
            y += 2;
            doc.setDrawColor(99, 102, 241);
            doc.setLineWidth(0.5);
            doc.line(margin, y, margin + 40, y);
            y += 8;

            const metrics = [
                { label: 'Total Students', value: String(data.stats.totalStudents) },
                { label: 'Avg Progress',   value: `${Math.round(data.stats.avgProgress)}%` },
                { label: 'Completion',     value: `${Math.round(data.stats.completionRate)}%` },
                { label: 'Avg Rating',     value: String(data.stats.avgRating) },
            ];
            const cardW = (contentW - 9) / 4;
            metrics.forEach((m, i) => {
                const x = margin + i * (cardW + 3);
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.roundedRect(x, y, cardW, 22, 3, 3, 'FD');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(15);
                doc.setTextColor(30, 41, 59);
                doc.text(m.value, x + cardW / 2, y + 11, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text(m.label.toUpperCase(), x + cardW / 2, y + 18, { align: 'center' });
            });
            y += 32;

            // ── Status Distribution ──────────────────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text('Student Status Distribution', margin, y);
            y += 2;
            doc.setDrawColor(99, 102, 241);
            doc.line(margin, y, margin + 65, y);
            y += 8;

            const statusColors = [[16,185,129],[245,158,11],[239,68,68],[99,102,241]];
            const total = data.statusDistribution.reduce((a, s) => a + s.count, 0);

            if (data.statusDistribution.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text('No enrollment data available.', margin, y);
                y += 12;
            } else {
                data.statusDistribution.forEach((s, i) => {
                    const [r, g, b] = statusColors[i % 4];
                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    const barMax = contentW - 55;
                    const barW = (pct / 100) * barMax;

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(30, 41, 59);
                    doc.text(s._id.charAt(0).toUpperCase() + s._id.slice(1), margin, y + 4.5);

                    doc.setFillColor(241, 245, 249);
                    doc.roundedRect(margin + 32, y, barMax, 6, 2, 2, 'F');

                    doc.setFillColor(r, g, b);
                    if (barW > 0) doc.roundedRect(margin + 32, y, barW, 6, 2, 2, 'F');

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text(`${s.count} (${pct}%)`, margin + 32 + barMax + 3, y + 4.5);
                    y += 11;
                });
            }
            y += 6;

            // ── Revenue Breakdown (PDF) ──────────────────────────────────
            if (!data.isFree) {
                if (y > pageH - 80) { doc.addPage(); y = margin; }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(30, 41, 59);
                doc.text('Revenue Overview', margin, y);
                y += 2;
                doc.setDrawColor(99, 102, 241);
                doc.line(margin, y, margin + 45, y);
                y += 8;

                const revMetrics = [
                    { label: 'Total Revenue',       value: `Rs. ${data.stats.totalRevenue.toLocaleString()}` },
                    { label: 'Total Transactions',  value: String(data.stats.totalTransactions) },
                    { label: 'Avg Revenue/Student', value: `Rs. ${data.stats.avgRevenuePerStudent.toLocaleString()}` },
                ];
                const rCardW = (contentW - 6) / 3;
                revMetrics.forEach((m, i) => {
                    const x = margin + i * (rCardW + 3);
                    doc.setFillColor(240, 253, 244);
                    doc.setDrawColor(187, 247, 208);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(x, y, rCardW, 22, 3, 3, 'FD');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(13);
                    doc.setTextColor(21, 128, 61);
                    doc.text(m.value, x + rCardW / 2, y + 11, { align: 'center' });
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(100, 116, 139);
                    doc.text(m.label.toUpperCase(), x + rCardW / 2, y + 18, { align: 'center' });
                });
                y += 32;

                // Payment status
                if (data.paymentStatusBreakdown.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(30, 41, 59);
                    doc.text('Payment Status:', margin, y);
                    let px = margin + 34;
                    data.paymentStatusBreakdown.forEach(p => {
                        const color = p._id === 'success' ? [16,185,129] : p._id === 'failed' ? [239,68,68] : [245,158,11];
                        doc.setFillColor(...color);
                        doc.roundedRect(px, y - 4, 0, 0, 0, 0, 'F');
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8);
                        doc.setTextColor(...color);
                        doc.text(`${p._id}: ${p.count}`, px, y);
                        px += 35;
                    });
                    y += 10;
                }
                y += 4;
            }

            // ── Rating Breakdown ─────────────────────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text('Rating Breakdown', margin, y);
            y += 2;
            doc.setDrawColor(99, 102, 241);
            doc.line(margin, y, margin + 45, y);
            y += 8;

            const ratingMax = Math.max(
                ...[5,4,3,2,1].map(r => (data.ratings.find(rt => rt._id === r)?.count ?? 0)), 1
            );

            [5, 4, 3, 2, 1].forEach(star => {
                const count = data.ratings.find(rt => rt._id === star)?.count ?? 0;
                const barMax = contentW - 38;
                const barW = (count / ratingMax) * barMax;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(245, 158, 11);
                doc.text(`${star} Stars`, margin, y + 4.5);

                doc.setFillColor(241, 245, 249);
                doc.roundedRect(margin + 14, y, barMax, 6, 2, 2, 'F');
                doc.setFillColor(245, 158, 11);
                if (barW > 0) doc.roundedRect(margin + 14, y, barW, 6, 2, 2, 'F');

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(String(count), margin + 14 + barMax + 3, y + 4.5);
                y += 10;
            });
            y += 6;

            // ── Enrollment Timeline ──────────────────────────────────────
            if (y > pageH - 60) { doc.addPage(); y = margin; }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text('Enrollment Timeline', margin, y);
            y += 2;
            doc.setDrawColor(99, 102, 241);
            doc.line(margin, y, margin + 50, y);
            y += 8;

            if (data.timeline.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text('No enrollment activity in the selected period.', margin, y);
                y += 10;
            } else {
                // table header
                doc.setFillColor(99, 102, 241);
                doc.rect(margin, y, contentW, 7, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.text('Date', margin + 4, y + 5);
                doc.text('New Enrollments', margin + contentW - 44, y + 5);
                y += 7;

                data.timeline.forEach((t, i) => {
                    if (y > pageH - 20) { doc.addPage(); y = margin; }
                    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
                    doc.rect(margin, y, contentW, 6.5, 'F');
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(30, 41, 59);
                    doc.text(t._id, margin + 4, y + 4.5);
                    doc.text(String(t.count), margin + contentW - 25, y + 4.5, { align: 'center' });
                    y += 6.5;
                });
            }

            // ── Footer on every page ────────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Skillvyn Analytics  •  ${data.title}  •  Page ${p} of ${totalPages}`,
                    pageW / 2, pageH - 7, { align: 'center' }
                );
            }

            const safeName = data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`${safeName}_analytics_report.pdf`);
            toast.success('Report exported successfully');
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast.error('Failed to export report');
        } finally {
            setIsExporting(false);
        }
    };

    // ── Loading / Error states ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Metrics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-2xl text-center max-w-lg">
                    <Shield className="mx-auto text-rose-500 mb-6" size={64} />
                    <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Access Restricted</h2>
                    <p className="text-slate-500 font-bold mb-8">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-8 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all uppercase tracking-widest text-xs"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── Chart data ─────────────────────────────────────────────────────────
    const isFree = data.isFree;
    const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

    // Build a unified date label set for enrollment + revenue timeline
    const allDates = [...new Set([
        ...data.timeline.map(t => t._id),
        ...data.revenueTimeline.map(r => r._id)
    ])].sort();

    const enrollmentChartData = {
        labels: allDates.length > 0 ? allDates : ['No Data'],
        datasets: [{
            label: 'New Enrollments',
            data: allDates.length > 0
                ? allDates.map(d => data.timeline.find(t => t._id === d)?.count ?? 0)
                : [0],
            borderColor: '#006CFA',
            backgroundColor: 'rgba(0, 108, 250, 0.08)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y'
        },
        ...(!isFree ? [{
            label: 'Revenue (INR)',
            data: allDates.length > 0
                ? allDates.map(d => data.revenueTimeline.find(r => r._id === d)?.revenue ?? 0)
                : [0],
            borderColor: '#05C4FE',
            backgroundColor: 'rgba(5, 196, 254, 0.08)',
            borderWidth: 2,
            borderDash: [5, 4],
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#10b981',
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'y1'
        }] : [])]
    };

    const statusChartData = {
        labels: data.statusDistribution.map(s => s._id.toUpperCase()),
        datasets: [{
            data: data.statusDistribution.map(s => s.count),
            backgroundColor: ['#05C4FE', '#f59e0b', '#ef4444', '#006CFA'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };

    const ratingChartData = {
        labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
        datasets: [{
            label: 'Reviews',
            data: [5, 4, 3, 2, 1].map(r => data.ratings.find(rt => rt._id === r)?.count ?? 0),
            backgroundColor: '#f59e0b',
            borderRadius: 12,
            barThickness: 24
        }]
    };

    const chartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: !isFree, labels: { boxWidth: 12, font: { weight: 'bold', size: 11 } } },
            tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8 }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { font: { weight: 'bold' } },
                title: { display: true, text: 'Enrollments', font: { weight: 'bold', size: 10 } }
            },
            ...(isFree ? {} : {
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        font: { weight: 'bold' },
                        callback: (v) => `₹${v.toLocaleString('en-IN')}`
                    },
                    title: { display: true, text: 'Revenue (INR)', font: { weight: 'bold', size: 10 } }
                }
            }),
            x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
        }
    };

    const presets = [
        { label: 'Last 7 Days',  days: 7,  key: 'last7' },
        { label: 'Last 30 Days', days: 30, key: 'last30' },
        { label: 'Last 90 Days', days: 90, key: 'last90' },
    ];

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen animate-in fade-in duration-700">
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white hover:bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">Performance Hub</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-slate-400 text-xs font-bold leading-none">{appliedLabel}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{data.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Filter */}
                    <div className="relative" ref={dateRef}>
                        <button
                            onClick={() => setShowDatePanel(v => !v)}
                            className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm transition-all ${
                                showDatePanel
                                    ? 'bg-primary text-white border-primary shadow-primary/20'
                                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Calendar size={15} />
                            {appliedLabel}
                            <ChevronDown size={14} className={`transition-transform ${showDatePanel ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showDatePanel && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.97, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/60 z-30 overflow-hidden"
                                >
                                    {/* Quick presets */}
                                    <div className="p-3 border-b border-slate-50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quick Select</p>
                                        <div className="flex flex-col gap-1">
                                            {presets.map(p => (
                                                <button
                                                    key={p.key}
                                                    onClick={() => applyPreset(p.days, p.label)}
                                                    className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                        activePreset === p.key
                                                            ? 'bg-primary text-white'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Custom range */}
                                    <div className="p-4">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Custom Range</p>
                                        <div className="flex flex-col gap-2 mb-3">
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From</label>
                                                <input
                                                    type="date"
                                                    value={customStart}
                                                    max={customEnd || toYMD(new Date())}
                                                    onChange={e => setCustomStart(e.target.value)}
                                                    className="w-full mt-1 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To</label>
                                                <input
                                                    type="date"
                                                    value={customEnd}
                                                    min={customStart || undefined}
                                                    max={toYMD(new Date())}
                                                    onChange={e => setCustomEnd(e.target.value)}
                                                    className="w-full mt-1 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={applyCustom}
                                            className="w-full py-2 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95"
                                        >
                                            Apply Range
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Export PDF */}
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Download size={16} className={isExporting ? 'animate-bounce' : ''} />
                        {isExporting ? 'Exporting...' : 'Export Report'}
                    </button>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10 mt-6">
                {[
                    { label: 'Total Students',  value: data.stats.totalStudents,                    icon: Users,        color: 'text-primary',    bg: 'bg-primary/10' },
                    { label: 'Avg Progress',    value: `${Math.round(data.stats.avgProgress)}%`,    icon: TrendingUp,   color: 'text-accent',     bg: 'bg-accent/10' },
                    { label: 'Success Rate',    value: `${Math.round(data.stats.completionRate)}%`, icon: Award,        color: 'text-secondary',  bg: 'bg-secondary/10' },
                    { label: 'Platform Rating', value: data.stats.avgRating,                        icon: Star,         color: 'text-amber-500',   bg: 'bg-amber-50' },
                    {
                        label: isFree ? 'Course Type' : 'Total Revenue',
                        value: isFree ? 'Free' : fmtINR(data.stats.totalRevenue),
                        icon: IndianRupee,
                        color: isFree ? 'text-slate-400' : 'text-accent',
                        bg: isFree ? 'bg-slate-100' : 'bg-accent/10'
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-7 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:scale-[1.02] transition-all"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`${stat.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform inner-shadow`}>
                                <stat.icon size={26} className={stat.color} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Revenue sub-stats row (paid courses only) */}
            {!isFree && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Paid Transactions', value: data.stats.totalTransactions },
                        { label: 'Avg Revenue / Student',   value: fmtINR(data.stats.avgRevenuePerStudent) },
                        ...data.paymentStatusBreakdown.map(p => ({
                            label: `${p._id.charAt(0).toUpperCase() + p._id.slice(1)} Payments`,
                            value: p.count,
                            accent: p._id === 'success' ? 'text-accent' : p._id === 'failed' ? 'text-rose-500' : 'text-amber-500'
                        }))
                    ].map((item, i) => (
                        <div key={i} className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                            <span className={`text-lg font-black ${item.accent || 'text-slate-900'}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="font-black text-slate-800 tracking-tight text-lg">Enrollment{!isFree ? ' & Revenue' : ''} Momentum</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Growth velocity over timeline</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enrollments</span>
                            </div>
                            {!isFree && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <Line data={enrollmentChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <h3 className="font-black text-slate-800 tracking-tight text-lg mb-6">Student Status</h3>
                        <div className="h-[220px] mb-6 flex items-center justify-center relative">
                            <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            <div className="absolute flex flex-col items-center">
                                <p className="text-2xl font-black text-slate-900 leading-none">{data.stats.totalStudents}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Total</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {data.statusDistribution.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${['bg-accent','bg-amber-500','bg-rose-500','bg-primary'][i % 4]}`}></div>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{s._id}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <h3 className="font-black text-slate-800 tracking-tight text-lg mb-6">Feedback Spectrum</h3>
                        <div className="h-[200px]">
                            <Bar
                                data={ratingChartData}
                                options={{
                                    indexAxis: 'y',
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { display: false }, ticks: { font: { weight: 'black' } } },
                                        x: { grid: { display: false }, ticks: { display: false } }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseAnalytics;