import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ isOpen, onClose }) => {
    const { cart, removeFromCart, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/candidate/cart/checkout');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[160] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <ShoppingCart size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 leading-none">Your Cart</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {cart.length} {cart.length === 1 ? 'Course' : 'Courses'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                                        <ShoppingCart size={48} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900">Cart is empty</h4>
                                    <p className="text-sm text-slate-500 font-medium max-w-[200px]">
                                        Looks like you haven't added any paths to your cart yet.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="text-primary font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                                    >
                                        Browse Curriculums
                                    </button>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item._id} className="flex gap-4 group">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/30">
                                                    <BookOpen size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 text-sm leading-tight line-clamp-2 truncate">
                                                {item.title}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                                By {item.instructor?.firstName || 'Mentor'}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="font-black text-primary text-sm">
                                                    ₹{item.price?.toLocaleString()}
                                                </p>
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Total</span>
                                    <span className="text-2xl font-black text-slate-900">₹{cartTotal.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-200"
                                >
                                    <span>Checkout Now</span>
                                    <ArrowRight size={18} />
                                </button>
                                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                                    Secure 256-bit SSL Encrypted Transaction
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
