import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    CreditCard, 
    ShieldCheck, 
    Lock, 
    ArrowRight, 
    Loader2, 
    ChevronLeft,
    CheckCircle2,
    Building2,
    Wallet,
    ShoppingCart,
    BookOpen
} from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import PriceDisplay from '../../components/ui/PriceDisplay';

const CartCheckout = () => {
    const { 
        cart, 
        cartSubtotal, 
        cartTotal, 
        appliedCoupon, 
        discountAmount, 
        applyCoupon, 
        removeCoupon, 
        isApplyingCoupon,
        clearCart 
    } = useCart();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [finalAmount, setFinalAmount] = useState(0);
    const [couponCode, setCouponCode] = useState('');
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '4242 4242 4242 4242',
        expiry: '12/26',
        cvv: '123'
    });

    useEffect(() => {
        if (cart.length === 0 && !success) {
            navigate('/candidate');
        }
    }, [cart.length, navigate, success]);

    const handlePayment = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Enroll in all courses in the cart
            const courseIds = cart.map(item => item._id);
            await api.post('/api/enrollments/enroll-batch', { 
                courseIds, 
                couponCode: appliedCoupon?.code 
            });
            
            // Store final amount before clearing
            setFinalAmount(cartTotal);
            setSuccess(true);
            clearCart();
            toast.success('Payment Successful! Welcome to your new courses.');
            
            setTimeout(() => {
                navigate('/candidate/courses');
            }, 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transaction failed');
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-12 rounded-2xl shadow-2xl shadow-accent/10 text-center max-w-lg w-full border border-accent/10"
                >
                    <div className="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center text-accent mx-auto mb-8">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Purchase Successful!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8">
                        Your transaction of <span className="text-slate-900 font-black">₹{finalAmount.toLocaleString()}</span> was successful. You are now enrolled in all selected paths.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        Redirecting to My Courses...
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-widest">Continue Shopping</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Left Side: Summary */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                                <ShoppingCart className="text-primary" />
                                Cart Summary
                            </h2>
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {cart.map((item) => (
                                    <div key={item._id} className="flex gap-4 items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/30">
                                                    <BookOpen size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800 text-sm leading-tight truncate">{item.title}</p>
                                            <PriceDisplay 
                                                price={item.price} 
                                                originalPrice={item.originalPrice} 
                                                size="small" 
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-8 border-t border-slate-100 mt-6 space-y-4">
                                {/* Coupon Section */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Have a coupon?</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="SKILLVYN10"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            disabled={appliedCoupon || isApplyingCoupon}
                                            className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase placeholder:text-slate-300"
                                        />
                                        {appliedCoupon ? (
                                            <button 
                                                onClick={removeCoupon}
                                                className="px-4 h-12 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase hover:bg-red-100 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => applyCoupon(couponCode)}
                                                disabled={!couponCode || isApplyingCoupon}
                                                className="px-6 h-12 bg-secondary text-white rounded-2xl font-black text-xs uppercase hover:bg-secondary/90 transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105 active:scale-95"
                                            >
                                                {isApplyingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                                            </button>
                                        )}
                                    </div>
                                    {appliedCoupon && (
                                        <p className="text-[10px] text-accent font-bold flex items-center gap-1 mt-1">
                                            <CheckCircle2 size={12} />
                                            Coupon Applied! You saved ₹{discountAmount.toLocaleString()}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 pt-4 border-t border-dashed border-slate-100">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                        <span>Subtotal</span>
                                        <span>₹{cartSubtotal.toLocaleString()}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-xs font-bold text-accent">
                                            <span>Discount ({appliedCoupon?.code})</span>
                                            <span>-₹{discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-2">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                            <p className="text-4xl font-black text-slate-900 leading-none">₹{cartTotal.toLocaleString()}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-accent/5 text-accent rounded-full text-[10px] font-black border border-accent/10 uppercase tracking-widest">
                                            {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                                <ShieldCheck size={24} />
                                <span className="text-sm font-black uppercase tracking-widest">Skillvyn Secure Guarantee</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Your payment information is encrypted with the latest SSL technology. We never store your full card details.
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white p-12 rounded-2xl shadow-2xl shadow-slate-200 border border-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                            
                            <div className="flex items-center justify-between mb-12">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Payment Details</h3>
                                    <p className="text-sm text-slate-400 font-medium">Safe and encrypted checkout process</p>
                                </div>
                                <div className="flex gap-2">
                                    <Building2 className="text-slate-200" size={24} />
                                    <Wallet className="text-slate-200" size={24} />
                                </div>
                            </div>

                            <form onSubmit={handlePayment} className="space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cardholder Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="John Doe"
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                            value={formData.cardName}
                                            onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                                        <div className="relative">
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="4242 4242 4242 4242"
                                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 pl-14 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                                value={formData.cardNumber}
                                                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                                            />
                                            <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="MM/YY"
                                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner text-center"
                                                value={formData.expiry}
                                                onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                                            <div className="relative">
                                                <input 
                                                    required
                                                    type="password" 
                                                    placeholder="***"
                                                    maxLength="3"
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner text-center"
                                                    value={formData.cvv}
                                                    onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                                                />
                                                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-16 bg-secondary text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-secondary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-secondary/20 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Pay ₹{cartTotal.toLocaleString()} & Enroll</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartCheckout;
