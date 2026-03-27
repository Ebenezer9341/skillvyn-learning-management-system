import React from 'react'
import { Mail, Bell, Menu, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/imageUtils'

const TopBar = ({ onMenuClick, onCartClick }) => {
    const { user } = useAuth();
    const { cart } = useCart();

    // Format name if user object exists
    const displayName = user ? `${user.firstName} ${user.lastName}` : 'Guest User';
    const displayEmail = user ? user.email : 'not-signed-in@skillvyn.com';
    const isAdmin = user?.role === 'superuser' || user?.role === 'admin';

    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
                {/* Burger Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden transition-all"
                >
                    <Menu size={24} />
                </button>

                <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100/50 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 truncate max-w-[200px]">{displayEmail}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-6">
                {user?.role === 'candidate' && (
                    <button
                        onClick={onCartClick}
                        className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-lg transition-all group"
                        title="My Cart"
                    >
                        <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                        {cart.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full ring-2 ring-white animate-in zoom-in duration-300">
                                {cart.length}
                            </span>
                        )}
                    </button>
                )}
                <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all group">
                    <Bell size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="flex items-center space-x-3 pl-2 md:pl-6 border-l border-slate-100">
                    <div className="text-right hidden xs:block">
                        <p className="text-sm font-semibold text-secondary">{isAdmin ? 'Admin' : 'User'}: {user?.firstName || 'Guest'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[120px]">{displayEmail}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-white shadow-xl flex-shrink-0 overflow-hidden group/avatar relative">
                        <img 
                            src={getImageUrl(user?.avatar, `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName || 'admin'}`)} 
                            alt="Avatar" 
                            className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110"
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default TopBar