import React from 'react';
import { IndianRupee } from 'lucide-react';

const PriceDisplay = ({ price, originalPrice, size = 'normal', className = '' }) => {
    // Only show anchor pricing if original price is greater than sale price
    const showAnchor = Boolean(originalPrice && Number(originalPrice) > Number(price));
    
    // Size variants
    const sizes = {
        small: {
            sale: 'text-sm',
            anchor: 'text-[10px]',
            badge: 'text-[9px] px-1.5 py-0.5',
            icon: 12,
            anchorIcon: 8
        },
        normal: {
            sale: 'text-lg',
            anchor: 'text-xs',
            badge: 'text-[10px] px-2 py-0.5',
            icon: 14,
            anchorIcon: 10
        },
        medium: {
            sale: 'text-xl',
            anchor: 'text-sm',
            badge: 'text-[11px] px-2 py-0.5',
            icon: 16,
            anchorIcon: 11
        },
        large: {
            sale: 'text-2xl',
            anchor: 'text-sm',
            badge: 'text-xs px-2.5 py-1',
            icon: 18,
            anchorIcon: 12
        }
    };

    const s = sizes[size];
    
    // Format numbers safely
    const formattedPrice = Number(price || 0).toLocaleString();
    const formattedOriginal = Number(originalPrice || 0).toLocaleString();
    
    // Calculate save percentage
    const discountPercent = showAnchor 
        ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
        : 0;

    if (!showAnchor) {
        return (
            <div className={`flex flex-col ${className}`}>
                <div className={`flex items-center gap-1 font-black text-slate-900 ${s.sale}`}>
                    <IndianRupee size={s.icon} strokeWidth={3} className="text-slate-400" />
                    <span>{formattedPrice}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-0.5 ${className}`}>
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 font-black text-slate-900 ${s.sale}`}>
                    <IndianRupee size={s.icon} strokeWidth={3} className="text-blue-500" />
                    <span>{formattedPrice}</span>
                </div>
                {discountPercent > 0 && (
                    <span className={`bg-emerald-100 text-emerald-700 font-black uppercase tracking-widest rounded-md ${s.badge}`}>
                        {discountPercent}% OFF
                    </span>
                )}
            </div>
            <div className={`flex items-center gap-1 font-bold text-slate-400 line-through opacity-70 ${s.anchor}`}>
                <IndianRupee size={s.anchorIcon} strokeWidth={3} />
                <span>{formattedOriginal}</span>
            </div>
        </div>
    );
};

export default PriceDisplay;
