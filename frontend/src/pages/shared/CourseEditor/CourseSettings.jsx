import React from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    ChevronDown,
    Zap,
    Layout,
    AlertCircle,
    Image as ImageIcon,
    Upload,
    RefreshCw,
    Link as LinkIcon,
    Edit2,
    IndianRupee
} from 'lucide-react';

const CourseSettings = ({
    course,
    setCourse,
    handleBasicInfoChange,
    thumbnailInputRef,
    handleThumbnailFileChange,
    uploadingThumbnail,
    thumbMode,
    setThumbMode
}) => {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Settings size={20} className="text-slate-400" /> Course Settings
            </h3>

            <div className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Title</label>
                    <div className="relative group">
                        <input
                            type="text"
                            name="title"
                            value={course.title}
                            onChange={handleBasicInfoChange}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-700 text-sm focus:ring-blue-500/10 inner-shadow"
                            placeholder="Enter course title..."
                        />
                        <Edit2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Status</label>
                    <div className="relative">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                            course.status === 'published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                            course.status === 'archived' ? 'bg-slate-400' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        }`} />
                        <select
                            name="status"
                            value={course.status}
                            onChange={handleBasicInfoChange}
                            className="w-full bg-slate-50 border-slate-100 rounded-xl py-2.5 pl-8 pr-4 font-bold text-slate-700 text-sm focus:ring-blue-500/10 cursor-pointer appearance-none inner-shadow"
                        >
                            <option value="draft">Draft (Private)</option>
                            <option value="published">Published (Live)</option>
                            <option value="archived">Archived</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Description</label>
                    <textarea
                        name="description"
                        value={course.description}
                        onChange={handleBasicInfoChange}
                        rows="4"
                        className="w-full bg-slate-50 border-slate-100 rounded-xl py-2.5 px-4 font-medium text-slate-700 text-sm focus:ring-blue-500/10 resize-none premium-scroll inner-shadow"
                        placeholder="Describe what students will learn in this course..."
                    />
                </div>

                {/* Thumbnail */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Thumbnail</label>

                    <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                        {course.thumbnail ? (
                            <img src={course.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                                <ImageIcon size={24} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">No Preview</span>
                            </div>
                        )}
                        {uploadingThumbnail && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={24} className="text-blue-500 animate-spin" />
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Uploading...</span>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setThumbMode('url')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${thumbMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            URL
                        </button>
                        <button
                            onClick={() => setThumbMode('upload')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${thumbMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Upload
                        </button>
                    </div>

                    {thumbMode === 'url' ? (
                        <div className="relative group">
                            <input
                                type="text"
                                name="thumbnail"
                                value={course.thumbnail}
                                onChange={handleBasicInfoChange}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full bg-slate-50 border-slate-100 rounded-xl py-2.5 px-4 pr-10 font-medium text-slate-700 text-xs focus:ring-blue-500/10 inner-shadow"
                            />
                            <LinkIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="relative group">
                            <input
                                type="file"
                                ref={thumbnailInputRef}
                                id="thumb-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleThumbnailFileChange}
                            />
                            <label
                                htmlFor="thumb-upload"
                                className="w-full bg-slate-50 border border-slate-100 border-dashed hover:border-blue-400 hover:bg-blue-50/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all group/upload"
                            >
                                <Upload size={14} className="text-slate-400 group-hover/upload:text-blue-500 transition-colors" />
                                <span className="text-xs font-bold text-slate-500 group-hover/upload:text-blue-600">Choose Image File</span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                        name="category"
                        value={course.category}
                        onChange={handleBasicInfoChange}
                        className="w-full bg-slate-50 border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-700 text-sm focus:ring-blue-500/10 cursor-pointer inner-shadow"
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
                    <select
                        name="level"
                        value={course.level}
                        onChange={handleBasicInfoChange}
                        className="w-full bg-slate-50 border-slate-100 rounded-xl py-2 px-3 font-bold text-slate-700 text-xs focus:ring-blue-500/10 cursor-pointer inner-shadow"
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <IndianRupee size={10} /> Sale Price
                        </label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                            <input
                                type="number"
                                name="price"
                                value={course.price}
                                onChange={handleBasicInfoChange}
                                className="w-full bg-slate-50 border-slate-100 rounded-xl py-2 pl-6 pr-2 font-bold text-slate-700 text-xs focus:ring-blue-500/10 inner-shadow"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                            <IndianRupee size={10} /> Anchor
                        </label>
                        <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs opacity-50">₹</span>
                            <input
                                type="number"
                                name="originalPrice"
                                value={course.originalPrice || ''}
                                onChange={handleBasicInfoChange}
                                placeholder="Optional"
                                className="w-full bg-slate-50 border-slate-100 rounded-xl py-2 pl-6 pr-2 font-bold text-slate-400 italic text-xs focus:ring-blue-500/10 inner-shadow"
                            />
                        </div>
                    </div>
                </div>

                {course.originalPrice && Number(course.originalPrice) < Number(course.price) && (
                    <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={10} strokeWidth={3} /> Sale price exceeds anchor price
                    </p>
                )}

                {/* Auto-calculated Duration */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Duration</label>
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Zap size={10} /> Auto-Sync
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-4 inner-shadow">
                        <div className="text-center">
                            <p className="text-lg font-black text-slate-800 leading-none">{course.duration || '0m'}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Total Time</p>
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold ml-1 italic">
                        * Duration is automatically summed from all lesson units.
                    </p>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold flex items-center gap-2">
                            <Layout size={14} /> Lessons count
                        </span>
                        <span className="text-slate-900 font-black px-2 py-0.5 bg-slate-100 rounded-md">
                            {course.syllabus.length}
                        </span>
                    </div>
                </div>

                {/* Tip Banner */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                    <div className="flex gap-3">
                        <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-amber-800">Launch Tip</p>
                            <p className="text-[10px] text-amber-700/80 mt-1 leading-relaxed">
                                Make sure to have at least 5 lessons before publishing for better conversion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseSettings;
