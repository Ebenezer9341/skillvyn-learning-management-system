import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, ShieldCheck, Globe } from 'lucide-react';
import logo from '../assets/images/Skillvyn logo/PNG/horizontal.png';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center group cursor-pointer h-10">
                        <img src={logo} alt="Skillvyn Logo" className="h-full w-auto object-contain group-hover:scale-[1.02] transition-transform duration-300" />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Features</a>
                        <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">About</a>
                        <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Sign In</Link>
                        <Link to="/register" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-sm font-semibold text-white rounded-full shadow-lg shadow-primary/25 transition-all active:scale-95">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-40 pb-20 px-6 overflow-hidden relative">
                {/* Subtle Background Elements */}
                <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-40 -right-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

                <div className="max-w-7xl mx-auto relative">
                    <div className="max-w-3xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-6xl md:text-8xl font-black leading-[1.05] tracking-tight mb-8"
                        >
                            Master Your Future <br /> with <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%] animate-gradient bg-clip-text text-transparent italic">Skillvyn</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl font-medium"
                        >
                            An all-in-one educational platform engineered for modern learning. Access world-class courses, live assessments, and an integrated studio for mentors.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-col sm:flex-row items-center gap-4"
                        >
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0">
                                Explore Courses <ArrowRight size={20} />
                            </Link>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-900 font-bold rounded-2xl shadow-sm transition-all hover:bg-slate-50">
                                Become a Mentor
                            </button>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">Why choose Skillvyn?</h2>
                    <p className="text-slate-500 font-medium">Built for the ambitious, used by the successful.</p>
                </div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: BookOpen, title: "Curated Content", desc: "Expertly designed courses across technology, design, and business." },
                            { icon: ShieldCheck, title: "Verified Certificates", desc: "Stand out in your career with credentials that employers trust." },
                            { icon: Globe, title: "Global Community", desc: "Learn alongside thousands of ambitious students worldwide." }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <f.icon />
                                </div>
                                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
