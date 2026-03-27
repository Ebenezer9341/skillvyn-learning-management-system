import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronLeft, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/images/Skillvyn logo/PNG/horizontal.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isReturningUser, setIsReturningUser] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

    // Set page title and check returning user
    useEffect(() => {
        document.title = 'Login - Skillvyn';
        const hasVisitedBefore = localStorage.getItem('hasVisitedLoginBefore');
        setIsReturningUser(!!hasVisitedBefore); // Simplified: true if key exists, false otherwise
    }, []);

    const validateForm = () => {
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (password.length < 1) {
            setError('Please enter your password');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.post('api/auth/login', { email, password });
            const data = response.data;

            if (data.status !== "success") {
                throw new Error(data.message || 'Invalid email or password');
            }

            // Save auth state with tokens
            login(data.data.user, data.accessToken, data.refreshToken);

            // Mark user as "Returning" only after successful login
            localStorage.setItem('hasVisitedLoginBefore', 'true');

            // Redirect to specifically requested page or role-based dashboard
            const from = location.state?.from?.pathname;
            if (from) {
                navigate(from, { replace: true });
                return;
            }

            const role = data.data.user.role?.toLowerCase();
            if (role === 'superuser') navigate('/superuser');
            else if (role === 'admin') navigate('/admin');
            else if (role === 'mentor') navigate('/mentor');
            else if (role === 'candidate') navigate('/candidate');
            else navigate('/');

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

            <Link to="/" className="fixed top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <ChevronLeft size={16} />
                </div>
                <span className="text-sm font-semibold">Back to Home</span>
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
                        {isReturningUser ? 'Welcome back' : 'Welcome'}
                    </h1>
                    <p className="text-slate-500 font-semibold">
                        {isReturningUser ? 'Continue your learning journey today.' : 'Start your learning journey here.'}
                    </p>
                </div>

                <div className="bg-white/70 p-10 rounded-[2.5rem] border border-white backdrop-blur-3xl shadow-[0_32px_80px_-16px_rgba(31,41,55,0.15)] ring-1 ring-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {(error || successMessage) && (
                                <motion.div
                                    key={error ? 'error' : 'success'}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'} p-4 rounded-xl flex items-center gap-3 text-sm font-medium border`}
                                >
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{error || successMessage}</p>
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
                                    className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all group-hover:bg-slate-50/50 duration-300 font-medium disabled:opacity-50 shadow-sm"
                                    disabled={isLoading}
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                                <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-[0.1em] text-primary hover:text-primary focus:underline underline-offset-4">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-12 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all group-hover:bg-slate-50/50 duration-300 font-medium disabled:opacity-50 shadow-sm"
                                    disabled={isLoading}
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 space-x-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 duration-300 group disabled:opacity-70 disabled:hover:scale-100"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>
                                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                <span>Login to Account</span>
                            </>}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-100 pt-8">
                        <p className="text-slate-500 font-semibold group">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/50 transition-all decoration-2">Sign up free</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    <Link to="/support" className="hover:text-slate-900 transition-colors">Support</Link>
                </div>
            </motion.div>
        </div>
    );
}
