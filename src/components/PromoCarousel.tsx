import React, { useState, useEffect } from 'react';
import { PromoBanner } from '../types';
import { bannerService } from '../services/bannerService';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export const PromoCarousel: React.FC = () => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsub = bannerService.subscribe((list) => {
      setBanners(list.filter((b) => b.isActive));
    });
    return () => unsub();
  }, []);

  // Auto slide every 5 seconds if multiple banners exist
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex] || banners[0];

  return (
    <div id="promo-banner-carousel" className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-soft mb-3 sm:mb-4">
      <div
        className={`relative bg-gradient-to-r ${currentBanner.bgGradient} p-3 sm:p-4 text-white flex items-center justify-between gap-2.5 sm:gap-4 transition-all duration-500`}
      >
        <div className="relative z-10 min-w-0 flex-1 space-y-1">
          {currentBanner.tag && (
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              {currentBanner.tag}
            </span>
          )}

          <h3 className="font-bold text-xs sm:text-base font-['Outfit'] leading-tight sm:leading-snug truncate">
            {currentBanner.title}
          </h3>

          <p className="text-[10px] sm:text-xs text-white/85 line-clamp-1 leading-normal font-normal">
            {currentBanner.subtitle}
          </p>
        </div>

        {currentBanner.imageUrl && (
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shadow-md shrink-0 border border-white/25">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Carousel indicators if more than 1 */}
        {banners.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1 rounded-full transition-all ${
                  currentIndex === idx ? 'w-4 bg-white' : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
