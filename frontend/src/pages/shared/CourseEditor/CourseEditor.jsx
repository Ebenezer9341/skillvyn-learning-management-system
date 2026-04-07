import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save,
    Layers,
    Settings,
    Eye,
    Edit2,
    ArrowLeft,
    RefreshCw,
    Award,
    AlertCircle
} from 'lucide-react';
import { useRef } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import LessonDeleteConfirmModal from './LessonDeleteConfirmModal';
import CertificationHub from './CertificationHub';
import SyllabusSidebar from './SyllabusSidebar';
import LessonEditor from './LessonEditor';
import PlaceholderWorkspace from './PlaceholderWorkspace';
import CourseSettings from './CourseSettings';

const CourseEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: 'Development',
        level: 'Beginner',
        price: 0,
        duration: '',
        status: 'draft',
        thumbnail: '',
        syllabus: [],
        certification: {
            enabled: false,
            mcqEnabled: false,
            projectEnabled: false,
            mcqPassingScore: 70,
            projectDescription: '',
            questions: []
        }
    });

    const [activeModuleIdx, setActiveModuleIdx] = useState(0);
    const [showSettings, setShowSettings] = useState(true);
    const [thumbMode, setThumbMode] = useState('url'); // 'url' or 'upload'
    const [projectAssetMode, setProjectAssetMode] = useState('upload'); // 'url' or 'upload'
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // This is for video upload progress
    const [uploadingAsset, setUploadingAsset] = useState(false);
    const [assetUploadProgress, setAssetUploadProgress] = useState(0);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
    const [expandedSections, setExpandedSections] = useState({
        video: false,
        text: false,
        asset: false,
        quiz: false
    });
    const [showLessonDeleteModal, setShowLessonDeleteModal] = useState(false);
    const [lessonToDeleteIdx, setLessonToDeleteIdx] = useState(null);
    const videoInputRef = useRef(null);
    const assetInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const parseDuration = (durStr) => {
        if (!durStr) return { d: 0, h: 0, m: 0 };
        const d = durStr.match(/(\d+)\s*d/)?.[1] || 0;
        const h = durStr.match(/(\d+)\s*h/)?.[1] || 0;
        const m = durStr.match(/(\d+)\s*m/)?.[1] || durStr.match(/^(\d+)$/)?.[1] || 0;
        return { d: parseInt(d), h: parseInt(h), m: parseInt(m) };
    };

    const calculateTotalDuration = () => {
        let totalSeconds = 0;
        const lessons = course.syllabus || [];

        lessons.forEach(lesson => {
            if (!lesson.duration || lesson.isPreview) return;
            const dur = lesson.duration.toLowerCase();
            const dMatch = dur.match(/(\d+)\s*d/);
            const hMatch = dur.match(/(\d+)\s*h/);
            const mMatch = dur.match(/(\d+)\s*m/);
            const sMatch = dur.match(/(\d+)\s*s/);
            const plainMatch = dur.match(/^(\d+)$/);

            if (dMatch) totalSeconds += parseInt(dMatch[1]) * 24 * 60 * 60;
            if (hMatch) totalSeconds += parseInt(hMatch[1]) * 60 * 60;
            if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
            if (sMatch) totalSeconds += parseInt(sMatch[1]);
            if (plainMatch && !dMatch && !hMatch && !mMatch && !sMatch) totalSeconds += parseInt(plainMatch[1]) * 60;
        });

        if (totalSeconds === 0) return '0m';

        const d = Math.floor(totalSeconds / (24 * 60 * 60));
        let rem = totalSeconds % (24 * 60 * 60);
        const h = Math.floor(rem / (60 * 60));
        rem %= (60 * 60);
        const m = Math.floor(rem / 60);
        const s = rem % 60;

        let result = [];
        if (d > 0) result.push(`${d}d`);
        if (h > 0) result.push(`${h}h`);
        if (m > 0) result.push(`${m}m`);
        if (s > 0 && d === 0 && h === 0) result.push(`${s}s`);

        return result.length > 0 ? result.join(' ') : '0m';
    };

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/api/courses/${id}`);
                const courseData = response.data.data.course;

                // Ensure certification structure exists even for old courses
                if (!courseData.certification) {
                    courseData.certification = {
                        enabled: false,
                        mcqEnabled: false,
                        projectEnabled: false,
                        mcqPassingScore: 70,
                        projectDescription: '',
                        questions: []
                    };
                }

                setCourse(courseData);
            } catch (err) {
                toast.error('Failed to load course details');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id, navigate]);

    // Auto-calculate overall duration when syllabus changes
    useEffect(() => {
        if (!loading) {
            const total = calculateTotalDuration();
            if (total !== course.duration) {
                setCourse(prev => ({ ...prev, duration: total }));
            }
        }
    }, [course.syllabus, loading]);

    const handleBasicInfoChange = (e) => {
        const { name, value } = e.target;
        setCourse(prev => ({ ...prev, [name]: value }));
    };

    // Syllabus Management (Modules now represent single lessons)
    const addModule = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCourse(prev => ({
            ...prev,
            syllabus: [
                ...prev.syllabus,
                {
                    title: 'New Lesson',
                    duration: '',
                    video: { url: '', sourceType: 'link' },
                    text: { content: '' },
                    asset: { url: '', name: '', sourceType: 'link' },
                    quiz: []
                }
            ]
        }));
    };

    const confirmRemoveModule = (mIdx) => {
        setLessonToDeleteIdx(mIdx);
        setShowLessonDeleteModal(true);
    };

    const removeModule = () => {
        if (lessonToDeleteIdx === null) return;

        setCourse(prev => ({
            ...prev,
            syllabus: prev.syllabus.filter((_, i) => i !== lessonToDeleteIdx)
        }));

        // Adjust active index if needed
        if (activeModuleIdx >= course.syllabus.length - 1 && activeModuleIdx > 0) {
            setActiveModuleIdx(activeModuleIdx - 1);
        }

        setShowLessonDeleteModal(false);
        setLessonToDeleteIdx(null);
        toast.success('Lesson removed');
    };

    const updateModule = (mIdx, field, value) => {
        setCourse(prev => {
            const newSyllabus = [...prev.syllabus];
            const currentModule = newSyllabus[mIdx];
            const updatedModule = { ...currentModule };

            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                updatedModule[parent] = { ...updatedModule[parent], [child]: value };
            } else {
                updatedModule[field] = value;
            }

            newSyllabus[mIdx] = updatedModule;
            return { ...prev, syllabus: newSyllabus };
        });
    };

    const updateCertification = (update) => {
        setCourse(prev => ({
            ...prev,
            certification: {
                ...(prev.certification || {}),
                ...update
            }
        }));
    };

    const addQuizQuestion = (mIdx) => {
        setCourse(prev => {
            const newSyllabus = [...prev.syllabus];
            const updatedModule = { ...newSyllabus[mIdx] };

            const currentQuiz = updatedModule.quiz || [];
            updatedModule.quiz = [
                ...currentQuiz,
                { question: 'New Question', options: ['', '', '', ''], correctAnswer: 0 }
            ];

            newSyllabus[mIdx] = updatedModule;
            return { ...prev, syllabus: newSyllabus };
        });
    };

    const removeQuizQuestion = (mIdx, qIdx) => {
        setCourse(prev => {
            const newSyllabus = [...prev.syllabus];
            const updatedModule = { ...newSyllabus[mIdx] };

            updatedModule.quiz = (updatedModule.quiz || []).filter((_, i) => i !== qIdx);

            newSyllabus[mIdx] = updatedModule;
            return { ...prev, syllabus: newSyllabus };
        });
    };

    const updateQuizQuestion = (mIdx, qIdx, field, value) => {
        setCourse(prev => {
            const newSyllabus = [...prev.syllabus];
            const updatedModule = { ...newSyllabus[mIdx] };
            const updatedQuiz = [...(updatedModule.quiz || [])];

            updatedQuiz[qIdx] = { ...updatedQuiz[qIdx], [field]: value };
            updatedModule.quiz = updatedQuiz;

            newSyllabus[mIdx] = updatedModule;
            return { ...prev, syllabus: newSyllabus };
        });
    };

    const updateQuizOption = (mIdx, qIdx, oIdx, value) => {
        setCourse(prev => {
            const newSyllabus = [...prev.syllabus];
            const updatedModule = { ...newSyllabus[mIdx] };
            const updatedQuiz = [...(updatedModule.quiz || [])];
            const updatedOptions = [...updatedQuiz[qIdx].options];

            updatedOptions[oIdx] = value;
            updatedQuiz[qIdx] = { ...updatedQuiz[qIdx], options: updatedOptions };
            updatedModule.quiz = updatedQuiz;

            newSyllabus[mIdx] = updatedModule;
            return { ...prev, syllabus: newSyllabus };
        });
    };

    const handleVideoFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Please upload a valid video file');
            return;
        }

        setUploadingVideo(true);
        setUploadProgress(0);

        try {
            // 1. Attempt to extract duration locally
            let durationStr = '';
            try {
                const video = document.createElement('video');
                video.preload = 'metadata';
                const objectUrl = URL.createObjectURL(file);
                
                const durationInSeconds = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Timeout extracting duration')), 5000);
                    
                    video.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        URL.revokeObjectURL(objectUrl);
                        resolve(video.duration);
                    };
                    
                    video.onerror = (e) => {
                        clearTimeout(timeout);
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error('Media load error'));
                    };

                    video.src = objectUrl;
                });

                if (durationInSeconds) {
                    const minutes = Math.floor(durationInSeconds / 60);
                    const seconds = Math.floor(durationInSeconds % 60);
                    durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                }
            } catch (err) {
                console.warn('Could not extract duration locally, proceeding with upload only:', err);
            }

            // 2. Upload to server
            const formData = new FormData();
            formData.append('video', file);

            const response = await api.post('/api/courses/upload-video', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const videoUrl = response.data.data.url;
            
            // 3. Update module with both URL and calculated duration
            setCourse(prev => {
                const newSyllabus = [...prev.syllabus];
                const updatedModule = {
                    ...newSyllabus[activeModuleIdx],
                    video: { ...newSyllabus[activeModuleIdx].video, url: videoUrl }
                };
                
                // Only overwrite duration if we successfully extracted it
                if (durationStr) {
                    updatedModule.duration = durationStr;
                }
                
                newSyllabus[activeModuleIdx] = updatedModule;
                return { ...prev, syllabus: newSyllabus };
            });

            toast.success(`Video "${file.name}" uploaded successfully.${durationStr ? ` Duration: ${durationStr}` : ''}`);
        } catch (err) {
            console.error('Upload error:', err);
            toast.error(err.response?.data?.message || 'Failed to upload video');
        } finally {
            setUploadingVideo(false);
            setUploadProgress(0);
        }
    };

    const handleAssetFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAsset(true);
        setAssetUploadProgress(0);

        const formData = new FormData();
        formData.append('asset', file);

        try {
            const response = await api.post('/api/courses/upload-asset', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setAssetUploadProgress(percentCompleted);
                }
            });

            const { url, name } = response.data.data;
            updateModule(activeModuleIdx, 'asset.url', url);
            updateModule(activeModuleIdx, 'asset.name', name);
            toast.success(`Asset "${name}" uploaded successfully`);
        } catch (err) {
            console.error('Asset upload error:', err);
            toast.error(err.response?.data?.message || 'Failed to upload asset');
        } finally {
            setUploadingAsset(false);
            setAssetUploadProgress(0);
        }
    };

    const handleThumbnailFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload a valid image file');
            return;
        }

        setUploadingThumbnail(true);
        const formData = new FormData();
        formData.append('thumbnail', file);

        try {
            const response = await api.post('/api/courses/upload-thumbnail', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const thumbnailUrl = response.data.data.url;
            setCourse(prev => ({ ...prev, thumbnail: thumbnailUrl }));
            toast.success('Thumbnail uploaded successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploadingThumbnail(false);
        }
    };

    const handleProjectAssetFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAsset(true);
        const formData = new FormData();
        formData.append('asset', file);

        try {
            const response = await api.post('/api/courses/upload-asset', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setAssetUploadProgress(percentCompleted);
                }
            });

            const { url, name } = response.data.data;
            setCourse(prev => ({
                ...prev,
                certification: {
                    ...prev.certification,
                    projectAsset: { url, name }
                }
            }));
            toast.success(`Reference file "${name}" uploaded`);
        } catch (err) {
            console.error('Project asset upload error:', err);
            toast.error(err.response?.data?.message || 'Failed to upload reference file');
        } finally {
            setUploadingAsset(false);
            setAssetUploadProgress(0);
        }
    };



    const updateDurationString = (mIdx, type, value) => {
        const current = parseDuration(course.syllabus[mIdx].duration);
        const next = { ...current, [type]: parseInt(value) || 0 };
        let newStr = [];
        if (next.d > 0) newStr.push(`${next.d}d`);
        if (next.h > 0) newStr.push(`${next.h}h`);
        if (next.m > 0) newStr.push(`${next.m}m`);
        const finalStr = newStr.join(' ');

        updateModule(mIdx, 'duration', finalStr);
    };

    const handleSave = async () => {
        // Enforce mandatory video upload for instructors (admins, superusers, mentors)
        if (user && ['admin', 'superuser', 'mentor'].includes(user.role)) {
            const missingVideoIndex = course.syllabus.findIndex(lesson => !lesson.video?.url);
            if (missingVideoIndex !== -1) {
                const lesson = course.syllabus[missingVideoIndex];
                const type = lesson.isPreview ? 'Course Preview' : 'Lesson Unit';
                toast.error(`Missing video in ${type} "${lesson.title || `Unit #${missingVideoIndex + 1}`}". A video is required.`);
                
                // Immediately open the offending lesson
                setActiveModuleIdx(missingVideoIndex);
                setShowSettings(false);
                return;
            }
        }

        setSaving(true);
        try {
            await api.patch(`/api/courses/${id}`, course);
            toast.success('Course updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update course');
        } finally {
            setSaving(false);
        }
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
    const isReadOnly = !isAdmin && (course.status === 'published' || course.status === 'pending');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading Course Builder...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Sticky Bar */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="group relative">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                name="title"
                                value={course.title}
                                onChange={handleBasicInfoChange}
                                disabled={isReadOnly}
                                className={`text-lg font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 truncate max-w-[300px] placeholder:text-slate-300 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                placeholder="Untitled Course"
                            />
                            {!isReadOnly && <Edit2 size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">{course.category}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/courses/view/${id}`)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        <Eye size={18} />
                        <span className="hidden sm:inline">Preview Course</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || isReadOnly}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 rounded-xl border transition-all active:scale-95 ${showSettings
                            ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                            : 'bg-white text-slate-400 border-slate-200'
                            }`}
                        title={showSettings ? "Hide Settings" : "Show Settings"}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {isReadOnly && (
                <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center justify-center gap-3 text-amber-700 shadow-inner">
                    <AlertCircle size={16} />
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">
                        Course Locked: editing disabled while {course.status}
                    </p>
                </div>
            )}

            <div className={`max-w-[1600px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 ${showSettings ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8 transition-all duration-500`}>

                {/* Left Column: Syllabus / Builder */}
                <div className={`${showSettings ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6 transition-all duration-500`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Layers className="text-blue-500" /> Curriculum Designer
                        </h2>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[850px]">
                        {/* 1. Lesson Sidebar (Master List) */}
                        <SyllabusSidebar 
                            syllabus={course.syllabus}
                            activeModuleIdx={activeModuleIdx}
                            setActiveModuleIdx={setActiveModuleIdx}
                            addModule={addModule}
                            certification={course.certification}
                            isReadOnly={isReadOnly}
                        />

                        {/* 2. Focused Lesson Workspace (Detail View) */}
                        <div className="flex-1 bg-white overflow-y-auto premium-scroll max-h-[850px]">
                            <AnimatePresence mode="wait">
                                {activeModuleIdx === 'cert' ? (
                                    <motion.div
                                        key="cert-view"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-10 space-y-12"
                                    >
                                        <div className="flex items-start justify-between pb-8 border-b border-slate-50 gap-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">
                                                    <Award size={14} /> Global Certification Hub
                                                </div>
                                                <h2 className="text-3xl font-black text-slate-800 leading-tight">Certification Standards</h2>
                                                <p className="text-slate-500 text-sm mt-2">Define the requirements candidates must meet to earn their certificate.</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enable Status</span>
                                                <button
                                                    onClick={() => !isReadOnly && setCourse(prev => {
                                                        const currentCert = prev.certification || {
                                                            enabled: false,
                                                            mcqEnabled: false,
                                                            projectEnabled: false,
                                                            mcqPassingScore: 70,
                                                            projectDescription: '',
                                                            questions: []
                                                        };
                                                        return {
                                                            ...prev,
                                                            certification: {
                                                                ...currentCert,
                                                                enabled: !currentCert.enabled
                                                            }
                                                        };
                                                    })}
                                                    disabled={isReadOnly}
                                                    className={`w-14 h-7 rounded-full transition-all relative ${isReadOnly ? 'bg-slate-100 cursor-not-allowed opacity-50' : course.certification?.enabled ? 'bg-emerald-500 cursor-pointer' : 'bg-slate-200 cursor-pointer'}`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${course.certification?.enabled ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <CertificationHub 
                                            certification={course.certification}
                                            updateCertification={updateCertification}
                                            handleProjectAssetFileChange={handleProjectAssetFileChange}
                                            uploadingAsset={uploadingAsset}
                                            assetUploadProgress={assetUploadProgress}
                                            projectAssetMode={projectAssetMode}
                                            setProjectAssetMode={setProjectAssetMode}
                                            isReadOnly={isReadOnly}
                                        />
                                    </motion.div>
                                ) : course.syllabus[activeModuleIdx] ? (
                                    <LessonEditor 
                                        activeModuleIdx={activeModuleIdx}
                                        lesson={course.syllabus[activeModuleIdx]}
                                        updateModule={updateModule}
                                        confirmRemoveModule={confirmRemoveModule}
                                        parseDuration={parseDuration}
                                        updateDurationString={updateDurationString}
                                        toggleSection={toggleSection}
                                        expandedSections={expandedSections}
                                        videoInputRef={videoInputRef}
                                        handleVideoFileChange={handleVideoFileChange}
                                        uploadingVideo={uploadingVideo}
                                        uploadProgress={uploadProgress}
                                        assetInputRef={assetInputRef}
                                        handleAssetFileChange={handleAssetFileChange}
                                        uploadingAsset={uploadingAsset}
                                        assetUploadProgress={assetUploadProgress}
                                        isReadOnly={isReadOnly}
                                        addQuizQuestion={addQuizQuestion}
                                        removeQuizQuestion={removeQuizQuestion}
                                        updateQuizQuestion={updateQuizQuestion}
                                        updateQuizOption={updateQuizOption}
                                    />
                                ) : (
                                    <PlaceholderWorkspace 
                                        addModule={addModule}
                                        setActiveModuleIdx={setActiveModuleIdx}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings & Meta */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <CourseSettings
                                course={course}
                                setCourse={setCourse}
                                currentUser={user}
                                showSettings={showSettings}
                                handleBasicInfoChange={handleBasicInfoChange}
                                thumbnailInputRef={thumbnailInputRef}
                                handleThumbnailFileChange={handleThumbnailFileChange}
                                uploadingThumbnail={uploadingThumbnail}
                                thumbMode={thumbMode}
                                setThumbMode={setThumbMode}
                                isReadOnly={isReadOnly}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
            {/* Lesson Delete Confirmation Modal */}
            <LessonDeleteConfirmModal 
                isOpen={showLessonDeleteModal}
                onClose={() => setShowLessonDeleteModal(false)}
                onConfirm={removeModule}
                lessonTitle={course.syllabus[lessonToDeleteIdx]?.title}
            />
        </div>
    );
};

export default CourseEditor;
