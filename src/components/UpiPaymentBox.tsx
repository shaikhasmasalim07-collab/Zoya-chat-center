import React, { useState } from 'react';
import {
  UPI_CONFIG,
  PaymentAppType,
  triggerDirectPayment,
  generateDynamicQrUrl,
} from '../utils/paymentUtils';
import {
  QrCode,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface UpiPaymentBoxProps {
  amount: number;
  tableNumber?: number | string;
  orderId?: string;
  selectedApp?: PaymentAppType;
  onAppSelect?: (app: PaymentAppType) => void;
  compact?: boolean;
  showQrByDefault?: boolean;
}

export const UpiPaymentBox: React.FC<UpiPaymentBoxProps> = ({
  amount,
  tableNumber,
  orderId,
  selectedApp = 'phonepe',
  onAppSelect,
  compact = false,
  showQrByDefault = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(showQrByDefault);

  const cleanAmount = Math.max(0, Math.round(amount));
  const qrUrl = generateDynamicQrUrl(cleanAmount, tableNumber, orderId);

  const handleCopyUpi = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    navigator.clipboard.writeText(UPI_CONFIG.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleLaunchApp = (app: PaymentAppType) => {
    playTapSound();
    if (onAppSelect) {
      onAppSelect(app);
    }
    triggerDirectPayment(app, cleanAmount, tableNumber, orderId);
  };

  return (
    <div
      id="upi-payment-box"
      className="bg-white rounded-2xl border border-[#d8d6d3] p-3.5 sm:p-4 shadow-soft space-y-3"
    >
      {/* Header with Merchant Info */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5f259f] via-[#516B84] to-[#0f9d58] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-['Outfit'] flex items-center gap-1.5">
              <span>Direct UPI Payment</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Instant
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Payee: <strong className="text-slate-700">{UPI_CONFIG.payeeName}</strong>
            </p>
          </div>
        </div>

        {/* Amount Pill */}
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Amount</span>
          <span className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit']">
            ₹{cleanAmount}
          </span>
        </div>
      </div>

      {/* PhonePe Number & 1-Click Copy */}
      <div className="bg-[#F7F7F6] rounded-xl p-2.5 border border-[#E6E5E4] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#5f259f] shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">PhonePe / UPI Number</span>
            <span className="text-xs font-bold text-slate-900 font-mono tracking-wide select-all">
              {UPI_CONFIG.phoneNumber}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyUpi}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-[#d8d6d3] text-slate-700 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Direct App Launch Action Buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
          <span>Click to open payment app directly:</span>
          <span className="text-[10px] text-emerald-700 font-medium">✓ Amount Pre-filled</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* PhonePe Button */}
          <button
            id="pay-via-phonepe-btn"
            type="button"
            onClick={() => handleLaunchApp('phonepe')}
            className="p-2.5 rounded-xl border-2 border-[#5f259f]/30 hover:border-[#5f259f] bg-gradient-to-b from-[#5f259f]/5 to-[#5f259f]/10 hover:from-[#5f259f]/15 hover:to-[#5f259f]/20 transition-all text-left flex items-center justify-between group active:scale-98 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                <span>पे</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit'] leading-tight">
                  PhonePe
                </span>
                <span className="text-[10px] text-slate-500 block">9970542402</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#5f259f] opacity-70 group-hover:opacity-100" />
          </button>

          {/* Google Pay Button */}
          <button
            id="pay-via-gpay-btn"
            type="button"
            onClick={() => handleLaunchApp('gpay')}
            className="p-2.5 rounded-xl border-2 border-blue-500/30 hover:border-blue-500 bg-gradient-to-b from-blue-500/5 to-blue-500/10 hover:from-blue-500/15 hover:to-blue-500/20 transition-all text-left flex items-center justify-between group active:scale-98 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                <span className="text-blue-500 font-black">G</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit'] leading-tight">
                  Google Pay
                </span>
                <span className="text-[10px] text-slate-500 block">GPay Instant</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 opacity-70 group-hover:opacity-100" />
          </button>

          {/* Paytm Button */}
          <button
            id="pay-via-paytm-btn"
            type="button"
            onClick={() => handleLaunchApp('paytm')}
            className="p-2 rounded-xl border border-sky-400/40 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-100/50 transition-all text-left flex items-center justify-between group active:scale-98"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-[#002e6e] text-white flex items-center justify-center font-black text-[10px] shadow-2xs">
                <span>Ptm</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">Paytm</span>
            </div>
            <ExternalLink className="w-3 h-3 text-sky-700 opacity-60 group-hover:opacity-100" />
          </button>

          {/* Any UPI Button */}
          <button
            id="pay-via-generic-upi-btn"
            type="button"
            onClick={() => handleLaunchApp('generic_upi')}
            className="p-2 rounded-xl border border-[#516B84]/40 hover:border-[#516B84] bg-[#516B84]/5 hover:bg-[#516B84]/15 transition-all text-left flex items-center justify-between group active:scale-98"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-[#516B84] text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                <span>UPI</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">Any UPI App</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#516B84] opacity-60 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* QR Code Accordion / Toggle */}
      {!compact && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowQr((prev) => !prev);
            }}
            className="w-full py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-[#516B84]" />
            <span>{showQr ? 'Hide UPI QR Code' : 'Scan & Pay via QR Code'}</span>
            {showQr ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showQr && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#F7F7F6] border border-[#d8d6d3] text-center animate-fadeIn flex flex-col items-center">
              <p className="text-[11px] text-slate-600 mb-2 font-medium">
                Scan with <strong>PhonePe, GPay, Paytm, BHIM</strong> or any banking app
              </p>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs inline-block">
                <img
                  src={qrUrl}
                  alt={`UPI Payment QR for ₹${cleanAmount}`}
                  className="w-40 h-40 object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                UPI ID: <strong className="text-slate-700">{UPI_CONFIG.primaryUpiId}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
