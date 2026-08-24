import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem } from '../types';
import {
  Plus,
  Check,
  Clock,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Camera,
  Info,
} from 'lucide-react';
import { QuantitySelector } from './QuantitySelector';
import { ProductDetailModal } from './ProductDetailModal';
import { playTapSound } from '../utils/sound';

interface FoodCardProps {
  item: MenuItem;
  cartQuantity: number;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onUpdateCartQuantity?: (item: MenuItem, newQuantity: number) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  cartQuantity,
  onAddToCart,
  onUpdateCartQuantity,
}) => {
  const [localQuantity, setLocalQuantity] = useState(1);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Gallery of photos for this item
  const cardImages = React.useMemo(() => {
    if (item.images && item.images.length > 0) {
      const list = [...item.images];
      if (item.image && !list.includes(item.image)) {
        list.unshift(item.image);
      }
      return list;
    }
    return [item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'];
  }, [item]);

  const activeImage = cardImages[currentImageIndex] || item.image;

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    setCurrentImageIndex((prev) => (prev + 1) % cardImages.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    setCurrentImageIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length);
  };

  const handleAdd = () => {
    if (!item.isAvailable) return;
    playTapSound();
    onAddToCart(item, localQuantity);
    setIsAddedRecently(true);
    setTimeout(() => {
      setIsAddedRecently(false);
      setLocalQuantity(1);
    }, 1200);
  };

  return (
    <>
      <motion.div
        id={`food-card-${item.id}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={`bg-white rounded-xl sm:rounded-2xl border border-[#d8d6d3] overflow-hidden shadow-soft hover:shadow-soft-lg transition-shadow duration-200 flex flex-col justify-between group ${
          !item.isAvailable ? 'opacity-65 grayscale-[20%]' : ''
        }`}
      >
        {/* Top Image Section (Click to Open Detail & Multi-Image Gallery) */}
        <div
          onClick={() => {
            playTapSound();
            setIsDetailModalOpen(true);
          }}
          className="relative aspect-16/10 sm:aspect-16/10 w-full overflow-hidden bg-[#dcdad7] cursor-pointer select-none"
          title="Click to view all photos and details"
        >
          {/* Actual Image with smooth hover scale */}
          <img
            src={activeImage}
            alt={item.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Shimmer skeleton before image loads */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400 text-[10px]">
              Loading...
            </div>
          )}

          {/* Multiple Photos Navigation Arrows on Card */}
          {cardImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white transition-opacity opacity-75 sm:opacity-0 group-hover:opacity-100 z-10"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white transition-opacity opacity-75 sm:opacity-0 group-hover:opacity-100 z-10"
                aria-label="Next photo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Photo Count Badge */}
              <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
                <Camera className="w-2.5 h-2.5" />
                <span>
                  {currentImageIndex + 1}/{cardImages.length}
                </span>
              </div>

              {/* Dot Indicators */}
              <div className="absolute bottom-1.5 inset-x-0 flex justify-center gap-1 z-10 pointer-events-none">
                {cardImages.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1 rounded-full transition-all ${
                      idx === currentImageIndex
                        ? 'w-3 bg-white shadow-xs'
                        : 'w-1 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Veg / Non-Veg Indicator Badge */}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1 border border-slate-200 z-10">
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
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-slate-700">
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>

          {/* Popular / Spicy / Special Tags */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
            {item.isPopular && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#516B84] text-white text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                Popular
              </motion.span>
            )}
            {item.isSpicy && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5"
              >
                <Flame className="w-2.5 h-2.5 text-amber-600" />
                Spicy
              </motion.span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                Sold Out
              </span>
            </div>
          )}

          {/* Preparation Time Tag */}
          {item.preparationTime && cardImages.length <= 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
              <Clock className="w-2.5 h-2.5" />
              {item.preparationTime}m
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-2.5 sm:p-3.5 flex flex-col flex-grow justify-between gap-2">
          <div>
            <div
              onClick={() => {
                playTapSound();
                setIsDetailModalOpen(true);
              }}
              className="flex items-start justify-between gap-1 mb-0.5 cursor-pointer"
            >
              <h3
                id={`food-title-${item.id}`}
                className="font-bold text-xs sm:text-sm text-[#1E293B] group-hover:text-[#516B84] transition-colors leading-snug font-['Outfit'] line-clamp-1"
              >
                {item.name}
              </h3>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed mb-1.5 font-normal">
              {item.description}
            </p>

            <div className="flex items-center justify-between gap-1">
              <span
                id={`food-price-${item.id}`}
                className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit']"
              >
                ₹{item.price}
              </span>
              {cartQuantity > 0 && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200"
                >
                  {cartQuantity} in cart
                </motion.span>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="pt-1.5 border-t border-slate-100">
            {item.isAvailable ? (
              cartQuantity > 0 && onUpdateCartQuantity ? (
                // If already in cart, show direct cart quantity adjuster
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500">Cart:</span>
                  <QuantitySelector
                    idPrefix={`food-cart-qty-${item.id}`}
                    size="sm"
                    quantity={cartQuantity}
                    min={0}
                    onIncrease={() => {
                      playTapSound();
                      onUpdateCartQuantity(item, cartQuantity + 1);
                    }}
                    onDecrease={() => {
                      playTapSound();
                      onUpdateCartQuantity(item, cartQuantity - 1);
                    }}
                  />
                </div>
              ) : (
                // Standard Add state with selector & Add button
                <div className="flex items-center gap-1.5">
                  <QuantitySelector
                    idPrefix={`food-local-qty-${item.id}`}
                    size="sm"
                    quantity={localQuantity}
                    min={1}
                    onIncrease={() => setLocalQuantity((q) => q + 1)}
                    onDecrease={() => setLocalQuantity((q) => Math.max(1, q - 1))}
                  />

                  <motion.button
                    id={`add-to-cart-btn-${item.id}`}
                    type="button"
                    onClick={handleAdd}
                    disabled={isAddedRecently}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.94 }}
                    className={`flex-1 py-1 sm:py-1.5 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all duration-200 shadow-xs cursor-pointer ${
                      isAddedRecently
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#516B84] text-white hover:bg-[#3E5367]'
                    }`}
                  >
                    {isAddedRecently ? (
                      <motion.span
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Added</span>
                      </motion.span>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )
            ) : (
              <div className="text-center py-1 text-[10px] text-slate-400 font-medium bg-slate-50 rounded-lg">
                Unavailable
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Product Detail & Multi-Image Gallery Modal */}
      <ProductDetailModal
        item={item}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cartQuantity={cartQuantity}
        onAddToCart={onAddToCart}
        onUpdateCartQuantity={onUpdateCartQuantity}
      />
    </>
  );
};
