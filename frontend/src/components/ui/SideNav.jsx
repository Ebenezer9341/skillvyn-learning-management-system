import React from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logo from '../../assets/images/Skillvyn logo/PNG/horizontal.png';
import {
    ShieldCheck,
    LayoutDashboard,
    Users,
    BookOpen,
    LogOut,
    X,
    User,
    UserCheck,
    Award,
    ShoppingBag,
    MessageSquare,
    GraduationCap,
    Star,
    ReceiptText,
    Layers,
    Tag
} from 'lucide-react'



const SideNav = ({ onClose }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            // Tell backend we are logging out for audit purposes
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout log error:', err);
        } finally {
            logout();
            navigate('/login');
        }
    };

    // Helper to determine if a link is active
    const isActive = (path) => location.pathname === path;

    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-72 h-full bg-white border-r border-slate-200 flex flex-col relative"
        >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="">
                    <img src={logo} alt="" />
                    {user?.role === 'superuser' && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 ring-1 ring-primary/10">
                            <ShieldCheck size={12} className="text-primary" />
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Superuser</span>
                        </div>
                    )}
                    {user?.role === 'mentor' && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 ring-1 ring-primary/10">
                            <GraduationCap size={12} className="text-primary" />
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Mentor</span>
                        </div>
                    )}
                    {user?.role === 'candidate' && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 ring-1 ring-primary/10">
                            <User size={12} className="text-primary" />
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Candidate</span>
                        </div>
                    )}
                    {user?.role === 'admin' && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 ring-1 ring-primary/10">
                            <ShieldCheck size={12} className="text-primary" />
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Admin</span>
                        </div>
                    )}
                </div>

                {/* Close button for mobile */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-secondary lg:hidden transition-all"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-6 space-y-2 overflow-y-auto premium-scroll">
                {user?.role === "superuser" && (
                    <>
                        <Link
                            to="/superuser"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <LayoutDashboard size={20} className={isActive('/superuser') ? 'text-primary' : ''} />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/superuser/users"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${(isActive('/superuser/users') || location.pathname.startsWith('/superuser/user/'))
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Users size={20} className={(isActive('/superuser/users') || location.pathname.startsWith('/superuser/user/')) ? 'text-primary' : ''} />
                            <span>User Management</span>
                        </Link>
                        <Link
                            to="/superuser/students"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/students')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <GraduationCap size={20} className={isActive('/superuser/students') ? 'text-primary' : ''} />
                            <span>Students</span>
                        </Link>
                        <Link
                            to="/superuser/mentors"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/mentors')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <UserCheck size={20} className={isActive('/superuser/mentors') ? 'text-primary' : ''} />
                            <span>Mentors</span>
                        </Link>

                        <Link
                            to="/superuser/auditLogs"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/auditLogs')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                        >
                            <ShieldCheck size={20} className={isActive('/superuser/auditLogs') ? 'text-primary' : ''} />
                            <span>Audit Log</span>
                        </Link>

                        <Link
                            to="/superuser/courses"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${(isActive('/superuser/courses') ||
                                    location.pathname.startsWith('/superuser/course/') ||
                                    isActive('/superuser/analytics/platform'))
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <BookOpen size={20} className={(isActive('/superuser/courses') || location.pathname.startsWith('/superuser/course/') || isActive('/superuser/analytics/platform')) ? 'text-primary' : ''} />
                            <span>Courses</span>
                        </Link>

                        <Link
                            to="/superuser/bundles"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/bundles')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Layers size={20} className={isActive('/superuser/bundles') ? 'text-primary' : ''} />
                            <span>Bundles</span>
                        </Link>

                        <Link
                            to="/superuser/profile"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/profile')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <User size={20} className={isActive('/superuser/profile') ? 'text-primary' : ''} />
                            <span>Profile</span>
                        </Link>
                        <Link
                            to="/superuser/coupons"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/coupons')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Tag size={20} className={isActive('/superuser/coupons') ? 'text-primary' : ''} />
                            <span>Coupons</span>
                        </Link>
                        <Link
                            to="/superuser/reviews"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/reviews')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <MessageSquare size={20} className={isActive('/superuser/reviews') ? 'text-primary' : ''} />
                            <span>Reviews</span>
                        </Link>
                        <Link
                            to="/superuser/invoices"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/superuser/invoices')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <ReceiptText size={20} className={isActive('/superuser/invoices') ? 'text-primary' : ''} />
                            <span>Finances & Billing</span>
                        </Link>


                    </>
                )}

                {user?.role === "admin" && (
                    <>
                        <Link
                            to="/admin"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <LayoutDashboard size={20} className={isActive('/admin') ? 'text-primary' : ''} />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            to="/admin/users"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${(isActive('/admin/users') || location.pathname.startsWith('/admin/user/'))
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Users size={20} className={(isActive('/admin/users') || location.pathname.startsWith('/admin/user/')) ? 'text-primary' : ''} />
                            <span>User Management</span>
                        </Link>
                        <Link
                            to="/admin/students"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/students')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <GraduationCap size={20} className={isActive('/admin/students') ? 'text-primary' : ''} />
                            <span>Students</span>
                        </Link>
                        <Link
                            to="/admin/mentors"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/mentors')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <UserCheck size={20} className={isActive('/admin/mentors') ? 'text-primary' : ''} />
                            <span>Mentors</span>
                        </Link>

                        <Link
                            to="/admin/courses"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${(isActive('/admin/courses') ||
                                    location.pathname.startsWith('/admin/course/') ||
                                    isActive('/admin/analytics/platform'))
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <BookOpen size={20} className={(isActive('/admin/courses') || location.pathname.startsWith('/admin/course/') || isActive('/admin/analytics/platform')) ? 'text-primary' : ''} />
                            <span>Courses</span>
                        </Link>

                        <Link
                            to="/admin/bundles"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/bundles')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Layers size={20} className={isActive('/admin/bundles') ? 'text-primary' : ''} />
                            <span>Bundles</span>
                        </Link>
                        <Link
                            to="/admin/profile"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/profile')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <User size={20} className={isActive('/admin/profile') ? 'text-primary' : ''} />
                            <span>Profile</span>
                        </Link>
                        <Link
                            to="/admin/coupons"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/coupons')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Tag size={20} className={isActive('/admin/coupons') ? 'text-primary' : ''} />
                            <span>Coupons</span>
                        </Link>
                        <Link
                            to="/admin/reviews"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/reviews')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <MessageSquare size={20} className={isActive('/admin/reviews') ? 'text-primary' : ''} />
                            <span>Reviews</span>
                        </Link>
                        <Link
                            to="/admin/invoices"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/invoices')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <ReceiptText size={20} className={isActive('/admin/invoices') ? 'text-primary' : ''} />
                            <span>Finances & Billing</span>
                        </Link>
                        <Link
                            to="/admin/auditLogs"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/admin/auditLogs')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <ShieldCheck size={20} className={isActive('/admin/auditLogs') ? 'text-primary' : ''} />
                            <span>Audit Log</span>
                        </Link>
                    </>
                )}

                {user?.role === 'mentor' && (
                    <>
                        <Link
                            to="/mentor"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <LayoutDashboard size={20} className={isActive('/mentor') ? 'text-primary' : ''} />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/mentor/courses"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${(isActive('/mentor/courses') || location.pathname.startsWith('/mentor/course/'))
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <BookOpen size={20} className={(isActive('/mentor/courses') || location.pathname.startsWith('/mentor/course/')) ? 'text-primary' : ''} />
                            <span>My Courses</span>
                        </Link>

                        <Link
                            to="/mentor/bundles"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/bundles')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Layers size={20} className={isActive('/mentor/bundles') ? 'text-primary' : ''} />
                            <span>My Bundles</span>
                        </Link>

                        <Link
                            to="/mentor/students"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/students')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <GraduationCap size={20} className={isActive('/mentor/students') ? 'text-primary' : ''} />
                            <span>My Students</span>
                        </Link>
                        <Link
                            to="/mentor/reviews"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/reviews')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <MessageSquare size={20} className={isActive('/mentor/reviews') ? 'text-primary' : ''} />
                            <span>Reviews</span>
                        </Link>
                        <Link
                            to="/mentor/invoices"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/invoices')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <ReceiptText size={20} className={isActive('/mentor/invoices') ? 'text-primary' : ''} />
                            <span>Finances & Billing</span>
                        </Link>
                        <Link
                            to="/mentor/profile"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/profile')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <User size={20} className={isActive('/mentor/profile') ? 'text-primary' : ''} />
                            <span>Profile</span>
                        </Link>
                        <Link
                            to="/mentor/coupons"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/coupons')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Tag size={20} className={isActive('/mentor/coupons') ? 'text-primary' : ''} />
                            <span>Coupons</span>
                        </Link>
                        <Link
                            to="/mentor/audit-logs"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/mentor/audit-logs')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <ShieldCheck size={20} className={isActive('/mentor/audit-logs') ? 'text-primary' : ''} />
                            <span>Audit Log</span>
                        </Link>
                    </>
                )}

                {user?.role === 'candidate' && (
                    <>
                        <Link
                            to="/candidate"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/candidate')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <LayoutDashboard size={20} className={isActive('/candidate') ? 'text-primary' : ''} />
                            <span>Curriculums</span>
                        </Link>
                        <Link
                            to="/candidate/bundles"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/candidate/bundles')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Layers size={20} className={isActive('/candidate/bundles') ? 'text-primary' : ''} />
                            <span>Bundles</span>
                        </Link>
                        <Link
                            to="/candidate/courses"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${(isActive('/candidate/courses') || location.pathname.startsWith('/candidate/course/'))
                                    ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <BookOpen size={20} className={(isActive('/candidate/courses') || location.pathname.startsWith('/candidate/course/')) ? 'text-primary' : ''} />
                            <span>My Courses</span>
                        </Link>
                        <Link
                            to="/candidate/achievements"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/candidate/achievements')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <Award size={20} className={isActive('/candidate/achievements') ? 'text-primary' : ''} />
                            <span>Achievements</span>
                        </Link>
                        <Link
                            to="/candidate/purchases"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/candidate/purchases')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <ShoppingBag size={20} className={isActive('/candidate/purchases') ? 'text-primary' : ''} />
                            <span>My Purchases</span>
                        </Link>
                        <Link
                            to="/candidate/profile"
                            className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${isActive('/candidate/profile')
                                ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-secondary font-medium'
                                }`}
                            onClick={onClose}
                        >
                            <User size={20} className={isActive('/candidate/profile') ? 'text-primary' : ''} />
                            <span>Profile</span>
                        </Link>
                    </>
                )}
            </nav>

            <div className="p-6 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 p-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Logout</span>
                </button>
            </div>
        </motion.aside>
    )
}

export default SideNav