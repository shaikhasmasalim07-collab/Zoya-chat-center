import React from 'react';
import { ShoppingBag, Sparkles, ChefHat, Clock, ShieldCheck } from 'lucide-react';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';
import { playTapSound } from '../utils/sound';

interface HeaderProps {
  tableNumber: number | null;
  cartItemCount: number;
  activeOrderCount: number;
  onOpenCart: () => void;
  onSelectTable: () => void;
  onOpenOrderTracker: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tableNumber,
  cartItemCount,
  activeOrderCount,
  onOpenCart,
  onSelectTable,
  onOpenOrderTracker,
  onOpenAdmin,
}) => {
  const [logoTapCount, setLogoTapCount] = React.useState(0);

  const handleLogoTap = () => {
    playTapSound();
    const newCount = logoTapCount + 1;
    if (newCount >= 3) {
      setLogoTapCount(0);
      if (onOpenAdmin) {
        onOpenAdmin();
      } else {
        onSelectTable();
      }
    } else {
      setLogoTapCount(newCount);
      setTimeout(() => setLogoTapCount(0), 1500);
      onSelectTable();
    }
  };
  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 bg-[#E6E5E4]/95 backdrop-blur-md border-b border-[#d4d2cf] px-3 py-2 sm:px-6 sm:py-2.5 transition-all duration-200"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div
          id="brand-logo-container"
          onClick={handleLogoTap}
          className="flex items-center gap-2 cursor-pointer group select-none min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#516B84] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm sm:text-base tracking-tight text-[#516B84] font-['Outfit'] truncate">
                {RESTAURANT_DETAILS.name}
              </span>
              <Sparkles className="w-3 h-3 text-[#516B84] opacity-80 shrink-0" />
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 tracking-wide truncate">
              {RESTAURANT_DETAILS.city} · Fast Dining
            </p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Orders Tracker Pill for this Table */}
          {tableNumber !== null && activeOrderCount > 0 && (
            <button
              id="header-order-tracker-btn"
              onClick={onOpenOrderTracker}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100/90 text-amber-900 border border-amber-300 text-[11px] font-semibold hover:bg-amber-200 transition-colors animate-pulse"
              title="View live order status"
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span className="hidden sm:inline">Status</span>
              <span className="bg-amber-600 text-white rounded-full px-1 py-0.1 text-[9px]">
                {activeOrderCount}
              </span>
            </button>
          )}

          {/* Table Selector Pill */}
          {tableNumber !== null ? (
            <button
              id="header-table-badge-btn"
              onClick={onSelectTable}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#516B84]/30 text-[#516B84] hover:bg-[#516B84] hover:text-white transition-all text-xs font-semibold shadow-xs"
              aria-label="Change table number"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>T-{tableNumber}</span>
            </button>
          ) : (
            <button
              id="header-select-table-btn"
              onClick={onSelectTable}
              className="px-2.5 py-1 rounded-lg bg-[#516B84] text-white text-xs font-medium hover:bg-[#3E5367] transition-colors shadow-xs"
            >
              Table #
            </button>
          )}

          {/* Cart Trigger */}
          <button
            id="header-cart-btn"
            onClick={onOpenCart}
            className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#d4d2cf] text-[#516B84] hover:border-[#516B84] hover:text-[#3E5367] transition-colors shadow-xs"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartItemCount > 0 && (
              <span
                id="header-cart-badge"
                className="absolute -top-1 -right-1 bg-[#516B84] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#E6E5E4] shadow-xs"
              >
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
