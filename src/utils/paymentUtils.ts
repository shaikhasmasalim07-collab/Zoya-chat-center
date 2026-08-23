/**
 * UPI & PhonePe Payment Utilities for Zoya Chat Center
 * PhonePe Number: 9970542402
 * Payee Name: Zoya Chat Center
 */

export const UPI_CONFIG = {
  phoneNumber: '9970542402',
  payeeName: 'Zoya Chat Center',
  primaryUpiId: '9970542402@ybl', // PhonePe primary handle
  gpayUpiId: '9970542402@okaxis', // GPay handle
  paytmUpiId: '9970542402@paytm', // Paytm handle
  merchantCode: '5812', // Eating places, restaurants
};

export type PaymentAppType = 'phonepe' | 'gpay' | 'paytm' | 'generic_upi';

/**
 * Builds standard UPI payment intent string
 */
export function buildUpiPayload(
  amount: number,
  tableNumber?: number | string,
  orderId?: string,
  upiHandle: string = UPI_CONFIG.primaryUpiId
): string {
  const cleanAmount = Math.max(1, Math.round(amount)).toFixed(2);
  const note = orderId
    ? `Zoya Order ${orderId} Table ${tableNumber || 'Dine-In'}`
    : `Zoya Chat Table ${tableNumber || 'Order'} Bill`;

  const params = new URLSearchParams({
    pa: upiHandle,
    pn: UPI_CONFIG.payeeName,
    am: cleanAmount,
    cu: 'INR',
    tn: note,
    mc: UPI_CONFIG.merchantCode,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Builds specialized deep-link URL for specific payment apps
 */
export function getPaymentAppUrl(
  app: PaymentAppType,
  amount: number,
  tableNumber?: number | string,
  orderId?: string
): string {
  const cleanAmount = Math.max(1, Math.round(amount)).toFixed(2);
  const note = orderId
    ? `Zoya Order ${orderId} Table ${tableNumber || 'Dine-In'}`
    : `Zoya Chat Table ${tableNumber || 'Order'} Bill`;

  switch (app) {
    case 'phonepe': {
      // PhonePe dedicated intent
      const params = new URLSearchParams({
        pa: UPI_CONFIG.primaryUpiId,
        pn: UPI_CONFIG.payeeName,
        am: cleanAmount,
        cu: 'INR',
        tn: note,
      });
      return `phonepe://pay?${params.toString()}`;
    }

    case 'gpay': {
      // Google Pay (Tez) dedicated intent
      const params = new URLSearchParams({
        pa: UPI_CONFIG.primaryUpiId,
        pn: UPI_CONFIG.payeeName,
        am: cleanAmount,
        cu: 'INR',
        tn: note,
      });
      return `tez://upi/pay?${params.toString()}`;
    }

    case 'paytm': {
      // Paytm direct intent
      const params = new URLSearchParams({
        pa: UPI_CONFIG.primaryUpiId,
        pn: UPI_CONFIG.payeeName,
        am: cleanAmount,
        cu: 'INR',
        tn: note,
      });
      return `paytmmp://pay?${params.toString()}`;
    }

    case 'generic_upi':
    default:
      return buildUpiPayload(amount, tableNumber, orderId, UPI_CONFIG.primaryUpiId);
  }
}

/**
 * Triggers direct payment app launch on the user's mobile device
 */
export function triggerDirectPayment(
  app: PaymentAppType,
  amount: number,
  tableNumber?: number | string,
  orderId?: string
): void {
  const targetUrl = getPaymentAppUrl(app, amount, tableNumber, orderId);
  const fallbackGenericUpi = buildUpiPayload(amount, tableNumber, orderId);

  // Attempt dedicated app link
  const link = document.createElement('a');
  link.href = targetUrl;
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // If on non-mobile or app doesn't catch immediately, fallback to standard window location
  setTimeout(() => {
    try {
      window.location.href = fallbackGenericUpi;
    } catch (e) {
      // Ignore if user navigated away
    }
  }, 400);
}

/**
 * Generates an instant, crisp dynamic QR code URL
 */
export function generateDynamicQrUrl(
  amount: number,
  tableNumber?: number | string,
  orderId?: string
): string {
  const upiString = buildUpiPayload(amount, tableNumber, orderId);
  const encodedUpi = encodeURIComponent(upiString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&margin=10&data=${encodedUpi}`;
}
