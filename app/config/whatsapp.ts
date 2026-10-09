export const WHATSAPP_NUMBER = "917626884979";
export const WHATSAPP_DISPLAY = "+91 7626 884 979";

export function whatsAppUrl(text?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!text?.trim()) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export type CheckoutWhatsAppPayload = {
  orderNumber: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  pincode: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
};

/** Pre-filled order message opened in WhatsApp after checkout. */
export function buildCheckoutWhatsAppMessage(payload: CheckoutWhatsAppPayload) {
  const format = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const lines = [
    "Hi CultScribe — I'd like to place an order:",
    "",
    `Order: ${payload.orderNumber}`,
    "",
    "Items:",
    ...payload.items.map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${format(item.lineTotal)}`,
    ),
    "",
    `Total: ${format(payload.subtotal)}`,
    "",
    "Delivery details:",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
  ];

  if (payload.phone?.trim()) {
    lines.push(`Phone: ${payload.phone.trim()}`);
  }

  lines.push(
    `Address: ${payload.address}`,
    `City: ${payload.city}`,
    `Pincode: ${payload.pincode}`,
    "",
    "Please confirm payment and delivery. Thank you!",
  );

  return lines.join("\n");
}
