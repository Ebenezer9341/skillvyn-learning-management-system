import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {    
    User,
    AtSign,
    Lock,
    Edit2,
    X,
    Calendar,
    Shield
} from "lucide-react";

const EditUserModal = ({ isOpen, onClose, onSuccess, user }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: '',
        role: '',
        isActive: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
                role: user.role || 'candidate',
                isActive: user.isActive !== false
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.patch(`/api/users/${user._id}`, formData);
            if (response.data.status === 'success') {
                toast.success('User updated successfully!');
                setIsLoading(false);
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user');
            setIsLoading(false);
        }
    };

    // Determine roles that can be assigned
    const assignableRoles = currentUser?.role === 'superuser' 
        ? ['candidate', 'mentor', 'admin']
        : ['candidate', 'mentor'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white"
                    >
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-secondary">Edit User</h2>
                                <p className="text-slate-500 text-sm mt-1">Update account information and status.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

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
                                            className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
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
                                            className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative group/disabled">
                                    <AtSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        readOnly
                                        type="email"
                                        className="w-full bg-slate-100 border border-slate-200 py-3 pl-11 pr-4 rounded-xl focus:outline-none cursor-not-allowed text-slate-500 text-sm font-medium"
                                        value={formData.email}
                                        title="Email cannot be changed"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/disabled:opacity-100 transition-opacity">
                                        <Lock size={14} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date of Birth</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 py-3 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-slate-600"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        max={new Date().toISOString().split("T")[0]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Role</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {assignableRoles.map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role })}
                                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all capitalize ${
                                                formData.role === role 
                                                ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                            }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                    {/* If editing an admin but logged in as admin, show but disable the button */}
                                    {currentUser?.role !== 'superuser' && user?.role === 'admin' && (
                                        <button
                                            type="button"
                                            disabled
                                            className="py-2.5 px-3 rounded-xl border text-xs font-bold capitalize bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                        >
                                            Admin
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-secondary">Active Account</p>
                                        <p className="text-xs text-slate-500">Enable or disable user access.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                                            formData.isActive ? 'bg-primary' : 'bg-slate-300'
                                        }`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                                            formData.isActive ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-xl border border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Edit2 size={18} />
                                            <span>Save Changes</span>
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

export default EditUserModal;