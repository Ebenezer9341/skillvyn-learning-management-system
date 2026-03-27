import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, 
    Trash2, 
    Video, 
    CheckCircle, 
    ChevronUp, 
    ChevronDown, 
    Link as LinkIcon, 
    Upload, 
    FileVideo, 
    FileText, 
    Download, 
    HelpCircle, 
    Plus 
} from 'lucide-react';

const LessonEditor = ({
    activeModuleIdx,
    lesson,
    updateModule,
    confirmRemoveModule,
    parseDuration,
    updateDurationString,
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
    updateQuizOption
}) => {
    if (!lesson) return null;

    const duration = parseDuration(lesson.duration || '');

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
                {/* Top row: label + actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                        <Layers size={14} /> Lesson Unit #{activeModuleIdx + 1}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Preview toggle */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Free Preview</span>
                            <button
                                onClick={() => updateModule(activeModuleIdx, 'isPreview', !lesson.isPreview)}
                                className={`w-10 h-5 rounded-full transition-all relative cursor-pointer flex-shrink-0 ${lesson.isPreview ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${lesson.isPreview ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        {/* Delete */}
                        <button
                            onClick={() => confirmRemoveModule(activeModuleIdx)}
                            className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center border border-rose-100 cursor-pointer"
                            title="Delete this lesson"
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
                        className="w-full bg-white border-2 border-slate-100 hover:border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl font-black text-slate-800 text-xl py-4 px-5 placeholder:text-slate-200 transition-all outline-none"
                        placeholder="Enter lesson title..."
                    />
                </div>

                {/* Duration row */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estimated Duration</label>
                    <div className="flex items-center gap-3">
                        {[
                            { key: 'd', label: 'Days', val: duration.d, max: undefined },
                            { key: 'h', label: 'Hours', val: duration.h, max: 23 },
                            { key: 'm', label: 'Mins', val: duration.m, max: 59 },
                        ].map(({ key, label, val, max }) => (
                            <div key={key} className="relative flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max={max}
                                    value={val}
                                    onChange={(e) => updateDurationString(activeModuleIdx, key, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 hover:border-blue-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 rounded-xl py-3 px-3 text-sm font-black text-slate-700 transition-all text-center outline-none"
                                />
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-300 uppercase tracking-wider whitespace-nowrap">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Segments */}
            <div className="space-y-12 pb-10">
                {/* 1. Video Segment */}
                <div className="space-y-6">
                    <div
                        className="flex items-center justify-between cursor-pointer group/header"
                        onClick={() => toggleSection('video')}
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] bg-blue-50/50 w-fit px-3 py-1 rounded-full border border-blue-100/50">
                            <Video size={16} /> Lecture Video (Optional)
                        </div>
                        <div className="flex items-center gap-3">
                            {lesson.video?.url && <CheckCircle size={14} className="text-emerald-500" />}
                            <div className={`p-1.5 rounded-lg transition-all ${expandedSections.video ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                {expandedSections.video ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedSections.video && (
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
                                            updateModule(activeModuleIdx, 'video.sourceType', 'link');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${(lesson.video?.sourceType || 'link') === 'link'
                                            ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200'
                                            : 'text-slate-400 hover:text-slate-600'
                                            } cursor-pointer`}
                                    >
                                        <LinkIcon size={12} /> External Link
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            updateModule(activeModuleIdx, 'video.sourceType', 'upload');
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${lesson.video?.sourceType === 'upload'
                                            ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200'
                                            : 'text-slate-400 hover:text-slate-600'
                                            } cursor-pointer`}
                                    >
                                        <Upload size={12} /> Local File
                                    </button>
                                </div>

                                <div className="bg-slate-50/30 p-8 rounded-[2rem] border border-slate-50 transition-all">
                                    {(lesson.video?.sourceType || 'link') === 'link' ? (
                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-slate-500 uppercase ml-1">Streaming Link</label>
                                                <div className="relative">
                                                    <LinkIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={lesson.video?.url || ''}
                                                        onChange={(e) => updateModule(activeModuleIdx, 'video.url', e.target.value)}
                                                        className="w-full bg-white border border-slate-100 rounded-2xl text-sm py-3.5 pl-14 pr-5 focus:ring-2 focus:ring-blue-500/10 shadow-sm font-medium inner-shadow"
                                                        placeholder="YouTube, Vimeo, or direct mp4 link"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
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
                                                        !uploadingVideo && videoInputRef.current?.click();
                                                    }}
                                                    className={`group cursor-pointer border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${uploadingVideo ? 'bg-blue-50/20 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-blue-50/30'
                                                        }`}
                                                >
                                                    {uploadingVideo ? (
                                                        <div className="space-y-4">
                                                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                                                                <Upload className="text-blue-600 animate-bounce" size={32} />
                                                            </div>
                                                            <div className="max-w-[200px] mx-auto">
                                                                <div className="flex justify-between text-[10px] font-black text-blue-600 mb-2 uppercase">
                                                                    <span>Uploading</span>
                                                                    <span>{uploadProgress}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${uploadProgress}%` }}
                                                                        className="h-full bg-blue-600 rounded-full"
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
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Uploaded Resource</p>
                                                        <p className="text-sm font-bold text-slate-800 truncate">
                                                            {lesson.video.url.split('/').pop()}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }}
                                                                className="text-[10px] font-black text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer"
                                                            >
                                                                Replace File
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateModule(activeModuleIdx, 'video.url', ''); }}
                                                                className="text-[10px] font-black text-rose-500 hover:text-rose-600 underline underline-offset-4 cursor-pointer"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
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

                {/* 2. Text Segment */}
                <div className="space-y-6">
                    <div
                        className="flex items-center justify-between cursor-pointer group/header"
                        onClick={() => toggleSection('text')}
                    >
                        <div className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] bg-purple-50/50 w-fit px-3 py-1 rounded-full border border-purple-100/50">
                            <FileText size={16} /> Lesson Content (Optional)
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
                                        className="w-full bg-white border-none rounded-[1.8rem] text-sm py-8 px-8 focus:ring-purple-500/5 min-h-[300px] font-medium leading-loose shadow-sm inner-shadow premium-scroll"
                                        placeholder="Share the knowledge here..."
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
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-50/50 w-fit px-3 py-1 rounded-full border border-emerald-100/50">
                            <Download size={16} /> Downloadable Resource (Optional)
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
                                            } cursor-pointer`}
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
                                            } cursor-pointer`}
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
                                                        className="w-full bg-white border border-slate-100 rounded-2xl text-sm py-3.5 pl-14 pr-5 focus:ring-2 focus:ring-emerald-500/10 shadow-sm font-medium inner-shadow"
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
                                                        className="w-full bg-white border border-slate-100 rounded-2xl text-sm py-3.5 pl-14 pr-5 focus:ring-2 focus:ring-emerald-500/10 shadow-sm font-medium inner-shadow"
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
                                                    onClick={() => !uploadingAsset && assetInputRef.current?.click()}
                                                    className={`group cursor-pointer border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${uploadingAsset ? 'bg-emerald-50/20 border-emerald-200' : 'bg-white border-slate-100 hover:border-emerald-400 hover:bg-emerald-50/30'
                                                        }`}
                                                >
                                                    {uploadingAsset ? (
                                                        <div className="space-y-4">
                                                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                                                                <Upload className="text-emerald-600 animate-bounce" size={32} />
                                                            </div>
                                                            <div className="max-w-[200px] mx-auto">
                                                                <div className="flex justify-between text-[10px] font-black text-emerald-600 mb-2 uppercase">
                                                                    <span>Uploading</span>
                                                                    <span>{assetUploadProgress}%</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${assetUploadProgress}%` }}
                                                                        className="h-full bg-emerald-600 rounded-full"
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
                            <HelpCircle size={16} /> Lesson Quiz (Optional)
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
                                <div className="flex justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); addQuizQuestion(activeModuleIdx); }}
                                        className="text-[10px] font-black text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-all active:scale-95 cursor-pointer"
                                    >
                                        + New Question
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {lesson.quiz?.map((q, qIdx) => (
                                        <div key={qIdx} className="p-8 bg-slate-50/30 rounded-[2.5rem] border border-slate-50 relative group/q hover:bg-white transition-all border-l-4 border-l-amber-200">
                                            <button
                                                onClick={() => removeQuizQuestion(activeModuleIdx, qIdx)}
                                                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-all cursor-pointer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-amber-500 uppercase ml-1">Question {qIdx + 1}</label>
                                                    <input
                                                        type="text"
                                                        value={q.question}
                                                        onChange={(e) => updateQuizQuestion(activeModuleIdx, qIdx, 'question', e.target.value)}
                                                        className="w-full bg-white border border-slate-100 rounded-[1.5rem] text-sm py-4 px-6 focus:ring-2 focus:ring-amber-500/10 font-bold text-slate-800 shadow-sm inner-shadow"
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
                                                                onChange={() => updateQuizQuestion(activeModuleIdx, qIdx, 'correctAnswer', oIdx)}
                                                                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-slate-200 cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => updateQuizOption(activeModuleIdx, qIdx, oIdx, e.target.value)}
                                                                className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-700 placeholder:text-slate-200 focus:ring-0 focus:outline-none min-w-0"
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
