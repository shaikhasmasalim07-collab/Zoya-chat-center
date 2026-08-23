import React, { useState } from 'react';
import { MenuItem } from '../types';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Sparkles,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  Camera,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface ProductDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  cartQuantity: number;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onUpdateCartQuantity?: (item: MenuItem, newQuantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  cartQuantity,
  onAddToCart,
  onUpdateCartQuantity,
}) => {
  if (!isOpen || !item) return null;

  // Collect all images for gallery
  const allImages = React.useMemo(() => {
    if (item.images && item.images.length > 0) {
      // Ensure primary image is first if not already
      const list = [...item.images];
      if (item.image && !list.includes(item.image)) {
        list.unshift(item.image);
      }
      return list;
    }
    return [item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'];
  }, [item]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);

  const handleNextImage = () => {
    playTapSound();
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    playTapSound();
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAdd = () => {
    if (!item.isAvailable) return;
    playTapSound();
    onAddToCart(item, localQuantity);
    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
      onClose();
    }, 900);
  };

  return (
    <div
      id="product-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="relative">
          {/* Main Photo Gallery Carousel */}
          <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-900 overflow-hidden select-none">
            <img
              src={allImages[activeImageIndex]}
              alt={`${item.name} - photo ${activeImageIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Veg / Non-veg Badge */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs flex items-center gap-1.5 border border-slate-200">
              <div
                className={`w-3 h-3 border flex items-center justify-center rounded-[2.5px] p-[1px] ${
                  item.isVeg ? 'border-emerald-600' : 'border-red-600'
                }`}
              >
                <div
                  className={`w-full h-full rounded-full ${
                    item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                {item.isVeg ? 'Pure Veg' : 'Non-Veg'}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Next / Prev Arrows if multiple images */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Photo counter */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>
                    {activeImageIndex + 1} / {allImages.length}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Multiple Images Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 p-2.5 bg-[#F7F7F6] border-b border-[#d8d6d3] overflow-x-auto no-scrollbar">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setActiveImageIndex(idx);
                  }}
                  className={`relative w-14 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#516B84] scale-105 shadow-sm ring-1 ring-[#516B84]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-grow">
          {/* Title & Badges */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                {item.name}
              </h3>
              <span className="text-base sm:text-lg font-bold text-[#516B84] font-['Outfit'] shrink-0">
                ₹{item.price}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Category: {item.category}
              </span>

              {item.isPopular && (
                <span className="text-[10px] font-semibold text-white bg-[#516B84] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Popular Item
                </span>
              )}

              {item.isSpicy && (
                <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-600" />
                  Spicy
                </span>
              )}

              {item.preparationTime && (
                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Est. {item.preparationTime} mins prep
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 font-['Outfit'] mb-1">
              About this dish
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Highlights & Freshness promise */}
          <div className="p-3 bg-[#F7F7F6] rounded-xl border border-[#d8d6d3] text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prepared fresh upon order at Zoya Chat Center</span>
            </div>
            <p className="text-[11px] text-slate-500 pl-5">
              Served hot directly to your table with signature house spices and authentic chutneys.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          {item.isAvailable ? (
            <>
              {/* Quantity Controls */}
              <div className="flex items-center border border-[#d8d6d3] rounded-xl overflow-hidden bg-[#F7F7F6]">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setLocalQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="p-2 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800">
                  {localQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setLocalQuantity((q) => q + 1);
                  }}
                  className="p-2 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button with total price calculation */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAddedRecently}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                  isAddedRecently
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#516B84] text-white hover:bg-[#3E5367]'
                }`}
              >
                {isAddedRecently ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {localQuantity} · ₹{item.price * localQuantity}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full text-center py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl border border-red-200">
              Currently Out of Stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
