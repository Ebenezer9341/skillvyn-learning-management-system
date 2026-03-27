import React from 'react';
import { 
    Plus, 
    Video, 
    FileText, 
    Download, 
    HelpCircle, 
    Award, 
    Edit2 
} from 'lucide-react';

const SyllabusSidebar = ({ 
    syllabus, 
    activeModuleIdx, 
    setActiveModuleIdx, 
    addModule, 
    certification 
}) => {
    return (
        <div className="w-full md:w-72 bg-slate-50/50 border-r border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus List</span>
                <button
                    onClick={(e) => {
                        addModule(e);
                        setActiveModuleIdx(syllabus.length);
                    }}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100 cursor-pointer"
                    title="Add new lesson"
                >
                    <Plus size={16} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto premium-scroll p-3 space-y-1">
                {syllabus.map((module, mIdx) => (
                    <button
                        key={mIdx}
                        onClick={() => setActiveModuleIdx(mIdx)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all group text-left cursor-pointer ${
                            activeModuleIdx === mIdx
                                ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100 ring-4 ring-blue-50'
                                : 'hover:bg-white/60 text-slate-500'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                            activeModuleIdx === mIdx 
                                ? 'bg-blue-600 text-white scale-110' 
                                : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                        }`}>
                            {mIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0 pr-6 relative overflow-hidden group/title">
                            <p className={`text-sm font-black truncate ${activeModuleIdx === mIdx ? 'text-slate-900' : 'text-slate-600'}`}>
                                {module.title || `Untitled Lesson ${mIdx + 1}`}
                            </p>
                            <Edit2 size={10} className="absolute right-0 top-1 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-2 mt-1">
                                {module.video?.url && <Video size={10} className="text-blue-400" />}
                                {module.text?.content && <FileText size={10} className="text-purple-400" />}
                                {module.asset?.url && <Download size={10} className="text-emerald-400" />}
                                {module.quiz?.length > 0 && <HelpCircle size={10} className="text-amber-400" />}
                                {module.isPreview && <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-1 rounded ml-1">Free</span>}
                            </div>
                        </div>
                    </button>
                ))}

                {/* Post-Course Actions / Certification */}
                <div className="pt-4 mt-6 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2 block">Post-Course Actions</span>
                    <button
                        onClick={() => setActiveModuleIdx('cert')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all group text-left cursor-pointer ${
                            activeModuleIdx === 'cert'
                                ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100 ring-4 ring-blue-50'
                                : 'hover:bg-white/60 text-slate-500'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                            activeModuleIdx === 'cert' 
                                ? 'bg-indigo-600 text-white scale-110' 
                                : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                        }`}>
                            <Award size={16} />
                        </div>
                        <div className="flex-1 min-w-0 pr-6 relative overflow-hidden group/title">
                            <p className={`text-sm font-black truncate ${activeModuleIdx === 'cert' ? 'text-slate-900' : 'text-slate-600'}`}>
                                Certification Hub
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                {certification?.enabled ? (
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">Active</span>
                                ) : (
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">Disabled</span>
                                )}
                            </div>
                        </div>
                    </button>
                </div>

                {syllabus.length === 0 && (
                    <div className="py-12 px-6 text-center">
                        <p className="text-xs font-bold text-slate-400 italic">No lessons yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyllabusSidebar;
