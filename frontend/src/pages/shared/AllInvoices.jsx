import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ReceiptText,
    Download,
    Search,
    Filter,
    BookOpen,
    CheckCircle2,
    IndianRupee,
    Calendar,
    Hash,
    Loader2,
    TrendingUp,
    Users,
    ChevronDown,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Logo for invoice
import logo from '../../assets/images/Skillvyn logo/PNG/horizontal.png';

const AllInvoices = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const invoiceRef = useRef(null);

    useEffect(() => {
        fetchAllInvoices();
    }, []);

    const fetchAllInvoices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/transactions');
            setTransactions(response.data.data.transactions);
            setStats(response.data.data.stats);
        } catch (err) {
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = async (tx) => {
        const toastId = toast.loading('Generating PDF...');
        setSelectedTx(tx);
        
        setTimeout(async () => {
            try {
                if (!invoiceRef.current) throw new Error('Preview element not ready');
                const canvas = await html2canvas(invoiceRef.current, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Skillvyn_Invoice_${tx.invoiceNumber}.pdf`);
                toast.update(toastId, { render: 'Invoice downloaded!', type: 'success', isLoading: false, autoClose: 2000 });
            } catch (err) {
                toast.update(toastId, { render: 'Failed to generate PDF', type: 'error', isLoading: false, autoClose: 2000 });
            } finally {
                setSelectedTx(null);
            }
        }, 500);
    };

    const filteredTransactions = transactions.filter(tx => {
        const search = searchQuery.toLowerCase();
        const matchesSearch = 
            tx.invoiceNumber?.toLowerCase().includes(search) ||
            tx.course?.title?.toLowerCase().includes(search) ||
            `${tx.candidate?.firstName} ${tx.candidate?.lastName}`.toLowerCase().includes(search) ||
            tx.candidate?.email?.toLowerCase().includes(search);
        
        const matchesStatus = filterStatus === 'All' || tx.status === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <p className="text-slate-400 font-black mt-4 text-[10px] uppercase tracking-[0.2em]">Synchronizing Revenue Data...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finances & Billing</h1>
                <p className="text-slate-500 font-medium text-sm mt-1">Monitor all platform revenue and manage student invoices</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center inner-shadow">
                            <IndianRupee size={24} strokeWidth={2.5} />
                        </div>
                        <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</h3>
                    <p className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
                        <IndianRupee size={18} strokeWidth={3} className="text-slate-300" />
                        {stats?.totalRevenue?.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center inner-shadow">
                            <ReceiptText size={24} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Transactions</h3>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stats?.successCount}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center inner-shadow">
                            <Users size={24} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Payers</h3>
                    <p className="text-2xl font-black text-slate-900 mt-1">{[...new Set(transactions.map(t => t.candidate?._id))].length}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center inner-shadow">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Order Value</h3>
                    <p className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
                        <IndianRupee size={18} strokeWidth={3} className="text-slate-300" />
                        {stats?.avgTransaction}
                    </p>
                </div>
            </div>

            {/* Filter & Table Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by invoice #, candidate name, or course title..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl border-none text-sm font-medium focus:ring-4 focus:ring-indigo-100/50 transition-all placeholder:text-slate-300 inner-shadow"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                             <Filter size={14} className="text-slate-400" />
                             <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-0 outline-none cursor-pointer"
                             >
                                <option>All Status</option>
                                <option>Success</option>
                                <option>Pending</option>
                                <option>Failed</option>
                             </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Purchased</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Paid</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{tx.invoiceNumber}</p>
                                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    <Calendar size={10} /> {new Date(tx.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button 
                                            onClick={() => navigate(`/${user.role}/invoices/${tx.candidate?._id}`)}
                                            className="text-left group/name cursor-pointer"
                                        >
                                            <p className="text-sm font-black text-slate-900 group-hover/name:text-indigo-600 transition-colors cursor-pointer">{tx.candidate?.firstName} {tx.candidate?.lastName}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 group-hover/name:text-slate-500 transition-colors cursor-pointer">{tx.candidate?.email}</p>
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0 overflow-hidden">
                                                {tx.course?.thumbnail ? (
                                                    <img src={tx.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : <BookOpen size={14} />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{tx.course?.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-slate-900 flex items-center gap-1">
                                            <IndianRupee size={12} strokeWidth={3} className="text-slate-300" />
                                            {tx.amount?.toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                            tx.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            <CheckCircle2 size={12} />
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => downloadInvoice(tx)}
                                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-xl transition-all group-hover:shadow-sm shadow-indigo-100 active:scale-95"
                                            title="Download PDF Invoice"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="py-24 text-center">
                            <ReceiptText size={48} className="mx-auto text-slate-100 mb-4" strokeWidth={1} />
                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No matching invoices found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Invoice Preview Component */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={invoiceRef} style={{ width: '794px', padding: '60px', backgroundColor: 'white' }}>
                    {selectedTx && (
                        <div style={{ color: '#1e293b', fontFamily: "'Inter', sans-serif" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
                                <div>
                                    <img src={logo} alt="Logo" style={{ height: '40px', marginBottom: '8px' }} />
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Billing Portal</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8' }}>Official Invoice</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900' }}>#{selectedTx.invoiceNumber}</div>
                                </div>
                            </div>
                            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '50px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Payer Details</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900' }}>{selectedTx.candidate?.firstName} {selectedTx.candidate?.lastName}</div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>{selectedTx.candidate?.email}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Date Issued</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900' }}>{new Date(selectedTx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>TxID: {selectedTx.paymentId}</div>
                                </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '20px', marginBottom: '40px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>Line Item</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: '900' }}>{selectedTx.course?.title}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedTx.course?.category} • Fully Enrolled</div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '900' }}>₹{selectedTx.amount?.toLocaleString()}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f1f5f9', paddingTop: '30px' }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Total Amount Paid</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900' }}>₹{selectedTx.amount?.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px 20px', borderRadius: '100px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>✓ Paid In Full</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllInvoices;
