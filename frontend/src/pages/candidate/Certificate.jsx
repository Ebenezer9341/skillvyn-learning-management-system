import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Award, 
    Download, 
    Printer, 
    ArrowLeft,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import logo_horizontal from '../../assets/images/Skillvyn logo/PNG/horizontal.png';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useRef } from 'react';

const Certificate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const certificateRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchCertificateData = async () => {
            try {
                const response = await api.get(`/api/courses/${id}`);
                const { course, enrollment } = response.data.data;
                
                if (!enrollment?.certificationTracking?.isCertified) {
                    toast.error('Certificate not yet earned');
                    navigate(`/courses/certification/${id}`);
                    return;
                }

                setData({
                    studentName: `${enrollment.candidate.firstName} ${enrollment.candidate.lastName}`,
                    courseTitle: course.title,
                    instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`,
                    issueDate: new Date(enrollment.certificationTracking.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    certificateId: enrollment.certificationTracking.certificateId || enrollment._id.toString().toUpperCase().substring(0, 12)
                });
            } catch (err) {
                toast.error('Failed to load certificate');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificateData();
    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        setDownloading(true);
        
        try {
            const element = certificateRef.current;
            
            // Wait a tiny bit to ensure no animations are running
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
                scale: 2, // 2x is plenty for a 1200px container
                useCORS: true,
                logging: false,
                allowTaint: false,
                backgroundColor: '#ffffff',
                imageTimeout: 15000, // 15s timeout for images
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is visible
                    const clonedElement = clonedDoc.getElementById('certificate-content');
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.animation = 'none';
                    }
                }
            });
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // Calculate PDF dimensions (Landscape)
            const width = canvas.width;
            const height = canvas.height;
            const orientation = width > height ? 'l' : 'p';
            
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'px',
                format: [width, height],
                hotfixes: ['px_scaling']
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`Skillvyn_Certificate_${data.studentName.replace(/\s+/g, '_')}.pdf`);
            toast.success('Certificate downloaded successfully!');
        } catch (err) {
            console.error('PDF Generation Error:', err);
            toast.error('Failed to generate PDF. Please use the Print option.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Authenticating Certificate...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4 candidate-certificate-page">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8 no-print">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all"
                    >
                        <ArrowLeft size={20} /> Back to Hub
                    </button>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button 
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] shadow-2xl overflow-hidden relative border-[16px] border-slate-50 p-1"
                >
                    <div 
                        ref={certificateRef}
                        id="certificate-content"
                        className="border-[2px] rounded-[1.5rem] p-16 relative overflow-hidden text-center space-y-12 bg-white"
                        style={{ borderColor: '#e2e8f0' }}
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" style={{ backgroundColor: '#eef2ff' }} />
                        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full -ml-48 -mb-48 blur-3xl opacity-50" style={{ backgroundColor: '#eff6ff' }} />
                        
                        <div className="relative z-10 space-y-12">
                            <div className="flex flex-col items-center gap-6">
                                <img src={logo_horizontal} alt="Skillvyn Academy" className="h-20 w-auto opacity-90" />
                            </div>

                            <div className="space-y-4">
                                <p className="font-black uppercase tracking-[0.4em] text-xs" style={{ color: '#4f46e5' }}>Certificate of Completion</p>
                                <h1 className="text-2xl font-medium italic" style={{ color: '#64748b' }}>This is to certify that</h1>
                                <div className="py-4">
                                    <h2 className="text-6xl font-black tracking-tight underline underline-offset-8" style={{ color: '#0f172a', textDecorationColor: 'rgba(79, 70, 229, 0.2)' }}>{data.studentName}</h2>
                                </div>
                                <h3 className="text-xl font-medium italic" style={{ color: '#64748b' }}>has successfully completed the course</h3>
                                <div className="inline-block px-8 py-3 text-white rounded-full font-black text-2xl mt-4 shadow-xl" style={{ backgroundColor: '#0f172a' }}>
                                    {data.courseTitle}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 items-end">
                                <div className="space-y-4 text-center">
                                    <div className="h-[1px] w-full mb-4" style={{ backgroundColor: '#e2e8f0' }} />
                                    <p className="font-black" style={{ color: '#0f172a' }}>{data.instructorName}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Lead Instructor</p>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full flex items-center justify-center relative bg-white shadow-inner" style={{ border: '8px solid #f0f4ff' }}>
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: '#c7d2fe' }}>
                                            <Award size={48} style={{ color: '#4f46e5' }} />
                                        </div>
                                        <div className="absolute -bottom-2 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: '#4f46e5' }}>VERIFIED</div>
                                    </div>
                                </div>

                                <div className="space-y-4 text-center">
                                    <div className="h-[1px] w-full mb-4" style={{ backgroundColor: '#e2e8f0' }} />
                                    <p className="font-black" style={{ color: '#0f172a' }}>{data.issueDate}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Date of Achievement</p>
                                </div>
                            </div>

                            <div className="pt-20 flex flex-col items-center gap-2 border-t" style={{ borderTopColor: '#f8fafc' }}>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                                    <ShieldCheck size={12} /> Certificate ID: {data.certificateId}
                                </p>
                                <p className="text-[9px] max-w-md italic" style={{ color: '#94a3b8' }}>
                                    This certificate is authentic and can be verified on the official Skillvyn Academy certification portal.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .candidate-certificate-page { padding: 0 !important; }
                    .max-w-5xl { max-width: 100% !important; }
                    .shadow-2xl { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
};

export default Certificate;
