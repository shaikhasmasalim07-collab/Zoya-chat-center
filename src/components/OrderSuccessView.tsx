import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Sparkles,
  Utensils,
  ArrowRight,
  BellRing,
  RefreshCw,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  Share2,
  Receipt,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playTapSound } from '../utils/sound';
import { UpiPaymentBox } from './UpiPaymentBox';
import { UPI_CONFIG } from '../utils/paymentUtils';
import { orderService } from '../services/orderService';
import { InvoiceModal } from './InvoiceModal';
import { formatOrderWhatsAppInvoice, getWhatsAppDirectUrl } from '../utils/invoiceGenerator';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';

interface OrderSuccessViewProps {
  order: Order;
  onOrderMore: () => void;
  onRefreshStatus?: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; description: string }[] = [
  { key: 'new', label: 'Order Sent', description: 'Received at kitchen counter' },
  { key: 'accepted', label: 'Accepted', description: 'Chef acknowledged order' },
  { key: 'preparing', label: 'Preparing', description: 'Hot & fresh on the tawa' },
  { key: 'ready', label: 'Ready', description: 'Serving at your table' },
  { key: 'completed', label: 'Completed', description: 'Order finished & enjoyed' },
];

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  order,
  onOrderMore,
  onRefreshStatus,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [paidReported, setPaidReported] = useState(order.paymentStatus === 'paid');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
    setPaidReported(order.paymentStatus === 'paid');
  }, [order]);

  useEffect(() => {
    // Celebratory confetti burst
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#516B84', '#68829C', '#5f259f', '#10B981'],
      });
    } catch (e) {
      // Confetti fallback
    }
  }, [order.id]);

  const handleMarkAsPaid = async () => {
    playTapSound();
    setPaidReported(true);
    await orderService.updatePaymentStatus(order.id, 'paid');
  };

  const handleSwitchPaymentMode = async (mode: 'online' | 'cash') => {
    playTapSound();
    await orderService.updatePaymentMethod(order.id, mode);
    setCurrentOrder((prev) => ({ ...prev, paymentMethod: mode }));
  };

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentOrder.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;
  const isOnline = currentOrder.paymentMethod !== 'cash';

  return (
    <div
      id="order-success-container"
      className="min-h-[80vh] flex flex-col items-center justify-start px-3 sm:px-4 py-4 sm:py-6 max-w-lg mx-auto animate-fadeIn"
    >
      {/* Main Success Card */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-soft border border-[#d8d6d3] text-center mb-4">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border-4 border-emerald-100 text-emerald-600 mb-3 shadow-xs">
          <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5]" />
        </div>

        <div className="flex items-center justify-center gap-1 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-[#516B84] tracking-tight font-['Outfit']">
            Order Sent to Kitchen! 🎉
          </h1>
        </div>

        <p className="text-slate-600 text-xs sm:text-sm font-medium mb-1">
          Your order has been received at Zoya Chat Center.
        </p>

        {/* Table & Order Number Badge */}
        <div className="flex items-center justify-center gap-2 my-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EBF0F5] border border-[#516B84]/20 text-[#516B84] text-xs font-bold font-['Outfit']">
            <Utensils className="w-3.5 h-3.5" />
            <span>Table {currentOrder.tableNumber}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F7F7F6] border border-[#d8d6d3] text-slate-800 text-xs font-bold tracking-wider font-['Outfit']">
            <span>Order #{currentOrder.id}</span>
          </div>
        </div>

        {/* Live Kitchen Status Stepper */}
        <div className="text-left bg-[#F7F7F6] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-[#d8d6d3] mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-[#516B84]" />
              Live Kitchen Tracker
            </span>
            {onRefreshStatus && (
              <button
                type="button"
                onClick={onRefreshStatus}
                className="text-[10px] text-[#516B84] hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Live Sync
              </button>
            )}
          </div>

          <div className="space-y-3 relative">
            {/* Connecting line */}
            <div className="absolute left-[11px] top-2 bottom-3 w-0.5 bg-slate-200" />

            {STATUS_STEPS.slice(0, 4).map((step, idx) => {
              const isPassed = idx < activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div key={step.key} className="flex items-start gap-2.5 relative z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-[#516B84] text-white ring-4 ring-[#516B84]/20 shadow-xs animate-pulse'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold font-['Outfit'] ${
                          isCurrent
                            ? 'text-[#516B84] text-xs sm:text-sm'
                            : isPassed
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#516B84] text-white font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Payment Action Section */}
        <div className="text-left mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#516B84]" />
              <span>Bill & Payment Mode</span>
            </h4>

            {/* Switch Mode Toggle */}
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => handleSwitchPaymentMode('online')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                  isOnline
                    ? 'bg-[#516B84] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Online (UPI)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchPaymentMode('cash')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                  !isOnline
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* If Online, display interactive UPI Card with PhonePe & GPay direct triggers */}
          {isOnline ? (
            <div className="space-y-2">
              <UpiPaymentBox
                amount={currentOrder.totalAmount}
                tableNumber={currentOrder.tableNumber}
                orderId={currentOrder.id}
                showQrByDefault={true}
              />

              {!paidReported ? (
                <button
                  type="button"
                  onClick={handleMarkAsPaid}
                  className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>I have completed payment via PhonePe / GPay</span>
                </button>
              ) : (
                <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Payment status marked: Paid</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Banknote className="w-4 h-4 text-emerald-700" />
                <span>Cash on Table</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Please pay <strong>₹{currentOrder.totalAmount}</strong> in cash to the waiter when
                food is delivered to Table {currentOrder.tableNumber}.
              </p>
            </div>
          )}
        </div>

        {/* Order Items Breakdown */}
        <div className="text-left mb-4">
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Items in this order
          </h4>
          <div className="bg-[#F7F7F6] rounded-xl p-3 border border-[#d8d6d3] divide-y divide-slate-200">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="py-1.5 first:pt-0 last:pb-0 flex justify-between text-xs">
                <span className="font-medium text-slate-800">
                  <strong className="text-[#516B84]">{item.quantity}×</strong> {item.name}
                  {item.specialNotes && (
                    <span className="block text-[10px] text-slate-500 italic">
                      Note: {item.specialNotes}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-slate-700">₹{item.price * item.quantity}</span>
              </div>
            ))}

            {currentOrder.discountAmount ? (
              <div className="py-1.5 flex justify-between text-xs text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  Coupon Discount ({currentOrder.couponCode || 'PROMO'})
                </span>
                <span>-₹{currentOrder.discountAmount}</span>
              </div>
            ) : null}

            <div className="pt-2 flex justify-between text-xs sm:text-sm font-bold text-[#1E293B] font-['Outfit']">
              <span>Total Bill</span>
              <span className="text-[#516B84]">₹{currentOrder.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Direct WhatsApp Notification Banner */}
        <div className="mb-4 p-3 rounded-2xl bg-[#EBF0F5] border border-[#516B84]/30 text-left flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <h5 className="font-bold text-slate-800 font-['Outfit'] flex items-center gap-1.5">
              <span>Direct WhatsApp Order Delivery</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">Active</span>
            </h5>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              Order WhatsApp pe <strong className="text-slate-800 font-semibold">{RESTAURANT_DETAILS.phone}</strong> par send ho gaya hai. Aap niche diye gaye button se dobara bhi message bhej sakte hain.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {/* Prominent Direct WhatsApp Button */}
          <button
            id="success-whatsapp-send-owner-btn"
            type="button"
            onClick={() => {
              playTapSound();
              const msg = formatOrderWhatsAppInvoice(currentOrder);
              const url = getWhatsAppDirectUrl(RESTAURANT_DETAILS.whatsapp, msg);
              window.open(url, '_blank');
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Send / View Order on WhatsApp ({RESTAURANT_DETAILS.phone})</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="success-view-bill-btn"
              type="button"
              onClick={() => {
                playTapSound();
                setShowInvoiceModal(true);
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Receipt className="w-3.5 h-3.5 text-[#516B84]" />
              <span>View Bill / Print</span>
            </button>

            <button
              id="order-more-items-btn"
              type="button"
              onClick={() => {
                playTapSound();
                onOrderMore();
              }}
              className="py-2.5 px-3 rounded-xl bg-[#516B84] text-white font-semibold text-xs hover:bg-[#3E5367] active:scale-98 transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>+ Order More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Invoice Modal */}
        {showInvoiceModal && (
          <InvoiceModal
            order={currentOrder}
            isOpen={showInvoiceModal}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}
      </div>
    </div>
  );
};
