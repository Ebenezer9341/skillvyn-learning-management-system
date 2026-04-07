import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ChevronLeft, Loader2, AlertCircle, Calendar } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/images/Skillvyn logo/PNG/horizontal.png';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        dateOfBirth: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [registered, setRegistered] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user && !authLoading) {
            const role = user.role?.toLowerCase();
            if (role === 'superuser') navigate('/superuser', { replace: true });
            else if (role === 'admin') navigate('/admin', { replace: true });
            else if (role === 'mentor') navigate('/mentor', { replace: true });
            else if (role === 'candidate') navigate('/candidate', { replace: true });
            else navigate('/', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('api/auth/register', formData);
            
            if (response.data.status === 'success') {
                setRegisteredEmail(formData.email);
                setRegistered(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Something went wrong during registration');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 relative overflow-hidden">

            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

            {/* Back to Home Link */}
            <Link to="/" className="fixed top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-accent transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-accent group-hover:bg-accent/5 group-hover:scale-110 transition-all duration-300">
                    <ChevronLeft size={16} className="group-hover:text-accent transition-colors" />
                </div>
                <span className="text-sm font-semibold">Back to Home</span>
            </Link>

            {registered ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[500px] relative z-10 text-center"
                >
                    <div className="bg-white/70 p-10 rounded-2xl border border-white backdrop-blur-3xl shadow-[0_32px_80px_-16px_rgba(31,41,55,0.15)] ring-1 ring-slate-100">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail size={36} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-secondary mb-3">Check Your Inbox!</h2>
                        <p className="text-slate-500 font-medium leading-relaxed mb-2">
                            We sent a verification link to:
                        </p>
                        <p className="text-primary font-black text-lg mb-6">{registeredEmail}</p>
                        <p className="text-slate-400 text-sm font-medium mb-8">
                            Click the link in that email to activate your account. The link expires in 24 hours.
                        </p>
                        <Link
                            to="/login"
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 duration-300"
                        >
                            Go to Sign In
                        </Link>
                        <p className="text-xs text-slate-400 font-medium mt-6">
                            Didn't receive it? Check your spam folder, or contact support.
                        </p>
                    </div>
                </motion.div>
            ) : (
                <>
                    {/* Header */}
                    <div className="text-center mb-10 flex flex-col items-center gap-4">
                        <Link to="/" className="h-12 hover:scale-105 transition-transform duration-300">
                            <img src={logo} alt="Skillvyn Logo" className="h-full w-auto object-contain" />
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight">Create Account</h1>
                        <p className="text-slate-500 font-semibold px-4">Join Skillvyn today and build the skills of tomorrow.</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white/70 p-10 rounded-2xl border border-white backdrop-blur-3xl shadow-[0_32px_80px_-16px_rgba(31,41,55,0.15)] ring-1 ring-slate-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
                                    >
                                        <AlertCircle size={18} />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">First Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="John"
                                            className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-white duration-300 font-medium disabled:opacity-50"
                                            disabled={isLoading}
                                        />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Last Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Doe"
                                            className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-white duration-300 font-medium disabled:opacity-50"
                                            disabled={isLoading}
                                        />
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-white duration-300 font-medium disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Date of Birth</label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        required
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-white duration-300 font-medium disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-white duration-300 font-medium disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-white duration-300 font-medium disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 space-x-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 duration-300 group disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>
                                    <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
                                    <span>Create Free Account</span>
                                </>}
                            </button>
                        </form>

                        <div className="mt-8 text-center border-t border-slate-100 pt-8">
                            <p className="text-slate-500 font-semibold group">
                                Already have an account?{' '}
                                <Link to="/login" className="text-accent font-bold hover:underline underline-offset-4 decoration-accent/30 transition-all decoration-2">Sign in</Link>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center px-4 leading-relaxed">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </>
            )}
        </div>
    );
}
