import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    FileText,
    Download,
    HelpCircle,
    ChevronRight,
    ChevronLeft,
    Clock,
    Award,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Maximize2,
    Trophy,
    Lock,
    ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import PriceDisplay from '../../components/ui/PriceDisplay';

const CourseViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [activeLessonIdx, setActiveLessonIdx] = useState(-1);
    const [completedLessons, setCompletedLessons] = useState({}); // { lessonIdx: boolean }
    const [quizAnswers, setQuizAnswers] = useState({}); // { lessonIdx: { questionIdx: optionIdx } }
    const [quizSubmitted, setQuizSubmitted] = useState({}); // { lessonIdx: boolean }
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleCompletion = async (idx) => {
        const isCurrentlyCompleted = completedLessons[idx];
        
        // Optimistic UI update
        setCompletedLessons(prev => ({
            ...prev,
            [idx]: !isCurrentlyCompleted
        }));

        try {
            await api.patch('/api/enrollments/update-progress', {
                courseId: id,
                lessonIdx: idx,
                completed: !isCurrentlyCompleted
            });
        } catch (err) {
            // Revert on error
            setCompletedLessons(prev => ({
                ...prev,
                [idx]: isCurrentlyCompleted
            }));
            toast.error('Failed to save progress');
        }
    };

    const completedCount = Object.values(completedLessons).filter(Boolean).length;
    const progressPercent = course?.syllabus?.length > 0 ? Math.round((completedCount / course.syllabus.length) * 100) : 0;

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/api/courses/${id}`);
                const courseData = response.data.data.course;
                const enrollmentData = response.data.data.enrollment;
                
                setCourse(courseData);
                setEnrollment(enrollmentData);
                
                // Initialize completed lessons from enrollment data
                if (enrollmentData?.completedLessons) {
                    const completedMap = {};
                    enrollmentData.completedLessons.forEach(idx => {
                        completedMap[idx] = true;
                    });
                    setCompletedLessons(completedMap);
                }
            } catch (err) {
                toast.error('Failed to load course preview');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Entering Classroom...</p>
                </div>
            </div>
        );
    }

    if (!course) return null;

    const lessons = course.syllabus || [];

    // Helper to calculate total duration from syllabus
    const calculateInvestment = () => {
        let totalMinutes = 0;
        lessons.forEach(lesson => {
            if (!lesson.duration) return;
            
            const dur = lesson.duration.toLowerCase();
            // Handle Xd, Xh, Xm
            const dayMatch = dur.match(/(\d+)\s*d/);
            const hourMatch = dur.match(/(\d+)\s*h/);
            const minMatch = dur.match(/(\d+)\s*m/);
            
            // Handle plain numbers (assume minutes if no h/m/d)
            const plainMatch = dur.match(/^(\d+)$/);

            if (dayMatch) totalMinutes += parseInt(dayMatch[1]) * 24 * 60;
            if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
            if (minMatch) totalMinutes += parseInt(minMatch[1]);
            if (plainMatch && !dayMatch && !hourMatch && !minMatch) totalMinutes += parseInt(plainMatch[1]);
        });

        if (totalMinutes === 0) return course.duration || 'Flexible Path';
        
        const d = Math.floor(totalMinutes / (24 * 60));
        const remAfterDays = totalMinutes % (24 * 60);
        const h = Math.floor(remAfterDays / 60);
        const m = remAfterDays % 60;
        
        let result = [];
        if (d > 0) result.push(`${d}d`);
        if (h > 0) result.push(`${h}h`);
        if (m > 0) result.push(`${m}m`); 
        
        return result.length > 0 ? result.join(' ') : `${totalMinutes} Mins`;
    };

    const activeLesson = activeLessonIdx >= 0 ? lessons[activeLessonIdx] : null;

    const handleQuizOptionSelect = (qIdx, oIdx) => {
        if (quizSubmitted[activeLessonIdx]) return;
        setQuizAnswers(prev => ({
            ...prev,
            [activeLessonIdx]: {
                ...(prev[activeLessonIdx] || {}),
                [qIdx]: oIdx
            }
        }));
    };

    const submitQuiz = () => {
        setQuizSubmitted(prev => ({ ...prev, [activeLessonIdx]: true }));
    };

    const calculateQuizScore = (lessonIdx) => {
        const quiz = lessons[lessonIdx].quiz || [];
        const answers = quizAnswers[lessonIdx] || {};
        let correct = 0;
        quiz.forEach((q, qIdx) => {
            if (answers[qIdx] === q.correctAnswer) correct++;
        });
        return { correct, total: quiz.length, percent: Math.round((correct / quiz.length) * 100) };
    };

    const renderContent = () => {
        if (activeLessonIdx === -1) {
            return (
                <div className="space-y-12 pb-20">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600">
                            <Award size={12} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Comprehensive Pathway</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">{course.title}</h1>
                    </div>

                    {/* Mentor Info */}
                    <div className="flex items-center gap-6 p-8 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                            {course.instructor?.avatar ? (
                                <img src={course.instructor.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <HelpCircle size={40} className="text-slate-200" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Mentor & Architect</p>
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">
                                {course.instructor?.firstName} {course.instructor?.lastName || 'Skillvyn Mentor'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100/50">Verified Instructor</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 text-xs font-bold font-sans">Industry Expert</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Play size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Syllabus</p>
                                <p className="text-xl font-black text-slate-900">{lessons.length} Expert Lessons</p>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Estimated duration</p>
                                <p className="text-xl font-black text-slate-900">{calculateInvestment()}</p>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Prestige</p>
                                <p className="text-xl font-black text-slate-900">{course.certification?.enabled ? 'Certified Course' : 'Skillvyn Verified'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Course Summary</h2>
                        </div>
                        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm leading-[1.8] text-slate-600 font-medium whitespace-pre-wrap relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/10" />
                            {course.description}
                        </div>
                    </div>

                    {/* Start Learning Action */}
                    <div className="p-12 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-slate-200 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative space-y-3 z-10 text-center md:text-left">
                            <h3 className="text-3xl font-black leading-tight tracking-tight">The path is set.</h3>
                            <p className="text-slate-400 font-bold text-sm tracking-wide">Advance through each module to earn your verified credential.</p>
                        </div>
                        <button 
                            onClick={() => setActiveLessonIdx(0)}
                            className="relative z-10 px-12 py-6 bg-white text-slate-900 rounded-xl font-black hover:bg-primary hover:text-white hover:scale-105 transition-all active:scale-95 shadow-2xl flex items-center gap-4 uppercase text-xs tracking-widest"
                        >
                            Begin Masterclass
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            );
        }

        if (!activeLesson) return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Please select a curriculum item</p>
            </div>
        );

        const isLocked = !enrollment && !activeLesson.isPreview && user?.role === 'candidate';

        if (isLocked) {
            return (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-8 min-h-[60vh]">
                    <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 relative">
                        <Play size={40} className="opacity-20" />
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-3 rounded-2xl shadow-lg border-4 border-white">
                            <Lock size={20} />
                        </div>
                    </div>
                    <div className="max-w-md space-y-4">
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">This Lesson is Locked</h2>
                        <p className="text-slate-500 font-medium">To access this premium content and continue your learning path, please join the course first.</p>
                    </div>
                    {!user ? (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Already have an account?</p>
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
                            >
                                Login to Account
                            </button>
                        </div>
                    ) : (
                        <>
                            {course.price > 0 && (
                                <div className="mb-2">
                                    <PriceDisplay 
                                        price={course.price} 
                                        originalPrice={course.originalPrice} 
                                        size="large" 
                                    />
                                </div>
                            )}
                            <button 
                                onClick={async () => {
                                    if (course.price > 0) {
                                        // Paid course → send through payment gateway
                                        navigate('/candidate/payment', {
                                            state: {
                                                courseId: id,
                                                courseTitle: course.title,
                                                price: course.price,
                                                originalPrice: course.originalPrice
                                            }
                                        });
                                    } else {
                                        // Free course → enroll directly
                                        try {
                                            await api.post('/api/enrollments/enroll', { courseId: id });
                                            window.location.reload();
                                        } catch (err) {
                                            toast.error(err.response?.data?.message || 'Failed to enroll');
                                        }
                                    }
                                }}
                                className={`px-10 py-5 rounded-[2rem] font-black transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3 ${
                                    course.price > 0
                                        ? 'bg-slate-900 text-white hover:bg-black shadow-slate-200'
                                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                                }`}
                            >
                                <span>{course.price > 0 ? `Pay ₹${course.price.toLocaleString()} to Enroll` : 'Enroll for Free'}</span>
                                <ArrowRight size={20} />
                            </button>
                        </>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-10 pb-20">
                {/* Lesson Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
                            Lesson {activeLessonIdx + 1} of {lessons.length}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">{activeLesson.title}</h1>
                    </div>
                    {enrollment && (
                        <button 
                            onClick={() => toggleCompletion(activeLessonIdx)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${
                                completedLessons[activeLessonIdx] 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                            }`}
                        >
                            {completedLessons[activeLessonIdx] ? (
                                <>
                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                    <span>Completed</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                    <span>Mark as Completed</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Video Stage */}
                {activeLesson.video?.url && (
                    <div className="relative group">
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200">
                            {activeLesson.video.url.includes('youtube.com') || activeLesson.video.url.includes('youtu.be') ? (
                                <iframe 
                                    src={`https://www.youtube.com/embed/${activeLesson.video.url.split('v=')[1] || activeLesson.video.url.split('/').pop()}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Lesson Video"
                                />
                            ) : (
                                <video 
                                    src={activeLesson.video.url} 
                                    controls 
                                    controlsList="nodownload"
                                    onContextMenu={(e) => e.preventDefault()}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-slate-400 px-2">
                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock size={14} /> {activeLesson.video.duration || '00:00'}</span>
                                <span className="flex items-center gap-1.5"><Maximize2 size={14} /> Fullscreen enabled</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Text Content */}
                {activeLesson.text?.content && (
                    <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm leading-loose text-slate-700 whitespace-pre-wrap font-medium inner-shadow">
                        {activeLesson.text.content}
                    </div>
                )}

                {/* Assets / Downloads */}
                {activeLesson.asset?.url && (
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                <Download size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Resource File</p>
                                <p className="text-sm font-bold text-slate-800">{activeLesson.asset.name || 'Downloadable Material'}</p>
                            </div>
                        </div>
                        <a 
                            href={activeLesson.asset.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                        >
                            Download
                        </a>
                    </div>
                )}

                {/* Quiz Section */}
                {activeLesson.quiz?.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-amber-500 mb-2">
                            <HelpCircle size={24} />
                            <h2 className="text-xl font-black">Knowledge Check</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {activeLesson.quiz.map((q, qIdx) => {
                                const selected = quizAnswers[activeLessonIdx]?.[qIdx];
                                const submitted = quizSubmitted[activeLessonIdx];
                                const isCorrect = selected === q.correctAnswer;

                                return (
                                    <div key={qIdx} className={`p-8 rounded-2xl border transition-all shadow-sm ${
                                        submitted 
                                        ? isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                                        : 'bg-white border-slate-100'
                                    }`}>
                                        <p className="font-bold text-slate-800 mb-6 flex gap-3">
                                            <span className="text-slate-300">0{qIdx + 1}</span>
                                            {q.question}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((opt, oIdx) => {
                                                const isSelected = selected === oIdx;
                                                const isOptionCorrect = oIdx === q.correctAnswer;
                                                
                                                let style = "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600";
                                                if (submitted) {
                                                    if (isOptionCorrect) style = "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200";
                                                    else if (isSelected) style = "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200";
                                                    else style = "bg-white border-slate-100 text-slate-300 opacity-60";
                                                } else if (isSelected) {
                                                    style = "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200";
                                                }

                                                return (
                                                    <button
                                                        key={oIdx}
                                                        onClick={() => handleQuizOptionSelect(qIdx, oIdx)}
                                                        className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold transition-all ${style}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] ${
                                                            isSelected || (submitted && isOptionCorrect) ? 'bg-white/20 border-white/40' : 'bg-white border-slate-200'
                                                        }`}>
                                                            {String.fromCharCode(65 + oIdx)}
                                                        </div>
                                                        {opt}
                                                        {(submitted && isOptionCorrect) && <CheckCircle2 size={16} className="ml-auto" />}
                                                        {(submitted && isSelected && !isOptionCorrect) && <XCircle size={16} className="ml-auto" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!quizSubmitted[activeLessonIdx] ? (
                            <button 
                                onClick={submitQuiz}
                                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Award size={22} />
                                Check My Answers
                            </button>
                        ) : (
                            <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 shadow-2xl flex flex-col md:flex-row items-center gap-8">
                                <div className="relative">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * calculateQuizScore(activeLessonIdx).percent) / 100} className="text-emerald-500 transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-slate-800">
                                        {calculateQuizScore(activeLessonIdx).percent}%
                                    </div>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-xl font-black text-slate-900">Quiz Completed!</h3>
                                    <p className="text-slate-500 font-medium">You got {calculateQuizScore(activeLessonIdx).correct} out of {calculateQuizScore(activeLessonIdx).total} questions correctly.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setQuizSubmitted(prev => ({ ...prev, [activeLessonIdx]: false }));
                                        setQuizAnswers(prev => ({ ...prev, [activeLessonIdx]: {} }));
                                    }}
                                    className="md:ml-auto px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                                >
                                    Retake Quiz
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Footer */}
                <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                    <button 
                        disabled={activeLessonIdx === 0}
                        onClick={() => setActiveLessonIdx(prev => prev - 1)}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-0"
                    >
                        <ChevronLeft size={20} />
                        Previous Lesson
                    </button>
                    {activeLessonIdx < lessons.length - 1 ? (
                        <button 
                            onClick={() => setActiveLessonIdx(prev => prev + 1)}
                            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Next Lesson
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            {(enrollment?.certificationTracking?.isCertified || (progressPercent === 100 && course?.certification?.enabled)) && (
                                !enrollment?.certificationTracking?.isCertified ? (
                                <button 
                                    onClick={() => navigate(`/courses/certification/${id}`)}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black shadow-xl shadow-amber-200 hover:scale-105 transition-all active:scale-95 group"
                                >
                                    <Award size={24} className="group-hover:rotate-12 transition-transform" />
                                    Get Certified
                                </button>
                                ) : (
                                    <button 
                                        onClick={() => navigate(`/courses/certificate/${id}`)}
                                        className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:scale-105 transition-all active:scale-95 group"
                                    >
                                        <Trophy size={20} className="group-hover:rotate-12 transition-transform" />
                                        View My Certificate
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* 1. Sidebar */}
            <motion.div 
                animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
                className="bg-white border-r border-slate-100 flex flex-col relative z-20 shadow-xl shadow-slate-200/50 overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-white sticky top-0">
                    {course.thumbnail && (
                        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Course</p>
                        <h2 className="text-sm font-black text-slate-800 line-clamp-1">{course.title}</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto premium-scroll p-4 space-y-2">
                    {/* Course Summary Item */}
                    <button
                        onClick={() => setActiveLessonIdx(-1)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left relative group ${
                            activeLessonIdx === -1 
                            ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-sm' 
                            : 'hover:bg-slate-50 text-slate-500'
                        }`}
                    >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] transition-all ${
                            activeLessonIdx === -1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                        }`}>
                            <Trophy size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`text-xs font-black leading-tight ${activeLessonIdx === -1 ? 'text-blue-900' : 'text-slate-600'}`}>
                                Course Summary
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">General overview</p>
                        </div>
                        {activeLessonIdx === -1 && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full shadow-[2px_0_10px_rgba(37,99,235,0.4)]" />
                        )}
                    </button>

                    <div className="h-4 border-b border-slate-100 mb-4" />

                    {lessons.map((lesson, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveLessonIdx(idx)}
                            className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all text-left relative group ${
                                activeLessonIdx === idx 
                                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-sm' 
                                : 'hover:bg-slate-50 text-slate-500'
                            }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] transition-all ${
                                activeLessonIdx === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                            }`}>
                                {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold leading-tight line-clamp-2 ${activeLessonIdx === idx ? 'text-blue-900' : 'text-slate-600'}`}>
                                    {lesson.title}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    {lesson.duration && (
                                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[9px]">
                                            <Clock size={10} className="text-blue-500" />
                                            {lesson.duration}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 opacity-40">
                                        {lesson.video?.url && <Play size={10} />}
                                        {lesson.text?.content && <FileText size={10} />}
                                        {lesson.quiz?.length > 0 && <HelpCircle size={10} />}
                                    </div>
                                </div>
                            </div>
                                {lesson.isPreview && (activeLessonIdx !== idx) && (
                                    <div className="shrink-0 text-emerald-500 flex items-center gap-1">
                                        <span className="text-[8px] font-black uppercase tracking-tighter bg-emerald-50 px-1 rounded border border-emerald-100/50">Free Preview</span>
                                    </div>
                                )}
                                {completedLessons[idx] && (
                                <div className="shrink-0 text-emerald-500">
                                    <CheckCircle2 size={14} />
                                </div>
                            )}
                            {activeLessonIdx === idx && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full shadow-[2px_0_10px_rgba(37,99,235,0.4)]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    <div className="space-y-3">
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Course Progress</span>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-blue-600">{progressPercent}%</span>
                                <span className="text-[8px] font-bold text-slate-400">{completedCount} / {lessons.length} Lessons</span>
                            </div>
                        </div>
                    </div>
                    {(enrollment?.certificationTracking?.isCertified || (progressPercent === 100 && course?.certification?.enabled)) && (
                        enrollment?.certificationTracking?.isCertified ? (
                            <motion.button 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => navigate(`/courses/certificate/${id}`)}
                                className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-100 hover:shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                <Trophy size={18} />
                                View Certificate
                            </motion.button>
                        ) : (
                            <motion.button 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                onClick={() => navigate(`/courses/certification/${id}`)}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-200 hover:shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                <Award size={18} />
                                Get Certified
                            </motion.button>
                        )
                    )}
                </div>
            </motion.div>

            {/* 2. Content Viewport */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
                {/* Viewport Header */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                            title={sidebarOpen ? "Hide Syllabus" : "Show Syllabus"}
                        >
                            {sidebarOpen ? <ChevronLeft size={20} /> : <div className="flex items-center gap-2"><ArrowLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Syllabus</span></div>}
                        </button>
                        <div className="h-6 w-[1.5px] bg-slate-100" />
                        <button 
                            onClick={() => navigate(-1)}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2 transition-colors"
                        >
                            {user?.role === 'candidate' ? 'Exit Classroom' : 'Exit Preview'}
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            {user?.role === 'candidate' ? 'Learning Mode' : 'Preview Mode'}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto premium-scroll p-8 md:p-12 lg:p-6">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeLessonIdx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseViewer;
