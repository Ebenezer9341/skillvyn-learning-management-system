import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    ChevronDown,
    Zap,
    Layout,
    AlertCircle,
    Image as ImageIcon,
    Upload,
    RefreshCw,
    Edit2,
    IndianRupee,
    Clock,
    ShieldCheck,
    ChevronRight,
    Loader2
} from 'lucide-react';
import api from '../../../services/api';

const CourseSettings = ({
    course,
    currentUser,
    setCourse,
    handleBasicInfoChange,
    thumbnailInputRef,
    handleThumbnailFileChange,
    uploadingThumbnail,
    thumbMode,
    setThumbMode,
    isReadOnly
}) => {
    const [showRequestModal, setShowRequestModal] = React.useState(false);
    const [requestData, setRequestData] = React.useState({
        requestedStatus: 'published',
        mentorRemark: ''
    });
    const [requesting, setRequesting] = React.useState(false);

    // Filter available statuses based on current course status
    const statusOptions = [
        { value: 'published', label: 'Publish (Public Access)' },
        { value: 'archived', label: 'Archive Content' },
        ...(course.status === 'draft' ? [{ value: 'draft', label: 'Revert to Private Draft' }] : [])
    ].filter(option => option.value !== course.status);

    // Update default choice when modal opens or course status changes
    useEffect(() => {
        if (showRequestModal && statusOptions.length > 0) {
            setRequestData(prev => ({
                ...prev,
                requestedStatus: statusOptions[0].value
            }));
        }
    }, [showRequestModal, course.status]);

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superuser';

    const handleRequestSubmit = async () => {
        if (!requestData.mentorRemark.trim()) {
            import('react-toastify').then(({ toast }) => toast.error('Please provide a remark for the admin.'));
            return;
        }

        setRequesting(true);
        try {
            const update = {
                status: 'pending',
                approvalRequest: {
                    requestedStatus: requestData.requestedStatus,
                    mentorRemark: requestData.mentorRemark,
                    requestedAt: new Date()
                }
            };
            await api.patch(`/api/courses/${course._id}`, update);
            setCourse(prev => ({ ...prev, ...update }));
            import('react-toastify').then(({ toast }) => toast.success('Verification request submitted and notified to admin.'));
            setShowRequestModal(false);
        } catch (err) {
            import('react-toastify').then(({ toast }) => toast.error(err.response?.data?.message || 'Failed to submit request'));
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings size={20} className="text-slate-400" /> Course Settings
            </h3>

            <div className="space-y-5">
                {/* Status Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Course Visibility</label>
                        {currentUser?.role === 'mentor' && course.status !== 'pending' && (
                            <button 
                                onClick={() => setShowRequestModal(true)}
                                className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 hover:bg-primary/10 transition-all flex items-center gap-1.5"
                            >
                                <RefreshCw size={10} /> Request Change
                            </button>
                        )}
                    </div>
                    
                    {isAdmin ? (
                        <div className="relative">
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                                course.status === 'published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                course.status === 'archived' ? 'bg-slate-400' : 
                                course.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            }`} />
                            <select
                                name="status"
                                value={course.status}
                                onChange={(e) => {
                                    const newStatus = e.target.value;
                                    if (newStatus === 'published') {
                                        const lessons = course.syllabus || [];
                                        const missingVideo = lessons.some(l => !l.video?.url);
                                        if (missingVideo) {
                                            import('react-toastify').then(({ toast }) => {
                                                toast.error('Cannot publish! Some lessons are missing videos.');
                                            });
                                            return;
                                        }
                                    }
                                    handleBasicInfoChange(e);
                                }}
                                className="w-full bg-slate-50 border-slate-100 rounded-2xl py-2.5 pl-8 pr-4 font-bold text-slate-700 text-sm focus:ring-primary/5 cursor-pointer appearance-none inner-shadow"
                            >
                                {course.status === 'draft' && <option value="draft">Draft (Private)</option>}
                                {course.status === 'pending' && <option value="pending">Pending Review</option>}
                                <option value="published">Published (Live)</option>
                                <option value="archived">Archived</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                                course.status === 'published' ? 'bg-emerald-50 border-emerald-100' :
                                course.status === 'pending' ? 'bg-amber-50 border-amber-100 animate-pulse' : 'bg-slate-50 border-slate-100'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        course.status === 'published' ? 'bg-emerald-500' :
                                        course.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                                    }`} />
                                    <span className={`text-xs font-black uppercase tracking-widest ${
                                        course.status === 'published' ? 'text-emerald-700' :
                                        course.status === 'pending' ? 'text-amber-700' : 'text-slate-600'
                                    }`}>
                                        {course.status === 'pending' ? 'Under Review' : course.status}
                                    </span>
                                </div>
                                {course.status === 'pending' && <Clock size={16} className="text-amber-400" />}
                            </div>

                            {course.status === 'pending' && course.approvalRequest?.mentorRemark && (
                                <div className="bg-amber-50/30 border border-amber-100/50 p-3 rounded-xl">
                                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 leading-none italic">Your Submission Remark:</p>
                                    <p className="text-[10px] text-amber-800 leading-tight font-medium italic">"{course.approvalRequest.mentorRemark}"</p>
                                </div>
                            )}

                            {course.approvalRequest?.adminRemark && (
                                <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <ShieldCheck size={10} className="text-primary" />
                                        <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none italic">Administrative Feedback:</p>
                                    </div>
                                    <p className="text-[10px] text-slate-700 leading-tight font-bold italic">"{course.approvalRequest.adminRemark}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status Request Modal */}
                {typeof document !== 'undefined' && createPortal(
                    <AnimatePresence>
                        {showRequestModal && (
                            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                                    onClick={() => setShowRequestModal(false)}
                                />
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                    className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white"
                                >
                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                            <RefreshCw size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Status Verification</h4>
                                            <p className="text-slate-500 text-xs font-medium mt-2">Request permission to change your course status on the platform.</p>
                                        </div>

                                        <div className="w-full space-y-4">
                                            <div className="space-y-1.5 text-left">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target State</label>
                                                <div className="relative">
                                                    <select 
                                                        className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-2xl font-bold text-slate-700 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                                        value={requestData.requestedStatus}
                                                        onChange={(e) => setRequestData({ ...requestData, requestedStatus: e.target.value })}
                                                    >
                                                        {statusOptions.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 text-left">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Change Rationale</label>
                                                <textarea 
                                                    placeholder="Provide justification for this change..."
                                                    className="w-full bg-slate-50 border border-slate-100 py-3.5 px-4 rounded-2xl font-medium text-slate-700 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none h-24 premium-scroll"
                                                    value={requestData.mentorRemark}
                                                    onChange={(e) => setRequestData({ ...requestData, mentorRemark: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                            <button 
                                                onClick={() => setShowRequestModal(false)}
                                                className="px-6 py-4 rounded-2xl border border-slate-100 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleRequestSubmit}
                                                disabled={requesting}
                                                className="px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                {requesting ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                                                <span>Submit</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}

                {/* Basic Info */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Title</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="title"
                            value={course.title}
                            readOnly={!isAdmin}
                            onChange={handleBasicInfoChange}
                            className={`w-full bg-slate-50 border-slate-100 rounded-2xl py-2.5 px-4 font-bold text-slate-700 text-sm focus:ring-primary/5 inner-shadow ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder="Enter course title..."
                        />
                        {isAdmin && <Edit2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Description</label>
                    <textarea
                        name="description"
                        value={course.description}
                        onChange={handleBasicInfoChange}
                        disabled={isReadOnly}
                        rows="4"
                        className={`w-full bg-slate-50 border-slate-100 rounded-2xl py-2.5 px-4 font-medium text-slate-700 text-sm focus:ring-primary/5 resize-none premium-scroll inner-shadow ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Describe what students will learn..."
                    />
                </div>

                {/* Thumbnail */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Presentation Image</label>
                    <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                        {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                                <ImageIcon size={24} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">No Preview</span>
                            </div>
                        )}
                        {uploadingThumbnail && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={24} className="text-primary animate-spin" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Uploading...</span>
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={thumbnailInputRef}
                        id="thumb-upload"
                        className="hidden"
                        accept="image/*"
                        disabled={isReadOnly}
                        onChange={handleThumbnailFileChange}
                    />
                    <label
                        htmlFor={isReadOnly ? "" : "thumb-upload"}
                        className={`w-full bg-slate-50 border border-slate-100 border-dashed hover:border-primary/40 hover:bg-primary/5 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 transition-all group/upload ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                        <Upload size={14} className="text-slate-400 group-hover/upload:text-primary transition-colors" />
                        <span className="text-xs font-bold text-slate-500 group-hover/upload:text-primary">{isReadOnly ? 'Image Locked' : 'Change Image'}</span>
                    </label>
                </div>

                {/* Categorization */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                        name="category"
                        value={course.category}
                        onChange={handleBasicInfoChange}
                        disabled={isReadOnly}
                        className={`w-full bg-slate-50 border-slate-100 rounded-2xl py-2.5 px-4 font-bold text-slate-700 text-sm focus:ring-primary/5 cursor-pointer appearance-none inner-shadow ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <option value="Development">Development</option>
                        <option value="Design">Design</option>
                        <option value="Business">Business</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Personal Development">Personal Development</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Level & Pricing */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proficiency Level</label>
                    <select
                        name="level"
                        value={course.level}
                        onChange={handleBasicInfoChange}
                        disabled={isReadOnly}
                        className={`w-full bg-slate-50 border-slate-100 rounded-2xl py-2 px-3 font-bold text-slate-700 text-xs focus:ring-primary/5 cursor-pointer appearance-none inner-shadow ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <IndianRupee size={10} /> Market Price
                        </label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                            <input
                                type="number"
                                name="price"
                                value={course.price}
                                readOnly={!isAdmin || isReadOnly}
                                onChange={handleBasicInfoChange}
                                className={`w-full bg-slate-50 border-slate-100 rounded-2xl py-2 pl-6 pr-2 font-bold text-slate-700 text-xs focus:ring-primary/5 inner-shadow ${(!isAdmin || isReadOnly) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <IndianRupee size={10} /> Original
                        </label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs opacity-50">₹</span>
                            <input
                                type="number"
                                name="originalPrice"
                                value={course.originalPrice || ''}
                                readOnly={!isAdmin || isReadOnly}
                                onChange={handleBasicInfoChange}
                                placeholder="Optional"
                                className={`w-full bg-slate-50 border-slate-100 rounded-2xl py-2 pl-6 pr-2 font-bold text-slate-400 italic text-xs focus:ring-primary/5 inner-shadow ${(!isAdmin || isReadOnly) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Live Discount Calculation */}
                {isAdmin && Number(course.price) > 0 && Number(course.originalPrice) > Number(course.price) && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-3 flex flex-col items-center gap-1.5"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Live Discount Calculation</p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-emerald-700 leading-none">
                                {Math.round(((Number(course.originalPrice) - Number(course.price)) / Number(course.originalPrice)) * 100)}%
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">OFF</span>
                        </div>
                        <p className="text-[8px] text-emerald-500 font-medium italic">Students will save ₹{(Number(course.originalPrice) - Number(course.price)).toLocaleString()} on this course</p>
                    </motion.div>
                )}

                {/* Duration Auto-Sync */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Course Runtime</label>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100/50">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-4 inner-shadow relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-center relative z-10">
                            <p className="text-lg font-black text-slate-800 leading-none">{course.duration || '0m'}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Calculated Time</p>
                        </div>
                        <Clock size={20} className="text-slate-200 absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Lesson Counter */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-5100 font-bold flex items-center gap-2">
                        <Layout size={14} className="text-slate-400" /> Syllabus Composition
                    </span>
                    <span className="text-slate-900 font-black px-3 py-1 bg-slate-100 rounded-xl">
                        {course.syllabus?.length || 0} Modules
                    </span>
                </div>

                {/* Tip Banner */}
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex gap-3">
                    <AlertCircle size={20} className="text-primary flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-slate-800">Quality Standard</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Courses with comprehensive descriptions and clear video lessons have 4x higher enrollment rates.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseSettings;
