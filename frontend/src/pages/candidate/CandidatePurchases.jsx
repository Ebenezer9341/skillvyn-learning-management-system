import React, { useState, useEffect, useRef } from 'react';
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
    ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Components & Assests
import PriceDisplay from '../../components/ui/PriceDisplay';

// Logo for invoice
import logo from '../../assets/images/Skillvyn logo/PNG/horizontal.png';

const CandidatePurchases = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);
    const invoiceRef = useRef(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/api/transactions/my');
            setTransactions(res.data.data.transactions);
        } catch {
            toast.error('Failed to load purchase history');
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = async (tx) => {
        const toastId = toast.loading('Generating your PDF invoice...');
        setSelectedTx(tx);
        
        // Brief delay to ensure state update and DOM render of the hidden invoice template
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
                
                // Use a Blob and hidden link for a more "silent" download experience
                // which often avoids browsers automatically opening the PDF
                const blob = pdf.output('blob');
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Skillvyn_Invoice_${tx.invoiceNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                toast.update(toastId, { 
                    render: 'Invoice downloaded as PDF!', 
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
                <p className="text-slate-400 font-bold mt-4 text-sm uppercase tracking-widest">Loading Purchases...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-8 py-12">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Purchase History</h1>
                            <p className="text-slate-400 font-medium text-sm">All your course purchases & invoices in one place</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-auto mx-auto px-8 py-10">
                {transactions.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-inner">
                            <ReceiptText size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-300 tracking-tight">No Purchases Yet</h3>
                        <p className="text-slate-400 font-medium mt-2 text-sm">Your course purchase history will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx, i) => (
                            <motion.div
                                key={tx._id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 transition-all overflow-hidden group"
                            >
                                <div className="p-8 flex items-center gap-6">
                                    {/* Course Thumbnail */}
                                    <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 overflow-hidden border border-primary/10 inner-shadow">
                                        {tx.course?.thumbnail ? (
                                            <img src={tx.course.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOpen size={28} />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-slate-900 text-lg leading-tight truncate mb-2">{tx.course?.title}</h3>
                                        <div className="flex items-center flex-wrap gap-4">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Hash size={12} /> {tx.invoiceNumber}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar size={12} /> {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                <CheckCircle2 size={12} /> Paid
                                            </span>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right flex-shrink-0 mr-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                        <PriceDisplay 
                                            price={tx.amount} 
                                            size="normal"
                                            className="items-end"
                                        />
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => downloadInvoice(tx)}
                                        className="flex-shrink-0 h-14 px-6 bg-slate-50 hover:bg-primary hover:text-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-100 group-hover:border-transparent"
                                    >
                                        <Download size={16} />
                                        <span>Invoice</span>
                                    </button>
                                </div>
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
                        width: '794px', // A4 Width at 96 DPI
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
                                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>{selectedTx.billingDetails?.name || 'Candidate Name'}</div>
                                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedTx.billingDetails?.email}</div>
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
                                <div style={{ background: '#ecfdf5', color: '#059669', padding: '10px 20px', borderRadius: '100px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', border: '1px solid #d1fae5' }}>
                                    ✓ Payment Successful
                                </div>
                            </div>

                            <div style={{ marginTop: '80px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
                                <div>Thank you for choosing Skillvyn to advance your skills!</div>
                                <div style={{ marginTop: '8px' }}>This is a computer-generated invoice. For support, reach out to help@skillvyn.com</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidatePurchases;
