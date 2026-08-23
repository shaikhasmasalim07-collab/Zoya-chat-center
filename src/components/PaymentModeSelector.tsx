import React from 'react';
import { CreditCard, Banknote, Smartphone, Check, Sparkles } from 'lucide-react';
import { UpiPaymentBox } from './UpiPaymentBox';
import { PaymentAppType, UPI_CONFIG } from '../utils/paymentUtils';
import { playTapSound } from '../utils/sound';

interface PaymentModeSelectorProps {
  paymentMethod: 'online' | 'cash';
  onChangeMethod: (method: 'online' | 'cash') => void;
  amount: number;
  tableNumber?: number | string;
  orderId?: string;
  selectedUpiApp?: PaymentAppType;
  onSelectUpiApp?: (app: PaymentAppType) => void;
  showDetails?: boolean;
}

export const PaymentModeSelector: React.FC<PaymentModeSelectorProps> = ({
  paymentMethod,
  onChangeMethod,
  amount,
  tableNumber,
  orderId,
  selectedUpiApp = 'phonepe',
  onSelectUpiApp,
  showDetails = true,
}) => {
  return (
    <div id="payment-mode-selector" className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-[#516B84]" />
          <span>Payment Option</span>
        </label>
        <span className="text-[11px] text-slate-500 font-medium">Choose Online or Cash</span>
      </div>

      {/* Two Choice Option Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Online Option */}
        <button
          id="select-online-payment-btn"
          type="button"
          onClick={() => {
            playTapSound();
            onChangeMethod('online');
          }}
          className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            paymentMethod === 'online'
              ? 'border-[#516B84] bg-white ring-2 ring-[#516B84]/15 shadow-sm'
              : 'border-[#d8d6d3] bg-[#F7F7F6] hover:bg-white text-slate-600'
          }`}
        >
          {paymentMethod === 'online' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#516B84] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  paymentMethod === 'online'
                    ? 'bg-[#516B84] text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold font-['Outfit'] text-slate-900">
                Online (UPI)
              </span>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              PhonePe, GPay, Paytm ({UPI_CONFIG.phoneNumber})
            </p>
          </div>

          <div className="mt-2 flex items-center gap-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
              PhonePe
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              GPay
            </span>
          </div>
        </button>

        {/* Cash Option */}
        <button
          id="select-cash-payment-btn"
          type="button"
          onClick={() => {
            playTapSound();
            onChangeMethod('cash');
          }}
          className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            paymentMethod === 'cash'
              ? 'border-[#516B84] bg-white ring-2 ring-[#516B84]/15 shadow-sm'
              : 'border-[#d8d6d3] bg-[#F7F7F6] hover:bg-white text-slate-600'
          }`}
        >
          {paymentMethod === 'cash' && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#516B84] text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold font-['Outfit'] text-slate-900">
                Cash on Table
              </span>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Pay in cash to staff or at counter
            </p>
          </div>

          <div className="mt-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              💵 Pay on Delivery
            </span>
          </div>
        </button>
      </div>

      {/* If Online is selected and showDetails is true, render the interactive UPI Payment Box */}
      {paymentMethod === 'online' && showDetails && (
        <div className="pt-1 animate-fadeIn">
          <UpiPaymentBox
            amount={amount}
            tableNumber={tableNumber}
            orderId={orderId}
            selectedApp={selectedUpiApp}
            onAppSelect={onSelectUpiApp}
          />
        </div>
      )}

      {paymentMethod === 'cash' && showDetails && (
        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
          <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            You can pay <strong>₹{Math.max(0, Math.round(amount))}</strong> in cash to the waiter when your food is served at Table {tableNumber || ''}.
          </span>
        </div>
      )}
    </div>
  );
};
