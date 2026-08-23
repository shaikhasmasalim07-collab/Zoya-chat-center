import React from 'react';
import { CartItem } from '../types';
import {
  ShieldCheck,
  X,
  Check,
  Utensils,
  Tag,
  Loader2,
  Smartphone,
  Banknote,
  ExternalLink,
  User,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';
import { PaymentModeSelector } from './PaymentModeSelector';
import { PaymentAppType, UPI_CONFIG } from '../utils/paymentUtils';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
  items: CartItem[];
  customerNotes?: string;
  customerName?: string;
  customerPhone?: string;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod?: 'online' | 'cash';
  selectedUpiApp?: PaymentAppType;
  onChangePaymentMethod?: (method: 'online' | 'cash') => void;
  onSelectUpiApp?: (app: PaymentAppType) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  items,
  customerNotes,
  customerName,
  customerPhone,
  discountAmount = 0,
  couponCode,
  paymentMethod = 'online',
  selectedUpiApp = 'phonepe',
  onChangePaymentMethod,
  onSelectUpiApp,
  isSubmitting,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const totalItemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div
      id="order-confirmation-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={!isSubmitting ? onClose : undefined}
    >
      <div
        id="order-confirmation-modal"
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E6E5E4] flex items-center justify-between bg-[#F7F7F6] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#516B84] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#516B84] font-['Outfit']">Confirm Table Order</h2>
              <p className="text-[11px] text-slate-500">Zoya Chat Center · Dine In</p>
            </div>
          </div>

          {!isSubmitting && (
            <button
              id="close-confirmation-modal-btn"
              type="button"
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#E6E5E4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* Table Callout */}
          <div className="p-2.5 rounded-xl bg-[#EBF0F5] border border-[#516B84]/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#516B84]" />
              <span className="text-xs font-semibold text-slate-700">Dine-in Table:</span>
            </div>
            <span className="text-sm font-bold text-[#516B84] font-['Outfit']">
              Table {tableNumber}
            </span>
          </div>

          {/* Customer Info if provided */}
          {(customerName || customerPhone) && (
            <div className="p-2.5 rounded-xl bg-[#F7F7F6] border border-[#d8d6d3] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <User className="w-3.5 h-3.5 text-[#516B84]" />
                <span className="font-semibold text-slate-800">
                  {customerName || 'Guest'}
                </span>
              </div>
              {customerPhone && (
                <span className="font-mono font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  +91 {customerPhone}
                </span>
              )}
            </div>
          )}

          {/* Itemized summary */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Order Items ({totalItemCount})
            </h4>
            <div className="bg-[#F7F7F6] rounded-xl p-2.5 border border-[#E6E5E4] divide-y divide-slate-200/70">
              {items.map((cartItem) => (
                <div
                  key={cartItem.item.id}
                  className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="font-bold text-[#516B84] min-w-[20px]">
                      {cartItem.quantity}×
                    </span>
                    <span className="font-medium text-slate-800 truncate">
                      {cartItem.item.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-700 whitespace-nowrap">
                    ₹{cartItem.item.price * cartItem.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Discount if applied */}
          {discountAmount > 0 && (
            <div className="text-xs p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Coupon ({couponCode}):</span>
              </div>
              <span className="font-bold text-emerald-700">-₹{discountAmount}</span>
            </div>
          )}

          {/* Notes if present */}
          {customerNotes && (
            <div className="text-xs p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
              <span className="font-semibold">Note for Kitchen: </span>
              <span>"{customerNotes}"</span>
            </div>
          )}

          {/* Payment Method Selector / Box */}
          <div>
            {onChangePaymentMethod ? (
              <PaymentModeSelector
                paymentMethod={paymentMethod}
                onChangeMethod={onChangePaymentMethod}
                amount={grandTotal}
                tableNumber={tableNumber}
                selectedUpiApp={selectedUpiApp}
                onSelectUpiApp={onSelectUpiApp}
                showDetails={true}
              />
            ) : (
              <div className="p-3 rounded-xl bg-[#F7F7F6] border border-[#d8d6d3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {paymentMethod === 'online' ? (
                    <Smartphone className="w-4 h-4 text-[#516B84]" />
                  ) : (
                    <Banknote className="w-4 h-4 text-emerald-700" />
                  )}
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {paymentMethod === 'online' ? 'Online Payment (UPI)' : 'Cash on Table'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {paymentMethod === 'online' ? `PhonePe ${UPI_CONFIG.phoneNumber}` : 'Pay staff on service'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="p-3 rounded-xl bg-[#EBF0F5] border border-[#516B84]/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-600 block">Total Bill Amount:</span>
              <span className="text-[10px] text-[#516B84] font-medium">
                {paymentMethod === 'online' ? 'Pay directly via UPI or After Kitchen Confirmation' : 'Pay in cash on delivery'}
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#516B84] font-['Outfit']">
              ₹{grandTotal}
            </span>
          </div>
        </div>

        {/* Footer Actions - Stacked with Safe Clearance from Netlify Badge */}
        <div className="p-3.5 sm:p-4 pb-20 sm:pb-4 border-t border-[#E6E5E4] bg-[#F7F7F6] flex flex-col gap-2 shrink-0">
          <button
            id="final-confirm-order-btn"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              playTapSound();
              onConfirm();
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#516B84] text-white hover:bg-[#3E5367] font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-between disabled:opacity-75 disabled:cursor-not-allowed active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 font-bold font-['Outfit'] text-base">
              <span>₹{grandTotal}</span>
              <span className="text-[11px] font-normal text-slate-200 pl-1 border-l border-white/30">
                {paymentMethod === 'online' ? 'UPI' : 'Cash'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Order to Kitchen...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm Table Order ➔</span>
                </>
              )}
            </div>
          </button>

          <button
            id="cancel-confirm-btn"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-lg text-slate-600 font-semibold text-xs hover:bg-slate-200/60 transition-colors disabled:opacity-50 text-center"
          >
            ← Back to Review Cart & Edit Items
          </button>
        </div>
      </div>
    </div>
  );
};
