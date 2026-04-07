import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Bell, Menu, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useNotification } from '../../context/NotificationContext'
import { getImageUrl } from '../../utils/imageUtils'

const TopBar = ({ onMenuClick, onCartClick }) => {
    const { user } = useAuth();
    const { cart } = useCart();
    const { unreadCount } = useNotification();
    const navigate = useNavigate();

    // Format name if user object exists
    const displayEmail = user ? user.email : 'not-signed-in@skillvyn.com';



    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
                {/* Burger Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-2xl lg:hidden transition-all"
                >
                    <Menu size={24} />
                </button>

                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100/50 shadow-sm">
                    <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Mail size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 truncate max-w-[200px]">{displayEmail}</span>
                </div>
            </div>

            <div className="flex items-center space-x-3 md:space-x-5">
                {/* Shopping Cart */}
                {user?.role === 'candidate' && (
                    <button
                        onClick={onCartClick}
                        className="relative p-2.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary hover:border-primary/20 rounded-2xl transition-all group shadow-sm cursor-pointer outline-none"
                        title="My Cart"
                    >
                        <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white shadow-md animate-in zoom-in duration-300">
                                {cart.length}
                            </span>
                        )}
                    </button>
                )}

                {/* Notification Bell */}
                <button 
                    onClick={() => navigate(`/${user?.role?.toLowerCase() || 'candidate'}/notifications`)}
                    className="relative p-2.5 bg-white border text-slate-500 hover:bg-slate-50 hover:text-primary border-slate-200 hover:border-primary/20 rounded-2xl transition-all group shadow-sm cursor-pointer outline-none"
                    title={unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
                >
                    <Bell size={18} className="group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
                    )}
                </button>

                <div className="flex items-center gap-4 pl-4 md:pl-5 border-l border-slate-200">
                    <div className="text-right hidden sm:block mt-0.5">
                        <p className="text-sm font-black text-slate-900 leading-tight">
                            {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                        </p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {user?.role || 'Guest'}
                        </p>
                    </div>
                    <Link 
                        to={`/${user?.role?.toLowerCase() || 'candidate'}/profile`}
                        className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] shadow-xl flex-shrink-0 group/avatar relative outline-none hover:shadow-primary/30 transition-all cursor-pointer"
                    >
                        <div className="w-full h-full rounded-full border-2 border-white overflow-visible relative text-slate-900">
                            <img 
                                src={getImageUrl(user?.avatar, `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName || 'admin'}`)} 
                                alt="Avatar" 
                                className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover/avatar:scale-110"
                            />
                        </div>
                        <div className="absolute -bottom-10 right-0 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:-translate-y-1 transition-all whitespace-nowrap shadow-xl z-50">
                            View Profile
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45" />
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    )
}

export default TopBar