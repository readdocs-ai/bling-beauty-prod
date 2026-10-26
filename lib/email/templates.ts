/** Transactional copy only. This module does not send emails or change order state. */
export type EmailKind = 'order-received' | 'payment-confirmed' | 'dispatched' | 'admin-alert' | 'transport-test';
export type EmailOrder = { reference: string; customerName: string; customerEmail: string; totalGBP: number; items: { name: string; quantity: number }[]; trackingUrl?: string;shipping?:{address1:string;address2?:string;city:string;postcode:string;country:string} };
export type EmailDraft = { subject: string; text: string; recipient: string };
const money = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
const shop = 'Bling Beauty Products';
const support = 'info@blingbeautyproducts.com';
export function buildEmail(kind: EmailKind, order: EmailOrder): EmailDraft {
  const ref = order.reference.trim();
  if (!ref || !Number.isFinite(order.totalGBP) || order.totalGBP < 0) throw new Error('Invalid order details');
  const name = order.customerName.trim() || 'there';
  const lines = order.items.map(item => `- ${item.name} × ${item.quantity}`).join('\n');
  const summary = `Order reference: ${ref}\n${lines}\nOrder total: ${money(order.totalGBP)}`;
  const delivery=order.shipping?`\n\nDelivery address:\n${[order.customerName,order.shipping.address1,order.shipping.address2,order.shipping.city,order.shipping.postcode,order.shipping.country].filter(Boolean).join('\n')}`:'';
  const signature = `\n\nKind regards,\n${shop}\n${support}`;
  switch (kind) {
    case 'transport-test':return {recipient:support,subject:`Email delivery test | ${shop}`,text:'This is a transactional email delivery test. No order was created and no payment was taken.'};
    case 'order-received': return { recipient: order.customerEmail, subject: `We have received your order ${ref} | ${shop}`, text: `Hello ${name},\n\nThank you for your order. We have received your order details. This email is not confirmation that payment has been received.\n\n${summary}\n\nWe'll email you when payment is confirmed.${signature}` };
    case 'payment-confirmed': return { recipient: order.customerEmail, subject: `Payment confirmed for order ${ref} | ${shop}`, text: `Hello ${name},\n\nWe've confirmed payment for your order. We'll update you when it is on its way.\n\n${summary}${delivery}${signature}` };
    case 'dispatched': return { recipient: order.customerEmail, subject: `Your order ${ref} is on its way | ${shop}`, text: `Hello ${name},\n\nYour order has been dispatched.\n\n${summary}${order.trackingUrl ? `\n\nTrack your parcel: ${order.trackingUrl}` : ''}${signature}` };
    case 'admin-alert': return { recipient: support, subject: `Paid order: ${ref} | ${shop}`, text: `Payment has been independently verified with Worldpay. Review the order in admin before dispatch.\n\nCustomer: ${order.customerName}\nEmail: ${order.customerEmail}\n${summary}${delivery}` };
  }
}
