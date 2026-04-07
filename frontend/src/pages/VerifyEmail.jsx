import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Mail } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/images/Skillvyn logo/PNG/horizontal.png';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('No verification token found in the URL. Please check your email link.');
                return;
            }

            try {
                const response = await api.post('/api/auth/verify-email', { token });
                if (response.data.status === 'success') {
                    setStatus('success');
                    setMessage(response.data.message);
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 relative overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white p-10 rounded-3xl border border-white shadow-[0_32px_80px_-16px_rgba(31,41,55,0.1)] relative z-10 text-center"
            >
                <div className="mb-10 flex justify-center">
                    <img src={logo} alt="Skillvyn Logo" className="h-10 w-auto object-contain" />
                </div>

                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-secondary mb-2">Verifying Account</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Please wait while we confirm your identity and secure your account...
                            </p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200"
                        >
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-black text-secondary mb-2">Success!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                {message || 'Your email has been successfully verified. You now have full access to Skillvyn.'}
                            </p>
                            <Link 
                                to="/login" 
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Continue to Sign In <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-200"
                        >
                            <XCircle className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl font-black text-secondary mb-2">Verification Failed</h2>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                {message}
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link 
                                    to="/login" 
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    Try Logging In
                                </Link>
                                <Link 
                                    to="/" 
                                    className="text-sm font-bold text-slate-500 hover:text-primary transition-colors py-2"
                                >
                                    Return to Homepage
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            <div className="mt-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">
                Secure Education Engineered by Skillvyn
            </div>
        </div>
    );
}
