import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Award, 
    CheckCircle2, 
    ChevronRight, 
    HelpCircle, 
    Github, 
    ExternalLink, 
    AlertCircle, 
    Clock, 
    Loader2,
    ArrowLeft,
    Trophy,
    Check,
    Download,
    FileText
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const CertificationHub = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // MCQ State
    const [answers, setAnswers] = useState({});
    const [examSubmitted, setExamSubmitted] = useState(false);
    const [examResult, setExamResult] = useState(null);

    // Project State
    const [projectUrl, setProjectUrl] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/api/courses/${id}`);
                setCourse(response.data.data.course);
                setEnrollment(response.data.data.enrollment);
            } catch (err) {
                toast.error('Failed to load certification details');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleSubmitExam = async () => {
        if (Object.keys(answers).length < (course.certification.questions?.length || 0)) {
            return toast.warning('Please answer all questions before submitting');
        }

        setSubmitting(true);
        try {
            const response = await api.post('/api/enrollments/submit-exam', {
                courseId: id,
                answers
            });
            setExamSubmitted(true);
            setExamResult(response.data.data);
            setEnrollment(prev => ({
                ...prev,
                certificationTracking: {
                    ...prev.certificationTracking,
                    mcqStatus: response.data.data.passed ? 'passed' : 'failed',
                    mcqScore: response.data.data.score,
                    isCertified: response.data.data.isCertified
                }
            }));
            
            if (response.data.data.passed) {
                toast.success('Exam passed! Keep going.');
            } else {
                toast.error('Did not pass the exam. You can try again.');
            }
        } catch (err) {
            toast.error('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitProject = async () => {
        if (!projectUrl.includes('github.com') && !projectUrl.includes('gitlab.com')) {
            return toast.warning('Please provide a valid Git repository URL (GitHub/GitLab)');
        }

        setSubmitting(true);
        try {
            await api.post('/api/enrollments/submit-project', {
                courseId: id,
                projectUrl
            });
            setEnrollment(prev => ({
                ...prev,
                certificationTracking: {
                    ...prev.certificationTracking,
                    projectStatus: 'submitted',
                    projectUrl
                }
            }));
            toast.success('Project submitted for review!');
        } catch (err) {
            toast.error('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Entering Hub...</p>
                </div>
            </div>
        );
    }

    const { certification } = course;
    const { certificationTracking } = enrollment;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">
                                <Award size={14} /> Certification Hub
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 leading-tight">{course.title}</h1>
                        </div>
                    </div>
                </div>

                {certificationTracking.isCertified ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary rounded-2xl p-12 text-center text-white shadow-2xl shadow-primary/20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12">
                            <Trophy size={300} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/30 text-white">
                                <Trophy size={48} />
                            </div>
                            <h2 className="text-5xl font-black mb-4">You're Certified!</h2>
                            <p className="text-primary-50 text-lg font-medium max-w-xl mx-auto mb-10 leading-loose">
                                Congratulations! You have successfully completed all the requirements for this course and earned your official certification.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button 
                                    onClick={() => navigate(`/courses/certificate/${id}`)}
                                    className="px-8 py-4 bg-white text-primary rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Award size={18} /> View Certificate
                                </button>
                                <button 
                                    onClick={() => navigate('/candidate/courses')}
                                    className="px-8 py-4 bg-primary/20 text-white border border-white/20 rounded-2xl font-black hover:bg-white/30 transition-all"
                                >
                                    My Courses
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Requirement Tracker */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm h-fit">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Requirements</h3>
                                <div className="space-y-6">
                                    {/* 1. Progress Check (Always true if they are here) */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900">Curriculum Finish</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">100% Core Material</p>
                                        </div>
                                    </div>

                                    {/* 2. MCQ Check */}
                                    {certification.mcqEnabled && (
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                certificationTracking.mcqStatus === 'passed' 
                                                ? 'bg-emerald-500 text-white' 
                                                : (certificationTracking.mcqStatus === 'failed' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-300')
                                            }`}>
                                                {certificationTracking.mcqStatus === 'passed' ? <Check size={16} strokeWidth={3} /> : <HelpCircle size={16} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-900">Assessment Exam</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {certificationTracking.mcqStatus === 'passed' ? `Score: ${certificationTracking.mcqScore}%` : 'Not Passed Yet'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Project Check */}
                                    {certification.projectEnabled && (
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                certificationTracking.projectStatus === 'approved' 
                                                ? 'bg-accent text-white' 
                                                : (certificationTracking.projectStatus === 'rejected' ? 'bg-rose-500 text-white' : (certificationTracking.projectStatus === 'submitted' ? 'bg-primary/10 text-primary animate-pulse' : 'bg-slate-100 text-slate-300'))
                                            }`}>
                                                {certificationTracking.projectStatus === 'approved' ? <Check size={16} strokeWidth={3} /> : <Github size={16} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-900">Capstone Project</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                    {certificationTracking.projectStatus === 'submitted' ? 'Review Pending' : 
                                                     certificationTracking.projectStatus === 'approved' ? 'Verified' : 'Submission Required'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100/50">
                                <div className="flex gap-4">
                                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Mentor Verification</p>
                                        <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium italic">
                                            Projects are manually reviewed by your instructor. This usually takes 24-48 hours.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Interaction Area */}
                        <div className="md:col-span-2 space-y-8">
                            {/* MCQ Section */}
                            {certification.mcqEnabled && certificationTracking.mcqStatus !== 'passed' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm space-y-8"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Final Assessment</h3>
                                            <p className="text-slate-500 text-sm mt-1">Answer these questions to demonstrate your mastery.</p>
                                        </div>
                                        <div className="bg-primary/5 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/10 italic">
                                            Goal: {certification.mcqPassingScore}%+
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        {certification.questions?.map((q, qIdx) => (
                                            <div key={qIdx} className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-slate-300 font-black italic mt-1">Q{qIdx+1}.</span>
                                                    <p className="text-slate-700 font-bold leading-relaxed">{q.question}</p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                                                    {q.options.map((opt, oIdx) => (
                                                        <button 
                                                            key={oIdx}
                                                            onClick={() => setAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                                            className={`p-4 rounded-2xl text-left text-sm font-bold transition-all border-2 ${
                                                                answers[qIdx] === oIdx 
                                                                ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]' 
                                                                : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[10px] font-black ${
                                                                    answers[qIdx] === oIdx ? 'bg-white/20' : 'bg-white text-slate-400 border border-slate-100'
                                                                }`}>
                                                                    {String.fromCharCode(65 + oIdx)}
                                                                </span>
                                                                {opt}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={handleSubmitExam}
                                        disabled={submitting}
                                        className="w-full py-5 bg-secondary text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-secondary/10 hover:bg-secondary/90 hover:scale-[1.01] transition-all disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Finish Exam & Grade'}
                                    </button>
                                </motion.div>
                            )}

                            {/* Project Section */}
                            {certification.projectEnabled && certificationTracking.projectStatus !== 'approved' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm space-y-8"
                                >
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Capstone Project Submission</h3>
                                        <p className="text-slate-500 text-sm mt-1 italic leading-relaxed">
                                            This is the final hurdle! Real-world verification by your mentor.
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">The Challenge</p>
                                            <div className="text-slate-700 text-sm font-medium leading-loose whitespace-pre-wrap">
                                                {certification.projectDescription || "Build a complete application using everything you've learned. Submit the repository link below."}
                                            </div>
                                        </div>

                                        {certification.projectAsset?.url && (
                                            <div className="pt-4 border-t border-slate-200/60">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reference Material</p>
                                                <a 
                                                    href={certification.projectAsset.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary/20 hover:bg-primary/5 group transition-all"
                                                >
                                                    <div className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="text-left pr-4">
                                                        <p className="text-[11px] font-black text-slate-800 line-clamp-1">{certification.projectAsset.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Click to Download / View</p>
                                                    </div>
                                                    <Download size={14} className="text-slate-300 group-hover:text-primary ml-auto" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {certificationTracking.projectStatus === 'submitted' ? (
                                        <div className="bg-primary/5 border border-primary/10 p-8 rounded-2xl text-center space-y-4 shadow-inner">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto shadow-sm border border-primary/5">
                                                <Clock size={32} className="animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-primary font-black uppercase tracking-widest text-xs">Submission Received</p>
                                                <p className="text-slate-500 text-[11px] font-bold mt-1 max-w-xs mx-auto">
                                                    Mentor is currently reviewing your code at: <br/>
                                                    <span className="text-primary break-all">{certificationTracking.projectUrl}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Repository URL</label>
                                                <div className="relative">
                                                    <Github size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        value={projectUrl}
                                                        onChange={(e) => setProjectUrl(e.target.value)}
                                                        placeholder="https://github.com/yourname/project"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 placeholder:text-slate-300"
                                                    />
                                                </div>
                                            </div>

                                            {certificationTracking.projectStatus === 'rejected' && (
                                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                                                    <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Mentor Feedback</p>
                                                    <p className="text-xs text-rose-900 leading-relaxed italic">"{certificationTracking.projectFeedback}"</p>
                                                </div>
                                            )}

                                            <button 
                                                onClick={handleSubmitProject}
                                                disabled={submitting}
                                                className="w-full py-5 bg-secondary text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-secondary/10 hover:bg-secondary/90 hover:scale-[1.01] transition-all disabled:opacity-50"
                                            >
                                                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Repository'}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificationHub;
