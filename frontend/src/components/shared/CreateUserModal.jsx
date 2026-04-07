import {
    X,
    UserPlus,
    Shield,
    User,
    AtSign,
    Calendar
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

const CreateUserModal = ({ isOpen, onClose, onSuccess, requesterRole }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        role: 'candidate'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Superusers can assign any role; admins can only assign mentor or candidate
    const selectableRoles = requesterRole === 'superuser'
        ? ['candidate', 'mentor', 'admin']
        : ['candidate', 'mentor'];

    // Password generation logic for display and submission
    const getGeneratedPassword = () => {
        if (!formData.firstName.trim() || !formData.dateOfBirth) return null;
        try {
            const yearOfBirth = new Date(formData.dateOfBirth).getFullYear();
            if (isNaN(yearOfBirth)) return null;
            return `${formData.firstName.trim().split(' ')[0]}${yearOfBirth}`;
        } catch (err) {
            return null;
        }
    };

    const suggestedPassword = getGeneratedPassword();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                password: suggestedPassword
            };

            const response = await api.post('/api/users/create', payload);
            if (response.data.status === 'success') {
                toast.success('User created successfully!');
                setIsLoading(false);
                onSuccess(); // Refresh the parent list
                onClose();
                setFormData({ firstName: '', lastName: '', email: '', dateOfBirth: '', role: 'candidate' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-white"
                    >
                        {/* Header */}
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-secondary">Create New User</h2>
                                <p className="text-slate-500 text-sm mt-1">Add a new member to the platform.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                    <Shield size={14} />
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="John"
                                            className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Doe"
                                            className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative">
                                    <AtSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        required
                                        type="email"
                                        placeholder="john@example.com"
                                        className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date of Birth</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-600"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        max={new Date().toISOString().split("T")[0]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 ">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Assign Role</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {selectableRoles.map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role })}
                                            className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all capitalize ${
                                                formData.role === role 
                                                ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                            }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
                                <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-primary uppercase tracking-widest">Auto-Generated Password</p>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-bold">
                                        {suggestedPassword ? (
                                            <span className="flex items-center gap-2 flex-wrap">
                                                User password: <span className="font-mono font-black bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 text-primary">{suggestedPassword}</span>
                                            </span>
                                        ) : (
                                            <>For security, a password will be generated: <span className="font-bold">First Name + Year of Birth</span> (e.g., John1990).</>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-2xl border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-3 px-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            <span>Create Account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateUserModal;