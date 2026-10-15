import { getSmtpConfig } from "@/lib/email/config";
import { sendMail } from "@/lib/email/mailer";
import {
  agencyDispatchEmail,
  customerConfirmationEmail,
  customerDeliveredEmail,
  customerShippedEmail,
} from "@/lib/email/templates";
import type { EmailLogAttrs, OrderDocument } from "@/lib/models/Order";

async function pushLog(
  order: OrderDocument,
  entry: Omit<EmailLogAttrs, "sentAt"> & { sentAt?: Date },
) {
  const to = entry.to?.trim();
  // Mongoose `required: true` rejects empty strings — never write invalid log rows.
  if (!to) {
    throw new Error(
      `Refusing to write emailLog entry of type "${entry.type}" without a recipient`,
    );
  }
  if (!order.emailLog) order.emailLog = [];
  order.emailLog.push({
    ...entry,
    to,
    sentAt: entry.sentAt ?? new Date(),
  });
  await order.save();
}

function appendDeliveryNote(order: OrderDocument, note: string) {
  if (!order.delivery) {
    order.delivery = {
      agencyName: "",
      agencyEmail: "",
      trackingNumber: "",
      notes: "",
    };
  }
  const existing = (order.delivery.notes || "").trim();
  if (existing.includes(note)) return;
  order.delivery.notes = existing ? `${existing} ${note}` : note;
}

/** After successful payment: confirm customer + notify delivery agency. */
export async function notifyOrderPaid(order: OrderDocument) {
  // Idempotent: skip if confirmation was already sent for this order.
  const alreadyConfirmed = (order.emailLog || []).some(
    (e) => e.type === "customer_confirmation" && e.status === "sent",
  );
  if (alreadyConfirmed) {
    return;
  }

  if (!order.delivery) {
    order.delivery = {
      agencyName: "",
      agencyEmail: "",
      trackingNumber: "",
      notes: "",
    };
  }
  const cfg = getSmtpConfig();

  if (!order.delivery.agencyName) {
    order.delivery.agencyName = cfg.agencyName;
  }
  if (!order.delivery.agencyEmail) {
    order.delivery.agencyEmail = cfg.agencyEmail;
  }
  order.fulfillmentStatus = "confirmed";
  await order.save();

  const customerTo = order.customer?.email?.trim() || "";
  if (!customerTo) {
    appendDeliveryNote(
      order,
      "Customer confirmation email skipped: customer email is missing.",
    );
    await order.save();
  } else {
    const confirm = customerConfirmationEmail(order);
    const confirmResult = await sendMail({
      to: customerTo,
      ...confirm,
    });
    await pushLog(order, {
      type: "customer_confirmation",
      to: customerTo,
      subject: confirm.subject,
      status: confirmResult.status,
      error: confirmResult.error || "",
    });
  }

  const agencyTo =
    order.delivery.agencyEmail?.trim() || cfg.agencyEmail?.trim() || "";
  if (agencyTo) {
    const dispatch = agencyDispatchEmail(order);
    const agencyResult = await sendMail({
      to: agencyTo,
      ...dispatch,
    });
    await pushLog(order, {
      type: "agency_dispatch",
      to: agencyTo,
      subject: dispatch.subject,
      status: agencyResult.status,
      error: agencyResult.error || "",
    });
  } else {
    // Do not write emailLog with empty `to` (schema requires a non-empty recipient).
    appendDeliveryNote(
      order,
      "Agency dispatch email skipped: set DELIVERY_AGENCY_EMAIL.",
    );
    await order.save();
  }
}

/** When admin marks order shipped. */
export async function notifyOrderShipped(order: OrderDocument) {
  order.fulfillmentStatus = "shipped";
  order.delivery.dispatchedAt = order.delivery.dispatchedAt || new Date();
  await order.save();

  const customerTo = order.customer?.email?.trim() || "";
  if (!customerTo) {
    appendDeliveryNote(
      order,
      "Shipped notification skipped: customer email is missing.",
    );
    await order.save();
    return;
  }

  const mail = customerShippedEmail(order);
  const result = await sendMail({
    to: customerTo,
    ...mail,
  });
  await pushLog(order, {
    type: "customer_shipped",
    to: customerTo,
    subject: mail.subject,
    status: result.status,
    error: result.error || "",
  });
}

/** When admin marks order delivered. */
export async function notifyOrderDelivered(order: OrderDocument) {
  order.fulfillmentStatus = "delivered";
  order.delivery.deliveredAt = new Date();
  await order.save();

  const customerTo = order.customer?.email?.trim() || "";
  if (!customerTo) {
    appendDeliveryNote(
      order,
      "Delivered notification skipped: customer email is missing.",
    );
    await order.save();
    return;
  }

  const mail = customerDeliveredEmail(order);
  const result = await sendMail({
    to: customerTo,
    ...mail,
  });
  await pushLog(order, {
    type: "customer_delivered",
    to: customerTo,
    subject: mail.subject,
    status: result.status,
    error: result.error || "",
  });
}
