import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Shield,
    Briefcase,
    Calendar,
    RefreshCw,
    CheckCircle2,
    Star,
    Award,
    BookOpen,
    Users,
    ArrowLeft,
    ShieldAlert,
    Clock,
    UserCheck,
    Lock,
    Unlock
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';

const UserProfileView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({});
    const [activeTab, setActiveTab] = useState('personal');

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/users/${id}`);
            const { user, stats: userStats } = response.data.data;
            setUserData(user);
            setStats(userStats || {});
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to load user profile');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [id]);

    const handleToggleStatus = async () => {
        try {
            const newStatus = !userData.isActive;
            const response = await api.patch(`/api/users/${id}`, { isActive: newStatus });
            setUserData(response.data.data.user);
            toast.success(`User account ${newStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (err) {
            toast.error('Failed to update user status');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <RefreshCw size={40} className="text-primary animate-spin mb-4" />
                <p className="text-slate-500 font-bold animate-pulse">Retrieving Profile Data...</p>
            </div>
        );
    }

    if (!userData) return null;

    const userRole = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);

    const tabs = [
        { id: 'personal', label: 'Identity', icon: User, color: 'blue' },
        ...(userData.role === 'mentor' ? [{ id: 'professional', label: 'Teaching', icon: Briefcase, color: 'emerald' }] : []),
        { id: 'account', label: 'Account Info', icon: Shield, color: 'amber' }
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto px-4 md:px-8 py-8"
        >
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors group px-4 py-2 hover:bg-slate-100 rounded-2xl"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Directory
                </button>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border  ${
                        userData.isActive !== false ? 'bg-primary/5 text-primary border-primary/10' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                        {userData.isActive !== false ? 'Active Account' : 'Deactivated'}
                    </span>
                </div>
            </div>

            {/* Profile Header */}
            <div className="relative mb-24">
                <div className="h-48 md:h-64 rounded-2xl overflow-hidden relative shadow-2xl shadow-slate-200">
                    <img
                        src={getImageUrl(userData.cover, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2000')}
                        alt="cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                </div>

                <div className="absolute -bottom-16 left-8 md:left-14 flex flex-col md:flex-row md:items-end gap-8">
                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-[6px] border-white overflow-hidden shadow-2xl bg-white shadow-primary/10">
                        <img 
                            src={getImageUrl(userData.avatar, `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}`)} 
                            alt="avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                                {userData.firstName} {userData.lastName}
                            </h1>
                            {userData.isActive !== false && <CheckCircle2 size={24} className="text-primary" />}
                        </div>
                        <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs flex items-center gap-2">
                           <Shield size={14} className="text-primary" /> {userRole} • Member since {new Date(userData.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 right-0 flex gap-4">
                    <button
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-2 px-8 py-4 font-black rounded-2xl transition-all shadow-xl active:scale-95 group ${
                            userData.isActive !== false 
                                ? 'bg-secondary/5 text-secondary hover:bg-secondary/10' 
                                : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                        }`}
                    >
                        {userData.isActive !== false ? <Lock size={20} /> : <Unlock size={20} />}
                        {userData.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Info & Stats */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Stats */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Star size={18} className="text-secondary" />
                            Activity Summary
                        </h3>
                        
                        <div className="space-y-4">
                            {userData.role === 'mentor' ? (
                                <>
                                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={20} className="text-primary" />
                                            <span className="text-sm font-bold text-slate-900">Courses Published</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-900">{stats.courseCount || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <Users size={20} className="text-emerald-600" />
                                            <span className="text-sm font-bold text-emerald-900">Total Students</span>
                                        </div>
                                        <span className="text-xl font-black text-emerald-900">{stats.totalStudents || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <Star size={20} className="text-secondary" />
                                            <span className="text-sm font-bold text-slate-900">Avg. Rating</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-900">{stats.averageRating || 0}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={20} className="text-primary" />
                                            <span className="text-sm font-bold text-slate-900">Courses Taken</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-900">{stats.enrolledCount || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={20} className="text-emerald-600" />
                                            <span className="text-sm font-bold text-emerald-900">Completed</span>
                                        </div>
                                        <span className="text-xl font-black text-emerald-900">{stats.completedCount || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <Award size={20} className="text-secondary" />
                                            <span className="text-sm font-bold text-slate-900">Certificates</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-900">{stats.certificateCount || 0}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Contact Details Card */}
                    <div className="bg-secondary p-8 rounded-2xl text-white shadow-2xl space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Admin Quick Access</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Mail size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Email Address</p>
                                    <p className="truncate font-bold text-sm">{userData.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Phone Number</p>
                                    <p className="font-bold text-sm">{userData.phone || 'Not Provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Location</p>
                                    <p className="font-bold text-sm">{userData.location || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & Bio */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-6 mb-8 p-1 bg-slate-50 rounded-2xl w-fit">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                        activeTab === tab.id 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'personal' && (
                                <motion.div
                                    key="personal"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                                            <UserCheck size={22} className="text-primary" />
                                            Professional Bio
                                        </h3>
                                        <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-blue-100 pl-6 py-2 bg-blue-50/30 rounded-r-2xl">
                                            "{userData.bio || 'This user hasn\'t shared a bio yet.'}"
                                        </p>
                                    </div>

                                    {userData.role === 'mentor' && (
                                        <div>
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Area of Expertise</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(userData.specialty || 'General Instructor').split(',').map((s, i) => (
                                                    <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs border border-slate-200">
                                                        {s.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-4 mb-2">
                                                <Calendar size={18} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Born on</span>
                                            </div>
                                            <p className="font-black text-slate-900">
                                                {userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not disclosed'}
                                            </p>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-4 mb-2">
                                                <ShieldAlert size={18} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</span>
                                            </div>
                                            <p className="font-black text-slate-900">{userRole}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'professional' && userData.role === 'mentor' && (
                                <motion.div
                                    key="professional"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="p-8 bg-accent/5 rounded-2xl border border-accent/10 flex items-start gap-6">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-accent shadow-xl shadow-accent/20">
                                            <Briefcase size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900">Teaching Credential</h4>
                                            <p className="text-sm text-slate-500 mt-2 font-bold leading-relaxed">
                                                As a verified mentor, this instructor has full permissions to manage curricula, oversee student progress, and issue platform-verified certifications.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">View instructor's full curriculum portfolio from Course Management</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'account' && (
                                <motion.div
                                    key="account"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm">Account UUID</h4>
                                                <p className="text-xs text-slate-400 font-mono mt-1">{userData._id}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(userData._id);
                                                    toast.info('ID copied to clipboard');
                                                }}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                Copy ID
                                            </button>
                                        </div>
                                        
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Clock size={20} className="text-slate-400" />
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm">Last Updated</h4>
                                                    <p className="text-xs text-slate-400 font-bold mt-1">
                                                        {new Date(userData.updatedAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserProfileView;
