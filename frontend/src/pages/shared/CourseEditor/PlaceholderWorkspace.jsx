import React from 'react';
import { Layout } from 'lucide-react';

const PlaceholderWorkspace = ({ addModule, setActiveModuleIdx }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Layout size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3">Workspace Ready</h3>
            <p className="text-slate-400 max-w-sm font-medium leading-relaxed">Select a lesson from the sidebar or create a new one to start designing.</p>
            <button
                onClick={(e) => {
                    addModule(e);
                    setActiveModuleIdx(0);
                }}
                className="mt-8 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
                Create First Lesson
            </button>
        </div>
    );
};

export default PlaceholderWorkspace;
