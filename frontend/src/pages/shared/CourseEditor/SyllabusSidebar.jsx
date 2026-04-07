import React, { useState } from 'react';
import { 
    Plus, 
    Video, 
    FileText, 
    Download, 
    HelpCircle, 
    Award, 
    Edit2,
    Eye,
    BookOpen,
    ChevronDown,
    ChevronRight
} from 'lucide-react';

// Reusable lesson row used in both sections
const LessonRow = ({ module, mIdx, displayNumber, activeModuleIdx, setActiveModuleIdx, isPreviewSection }) => {
    const isActive = activeModuleIdx === mIdx;
    const accentColor = isPreviewSection ? 'text-accent' : 'text-primary';
    const activeBg = isPreviewSection
        ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100 ring-4 ring-accent/5'
        : 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100 ring-4 ring-primary/5';
    const activeIcon = isPreviewSection
        ? 'bg-accent text-white scale-110'
        : 'bg-primary text-white scale-110';
    const hoverIcon = isPreviewSection
        ? 'bg-slate-100 text-slate-400 group-hover:bg-accent/5 group-hover:text-accent'
        : 'bg-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary';

    return (
        <button
            key={mIdx}
            onClick={() => setActiveModuleIdx(mIdx)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all group text-left cursor-pointer ${
                isActive ? activeBg : 'hover:bg-white/60 text-slate-500'
            }`}
        >
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                isActive ? activeIcon : hoverIcon
            }`}>
                {isPreviewSection ? <Eye size={14} /> : displayNumber}
            </div>
            <div className="flex-1 min-w-0 pr-6 relative overflow-hidden group/title">
                <p className={`text-sm font-black truncate ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                    {module.title || (isPreviewSection ? `Preview ${mIdx + 1}` : `Untitled Lesson ${mIdx + 1}`)}
                </p>
                {!module.isReadOnly && <Edit2 size={10} className="absolute right-0 top-1 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />}
                <div className="flex items-center gap-2 mt-1">
                    {module.video?.url && <Video size={10} className={accentColor} />}
                    {module.text?.content && <FileText size={10} className="text-purple-400" />}
                    {module.asset?.url && <Download size={10} className="text-emerald-400" />}
                    {module.quiz?.length > 0 && <HelpCircle size={10} className="text-amber-400" />}
                    {module.duration && (
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                            {module.duration}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

// Collapsible section wrapper
const SidebarSection = ({ label, icon: Icon, iconColor, count, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="space-y-1">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100/80 transition-all group cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <Icon size={11} className={iconColor} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${iconColor}`}>{label}</span>
                    {count > 0 && (
                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">
                            {count}
                        </span>
                    )}
                </div>
                {open
                    ? <ChevronDown size={11} className="text-slate-400" />
                    : <ChevronRight size={11} className="text-slate-400" />
                }
            </button>
            {open && <div className="space-y-1">{children}</div>}
        </div>
    );
};

const SyllabusSidebar = ({ 
    syllabus, 
    activeModuleIdx, 
    setActiveModuleIdx, 
    addModule, 
    certification,
    isReadOnly
}) => {
    // Split into two groups, keeping original indices intact
    const previewLessons = syllabus
        .map((module, mIdx) => ({ module, mIdx }))
        .filter(({ module }) => module.isPreview);

    const regularLessons = syllabus
        .map((module, mIdx) => ({ module, mIdx }))
        .filter(({ module }) => !module.isPreview);

    return (
        <div className="w-full md:w-72 bg-slate-50/50 border-r border-slate-100 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Builder</span>
                <button
                    onClick={(e) => {
                        if (isReadOnly) return;
                        addModule(e);
                        setActiveModuleIdx(syllabus.length);
                    }}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-2xl transition-all shadow-md cursor-pointer ${
                        isReadOnly 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/10'
                    }`}
                    title={isReadOnly ? "Course locked" : "Add new lesson"}
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto premium-scroll p-3 space-y-4">

                {/* ── PREVIEW SECTION ── */}
                <SidebarSection
                    label="Course Previews"
                    icon={Eye}
                    iconColor="text-accent"
                    count={previewLessons.length}
                    defaultOpen={true}
                >
                    {previewLessons.length > 0 ? (
                        previewLessons.map(({ module, mIdx }, sectionIdx) => (
                            <LessonRow
                                key={mIdx}
                                module={module}
                                mIdx={mIdx}
                                displayNumber={sectionIdx + 1}
                                activeModuleIdx={activeModuleIdx}
                                setActiveModuleIdx={setActiveModuleIdx}
                                isPreviewSection={true}
                            />
                        ))
                    ) : (
                        <div className="py-4 px-3 text-center">
                            <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">
                                Toggle "Free Preview" on a lesson to add it here.
                            </p>
                        </div>
                    )}
                </SidebarSection>

                {/* Divider */}
                <div className="h-px bg-slate-100 mx-2" />

                {/* ── LESSONS SECTION ── */}
                <SidebarSection
                    label="Lessons"
                    icon={BookOpen}
                    iconColor="text-primary"
                    count={regularLessons.length}
                    defaultOpen={true}
                >
                    {regularLessons.length > 0 ? (
                        regularLessons.map(({ module, mIdx }, sectionIdx) => (
                            <LessonRow
                                key={mIdx}
                                module={module}
                                mIdx={mIdx}
                                displayNumber={sectionIdx + 1}
                                activeModuleIdx={activeModuleIdx}
                                setActiveModuleIdx={setActiveModuleIdx}
                                isPreviewSection={false}
                            />
                        ))
                    ) : (
                        <div className="py-4 px-3 text-center">
                            <p className="text-[10px] font-bold text-slate-400 italic">No lessons yet.</p>
                        </div>
                    )}
                </SidebarSection>

                {/* ── POST-COURSE ACTIONS ── */}
                <div className="pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-3 mb-2 flex items-center gap-1.5">
                        <Award size={10} className="text-slate-300" /> Post-Course
                    </span>
                    <button
                        onClick={() => setActiveModuleIdx('cert')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all group text-left cursor-pointer ${
                            activeModuleIdx === 'cert'
                                ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100 ring-4 ring-primary/5'
                                : 'hover:bg-white/60 text-slate-500'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
                            activeModuleIdx === 'cert' 
                                ? 'bg-accent text-white scale-110' 
                                : 'bg-slate-100 text-slate-400 group-hover:bg-accent/5 group-hover:text-accent'
                        }`}>
                            <Award size={16} />
                        </div>
                        <div className="flex-1 min-w-0 pr-6 relative overflow-hidden group/title">
                            <p className={`text-sm font-black truncate ${activeModuleIdx === 'cert' ? 'text-slate-900' : 'text-slate-600'}`}>
                                Certification Hub
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                {certification?.enabled ? (
                                    <span className="text-[8px] font-black text-accent uppercase tracking-widest bg-accent/5 px-1.5 py-0.5 rounded border border-accent/10">Active</span>
                                ) : (
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">Disabled</span>
                                )}
                            </div>
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SyllabusSidebar;
