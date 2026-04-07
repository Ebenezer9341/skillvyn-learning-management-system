import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    BarChart3,
    Trophy,
    BookOpen,
    LayoutDashboard,
    Loader2
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

const PlatformInsights = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const fetchGlobalAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/courses/global-stats');
            setData(response.data.data);
        } catch (err) {
            console.error('Platform Insights Fetch Error:', err);
            setError(err.response?.data?.message || 'Failed to load platform global stats');
            toast.error('Unable to synchronize platform matrix');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalAnalytics();
    }, []);

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
            doc.setFillColor(0, 25, 136); // brand secondary (#001988)
            doc.rect(0, 0, pageW, 45, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text('Platform Performance Report', margin, 18);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 26);
            doc.setFontSize(10);
            doc.text(`Requester: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.role.toUpperCase()})`, margin, 32);
            y = 55;

            // ── Key Metrics Overview ──────────────────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text('Key Platform Metrics', margin, y);
            y += 2;
            doc.setDrawColor(0, 108, 250); // brand primary (#006CFA)
            doc.setLineWidth(0.8);
            doc.line(margin, y, margin + 40, y);
            y += 10;

            const metrics = [
                { label: 'Total Revenue',    value: `Rs. ${data.overview.totalRevenue.toLocaleString()}` },
                { label: 'Total Enrollments', value: String(data.overview.totalEnrollments) },
                { label: 'Total Modules',    value: String(data.overview.totalCourses) },
                { label: 'Avg User Rating',  value: String(data.overview.avgRating) },
            ];
            
            const cardW = (contentW - 9) / 4;
            metrics.forEach((m, i) => {
                const x = margin + i * (cardW + 3);
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.3);
                doc.roundedRect(x, y, cardW, 25, 4, 4, 'FD');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setTextColor(30, 41, 59);
                doc.text(m.value, x + cardW / 2, y + 12, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(m.label.toUpperCase(), x + cardW / 2, y + 20, { align: 'center' });
            });
            y += 35;

            // ── Top Performing Curriculum (Revenue) ────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text('Top Performance: Revenue Leaderboard', margin, y);
            y += 10;

            doc.setFillColor(241, 245, 249);
            doc.rect(margin, y, contentW, 8, 'F');
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text('Curriculum Title', margin + 4, y + 5.5);
            doc.text('Revenue', margin + contentW - 55, y + 5.5);
            doc.text('Sales', margin + contentW - 20, y + 5.5);
            y += 8;

            data.leaderboards.byRevenue.forEach((c, i) => {
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.text(c.title, margin + 4, y + 6);
                doc.setFont('helvetica', 'normal');
                doc.text(`Rs. ${c.revenue.toLocaleString()}`, margin + contentW - 55, y + 6);
                doc.text(String(c.salesCount), margin + contentW - 20, y + 6);
                doc.setDrawColor(241, 245, 249);
                doc.line(margin, y + 9, margin + contentW, y + 9);
                y += 10;
            });
            y += 10;

            // ── Category Distribution ─────────────────────────────────────
            if (y > pageH - 80) { doc.addPage(); y = margin + 10; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Market Category Distribution', margin, y);
            y += 10;

            const totalEnrols = data.overview.totalEnrollments || 1;
            data.categoryBreakdown.forEach((cat, i) => {
                const pct = Math.round((cat.enrollments / totalEnrols) * 100);
                const barW = (pct / 100) * (contentW - 60);

                doc.setFontSize(9);
                doc.setTextColor(30, 41, 59);
                doc.text(cat._id, margin, y + 5);
                
                doc.setFillColor(241, 245, 249);
                doc.roundedRect(margin + 40, y, (contentW - 60), 6, 2, 2, 'F');
                doc.setFillColor(0, 108, 250); // brand primary
                if (barW > 0) doc.roundedRect(margin + 40, y, barW, 6, 2, 2, 'F');
                
                doc.setTextColor(100, 116, 139);
                doc.text(`${cat.enrollments} enrols (${pct}%)`, margin + 40 + (contentW - 60) + 2, y + 5);
                y += 10;
            });

            // ── Footer ───────────────────────────────────────────────────
            const totalPages = doc.internal.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`Skillvyn Internal Platform Report  •  Page ${p} of ${totalPages}`, pageW / 2, pageH - 10, { align: 'center' });
            }

            doc.save(`skillvyn_platform_insights_${new Date().getTime()}.pdf`);
            toast.success('Platform matrix exported successfully');
        } catch (err) {
            console.error('PDF Export Error:', err);
            toast.error('Failed to export platform report');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-8 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BarChart3 className="text-primary animate-pulse" size={24} />
                    </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Aggregating Global Matrix</h3>
                <p className="text-slate-400 font-bold text-sm">Processing millions of platform data points...</p>
            </div>
        );
    }

    if (error) return (
        <div className="p-12 text-center">
            <Shield className="mx-auto text-rose-500 mb-4" size={48} />
            <h2 className="text-2xl font-black text-slate-800">Authorization Failure</h2>
            <p className="text-slate-500 mt-2">{error}</p>
        </div>
    );

    // ── Chart Preparation ─────────────────────────────────────────────────
    const growthChartData = {
        labels: data.timelines.enrollment.map(t => t._id),
        datasets: [
            {
                label: 'Enrollment Growth',
                data: data.timelines.enrollment.map(t => t.count),
                borderColor: '#006CFA',
                backgroundColor: 'rgba(0, 108, 250, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#006CFA',
                pointBorderWidth: 2
            }
        ]
    };

    const categoryChartData = {
        labels: data.categoryBreakdown.map(c => c._id),
        datasets: [{
            data: data.categoryBreakdown.map(c => c.enrollments),
            backgroundColor: [
                '#006CFA', '#05C4FE', '#001988', '#0055C4', '#1E40AF', '#1e1b4b', '#475569'
            ],
            borderWidth: 0,
            hoverOffset: 20
        }]
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-4 bg-white text-slate-400 rounded-2xl border border-slate-100 shadow-xl hover:text-primary transition-all active:scale-90"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
                                <Shield size={10} /> Administrative Command Center
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            <span className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Scale: Global</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Platform Insights Overview
                            <span className="text-slate-200 font-thin">|</span>
                            <span className="text-slate-400 text-lg font-bold">Q1 2026 Metrics</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        {isExporting ? 'Generating Analysis...' : 'Export Platform Report'}
                    </button>
                </div>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Platform Revenue', value: `₹${data.overview.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-accent', bg: 'bg-accent/5' },
                    { label: 'Global Students', value: data.overview.totalEnrollments.toLocaleString(), icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Active Modules', value: data.overview.totalCourses, icon: BookOpen, color: 'text-secondary', bg: 'bg-secondary/5' },
                    { label: 'Platform Rating', value: `${data.overview.avgRating} / 5`, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`${stat.bg} p-4 rounded-2xl group-hover:rotate-12 transition-transform duration-500 inner-shadow`}>
                                <stat.icon size={28} className={stat.color} />
                            </div>
                            <TrendingUp size={20} className="text-slate-100 group-hover:text-emerald-100 transition-colors" />
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{stat.label}</h3>
                        <p className="text-3xl font-black text-slate-900 leading-tight">{stat.value}</p>
                        
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12">
                            <stat.icon size={120} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 bg-white p-10 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform Growth Momentum</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Last 30 Days Acquisition Timeline</p>
                        </div>
                        <div className="px-5 py-2.5 bg-slate-50 rounded-2xl flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enrollments</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <Line
                            data={growthChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { cornerRadius: 10, padding: 15 } },
                                scales: { 
                                    y: { grid: { color: '#f1f5f9' }, ticks: { font: { weight: 'bold' } } },
                                    x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col items-center">
                    <h2 className="w-full text-xl font-black text-slate-900 tracking-tight text-center mb-10">Market Share by Category</h2>
                    <div className="w-full h-[300px] mb-10 relative flex items-center justify-center">
                        <Doughnut
                            data={categoryChartData}
                            options={{ 
                                cutout: '75%', 
                                maintainAspectRatio: false, 
                                plugins: { legend: { display: false } } 
                            }}
                        />
                        <div className="absolute flex flex-col items-center">
                            <p className="text-3xl font-black text-slate-900 leading-none">{data.categoryBreakdown.length}</p>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">Niche Segments</p>
                        </div>
                    </div>
                    <div className="w-full space-y-3">
                        {data.categoryBreakdown.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100/50 rounded-2xl hover:scale-105 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryChartData.datasets[0].backgroundColor[idx % 7] }}></div>
                                    <span className="text-xs font-black text-slate-700">{cat._id}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">{(cat.enrollments / data.overview.totalEnrollments * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Leaderboard */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-10 border-b border-slate-50">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Trophy className="text-amber-500" size={24} />
                            Revenue Titans
                        </h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Top 5 Curriculums by lifetime earnings</p>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {data.leaderboards.byRevenue.map((course, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ x: 10 }}
                                    className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white border hover:border-emerald-100 hover:shadow-lg rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-200 overflow-hidden group-hover:scale-110 transition-transform">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={24} /></div>
                                                )}
                                            </div>
                                            <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-white text-[10px] font-black">
                                                #{i + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 tracking-tight leading-tight group-hover:text-accent transition-colors">{course.title}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{course.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right pr-4">
                                        <div className="flex items-center justify-end gap-1.5 text-lg font-black text-slate-900">
                                            <IndianRupee size={14} className="text-slate-400" />
                                            {course.revenue.toLocaleString()}
                                        </div>
                                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1.5">{course.salesCount} Pure Sales</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enrollment Leaderboard */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-10 border-b border-slate-50">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <TrendingUp className="text-blue-500" size={24} />
                            Student Favorites
                        </h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Top 5 Curriculums by user acquisition</p>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {data.leaderboards.byEnrollment.map((course, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ x: -10 }}
                                    className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white border hover:border-blue-100 hover:shadow-lg rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-200 overflow-hidden group-hover:scale-110 transition-transform">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><BookOpen size={24} /></div>
                                                )}
                                            </div>
                                            <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary border-4 border-white flex items-center justify-center text-white text-[10px] font-black">
                                                #{i + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors">{course.title}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{course.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right pr-4">
                                        <div className="flex items-center justify-end gap-2 text-lg font-black text-slate-900">
                                            <Users size={16} className="text-slate-400" />
                                            {course.enrollmentCount.toLocaleString()}
                                        </div>
                                        <div className="flex items-center justify-end gap-1 mt-1.5">
                                            <Star size={10} className="text-amber-500 fill-amber-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.averageRating} / 5</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Health Badge */}
            <div className="mt-12 p-8 bg-secondary rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="relative z-10">
                    <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase tracking-widest">Platform Resilience Score: Optimal</h3>
                    <p className="text-slate-400 text-sm font-bold">All systems operating within performance thresholds. Global synchronization complete.</p>
                </div>
                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    <div className="flex -space-x-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-700 flex items-center justify-center">
                                <Users size={16} className="text-slate-400" />
                            </div>
                        ))}
                    </div>
                    <p className="text-white font-black text-xs uppercase tracking-widest">Global Watchtower Active</p>
                </div>
                
                <LayoutDashboard className="absolute -bottom-10 -right-10 text-white opacity-5 rotate-12" size={300} />
            </div>
        </div>
    );
};

export default PlatformInsights;
