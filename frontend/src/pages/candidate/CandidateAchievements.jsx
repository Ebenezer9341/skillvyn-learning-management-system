import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, ExternalLink, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CandidateAchievements = () => {
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const response = await api.get('/api/enrollments/my-enrollments');
                const earnedCerts = response.data.data.enrollments
                    .filter(en => en.certificationTracking?.isCertified)
                    .map(en => ({
                        id: en.course._id,
                        title: en.course.title,
                        description: en.course.description,
                        date: new Date(en.certificationTracking.issuedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }),
                        instructor: `${en.course.instructor.firstName} ${en.course.instructor.lastName}`,
                        category: en.course.category,
                        bgLight: 'bg-indigo-50',
                        textColor: 'text-indigo-600'
                    }));
                setCertificates(earnedCerts);
            } catch (err) {
                console.error('Failed to load achievements');
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Certification Vault</h1>
                <p className="text-slate-500 mt-2 font-medium">Your collection of earned credentials and academic milestones.</p>
            </header>

            {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((cert, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={cert.id}
                            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden"
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-50 opacity-50 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl shadow-indigo-100">
                                    <Award size={32} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                    Verified
                                </span>
                            </div>
                            
                            <div className="relative z-10 flex-1 flex flex-col">
                                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {cert.title}
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
                                    Certified by {cert.instructor}
                                </p>
                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-8">
                                    {cert.description}
                                </p>

                                <div className="mt-auto">
                                    <div className="flex items-center justify-between py-4 border-y border-slate-50 mb-6">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awarded</span>
                                        <span className="text-sm font-black text-slate-700">{cert.date}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => navigate(`/courses/certificate/${cert.id}`)}
                                            className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors border border-slate-100"
                                        >
                                            <ExternalLink size={14} />
                                            <span>View</span>
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/courses/certificate/${cert.id}`)}
                                            className="flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                        >
                                            <Download size={14} />
                                            <span>PDF</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-slate-100 rounded-[3rem] p-20 text-center flex flex-col items-center justify-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                        <Award size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">The Vault is Empty</h3>
                    <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                        Complete your course curriculum and pass the final assessments to unlock your official digital certificates.
                    </p>
                    <button 
                        onClick={() => navigate('/candidate')}
                        className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                    >
                        Browse Courses
                    </button>
                </div>
            )}
        </div>
    );
};

export default CandidateAchievements;