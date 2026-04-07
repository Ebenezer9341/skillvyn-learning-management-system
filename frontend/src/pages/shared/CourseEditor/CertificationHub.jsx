import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Award, 
    HelpCircle, 
    Plus, 
    Trash2, 
    CheckCircle, 
    Image as ImageIcon, 
    FileText, 
    RefreshCw, 
    Upload, 
    Link as LinkIcon 
} from 'lucide-react';

const CertificationHub = ({ 
    certification, 
    updateCertification, 
    handleProjectAssetFileChange,
    uploadingAsset,
    assetUploadProgress,
    projectAssetMode,
    setProjectAssetMode,
    isReadOnly
}) => {
    
    const handleMcqToggle = () => {
        if (isReadOnly) return;
        updateCertification({ mcqEnabled: !certification?.mcqEnabled });
    };

    const handleProjectToggle = () => {
        if (isReadOnly) return;
        updateCertification({ projectEnabled: !certification?.projectEnabled });
    };

    const addMcqQuestion = () => {
        if (isReadOnly) return;
        const newQuestions = [...(certification?.questions || [])];
        newQuestions.push({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
        updateCertification({ questions: newQuestions });
    };

    const updateMcqQuestion = (qIdx, field, value) => {
        if (isReadOnly) return;
        const newQuestions = [...certification.questions];
        newQuestions[qIdx][field] = value;
        updateCertification({ questions: newQuestions });
    };

    const deleteMcqQuestion = (qIdx) => {
        if (isReadOnly) return;
        const newQuestions = certification.questions.filter((_, i) => i !== qIdx);
        updateCertification({ questions: newQuestions });
    };

    const updateMcqOption = (qIdx, oIdx, value) => {
        if (isReadOnly) return;
        const newQuestions = [...certification.questions];
        newQuestions[qIdx].options[oIdx] = value;
        updateCertification({ questions: newQuestions });
    };

    if (!certification?.enabled) {
        return (
            <div className="py-20 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                    <Award size={48} strokeWidth={1} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-400">Certification Disabled</h3>
                    <p className="text-sm text-slate-300 max-w-sm mt-1">Enable certification to define assessment criteria for this course.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* MCQ Settings */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-bold">
                            <HelpCircle size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">Final Assessment (MCQ)</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Requirement #1</p>
                        </div>
                    </div>
                    <button
                        onClick={handleMcqToggle}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isReadOnly ? 'bg-slate-50 text-slate-300 cursor-not-allowed' :
                            certification?.mcqEnabled ? 'bg-primary text-white shadow-lg shadow-primary/10 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-pointer'
                        }`}
                        disabled={isReadOnly}
                    >
                        {certification?.mcqEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                {certification?.mcqEnabled && (
                    <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100 space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Passing Score (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={certification.mcqPassingScore}
                                    onChange={(e) => updateCertification({ mcqPassingScore: parseInt(e.target.value) || 0 })}
                                    disabled={isReadOnly}
                                    className={`w-full bg-white border border-slate-200 rounded-2xl py-2 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-primary/5 transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                            </div>
                            {!isReadOnly && (
                                <button
                                    onClick={addMcqQuestion}
                                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:border-primary/20 transition-all shadow-sm"
                                >
                                    <Plus size={14} /> Add Question
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {certification.questions?.map((q, qIdx) => (
                                <div key={qIdx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[10px] font-black text-slate-300 uppercase">Q{qIdx + 1}</span>
                                        <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) => updateMcqQuestion(qIdx, 'question', e.target.value)}
                                            placeholder="Type your question here..."
                                            className="flex-1 bg-slate-50 border-none rounded-2xl py-2 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/5 transition-all"
                                        />
                                        {!isReadOnly && (
                                            <button
                                                onClick={() => deleteMcqQuestion(qIdx)}
                                                className="text-rose-400 hover:text-rose-600 p-1 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateMcqQuestion(qIdx, 'correctAnswer', oIdx)}
                                                    className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                                                        q.correctAnswer === oIdx ? 'bg-accent text-white shadow-md shadow-accent/10' : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    {String.fromCharCode(65 + oIdx)}
                                                </button>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateMcqOption(qIdx, oIdx, e.target.value)}
                                                    disabled={isReadOnly}
                                                    className={`flex-1 bg-slate-50 border-none rounded-2xl py-1.5 px-3 text-[10px] font-medium focus:ring-1 focus:ring-primary/5 transition-all ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                                                    placeholder={`Option ${oIdx + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Capstone Settings */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-secondary/5 text-secondary flex items-center justify-center font-bold">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">Capstone Project</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Requirement #2</p>
                        </div>
                    </div>
                    <button
                        onClick={handleProjectToggle}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isReadOnly ? 'bg-slate-50 text-slate-300 cursor-not-allowed' :
                            certification?.projectEnabled ? 'bg-secondary text-white shadow-lg shadow-secondary/10 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-pointer'
                        }`}
                        disabled={isReadOnly}
                    >
                        {certification?.projectEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                {certification?.projectEnabled && (
                    <div className="bg-slate-50/50 p-8 rounded-2xl border border-slate-100 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Instructions & Brief</label>
                        <textarea
                            rows="6"
                            value={certification.projectDescription}
                            onChange={(e) => updateCertification({ projectDescription: e.target.value })}
                            disabled={isReadOnly}
                            className={`w-full bg-white border border-slate-200 rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-secondary/5 placeholder:italic resize-none premium-scroll ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                            placeholder="Explain what the student needs to build, the tech stack, and the submission criteria via GitHub link..."
                        />
                        <div className="flex items-center gap-2 text-[10px] text-secondary font-bold italic">
                            <CheckCircle size={14} />
                            <span>Candidates will see an input field to submit their Git repository URL.</span>
                        </div>

                        {/* Project Reference File Upload */}
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Guide (Optional)</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setProjectAssetMode('upload')}
                                        className={`px-3 py-1 text-[8px] font-black uppercase rounded-2xl transition-all ${projectAssetMode === 'upload' ? 'bg-white text-secondary shadow-sm' : 'text-slate-400'}`}
                                    >
                                        File
                                    </button>
                                    <button
                                        onClick={() => setProjectAssetMode('url')}
                                        className={`px-3 py-1 text-[8px] font-black uppercase rounded-2xl transition-all ${projectAssetMode === 'url' ? 'bg-white text-secondary shadow-sm' : 'text-slate-400'}`}
                                    >
                                        URL
                                    </button>
                                </div>
                            </div>

                            {certification?.projectAsset?.url ? (
                                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-accent/5 text-accent flex items-center justify-center font-bold">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0 pr-4">
                                            <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{certification.projectAsset.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium truncate">{certification.projectAsset.url}</p>
                                        </div>
                                    </div>
                                    {!isReadOnly && (
                                        <button
                                            onClick={() => updateCertification({ projectAsset: null })}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-all border border-slate-50 rounded-lg group"
                                        >
                                            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                projectAssetMode === 'upload' ? (
                                    <div className="relative group/proj">
                                        <input
                                            type="file"
                                            id="project-asset-upload"
                                            className="hidden"
                                            onChange={handleProjectAssetFileChange}
                                        />
                                        <label
                                            htmlFor="project-asset-upload"
                                            className="w-full bg-white border-2 border-dashed border-slate-100 hover:border-purple-200 hover:bg-purple-50/10 rounded-2xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                                        >
                                            {uploadingAsset ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <RefreshCw size={20} className="text-secondary animate-spin" />
                                                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Uploading {assetUploadProgress}%</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover/proj:bg-secondary/5 group-hover/proj:text-secondary transition-all shadow-sm">
                                                        <Upload size={20} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-slate-400 group-hover/proj:text-secondary uppercase tracking-widest">Upload Project Brief</p>
                                                        <p className="text-[9px] text-slate-300 font-medium mt-0.5">PDF, DOCX, or ZIP (Optional)</p>
                                                    </div>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                        <div className="relative group/url">
                                            <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/url:text-secondary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Paste Guide URL (Drive, Figma, YouTube...)"
                                                className="w-full bg-slate-50 border-none rounded-2xl py-2 pl-10 pr-4 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-secondary/5"
                                                onBlur={(e) => {
                                                    if (e.target.value) {
                                                        updateCertification({
                                                            projectAsset: { url: e.target.value, name: 'External Resource' }
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-medium ml-1">Candidates can click this to view external documentation.</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificationHub;
