import React, { useRef, useEffect } from 'react';
import { Category, CategoryId } from '../types';
import {
  Utensils,
  Sparkles,
  Flame,
  CircleDot,
  Layers,
  Pizza,
  Soup,
  ChefHat,
  Zap,
  Drumstick,
  Coffee,
  IceCream,
  Sandwich,
  Wine,
  Apple,
  Cookie,
  LucideIcon,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  categoryCounts?: Record<string, number>;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Sparkles,
  Flame,
  CircleDot,
  Layers,
  Pizza,
  Soup,
  ChefHat,
  Zap,
  Drumstick,
  Coffee,
  IceCream,
  Sandwich,
  Wine,
  Apple,
  Cookie,
};

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab smoothly into view when activeCategory changes
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  return (
    <div
      id="category-tabs-wrapper"
      className="sticky top-[49px] sm:top-[57px] z-30 bg-[#E6E5E4]/95 backdrop-blur-sm py-1.5 sm:py-2.5 px-2 sm:px-4 border-b border-[#d4d2cf]"
    >
      <div
        ref={containerRef}
        id="category-tabs-container"
        className="max-w-5xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const IconComponent = ICON_MAP[cat.iconName] || Utensils;
          const count = categoryCounts ? categoryCounts[cat.id] : undefined;

          return (
            <button
              key={cat.id}
              ref={isActive ? activeTabRef : null}
              id={`category-tab-${cat.id}`}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                playTapSound();
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-xs select-none shrink-0 ${
                isActive
                  ? 'bg-[#516B84] text-white shadow-xs ring-1 ring-[#516B84]'
                  : 'bg-white text-slate-700 border border-[#d8d6d3] hover:border-[#516B84]/50 hover:bg-slate-50'
              }`}
            >
              <IconComponent className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-white' : 'text-[#516B84]'}`} />
              <span>{cat.name}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.1 rounded-full font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
