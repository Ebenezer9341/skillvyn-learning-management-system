import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('skillvyn_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    // ✅ AFTER
    useEffect(() => {
        localStorage.setItem('skillvyn_cart', JSON.stringify(cart));

        if (!appliedCoupon) return;

        // Always clear if cart is empty
        if (cart.length === 0) {
            removeCoupon();
            return;
        }

        // Re-check if the coupon is still valid for the remaining cart items.
        // A coupon can be scoped to a specific instructor or specific items —
        // if those items were removed, the coupon should be cleared.
        const cartItems = cart.map(item => ({
            id: item._id,
            type: item.type || 'Course',
            price: item.price
        }));

        api.post('/api/coupons/validate', {
            code: appliedCoupon.code,
            cartItems
        }).then(response => {
            if (response.data.status === 'success') {
                // Update discount in case the amount changed (e.g. fewer applicable items)
                setAppliedCoupon(response.data.data);
                setDiscountAmount(response.data.data.discountAmount);
            } else {
                removeCoupon();
                toast.info('Coupon removed — no longer applicable to your cart.');
            }
        }).catch(() => {
            // If validation fails (coupon no longer valid for remaining items), clear it
            removeCoupon();
            toast.info('Coupon removed — no longer applicable to your cart.');
        });
    }, [cart]);

    const addToCart = (course) => {
        setCart((prevCart) => {
            if (prevCart.find((item) => item._id === course._id)) {
                return prevCart;
            }
            return [...prevCart, course];
        });
    };

    const removeFromCart = (courseId) => {
        setCart((prevCart) => prevCart.filter((item) => item._id !== courseId));
    };

    const clearCart = () => {
        setCart([]);
        removeCoupon();
    };

    const isInCart = (courseId) => {
        return cart.some((item) => item._id === courseId);
    };

    const applyCoupon = async (code) => {
        if (!code) return;
        setIsApplyingCoupon(true);
        try {
            const cartItems = cart.map(item => ({
                id: item._id,
                type: item.type || 'Course', // Default to Course if not specified
                price: item.price
            }));

            const response = await api.post('/api/coupons/validate', {
                code,
                cartItems
            });

            if (response.data.status === 'success') {
                setAppliedCoupon(response.data.data);
                setDiscountAmount(response.data.data.discountAmount);
                toast.success(`Coupon "${code}" applied successfully!`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid coupon code');
            setAppliedCoupon(null);
            setDiscountAmount(0);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
    };

    const cartSubtotal = cart.reduce((total, item) => total + (Number(item.price) || 0), 0);
    const cartTotal = Math.max(0, cartSubtotal - discountAmount);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            isInCart,
            cartSubtotal,
            cartTotal,
            appliedCoupon,
            discountAmount,
            applyCoupon,
            removeCoupon,
            isApplyingCoupon
        }}>
            {children}
        </CartContext.Provider>
    );
};
