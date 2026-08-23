import { Order } from '../types';
import { RESTAURANT_DETAILS } from '../data/restaurantInfo';

/**
 * Generates an ultra-clean formatted WhatsApp message text invoice for a customer order.
 */
export function formatOrderWhatsAppInvoice(order: Order, customCustomerName?: string, customPhone?: string): string {
  const customerName = customCustomerName?.trim() || order.customerName?.trim() || 'Valued Guest';
  const customerPhone = customPhone?.trim() || order.customerPhone?.trim();
  const dateStr = new Date(order.orderTime).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(order.orderTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const separator = '══════════════════════';
  const divider = '──────────────────────';

  let itemsList = '';
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    itemsList += `${index + 1}. *${item.name}*\n   ${item.quantity} x ₹${item.price} = *₹${itemTotal}*${
      item.specialNotes ? ` _(Note: ${item.specialNotes})_` : ''
    }\n`;
  });

  const subtotal = order.subtotalAmount || order.totalAmount + (order.discountAmount || 0);
  const discountText =
    order.discountAmount && order.discountAmount > 0
      ? `\n🎁 *Discount / Coupon (${order.couponCode || 'PROMO'}):* -₹${order.discountAmount}`
      : '';

  const paymentMethodStr = order.paymentMethod === 'online' ? 'Online UPI' : 'Cash on Table';
  const paymentStatusBadge = order.paymentStatus === 'paid' ? '✅ PAID' : '⏳ PAYMENT DUE';

  const message =
`🧾 *TAX INVOICE / BILL*
🍽️ *${RESTAURANT_DETAILS.name.toUpperCase()}*
📍 ${RESTAURANT_DETAILS.address}
📞 Helpline: ${RESTAURANT_DETAILS.phone}
${separator}
📋 *Order ID:* #${order.id}
🪑 *Table No:* Table ${order.tableNumber}
👤 *Customer:* ${customerName}${customerPhone ? ` (${customerPhone})` : ''}
📅 *Date:* ${dateStr}, ${timeStr}
💳 *Payment:* ${paymentMethodStr} (${paymentStatusBadge})
${separator}
*ORDER DETAILS & ITEMS:*
${divider}
${itemsList.trim()}
${divider}
💵 *Subtotal:* ₹${subtotal}${discountText}
💰 *TOTAL AMOUNT: ₹${order.totalAmount}*
${separator}
${order.customerNotes ? `📝 *Kitchen Note:* "${order.customerNotes}"\n${separator}\n` : ''}✨ *Thank you for dining at ${RESTAURANT_DETAILS.name}!*
🙏 We hope you loved the food. Visit us again soon!`;

  return message;
}

/**
 * Creates direct WhatsApp API link with pre-filled invoice message
 */
export function getWhatsAppDirectUrl(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const formattedPhone =
    cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone.startsWith('0')
      ? `91${cleanPhone.slice(1)}`
      : cleanPhone;

  const encodedMessage = encodeURIComponent(message);
  if (formattedPhone && formattedPhone.length >= 10) {
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }
  // Generic fallback if no specific phone number is supplied
  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}
