import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, Check, ChefHat, CheckCheck, XCircle, AlertCircle, Sparkles, Receipt, Share2, User } from 'lucide-react';
import { playTapSound } from '../utils/sound';
import { formatOrderWhatsAppInvoice, getWhatsAppDirectUrl } from '../utils/invoiceGenerator';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePayment?: (orderId: string, status: 'pending' | 'paid') => void;
  onOpenInvoice?: (order: Order) => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; nextStatus?: OrderStatus; nextLabel?: string }
> = {
  new: {
    label: 'New Order',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    nextStatus: 'accepted',
    nextLabel: 'Accept Order',
  },
  accepted: {
    label: 'Accepted',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    nextStatus: 'preparing',
    nextLabel: 'Start Preparing',
  },
  preparing: {
    label: 'Preparing',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    nextStatus: 'ready',
    nextLabel: 'Mark Ready',
  },
  ready: {
    label: 'Ready to Serve',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    nextStatus: 'completed',
    nextLabel: 'Complete Order',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
};

function formatTimeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ${diffMins % 60}m ago`;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onUpdatePayment,
  onOpenInvoice,
}) => {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    const message = formatOrderWhatsAppInvoice(order);
    const url = getWhatsAppDirectUrl(order.customerPhone, message);
    window.open(url, '_blank');
  };

  return (
    <div
      id={`admin-order-card-${order.id}`}
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-soft transition-all duration-200 flex flex-col justify-between ${
        order.status === 'new'
          ? 'border-blue-400 ring-2 ring-blue-100'
          : 'border-[#d8d6d3]'
      }`}
    >
      {/* Top Details */}
      <div>
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 font-['Outfit']">
                Order #{order.id}
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}
              >
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatTimeAgo(order.orderTime)}
              </span>
              <span>·</span>
              <span>{new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Customer name & phone badge if available */}
            {(order.customerName || order.customerPhone) && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg w-fit border border-slate-200 font-medium">
                <User className="w-3 h-3 text-[#516B84]" />
                <span className="font-semibold text-slate-800">
                  {order.customerName || 'Customer'}
                </span>
                {order.customerPhone && (
                  <span className="font-mono text-slate-500 text-[11px]">
                    · {order.customerPhone}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-[#516B84] text-white text-center shadow-xs shrink-0">
            <span className="text-[10px] uppercase tracking-wider block opacity-80">Table</span>
            <span className="text-lg font-bold font-['Outfit'] leading-none">
              {order.tableNumber}
            </span>
          </div>
        </div>

        {/* Ordered items list */}
        <div className="space-y-2 mb-3 bg-[#F7F7F6] p-3 rounded-xl border border-[#E6E5E4]">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-xs">
              <div className="flex items-start gap-1.5 flex-1 pr-2">
                <span className="font-bold text-[#516B84] text-sm leading-tight">
                  {item.quantity}×
                </span>
                <div>
                  <span className="font-medium text-slate-800">{item.name}</span>
                  {item.specialNotes && (
                    <span className="block text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 font-medium">
                      Note: {item.specialNotes}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-semibold text-slate-700 whitespace-nowrap">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Customer cooking notes if present */}
        {order.customerNotes && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-3 font-medium">
            <span className="font-bold">Instructions: </span>
            <span>"{order.customerNotes}"</span>
          </div>
        )}

        {/* Total & Payment Badge */}
        <div className="flex items-center justify-between py-2 border-t border-slate-100 mb-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                order.paymentMethod === 'online'
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {order.paymentMethod === 'online' ? '💳 Online UPI' : '💵 Cash'}
            </span>

            {onUpdatePayment ? (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onUpdatePayment(order.id, order.paymentStatus === 'paid' ? 'pending' : 'paid');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                }`}
              >
                {order.paymentStatus === 'paid' ? '✓ Paid' : 'Payment Due'}
              </button>
            ) : (
              <span className="font-semibold text-slate-700 uppercase text-[10px]">
                {order.paymentStatus}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-slate-500 mr-1.5">Total:</span>
            <span className="text-base font-bold text-[#516B84] font-['Outfit']">
              ₹{order.totalAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons for Kitchen / Admin */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        {/* Invoice & WhatsApp Direct Bar */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            id={`order-invoice-btn-${order.id}`}
            type="button"
            onClick={() => {
              playTapSound();
              if (onOpenInvoice) {
                onOpenInvoice(order);
              }
            }}
            className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            title="Generate & View Print Invoice"
          >
            <Receipt className="w-3.5 h-3.5 text-[#516B84]" />
            <span>Generate Bill</span>
          </button>

          <button
            id={`order-whatsapp-btn-${order.id}`}
            type="button"
            onClick={handleQuickWhatsApp}
            className="py-1.5 px-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            title="Send Invoice to WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Bill</span>
          </button>
        </div>

        {/* Main Progression Button */}
        {config.nextStatus && (
          <button
            id={`order-advance-btn-${order.id}`}
            type="button"
            onClick={() => {
              playTapSound();
              onUpdateStatus(order.id, config.nextStatus!);
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#516B84] text-white hover:bg-[#3E5367] font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{config.nextLabel}</span>
          </button>
        )}

        {/* Quick status manual switcher */}
        <div className="flex gap-1 pt-0.5">
          {order.status !== 'accepted' && order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'accepted')}
              className="flex-1 py-1 px-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-semibold border border-indigo-200"
            >
              Accept
            </button>
          )}

          {order.status !== 'preparing' && order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              className="flex-1 py-1 px-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-semibold border border-amber-300"
            >
              Preparing
            </button>
          )}

          {order.status !== 'ready' && order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'ready')}
              className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-300"
            >
              Ready
            </button>
          )}

          {order.status !== 'completed' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, 'completed')}
              className="flex-1 py-1 px-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-300"
            >
              Done
            </button>
          )}

          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Cancel Order #${order.id}?`)) {
                  onUpdateStatus(order.id, 'cancelled');
                }
              }}
              className="py-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-semibold border border-red-200"
              title="Cancel Order"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
