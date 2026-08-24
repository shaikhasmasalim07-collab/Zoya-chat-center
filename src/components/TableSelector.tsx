import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, Check, ArrowRight, Utensils, Clock, Smartphone, Instagram, Phone, MessageCircle, MapPin, Users } from 'lucide-react';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';
import { tableService } from '../services/tableService';
import { TableItem } from '../types';
import { playTapSound } from '../utils/sound';

interface TableSelectorProps {
  currentTable: number | null;
  totalTables?: number;
  onConfirmTable: (tableNumber: number) => void;
  onCancel?: () => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
  currentTable,
  totalTables = 10,
  onConfirmTable,
  onCancel,
}) => {
  const [selectedTable, setSelectedTable] = useState<number | null>(currentTable || null);
  const [isCustom, setIsCustom] = useState(false);
  const [customTableInput, setCustomTableInput] = useState('');
  const [availableTables, setAvailableTables] = useState<TableItem[]>(() => tableService.getActiveTables());

  useEffect(() => {
    const unsub = tableService.subscribe((tables) => {
      const active = tables.filter((t) => t.isActive);
      setAvailableTables(active.length > 0 ? active : tableService.getActiveTables());
    });
    return () => unsub();
  }, []);

  const handleSelect = (num: number) => {
    setSelectedTable(num);
    setIsCustom(false);
    playTapSound();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customTableInput, 10);
    if (num && num > 0 && num <= 999) {
      setSelectedTable(num);
      playTapSound();
    }
  };

  const handleStartOrdering = () => {
    if (selectedTable !== null) {
      playTapSound();
      onConfirmTable(selectedTable);
    }
  };

  return (
    <div
      id="table-selector-view"
      className="min-h-[75vh] flex flex-col items-center justify-center px-3 py-4 sm:py-6 max-w-lg mx-auto"
    >
      {/* Brand Hero Card - Compact */}
      <div className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft border border-[#d8d6d3] text-center mb-3 transition-all">
        {/* Logo badge */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#516B84] text-white shadow-soft mb-2 sm:mb-3">
          <ChefHat className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>

        <div className="flex items-center justify-center gap-1 mb-0.5">
          <h1 className="text-xl sm:text-2xl font-bold text-[#516B84] tracking-tight font-['Outfit']">
            {RESTAURANT_DETAILS.name}
          </h1>
          <Sparkles className="w-3.5 h-3.5 text-[#516B84]" />
        </div>

        <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-xs mx-auto mb-1">
          Please select your table number to view menu & order.
        </p>

        {/* Address & Quick Directions */}
        <a
          href={RESTAURANT_DETAILS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTapSound()}
          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#516B84] mb-3 transition-colors bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200"
        >
          <MapPin className="w-3 h-3 text-amber-600" />
          <span>{RESTAURANT_DETAILS.address}</span>
        </a>

        {/* Table Cards Grid */}
        <div
          id="table-cards-grid"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 mb-4"
        >
          {(availableTables.length > 0
            ? availableTables
            : Array.from({ length: totalTables }, (_, i) => ({
                id: `table_${i + 1}`,
                tableNumber: i + 1,
                label: 'Main Dining',
                capacity: 4,
                isActive: true,
              }))
          ).map((tbl) => {
            const num = tbl.tableNumber;
            const isSelected = selectedTable === num;
            return (
              <button
                key={tbl.id || num}
                id={`table-select-btn-${num}`}
                type="button"
                onClick={() => handleSelect(num)}
                className={`relative py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-xl border text-center font-medium transition-all duration-200 flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-[#516B84] text-white border-[#516B84] shadow-md scale-102 ring-2 ring-[#516B84]/30'
                    : 'bg-[#F7F7F6] text-[#1E293B] border-[#d8d6d3] hover:border-[#516B84]/60 hover:bg-white hover:shadow-xs active:scale-98'
                }`}
              >
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider opacity-80">
                  <span>Table</span>
                  {tbl.capacity && (
                    <span className="inline-flex items-center gap-0.5 text-[8px] opacity-75">
                      • {tbl.capacity}P
                    </span>
                  )}
                </div>
                <span className="text-xl sm:text-2xl font-bold font-['Outfit'] leading-tight">{num}</span>
                {tbl.label && tbl.label !== `Table ${num}` && (
                  <span className={`text-[8px] font-medium truncate max-w-[80px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {tbl.label}
                  </span>
                )}
                {isSelected && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-white text-[#516B84] rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Table option toggle */}
        {!isCustom ? (
          <button
            id="custom-table-toggle-btn"
            type="button"
            onClick={() => setIsCustom(true)}
            className="text-[11px] text-slate-500 hover:text-[#516B84] underline underline-offset-2 transition-colors mb-4 block mx-auto"
          >
            Sitting at a different table or counter?
          </button>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex gap-2 max-w-xs mx-auto mb-4">
            <input
              id="custom-table-input"
              type="number"
              min="1"
              max="99"
              placeholder="Table No. (e.g. 12)"
              value={customTableInput}
              onChange={(e) => setCustomTableInput(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
            />
            <button
              id="custom-table-submit-btn"
              type="submit"
              className="px-3 py-1.5 bg-[#516B84] text-white text-xs font-semibold rounded-lg hover:bg-[#3E5367] transition-colors"
            >
              Set
            </button>
          </form>
        )}

        {/* Selected Table Confirmation Callout & Action */}
        {selectedTable !== null ? (
          <div
            id="table-selected-confirmation-box"
            className="pt-2 border-t border-[#E6E5E4] flex flex-col items-center gap-2.5 animate-fadeIn"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF0F5] border border-[#516B84]/20 text-[#516B84] font-semibold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#516B84] animate-ping"></span>
              <span>Table {selectedTable} Selected</span>
            </div>

            <button
              id="start-ordering-action-btn"
              type="button"
              onClick={handleStartOrdering}
              className="w-full sm:w-auto min-w-[200px] py-2.5 sm:py-3 px-5 rounded-xl bg-[#516B84] text-white font-semibold text-sm hover:bg-[#3E5367] active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <span>View Food Menu</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-1">
            Tap a table number above to proceed
          </div>
        )}

        {onCancel && (
          <button
            id="cancel-table-change-btn"
            type="button"
            onClick={onCancel}
            className="mt-2.5 text-xs text-slate-500 hover:text-[#516B84] transition-colors"
          >
            Back to Current Order
          </button>
        )}
      </div>

      {/* One-tap Direct Connect Bar (Instagram, Call, WhatsApp, Location) */}
      <div className="grid grid-cols-4 gap-1.5 w-full mb-3">
        <a
          href={RESTAURANT_DETAILS.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTapSound()}
          className="bg-white p-2 rounded-xl border border-[#d8d6d3] flex flex-col items-center justify-center gap-1 text-pink-700 shadow-xs hover:border-pink-500 hover:bg-pink-50/40 active:scale-95 transition-all text-center"
        >
          <Instagram className="w-4 h-4 text-pink-600" />
          <span className="text-[10px] font-bold">@{RESTAURANT_DETAILS.instagram}</span>
        </a>

        <a
          href={`tel:${RESTAURANT_DETAILS.phone}`}
          onClick={() => playTapSound()}
          className="bg-white p-2 rounded-xl border border-[#d8d6d3] flex flex-col items-center justify-center gap-1 text-[#516B84] shadow-xs hover:border-[#516B84] hover:bg-[#516B84]/5 active:scale-95 transition-all text-center"
        >
          <Phone className="w-4 h-4 text-[#516B84]" />
          <span className="text-[10px] font-bold">Call Us</span>
        </a>

        <a
          href={`https://wa.me/91${RESTAURANT_DETAILS.whatsapp}?text=Hello%20Zoya%20Chat%20Center`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTapSound()}
          className="bg-white p-2 rounded-xl border border-[#d8d6d3] flex flex-col items-center justify-center gap-1 text-emerald-700 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-95 transition-all text-center"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-bold">WhatsApp</span>
        </a>

        <a
          href={RESTAURANT_DETAILS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTapSound()}
          className="bg-white p-2 rounded-xl border border-[#d8d6d3] flex flex-col items-center justify-center gap-1 text-slate-800 shadow-xs hover:border-amber-500 hover:bg-amber-50/40 active:scale-95 transition-all text-center"
        >
          <MapPin className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-bold">Location</span>
        </a>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-3 gap-2 w-full text-center">
        <div className="bg-white/80 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl border border-[#d8d6d3] flex flex-col items-center gap-0.5 shadow-xs">
          <Utensils className="w-3.5 h-3.5 text-[#516B84]" />
          <span className="text-[10px] font-semibold text-slate-700">Fresh Chaat</span>
          <span className="text-[9px] text-slate-500">Made to order</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl border border-[#d8d6d3] flex flex-col items-center gap-0.5 shadow-xs">
          <Smartphone className="w-3.5 h-3.5 text-[#516B84]" />
          <span className="text-[10px] font-semibold text-slate-700">Zero Signup</span>
          <span className="text-[9px] text-slate-500">Fast ordering</span>
        </div>
        <div className="bg-white/80 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl border border-[#d8d6d3] flex flex-col items-center gap-0.5 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-[#516B84]" />
          <span className="text-[10px] font-semibold text-slate-700">Fast Kitchen</span>
          <span className="text-[9px] text-slate-500">Live tracker</span>
        </div>
      </div>
    </div>
  );
};
