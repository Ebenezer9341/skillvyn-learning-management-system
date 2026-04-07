import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ChevronLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/images/Skillvyn logo/PNG/horizontal.png';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        document.title = 'Forgot Password - Skillvyn';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await api.post('api/auth/forgot-password', { email });
            if (response.data.status === "success") {
                setSuccess(true);
            } else {
                throw new Error(response.data.message || 'Something went wrong');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

            <Link to="/login" className="fixed top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-accent transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-accent group-hover:bg-accent/5 group-hover:scale-110 transition-all duration-300">
                    <ChevronLeft size={16} className="group-hover:text-accent transition-colors" />
                </div>
                <span className="text-sm font-semibold">Back to Login</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[460px] relative z-10"
            >
                <div className="text-center mb-10 flex flex-col items-center gap-4">
                    <Link to="/" className="h-12 hover:scale-105 transition-transform duration-300">
                        <img src={logo} alt="Skillvyn Logo" className="h-full w-auto object-contain" />
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight">
                        Reset Password
                    </h1>
                    <p className="text-slate-500 font-semibold italic">
                        No worries! Just enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-white/70 p-10 rounded-2xl border border-white backdrop-blur-3xl shadow-[0_32px_80px_-16px_rgba(31,41,55,0.15)] ring-1 ring-slate-100">
                    {success ? (
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    We've sent a password reset link to <span className="font-bold text-slate-900">{email}</span>. 
                                    Please check your inbox (and spam folder) for further instructions.
                                </p>
                            </div>
                            <Link 
                                to="/login"
                                className="inline-block w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 duration-300"
                            >
                                Back to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-red-50 border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border"
                                    >
                                        <AlertCircle size={18} className="shrink-0" />
                                        <p>{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                    className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all group-hover:bg-slate-50/50 duration-300 font-medium disabled:opacity-50 shadow-sm"
                                        disabled={isLoading}
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={20} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 space-x-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 duration-300 group disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                                    <span>Send Reset Link</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center">
                        <p className="text-slate-500 font-semibold">
                            Suddenly remembered?{' '}
                            <Link to="/login" className="text-accent font-bold hover:underline underline-offset-4 decoration-accent/30 transition-all decoration-2">Login now</Link>
                        </p>
                </div>
            </motion.div>
        </div>
    );
}
