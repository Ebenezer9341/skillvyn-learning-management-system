import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ReceiptText,
    Download,
    BookOpen,
    CheckCircle2,
    IndianRupee,
    Calendar,
    Hash,
    Loader2,
    ShoppingBag,
    ChevronLeft,
    User
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Logo for invoice
import logo from '../../assets/images/Skillvyn logo/PNG/horizontal.png';

const StudentInvoices = () => {
    const { candidateId } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);
    const invoiceRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [candidateId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/transactions/candidate/${candidateId}`);
            const txs = res.data.data.transactions;
            setTransactions(txs);
            
            // If we have transactions, we can get candidate info from those
            if (txs.length > 0) {
                setCandidate(txs[0].candidate);
            } else {
                // Fallback: Try fetching user details only if role permits, 
                // or we are simply showing 'Candidate'
                try {
                    const userRes = await api.get(`/api/users/${candidateId}`);
                    setCandidate(userRes.data.data.user);
                } catch (e) {
                    setCandidate({ firstName: 'Selected', lastName: 'Candidate' });
                }
            }
        } catch (err) {
            toast.error('Failed to load billing information');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = async (tx) => {
        const toastId = toast.loading('Generating PDF invoice...');
        setSelectedTx(tx);
        
        setTimeout(async () => {
            try {
                const invoiceElement = invoiceRef.current;
                if (!invoiceElement) throw new Error('Invoice element not found');

                const canvas = await html2canvas(invoiceElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Skillvyn_Invoice_${tx.invoiceNumber}.pdf`);
                
                toast.update(toastId, { 
                    render: 'Invoice downloaded successfully!', 
                    type: 'success', 
                    isLoading: false, 
                    autoClose: 3000 
                });
            } catch (err) {
                console.error('PDF Generation Error:', err);
                toast.update(toastId, { 
                    render: 'Failed to generate PDF invoice', 
                    type: 'error', 
                    isLoading: false, 
                    autoClose: 3000 
                });
            } finally {
                setSelectedTx(null);
            }
        }, 500);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-slate-400 font-black mt-4 text-xs uppercase tracking-[0.2em]">Loading Invoices...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-10">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-6 text-xs font-black uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Go Back
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/5 text-secondary flex items-center justify-center shadow-inner-sm">
                                <ReceiptText size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 leading-tight">Billing & Invoices</h1>
                                <p className="text-slate-400 font-bold mt-1 text-sm flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    Candidate: <span className="text-slate-900">{candidate?.firstName} {candidate?.lastName}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Purchases</p>
                                <p className="text-xl font-black text-slate-900">{transactions.length}</p>
                             </div>
                             <div className="w-px h-8 bg-slate-200 mx-2" />
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lifetime Value</p>
                                <p className="text-xl font-black text-primary flex items-center gap-1">
                                    <IndianRupee size={16} strokeWidth={3} />
                                    {transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0).toLocaleString()}
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10">
                {transactions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-24 text-center shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100">
                            <ShoppingBag size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">No Transactions Found</h3>
                        <p className="text-slate-400 font-medium mt-2 text-sm max-w-sm mx-auto italic">
                            This candidate hasn't made any course purchases yet. 
                            All generated invoices will appear here once a transaction is completed.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {transactions.map((tx, i) => (
                            <motion.div
                                key={tx._id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl hover:shadow-primary/5 transition-all"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner-sm">
                                    {tx.course?.thumbnail ? (
                                        <img src={tx.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <BookOpen size={28} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 tracking-tight group-hover:text-primary transition-colors">{tx.course?.title}</h3>
                                    <div className="flex items-center justify-center md:justify-start flex-wrap gap-x-6 gap-y-2">
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Hash size={12} className="text-slate-300" /> {tx.invoiceNumber}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} className="text-slate-300" /> {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-0.5 rounded-md border border-accent/10">
                                            <CheckCircle2 size={12} /> Success
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center md:text-right flex-shrink-0 px-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Paid</p>
                                    <p className="text-2xl font-black text-slate-900 flex items-center justify-center md:justify-end gap-1">
                                        <IndianRupee size={18} strokeWidth={3} className="text-slate-400" />
                                        {tx.amount?.toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => downloadInvoice(tx)}
                                    className="w-full md:w-auto px-8 h-14 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:bg-primary shadow-lg shadow-secondary/10 active:scale-95"
                                >
                                    <Download size={16} />
                                    Generate PDF
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden Invoice Template for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div 
                    ref={invoiceRef} 
                    style={{ 
                        width: '794px', 
                        padding: '60px',
                        backgroundColor: 'white',
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    {selectedTx && (
                        <div style={{ color: '#1e293b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
                                <div>
                                    <img src={logo} alt="Skillvyn Logo" style={{ height: '45px', marginBottom: '8px' }} />
                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Learning Platform Invoice
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', color: '#94a3b8', marginBottom: '4px' }}>Invoice</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>{selectedTx.invoiceNumber}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Billed To</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{selectedTx.billingDetails?.name || `${candidate?.firstName} ${candidate?.lastName}`}</div>
                                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedTx.billingDetails?.email || candidate?.email}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Transaction Details</div>
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>
                                        {new Date(selectedTx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>ID: {selectedTx.paymentId}</div>
                                </div>
                            </div>

                            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '40px', marginBottom: '40px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Course Purchased</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b' }}>{selectedTx.course?.title}</div>
                                        <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedTx.course?.category} • Lifetime Course Access</div>
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>₹{selectedTx.amount?.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', marginBottom: '4px' }}>Total Amount Paid</div>
                                    <div style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '24px' }}>₹</span>{selectedTx.amount?.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ background: '#f0f9ff', color: '#006CFA', padding: '10px 20px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', border: '1px solid #e0f2fe' }}>
                                    ✓ Payment Successful
                                </div>
                            </div>

                            <div style={{ marginTop: '80px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                                <div>Thank you for choosing Skillvyn!</div>
                                <div style={{ marginTop: '8px' }}>This is a computer-generated invoice. For support, reach out to help@skillvyn.com</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentInvoices;
