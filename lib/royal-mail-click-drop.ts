/** Server-only Royal Mail Click & Drop order-import adapter.
 * No postage is purchased here. Use only after payment is independently verified.
 */
import 'server-only';

const API_BASE = 'https://api.parcel.royalmail.com/api/v1';
export type ShippingOrder = {
  orderReference: string;
  recipient: { fullName: string; email: string; phone?: string; address1: string; address2?: string; city: string; postcode: string; countryCode: 'GB' };
  lines: { name: string; quantity: number; unitPriceGBP: number }[];
  /** Measured total packed parcel weight; never guess a default. */
  parcelWeightGrams: number;
};

export function prepareClickDropOrder(order: ShippingOrder) {
  if (!/^BLING-[A-Za-z0-9-]{4,64}$/.test(order.orderReference)) throw new Error('Invalid Bling Beauty reference');
  if (!order.recipient.fullName.trim() || !order.recipient.address1.trim() || !order.recipient.city.trim() || !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(order.recipient.postcode)) throw new Error('Incomplete UK delivery address');
  if (!Number.isSafeInteger(order.parcelWeightGrams) || order.parcelWeightGrams < 1 || order.parcelWeightGrams > 30000) throw new Error('A valid measured parcel weight is required');
  if (!order.lines.length || order.lines.some(line => !line.name.trim() || !Number.isInteger(line.quantity) || line.quantity < 1 || !Number.isFinite(line.unitPriceGBP) || line.unitPriceGBP < 0)) throw new Error('Invalid order lines');
  return {
    orderReference: order.orderReference,
    recipient: {
      address: {
        fullName: order.recipient.fullName,
        addressLine1: order.recipient.address1,
        addressLine2: order.recipient.address2 || undefined,
        city: order.recipient.city,
        postcode: order.recipient.postcode.toUpperCase(),
        countryCode: 'GB',
      },
      emailAddress: order.recipient.email,
      phoneNumber: order.recipient.phone || undefined,
    },
    packages: [{ weightInGrams: order.parcelWeightGrams }],
    orderLines: order.lines.map(line => ({ name: line.name, quantity: line.quantity, unitPrice: line.unitPriceGBP })),
    tradingName: 'Bling Beauty Products',
  };
}

/** Credential check only; no request made, no order imported. */
export function clickDropConfigured() {
  return Boolean(process.env.ROYAL_MAIL_CLICK_DROP_API_KEY?.trim());
}

/** Royal Mail order import is deliberately gated until payload mapping and weight are verified. */
export async function importClickDropOrder(_order: ShippingOrder): Promise<never> {
  void API_BASE;
  throw new Error('Royal Mail import disabled until account-specific API payload, trading name and parcel weights are validated');
}
