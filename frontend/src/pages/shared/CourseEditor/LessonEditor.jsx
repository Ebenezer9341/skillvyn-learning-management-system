import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers,
    Trash2,
    Video,
    CheckCircle,
    ChevronUp,
    ChevronDown,
    Upload,
    FileVideo,
    FileText,
    Download,
    HelpCircle,
    Plus,
    LinkIcon,
    Eye,
    BookOpen
} from 'lucide-react';

const LessonEditor = ({
    activeModuleIdx,
    lessonDisplayNumber,
    lesson,
    updateModule,
    confirmRemoveModule,
    toggleSection,
    expandedSections,
    videoInputRef,
    handleVideoFileChange,
    uploadingVideo,
    uploadProgress,
    assetInputRef,
    handleAssetFileChange,
    uploadingAsset,
    assetUploadProgress,
    addQuizQuestion,
    removeQuizQuestion,
    updateQuizQuestion,
    updateQuizOption,
    isReadOnly
}) => {
    if (!lesson) return null;

    return (
        <motion.div
            key={activeModuleIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-10 space-y-12"
        >
            {/* Editor Header */}
            <div className="pb-8 border-b border-slate-100 space-y-6">
                {/* Top row: section badge + actions */}
                <div className="flex items-center justify-between">
                    {/* Section indicator — updates live when toggled */}
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${
                        lesson.isPreview
                            ? 'text-accent bg-accent/5 border-accent/15'
                            : 'text-primary bg-primary/5 border-primary/10'
                    }`}>
                        {lesson.isPreview
                            ? <><Eye size={13} /> Course Preview #{lessonDisplayNumber}</>  
                            : <><BookOpen size={13} /> Lesson #{lessonDisplayNumber}</>
                        }
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Preview toggle */}
                        <div
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all ${
                                lesson.isPreview
                                    ? 'bg-accent/5 border-accent/20'
                                    : 'bg-slate-50 border-slate-100 hover:border-accent/20 hover:bg-accent/5'
                            } ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                            title={isReadOnly ? 'Course locked' : (lesson.isPreview
                                ? 'This lesson is in the Course Previews section. Toggle off to move it back to Lessons.'
                                : 'Toggle on to move this lesson into the Course Previews section.')}
                            onClick={() => !isReadOnly && updateModule(activeModuleIdx, 'isPreview', !lesson.isPreview)}
                        >
                            <Eye size={12} className={lesson.isPreview ? 'text-accent' : 'text-slate-400'} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                                lesson.isPreview ? 'text-accent' : 'text-slate-400'
                            }`}>
                                {lesson.isPreview ? 'In Previews' : 'Set as Preview'}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (!isReadOnly) updateModule(activeModuleIdx, 'isPreview', !lesson.isPreview); }}
                                disabled={isReadOnly}
                                className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                                    lesson.isPreview ? 'bg-accent' : 'bg-slate-200'
                                } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                                    lesson.isPreview ? 'right-0.5' : 'left-0.5'
                                }`} />
                            </button>
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => !isReadOnly && confirmRemoveModule(activeModuleIdx)}
                            disabled={isReadOnly}
                            className={`p-2 rounded-2xl transition-all flex items-center justify-center border transition-all ${
                                isReadOnly 
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                                : 'bg-rose-50 text-rose-400 border-rose-100 hover:bg-rose-100 hover:text-rose-600 active:scale-95'
                            }`}
                            title={isReadOnly ? "Course locked" : "Delete this lesson"}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Title — full width, clearly visible */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lesson Title</label>
                    <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateModule(activeModuleIdx, 'title', e.target.value)}
                        disabled={isReadOnly}
                        className={`w-full bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-800 text-xl py-4 px-5 placeholder:text-slate-200 transition-all outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70 bg-slate-50/50' : 'hover:border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/5'}`}
                        placeholder="Enter lesson title..."
                    />
                </div>

                {/* Duration row — auto-calculated from video */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lesson Duration</label>
                    {lesson.duration ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-2xl font-black text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {lesson.duration}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Auto-detected from video</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 border-dashed text-slate-400 px-4 py-2.5 rounded-2xl font-medium text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Duration will be auto-detected once a video is uploaded
                        </div>
                    )}
                </div>
            </div>

            {/* Content Segments */}
            <div className="space-y-12 pb-10">
                {/* 1. Video Segment — Required */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                                <Video size={16} /> Lecture Video
                            </div>
                            {!lesson.video?.url && (
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">Required</span>
                            )}
                        </div>
                        {lesson.video?.url && <CheckCircle size={16} className="text-emerald-500" />}
                    </div>

                    <div className="bg-slate-50/30 p-8 rounded-[2rem] border border-slate-50 transition-all">
                        <div className="space-y-6">
                            <input
                                type="file"
                                ref={videoInputRef}
                                onChange={handleVideoFileChange}
                                className="hidden"
                                accept="video/mp4,video/x-m4v,video/*"
                            />
                            {!lesson.video?.url || uploadingVideo ? (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        !uploadingVideo && !isReadOnly && videoInputRef.current?.click();
                                    }}
                                    className={`group border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                                        uploadingVideo ? 'bg-primary/5 border-primary/20' : 
                                        isReadOnly ? 'bg-slate-50/30 border-slate-100 cursor-not-allowed opacity-60' :
                                        'bg-white border-rose-100 hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                                    }`}
                                >
                                    {uploadingVideo ? (
                                        <div className="space-y-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                                                <Upload className="text-primary animate-bounce" size={32} />
                                            </div>
                                            <div className="max-w-[200px] mx-auto">
                                                <div className="flex justify-between text-[10px] font-black text-primary mb-2 uppercase">
                                                    <span>Uploading</span>
                                                    <span>{uploadProgress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${uploadProgress}%` }}
                                                        className="h-full bg-primary rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 group-hover:bg-white rounded-2xl flex items-center justify-center mx-auto transition-colors shadow-sm">
                                                <FileVideo className="text-slate-400 group-hover:text-blue-500" size={32} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-700">Click to upload lesson video</p>
                                                <p className="text-xs text-slate-400 mt-1 font-medium">MP4 or MOV preferred (Max 500MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-6 bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                        <CheckCircle className="text-emerald-500" size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Uploaded Video</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">
                                            {lesson.video.url.split('/').pop()}
                                        </p>
                                        {!isReadOnly && (
                                            <div className="flex items-center gap-3 mt-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }}
                                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer"
                                                >
                                                    Replace File
                                                </button>
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        updateModule(activeModuleIdx, 'video.url', ''); 
                                                        updateModule(activeModuleIdx, 'duration', '');
                                                    }}
                                                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4 cursor-pointer"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Text Segment */}
                <div className="space-y-6">
                    <div
                        className="flex items-center justify-between cursor-pointer group/header"
                        onClick={() => toggleSection('text')}
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-secondary uppercase tracking-[0.3em] bg-secondary/5 w-fit px-3 py-1 rounded-full border border-secondary/10">
                            <FileText size={16} /> Lesson Content
                        </div>
                        <div className="flex items-center gap-3">
                            {lesson.text?.content && <CheckCircle size={14} className="text-emerald-500" />}
                            <div className={`p-1.5 rounded-lg transition-all ${expandedSections.text ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                {expandedSections.text ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedSections.text && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-slate-50/30 p-1 rounded-[2rem] border border-slate-50">
                                    <textarea
                                        value={lesson.text?.content || ''}
                                        onChange={(e) => updateModule(activeModuleIdx, 'text.content', e.target.value)}
                                        disabled={isReadOnly}
                                        className={`w-full bg-white border-none rounded-[1.8rem] text-sm py-8 px-8 min-h-[300px] font-medium leading-loose shadow-sm inner-shadow premium-scroll outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70 bg-slate-50/20' : 'focus:ring-purple-500/5'}`}
                                        placeholder={isReadOnly ? "No content provided." : "Share the knowledge here..."}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. Asset Segment */}
                <div className="space-y-6">
                    <div
                        className="flex items-center justify-between cursor-pointer group/header"
                        onClick={() => toggleSection('asset')}
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-[0.3em] bg-accent/5 w-fit px-3 py-1 rounded-full border border-accent/10">
                            <Download size={16} /> Downloadable Resource
                        </div>
                        <div className="flex items-center gap-3">
                            {lesson.asset?.url && <CheckCircle size={14} className="text-emerald-500" />}
                            <div className={`p-1.5 rounded-lg transition-all ${expandedSections.asset ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                {expandedSections.asset ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedSections.asset && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-6"
                            >
                                <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50 w-fit">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            updateModule(activeModuleIdx, 'asset.sourceType', 'link');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${(lesson.asset?.sourceType || 'link') === 'link'
                                            ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-slate-200'
                                            : 'text-slate-400 hover:text-slate-600'
                                            } ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        disabled={isReadOnly}
                                    >
                                        <LinkIcon size={12} /> External Link
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            updateModule(activeModuleIdx, 'asset.sourceType', 'upload');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lesson.asset?.sourceType === 'upload'
                                            ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-slate-200'
                                            : 'text-slate-400 hover:text-slate-600'
                                            } ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        disabled={isReadOnly}
                                    >
                                        <Upload size={12} /> Local File
                                    </button>
                                </div>

                                <div className="bg-slate-50/30 p-8 rounded-[2rem] border border-slate-50 transition-all">
                                    {(lesson.asset?.sourceType || 'link') === 'link' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase ml-1">Asset Link</label>
                                                <div className="relative">
                                                    <LinkIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={lesson.asset?.url || ''}
                                                        onChange={(e) => updateModule(activeModuleIdx, 'asset.url', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className={`w-full bg-white border border-slate-100 rounded-2xl text-sm py-3.5 pl-14 pr-5 shadow-sm font-medium inner-shadow outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70 bg-slate-50/50' : 'focus:ring-2 focus:ring-emerald-500/10'}`}
                                                        placeholder="URL to files"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase ml-1">Asset Name</label>
                                                <div className="relative">
                                                    <FileText size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={lesson.asset?.name || ''}
                                                        onChange={(e) => updateModule(activeModuleIdx, 'asset.name', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className={`w-full bg-white border border-slate-100 rounded-2xl text-sm py-3.5 pl-14 pr-5 shadow-sm font-medium inner-shadow outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70 bg-slate-50/50' : 'focus:ring-2 focus:ring-emerald-500/10'}`}
                                                        placeholder="e.g. Workbook.pdf"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <input
                                                type="file"
                                                ref={assetInputRef}
                                                onChange={handleAssetFileChange}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.zip,.rar,.ppt,.pptx,.txt,image/*"
                                            />

                                            {!lesson.asset?.url || uploadingAsset ? (
                                                <div
                                                    onClick={() => !uploadingAsset && !isReadOnly && assetInputRef.current?.click()}
                                                    className={`group border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                                                        uploadingAsset ? 'bg-accent/5 border-accent/20' : 
                                                        isReadOnly ? 'bg-slate-50/30 border-slate-100 cursor-not-allowed opacity-60' :
                                                        'bg-white border-slate-100 hover:border-accent/40 hover:bg-accent/5 cursor-pointer'
                                                    }`}
                                                >
                                                    {uploadingAsset ? (
                                                        <div className="space-y-4">
                                                            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                                                                <Upload className="text-accent animate-bounce" size={32} />
                                                            </div>
                                                            <div className="max-w-[200px] mx-auto">
                                                                <div className="flex justify-between text-[10px] font-black text-accent mb-2 uppercase">
                                                                    <span>Uploading</span>
                                                                    <span>{assetUploadProgress}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${assetUploadProgress}%` }}
                                                                        className="h-full bg-accent rounded-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="w-16 h-16 bg-slate-50 group-hover:bg-white rounded-2xl flex items-center justify-center mx-auto transition-colors shadow-sm">
                                                                <Plus className="text-slate-400 group-hover:text-emerald-500" size={32} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-700">Click to upload resource file</p>
                                                                <p className="text-xs text-slate-400 mt-1 font-medium">PDF, DOC, ZIP or Images (Max 100MB)</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-6 bg-white p-6 rounded-[1.8rem] border border-slate-100 shadow-sm">
                                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                                        <CheckCircle className="text-emerald-500" size={28} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Uploaded Resource</p>
                                                        <p className="text-sm font-bold text-slate-800 truncate">
                                                            {lesson.asset.name || lesson.asset.url.split('/').pop()}
                                                        </p>
                                                        {!isReadOnly && (
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <button
                                                                    onClick={() => assetInputRef.current?.click()}
                                                                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
                                                                >
                                                                    Replace File
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        updateModule(activeModuleIdx, 'asset.url', '');
                                                                        updateModule(activeModuleIdx, 'asset.name', '');
                                                                    }}
                                                                    className="text-[10px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4 cursor-pointer"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 4. Quiz Segment */}
                <div className="space-y-6">
                    <div
                        className="flex items-center justify-between cursor-pointer group/header"
                        onClick={() => toggleSection('quiz')}
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] bg-amber-50/50 w-fit px-3 py-1 rounded-full border border-amber-100/50">
                            <HelpCircle size={16} /> Lesson Quiz
                        </div>
                        <div className="flex items-center gap-3">
                            {lesson.quiz?.length > 0 && (
                                <div className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-200">
                                    {lesson.quiz.length} Qs
                                </div>
                            )}
                            <div className={`p-1.5 rounded-lg transition-all ${expandedSections.quiz ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                {expandedSections.quiz ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedSections.quiz && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-6"
                            >
                                {!isReadOnly && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addQuizQuestion(activeModuleIdx); }}
                                            className="text-[10px] font-black text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-all active:scale-95 cursor-pointer"
                                        >
                                            + New Question
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {lesson.quiz?.map((q, qIdx) => (
                                        <div key={qIdx} className="p-8 bg-slate-50/30 rounded-[2.5rem] border border-slate-50 relative group/q hover:bg-white transition-all border-l-4 border-l-amber-200">
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => removeQuizQuestion(activeModuleIdx, qIdx)}
                                                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-amber-500 uppercase ml-1">Question {qIdx + 1}</label>
                                                    <input
                                                        type="text"
                                                        value={q.question}
                                                        onChange={(e) => updateQuizQuestion(activeModuleIdx, qIdx, 'question', e.target.value)}
                                                        disabled={isReadOnly}
                                                        className={`w-full bg-white border border-slate-100 rounded-[1.5rem] text-sm py-4 px-6 font-bold text-slate-800 shadow-sm inner-shadow outline-none ${isReadOnly ? 'cursor-not-allowed opacity-70 bg-slate-50/50' : 'focus:ring-2 focus:ring-amber-500/10'}`}
                                                        placeholder="What is the key takeaway?"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${q.correctAnswer === oIdx
                                                            ? 'bg-emerald-50 border-emerald-200 ring-4 ring-emerald-500/5'
                                                            : 'bg-white border-slate-100 shadow-sm'
                                                            }`}>
                                                            <input
                                                                type="radio"
                                                                name={`q-${activeModuleIdx}-${qIdx}`}
                                                                checked={q.correctAnswer === oIdx}
                                                                disabled={isReadOnly}
                                                                onChange={() => !isReadOnly && updateQuizQuestion(activeModuleIdx, qIdx, 'correctAnswer', oIdx)}
                                                                className={`w-5 h-5 text-emerald-600 border-slate-200 ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'focus:ring-emerald-500 cursor-pointer'}`}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => updateQuizOption(activeModuleIdx, qIdx, oIdx, e.target.value)}
                                                                disabled={isReadOnly}
                                                                className={`flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-700 placeholder:text-slate-200 focus:ring-0 focus:outline-none min-w-0 ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                                                                placeholder={`Option ${oIdx + 1}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {lesson.quiz?.length === 0 && (
                                        <div className="py-10 text-center bg-slate-50/20 rounded-[2rem] border border-dashed border-slate-200">
                                            <p className="text-sm font-bold text-slate-400">Add a quiz to test knowledge.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default LessonEditor;
