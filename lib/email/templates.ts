import type { OrderDocument } from "@/lib/models/Order";
import { formatINR } from "@/lib/commerce-client";

function itemsLines(order: OrderDocument) {
  return order.items
    .map(
      (i) =>
        `• ${i.name} × ${i.quantity} — ${formatINR(i.unitPrice * i.quantity)}`,
    )
    .join("\n");
}

function itemsHtml(order: OrderDocument) {
  return `<ul>${order.items
    .map(
      (i) =>
        `<li>${i.name} × ${i.quantity} — <strong>${formatINR(
          i.unitPrice * i.quantity,
        )}</strong></li>`,
    )
    .join("")}</ul>`;
}

function addressBlock(order: OrderDocument) {
  const c = order.customer;
  return [c.name, c.phone, c.address, c.city, c.pincode]
    .filter(Boolean)
    .join("\n");
}

export function customerConfirmationEmail(order: OrderDocument) {
  const subject = `Order confirmed — ${order.orderNumber}`;
  const text = [
    `Hi ${order.customer.name},`,
    "",
    `Thanks for your CultScribe order ${order.orderNumber}.`,
    `Payment status: ${order.status}`,
    `Total: ${formatINR(order.subtotal)}`,
    "",
    "Items:",
    itemsLines(order),
    "",
    "Delivery details:",
    addressBlock(order),
    "",
    "We’ll email you again when your order ships and when it’s delivered.",
    "",
    "— CultScribe",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Order confirmed</h2>
      <p>Hi ${order.customer.name},</p>
      <p>Thanks for your CultScribe order <strong>${order.orderNumber}</strong>.</p>
      <p>Payment: <strong>${order.status}</strong><br/>Total: <strong>${formatINR(order.subtotal)}</strong></p>
      <h3>Items</h3>
      ${itemsHtml(order)}
      <h3>Delivery details</h3>
      <pre style="font-family:inherit;white-space:pre-wrap">${addressBlock(order)}</pre>
      <p>We’ll email you when it ships and when it’s delivered.</p>
      <p>— CultScribe</p>
    </div>
  `;

  return { subject, text, html };
}

export function agencyDispatchEmail(order: OrderDocument) {
  const subject = `Dispatch request — ${order.orderNumber}`;
  const text = [
    "New CultScribe delivery job",
    "",
    `Order: ${order.orderNumber}`,
    `Tracking: ${order.delivery.trackingNumber || "(assign on pickup)"}`,
    "",
    "Ship to:",
    addressBlock(order),
    `Email: ${order.customer.email}`,
    "",
    "Items:",
    itemsLines(order),
    "",
    `Notes: ${order.delivery.notes || "Handle with care — premium notebooks."}`,
    "",
    "— CultScribe Ops",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Dispatch request</h2>
      <p>Order <strong>${order.orderNumber}</strong></p>
      <p>Tracking: <strong>${order.delivery.trackingNumber || "(assign on pickup)"}</strong></p>
      <h3>Ship to</h3>
      <pre style="font-family:inherit;white-space:pre-wrap">${addressBlock(order)}</pre>
      <p>Customer email: ${order.customer.email}</p>
      <h3>Items</h3>
      ${itemsHtml(order)}
      <p>Notes: ${order.delivery.notes || "Handle with care — premium notebooks."}</p>
    </div>
  `;

  return { subject, text, html };
}

export function customerShippedEmail(order: OrderDocument) {
  const subject = `Your order shipped — ${order.orderNumber}`;
  const text = [
    `Hi ${order.customer.name},`,
    "",
    `Your CultScribe order ${order.orderNumber} is on the way.`,
    `Courier: ${order.delivery.agencyName || "Delivery partner"}`,
    `Tracking: ${order.delivery.trackingNumber || "Updating soon"}`,
    "",
    "— CultScribe",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Your order shipped</h2>
      <p>Hi ${order.customer.name},</p>
      <p>Order <strong>${order.orderNumber}</strong> is on the way.</p>
      <p>Courier: <strong>${order.delivery.agencyName || "Delivery partner"}</strong><br/>
      Tracking: <strong>${order.delivery.trackingNumber || "Updating soon"}</strong></p>
      <p>— CultScribe</p>
    </div>
  `;

  return { subject, text, html };
}

export function customerDeliveredEmail(order: OrderDocument) {
  const subject = `Delivered — ${order.orderNumber}`;
  const text = [
    `Hi ${order.customer.name},`,
    "",
    `Your CultScribe order ${order.orderNumber} has been delivered.`,
    "We hope you love writing in it.",
    "",
    "— CultScribe",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Delivered</h2>
      <p>Hi ${order.customer.name},</p>
      <p>Your order <strong>${order.orderNumber}</strong> has been delivered.</p>
      <p>We hope you love writing in it.</p>
      <p>— CultScribe</p>
    </div>
  `;

  return { subject, text, html };
}
