import React, { useState, useEffect } from 'react';
import { CartItem, Coupon } from '../types';
import { couponService } from '../services/couponService';
import {
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  FileText,
  Tag,
  Check,
  Percent,
  AlertCircle,
  User,
  Smartphone,
} from 'lucide-react';
import { QuantitySelector } from './QuantitySelector';
import { PaymentModeSelector } from './PaymentModeSelector';
import { PaymentAppType } from '../utils/paymentUtils';
import { playTapSound } from '../utils/sound';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number | null;
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onProceedToConfirm: (
    customerNotes?: string,
    discountAmount?: number,
    couponCode?: string,
    paymentMethod?: 'online' | 'cash',
    selectedUpiApp?: PaymentAppType,
    customerName?: string,
    customerPhone?: string
  ) => void;
  onSelectTable: () => void;
}

export const CartSheet: React.FC<CartSheetProps> = ({
  isOpen,
  onClose,
  tableNumber,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToConfirm,
  onSelectTable,
}) => {
  const [customerNotes, setCustomerNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('zoya_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('zoya_customer_phone') || '');
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [selectedUpiApp, setSelectedUpiApp] = useState<PaymentAppType>('phonepe');

  useEffect(() => {
    const unsub = couponService.subscribe((list) => {
      setAvailableCoupons(list.filter((c) => c.isActive));
    });
    return () => unsub();
  }, []);

  const subtotalAmount = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const totalItemCount = items.reduce((sum, ci) => sum + ci.quantity, 0);

  // Recalculate discount
  let discountAmount = 0;
  if (appliedCoupon && subtotalAmount >= appliedCoupon.minOrderAmount) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotalAmount * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const finalGrandTotal = Math.max(0, subtotalAmount - discountAmount);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) return;

    setCouponError('');
    const matched = couponService.getCouponByCode(code);
    if (!matched) {
      setCouponError('Invalid coupon code.');
      return;
    }

    if (subtotalAmount < matched.minOrderAmount) {
      setCouponError(`Min. order ₹${matched.minOrderAmount} required for ${matched.code}.`);
      return;
    }

    playTapSound();
    setAppliedCoupon(matched);
    setCouponCodeInput(matched.code);
  };

  const handleRemoveCoupon = () => {
    playTapSound();
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="cart-sheet-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-fadeIn p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="cart-sheet-modal"
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#d8d6d3] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E6E5E4] flex items-center justify-between bg-[#F7F7F6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#516B84] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#516B84] font-['Outfit']">Your Cart</h2>
              {tableNumber !== null ? (
                <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Table {tableNumber}
                  <button
                    type="button"
                    onClick={onSelectTable}
                    className="text-[10px] text-[#516B84] underline ml-1 hover:text-[#3E5367]"
                  >
                    Change
                  </button>
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium">No table selected</p>
              )}
            </div>
          </div>

          <button
            id="close-cart-sheet-btn"
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#E6E5E4] transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-grow space-y-2.5 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#E6E5E4] flex items-center justify-center text-[#516B84] mb-2">
                <ShoppingBag className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mb-3">
                Explore our fresh chaats, crispy burgers, and hot pav bhaji!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#516B84] text-white text-xs font-semibold hover:bg-[#3E5367] transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {items.map((cartItem) => (
                <div
                  key={cartItem.item.id}
                  id={`cart-item-${cartItem.item.id}`}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5"
                >
                  {/* Thumbnail & Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={cartItem.item.image}
                      alt={cartItem.item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-[#E6E5E4] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            cartItem.item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        />
                        <h4 className="text-xs sm:text-sm font-semibold text-[#1E293B] truncate font-['Outfit']">
                          {cartItem.item.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        ₹{cartItem.item.price} each
                      </p>
                      <p className="text-xs font-bold text-[#516B84] font-['Outfit']">
                        ₹{cartItem.item.price * cartItem.quantity}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <QuantitySelector
                      idPrefix={`cart-qty-${cartItem.item.id}`}
                      size="sm"
                      quantity={cartItem.quantity}
                      min={1}
                      onIncrease={() => {
                        playTapSound();
                        onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1);
                      }}
                      onDecrease={() => {
                        playTapSound();
                        onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1);
                      }}
                    />

                    <button
                      id={`remove-cart-item-${cartItem.item.id}`}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onRemoveItem(cartItem.item.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add More Items Button inside cart list */}
              <div className="pt-2">
                <button
                  id="cart-continue-ordering-btn"
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#516B84]/50 bg-[#EBF0F5]/50 hover:bg-[#EBF0F5] text-[#516B84] font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                >
                  <span className="text-sm leading-none font-bold">+</span>
                  <span>Add More Dishes to Order</span>
                </button>
              </div>

              {/* Coupon Code Box */}
              <div className="pt-3">
                <div className="bg-[#F7F7F6] p-2.5 rounded-xl border border-[#d8d6d3]">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#516B84]" />
                    <span>Apply Promo Coupon</span>
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold">{appliedCoupon.code}</span> applied:
                        <span className="font-bold text-emerald-700">₹{discountAmount} saved!</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Enter secret promo code"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          className="flex-1 text-xs font-mono font-bold uppercase px-2.5 py-1.5 bg-white border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-3 py-1.5 bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Apply
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{couponError}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Mode Option (Online vs Cash) */}
              <div className="pt-2">
                <PaymentModeSelector
                  paymentMethod={paymentMethod}
                  onChangeMethod={setPaymentMethod}
                  amount={finalGrandTotal}
                  tableNumber={tableNumber || undefined}
                  selectedUpiApp={selectedUpiApp}
                  onSelectUpiApp={setSelectedUpiApp}
                  showDetails={true}
                />
              </div>

              {/* Customer Name & WhatsApp (For digital bill) */}
              <div className="pt-2">
                {!showCustomerInput && !customerName && !customerPhone ? (
                  <button
                    id="add-customer-info-btn"
                    type="button"
                    onClick={() => setShowCustomerInput(true)}
                    className="flex items-center gap-1 text-[11px] text-[#516B84] hover:underline font-medium"
                  >
                    <Smartphone className="w-3 h-3 text-[#25D366]" />
                    <span>Add name / WhatsApp number for digital bill (Optional)</span>
                  </button>
                ) : (
                  <div className="space-y-2 bg-[#F7F7F6] p-2.5 rounded-xl border border-[#d8d6d3]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-[#516B84]" />
                        <span>Customer Details (For Bill & WhatsApp)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerName('');
                          setCustomerPhone('');
                          localStorage.removeItem('zoya_customer_name');
                          localStorage.removeItem('zoya_customer_phone');
                          setShowCustomerInput(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        id="cart-customer-name-input"
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          localStorage.setItem('zoya_customer_name', e.target.value);
                        }}
                        placeholder="Your Name (e.g. Rahul)"
                        className="w-full text-xs p-2 rounded-lg bg-white border border-[#d8d6d3] focus:outline-none focus:border-[#516B84]"
                      />
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          +91
                        </span>
                        <input
                          id="cart-customer-phone-input"
                          type="tel"
                          maxLength={10}
                          value={customerPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCustomerPhone(val);
                            localStorage.setItem('zoya_customer_phone', val);
                          }}
                          placeholder="WhatsApp number"
                          className="w-full text-xs pl-10 pr-2 py-2 rounded-lg bg-white border border-[#d8d6d3] focus:outline-none focus:border-[#516B84] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Special Instructions Note */}
              <div className="pt-2">
                {!showNotesInput && !customerNotes ? (
                  <button
                    id="add-cooking-note-btn"
                    type="button"
                    onClick={() => setShowNotesInput(true)}
                    className="flex items-center gap-1 text-[11px] text-[#516B84] hover:underline font-medium"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Add cooking note (e.g. extra spicy)</span>
                  </button>
                ) : (
                  <div className="space-y-1 bg-[#F7F7F6] p-2.5 rounded-xl border border-[#d8d6d3]">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                      <span>Kitchen instructions:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerNotes('');
                          setShowNotesInput(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    </label>
                    <textarea
                      id="customer-order-notes-input"
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="e.g. Extra spicy bhaji, less ice in coffee..."
                      className="w-full text-xs p-2 rounded-lg bg-white border border-[#d8d6d3] focus:outline-none focus:border-[#516B84]"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer & Actions */}
        {items.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-[#E6E5E4] bg-[#F7F7F6] space-y-2.5">
            {/* Warning if no table selected */}
            {tableNumber === null && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>Please select table number before placing order.</span>
                <button
                  type="button"
                  onClick={onSelectTable}
                  className="font-bold underline ml-auto text-amber-900"
                >
                  Select
                </button>
              </div>
            )}

            {/* Bill Summary */}
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal ({totalItemCount} items)</span>
                <span className="font-semibold text-slate-800">₹{subtotalAmount}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Service & GST</span>
                <span className="text-emerald-700 font-medium">Included</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 text-sm font-bold text-[#1E293B]">
                <div className="flex items-center gap-1.5">
                  <span className="font-['Outfit']">To Pay</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-200 text-slate-700">
                    {paymentMethod === 'online' ? 'Online UPI' : 'Cash'}
                  </span>
                </div>
                <span className="text-base text-[#516B84] font-['Outfit']">₹{finalGrandTotal}</span>
              </div>
            </div>

            {/* Redesigned Prominent Proceed Button at Bottom */}
            <div className="pt-1">
              <button
                id="cart-place-order-btn"
                type="button"
                onClick={() => {
                  playTapSound();
                  if (tableNumber === null) {
                    onSelectTable();
                  } else {
                    onProceedToConfirm(
                      customerNotes,
                      discountAmount,
                      appliedCoupon?.code,
                      paymentMethod,
                      selectedUpiApp,
                      customerName,
                      customerPhone
                    );
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#516B84] text-white hover:bg-[#3E5367] font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-between active:scale-98 group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-['Outfit'] text-base">₹{finalGrandTotal}</span>
                  <span className="text-[11px] font-normal text-slate-200 border-l border-white/30 pl-2">
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} · {paymentMethod === 'online' ? 'UPI' : 'Cash'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wide">
                  <span>{tableNumber === null ? 'Select Table to Proceed' : 'Proceed to Confirm'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
