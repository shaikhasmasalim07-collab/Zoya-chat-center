import React, { useState, useRef } from 'react';
import { Order } from '../types';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';
import { formatOrderWhatsAppInvoice, getWhatsAppDirectUrl } from '../utils/invoiceGenerator';
import {
  FileText,
  Printer,
  Share2,
  X,
  Check,
  Smartphone,
  User,
  Phone,
  Copy,
  Receipt,
  Download,
  UtensilsCrossed,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCustomerDetails?: (orderId: string, name: string, phone: string) => void;
}

export type InvoicePaperSize = 'thermal-80mm' | 'thermal-58mm' | 'a4' | 'a5';

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateCustomerDetails,
}) => {
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [paperSize, setPaperSize] = useState<InvoicePaperSize>('thermal-80mm');
  const [copied, setCopied] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const subtotal = order.subtotalAmount || order.totalAmount + (order.discountAmount || 0);
  const discount = order.discountAmount || 0;
  const grandTotal = order.totalAmount;

  const handleSendWhatsApp = () => {
    playTapSound();
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (customerPhone && cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');

    if (onUpdateCustomerDetails && (customerName !== order.customerName || customerPhone !== order.customerPhone)) {
      onUpdateCustomerDetails(order.id, customerName, customerPhone);
    }

    const message = formatOrderWhatsAppInvoice(order, customerName, customerPhone);
    const url = getWhatsAppDirectUrl(customerPhone, message);
    window.open(url, '_blank');
  };

  const handleCopyInvoice = () => {
    playTapSound();
    const message = formatOrderWhatsAppInvoice(order, customerName, customerPhone);
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    playTapSound();
    window.print();
  };

  return (
    <div
      id="invoice-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="invoice-modal-dialog"
        className="w-full max-w-xl bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp my-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E6E5E4] flex items-center justify-between bg-[#F7F7F6] shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#516B84] text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit']">
                Order #{order.id} Invoice & Bill
              </h3>
              <p className="text-[11px] text-slate-500">Auto generated · Send to WhatsApp or Print</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#E6E5E4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-[#E6E5E4] space-y-3 shrink-0 print:hidden">
          {/* Customer Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-[#516B84]" />
                <span>Customer Name:</span>
              </label>
              <input
                id="invoice-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Smartphone className="w-3 h-3 text-[#25D366]" />
                <span>Customer WhatsApp No:</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  +91
                </span>
                <input
                  id="invoice-customer-phone"
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''));
                    setPhoneError('');
                  }}
                  placeholder="10-digit number"
                  className="w-full text-xs pl-10 pr-2.5 py-1.5 bg-white border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84] font-mono"
                />
              </div>
              {phoneError && <p className="text-[10px] text-red-600 mt-0.5">{phoneError}</p>}
            </div>
          </div>

          {/* Size & Print Customizer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600">Bill Size:</span>
              <div className="flex rounded-lg border border-[#d8d6d3] bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperSize('thermal-80mm')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    paperSize === 'thermal-80mm'
                      ? 'bg-[#516B84] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  80mm POS
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('thermal-58mm')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    paperSize === 'thermal-58mm'
                      ? 'bg-[#516B84] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  58mm Small
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('a5')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    paperSize === 'a5'
                      ? 'bg-[#516B84] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  A5 / Slip
                </button>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                id="invoice-copy-btn"
                type="button"
                onClick={handleCopyInvoice}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Copy text bill"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                id="invoice-print-btn"
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print</span>
              </button>

              <button
                id="invoice-send-whatsapp-btn"
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Paper Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            id="printable-invoice"
            className={`bg-white p-5 rounded-xl border border-[#d8d6d3] shadow-md text-slate-800 font-sans transition-all print:shadow-none print:border-none print:p-0 ${
              paperSize === 'thermal-58mm'
                ? 'w-[260px] text-[11px]'
                : paperSize === 'a5'
                ? 'w-[420px] text-xs'
                : 'w-[320px] text-xs'
            }`}
          >
            {/* Store Branding */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide font-['Outfit'] text-slate-900">
                {RESTAURANT_DETAILS.name}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">{RESTAURANT_DETAILS.tagline}</p>
              <p className="text-[10px] text-slate-600 mt-1 leading-tight">{RESTAURANT_DETAILS.address}</p>
              <p className="text-[10px] text-slate-600 font-mono">Ph: +91 {RESTAURANT_DETAILS.phone}</p>
            </div>

            {/* Bill Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">INVOICE / BILL:</span>
                <span className="font-mono font-bold text-slate-900">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">TABLE NUMBER:</span>
                <span className="font-bold text-[#516B84] bg-slate-100 px-1.5 rounded">
                  Table {order.tableNumber}
                </span>
              </div>
              {customerName && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">CUSTOMER:</span>
                  <span className="font-semibold text-slate-800">{customerName}</span>
                </div>
              )}
              {customerPhone && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">PHONE:</span>
                  <span className="font-mono text-slate-800">+91 {customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">DATE & TIME:</span>
                <span className="text-slate-700">
                  {new Date(order.orderTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} ·{' '}
                  {new Date(order.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">PAYMENT:</span>
                <span className="font-bold uppercase text-[10px] tracking-wider">
                  {order.paymentMethod === 'online' ? 'Online UPI' : 'Cash'} (
                  {order.paymentStatus === 'paid' ? 'PAID' : 'DUE'})
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500 mb-1.5 pb-1 border-b border-slate-100">
                <span>Item Description</span>
                <span>Qty × Rate</span>
                <span>Amount</span>
              </div>

              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="min-w-0 pr-1 flex-1">
                      <span className="font-bold text-slate-900 block leading-tight">
                        {item.name}
                      </span>
                      {item.specialNotes && (
                        <span className="text-[9px] text-slate-500 italic block">
                          Note: {item.specialNotes}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-600 font-mono text-[10px] px-1 shrink-0">
                      {item.quantity} × ₹{item.price}
                    </span>
                    <span className="font-bold text-slate-900 font-mono text-right shrink-0">
                      ₹{item.quantity * item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({order.totalItems} Items)</span>
                <span className="font-mono font-semibold text-slate-800">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
                  <span className="font-mono font-bold">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Taxes & GST</span>
                <span className="font-semibold text-emerald-700">INCLUDED</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span className="uppercase">GRAND TOTAL</span>
                <span className="text-base font-['Outfit'] font-black">₹{grandTotal}</span>
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="text-center pt-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-800">Thank you for dining with us!</p>
              <p className="text-[9px] text-slate-500">Please visit again · Have a great day!</p>
              <div className="text-[8px] text-slate-400 font-mono pt-1">
                Generated via Zoya Smart POS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
