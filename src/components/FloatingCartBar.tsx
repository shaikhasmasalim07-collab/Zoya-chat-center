import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface FloatingCartBarProps {
  itemCount: number;
  totalAmount: number;
  onOpenCart: () => void;
  tableNumber: number | null;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  itemCount,
  totalAmount,
  onOpenCart,
  tableNumber,
}) => {
  if (itemCount === 0) return null;

  return (
    <div
      id="floating-cart-bar-container"
      className="fixed bottom-3 left-0 right-0 z-35 px-3 pointer-events-none animate-slideUp"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          id="floating-cart-view-btn"
          type="button"
          onClick={() => {
            playTapSound();
            onOpenCart();
          }}
          className="w-full bg-[#516B84] hover:bg-[#3E5367] text-white py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl shadow-soft-lg flex items-center justify-between transition-all duration-200 active:scale-[0.98] border border-white/20"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-xs sm:text-sm tracking-tight font-['Outfit']">
                View Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
              {tableNumber !== null && (
                <span className="block text-[10px] text-white/80 font-normal">
                  Table {tableNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-bold font-['Outfit'] text-sm sm:text-base">
            <span>₹{totalAmount}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  );
};
