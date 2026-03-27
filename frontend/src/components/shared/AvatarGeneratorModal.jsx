import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, CheckCircle2, Wand2 } from "lucide-react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const AVATAR_STYLES = [
  { id: "avataaars", name: "Avataaars", desc: "Comic style" },
  { id: "bottts", name: "Bottts", desc: "Robots" },
  { id: "micah", name: "Micah", desc: "Sleek 3D" },
  { id: "lorelei", name: "Lorelei", desc: "Cute flat" },
  { id: "pixel-art", name: "Pixel Art", desc: "8-bit retro" },
  { id: "adventurer", name: "Adventurer", desc: "RPG characters" },
  { id: "notionists", name: "Notionists", desc: "Minimal sketch" },
];

const AvatarGeneratorModal = ({ isOpen, onClose, onSave, currentSeed }) => {
  const { updateUser } = useAuth();
  const [style, setStyle] = useState("avataaars");
  const [seed, setSeed] = useState(currentSeed || "Skillvyn");
  const [saving, setSaving] = useState(false);

  const generatedUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

  const handleApply = async () => {
    try {
      setSaving(true);
      const response = await api.patch("/api/users/update-profile", {
        avatar: generatedUrl,
      });
      const updatedUser = response.data.data.user;

      updateUser(updatedUser);
      onSave(generatedUrl);
      toast.success("Awesome new avatar saved!");
      onClose();
    } catch (err) {
      toast.error("Failed to save avatar");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Side: Preview */}
          <div className="bg-slate-50 border-r border-slate-100 p-8 flex flex-col items-center justify-center relative inner-shadow md:w-2/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

            <div className="w-40 h-40 bg-white rounded-3xl shadow-xl border border-slate-100 p-2 relative z-10 transition-all">
              <img
                src={generatedUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>

            <button
              onClick={() => setSeed(Math.random().toString(36).substring(7))}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
            >
              <RefreshCw size={14} />
              Randomize
            </button>
          </div>

          {/* Right Side: Options */}
          <div className="p-8 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Wand2 size={24} className="text-blue-500" /> Avatar Studio
                </h3>
                <p className="text-slate-500 text-sm font-bold mt-1">
                  Design your digital identity
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Your Base Word (Seed)
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Type anything..."
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Art Style
                </label>
                <div className="grid grid-cols-2 gap-3 p-1">
                  {AVATAR_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-3 text-left rounded-xl border text-sm transition-all focus:outline-none flex flex-col ${
                        style === s.id
                          ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`font-black ${style === s.id ? "text-blue-700" : "text-slate-700"}`}
                      >
                        {s.name}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold mt-1 ${style === s.id ? "text-blue-500/70" : "text-slate-400"}`}
                      >
                        {s.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={saving}
                className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                Apply Avatar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AvatarGeneratorModal;
