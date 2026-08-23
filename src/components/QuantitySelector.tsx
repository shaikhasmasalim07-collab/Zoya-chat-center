import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  idPrefix?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
  idPrefix = 'qty',
}) => {
  const sizeClasses = {
    sm: {
      btn: 'w-7 h-7 text-xs',
      text: 'text-sm font-semibold w-7',
      container: 'p-0.5',
    },
    md: {
      btn: 'w-8 h-8 text-sm',
      text: 'text-base font-semibold w-8',
      container: 'p-1',
    },
    lg: {
      btn: 'w-10 h-10 text-base',
      text: 'text-lg font-bold w-10',
      container: 'p-1.5',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      id={`${idPrefix}-container`}
      className={`inline-flex items-center justify-between bg-[#E6E5E4] rounded-lg border border-[#d3d1cf] ${currentSize.container}`}
    >
      <button
        id={`${idPrefix}-decrease-btn`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (quantity > min) onDecrease();
        }}
        disabled={quantity <= min}
        className={`${currentSize.btn} flex items-center justify-center rounded-md bg-white text-[#516B84] hover:bg-[#516B84] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#516B84] transition-colors shadow-xs active:scale-95`}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span
        id={`${idPrefix}-value`}
        className={`${currentSize.text} text-center select-none text-[#1e293b]`}
      >
        {quantity}
      </span>

      <button
        id={`${idPrefix}-increase-btn`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (quantity < max) onIncrease();
        }}
        disabled={quantity >= max}
        className={`${currentSize.btn} flex items-center justify-center rounded-md bg-white text-[#516B84] hover:bg-[#516B84] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#516B84] transition-colors shadow-xs active:scale-95`}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
