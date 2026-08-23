import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, X, ChefHat, CheckCircle2, Utensils, Share2, Receipt } from 'lucide-react';
import { playTapSound } from '../utils/sound';
import { InvoiceModal } from './InvoiceModal';
import { formatOrderWhatsAppInvoice, getWhatsAppDirectUrl } from '../utils/invoiceGenerator';

interface ActiveOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  tableNumber: number;
  onOrderMore: () => void;
}

const STATUS_BADGES: Record<OrderStatus, { bg: string; label: string }> = {
  new: { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New Order' },
  accepted: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Accepted' },
  preparing: { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: 'Preparing' },
  ready: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Ready to Serve' },
  completed: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Completed' },
  cancelled: { bg: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
};

export const ActiveOrdersModal: React.FC<ActiveOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  tableNumber,
  onOrderMore,
}) => {
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const totalTableBill = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div
      id="active-orders-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="active-orders-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E5E4] flex items-center justify-between bg-[#F7F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#516B84] text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#516B84] font-['Outfit']">
                Table {tableNumber} Orders
              </h2>
              <p className="text-xs text-slate-500">Live Kitchen Status</p>
            </div>
          </div>

          <button
            id="close-active-orders-modal-btn"
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#E6E5E4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-grow">
          {orders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No orders placed for Table {tableNumber} yet.
            </div>
          ) : (
            orders.map((order) => {
              const badge = STATUS_BADGES[order.status] || STATUS_BADGES.new;
              return (
                <div
                  key={order.id}
                  className="bg-[#F7F7F6] rounded-xl p-4 border border-[#d8d6d3] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-800 font-['Outfit']">
                        Order #{order.id}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(order.orderTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-xs divide-y divide-slate-200/70">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span className="text-slate-700">
                          <strong>{it.quantity}×</strong> {it.name}
                        </span>
                        <span className="font-semibold text-slate-800">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Total:</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {order.paymentStatus === 'paid'
                          ? '✓ Paid'
                          : order.paymentMethod === 'online'
                          ? 'Online UPI Due'
                          : 'Cash Due'}
                      </span>
                    </div>
                    <span className="text-sm text-[#516B84] font-['Outfit']">₹{order.totalAmount}</span>
                  </div>

                  {/* Customer Invoice / WhatsApp Trigger */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setSelectedInvoiceOrder(order);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-300 flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#516B84]" />
                      <span>View / Print Bill</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        const message = formatOrderWhatsAppInvoice(order);
                        const url = getWhatsAppDirectUrl(order.customerPhone, message);
                        window.open(url, '_blank');
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp Bill</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E6E5E4] bg-[#F7F7F6] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Table Bill:</span>
            <span className="text-xl font-bold text-[#516B84] font-['Outfit']">
              ₹{totalTableBill}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
              onOrderMore();
            }}
            className="py-2.5 px-4 rounded-xl bg-[#516B84] text-white text-xs font-semibold hover:bg-[#3E5367] transition-colors"
          >
            Order More Food
          </button>
        </div>

        {/* Invoice Modal for Active Table Order */}
        {selectedInvoiceOrder && (
          <InvoiceModal
            order={selectedInvoiceOrder}
            isOpen={Boolean(selectedInvoiceOrder)}
            onClose={() => setSelectedInvoiceOrder(null)}
          />
        )}
      </div>
    </div>
  );
};
