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
  if (!order.emailLog) order.emailLog = [];
  order.emailLog.push({
    ...entry,
    sentAt: entry.sentAt ?? new Date(),
  });
  await order.save();
}

/** After successful payment: confirm customer + notify delivery agency. */
export async function notifyOrderPaid(order: OrderDocument) {
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

  const confirm = customerConfirmationEmail(order);
  const confirmResult = await sendMail({
    to: order.customer.email,
    ...confirm,
  });
  await pushLog(order, {
    type: "customer_confirmation",
    to: order.customer.email,
    subject: confirm.subject,
    status: confirmResult.status,
    error: confirmResult.error || "",
  });

  const agencyTo = order.delivery.agencyEmail || cfg.agencyEmail;
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
    await pushLog(order, {
      type: "agency_dispatch",
      to: "",
      subject: "Dispatch request (no agency email configured)",
      status: "skipped",
      error: "Set DELIVERY_AGENCY_EMAIL in .env or on the order",
    });
  }
}

/** When admin marks order shipped. */
export async function notifyOrderShipped(order: OrderDocument) {
  order.fulfillmentStatus = "shipped";
  order.delivery.dispatchedAt = order.delivery.dispatchedAt || new Date();
  await order.save();

  const mail = customerShippedEmail(order);
  const result = await sendMail({
    to: order.customer.email,
    ...mail,
  });
  await pushLog(order, {
    type: "customer_shipped",
    to: order.customer.email,
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

  const mail = customerDeliveredEmail(order);
  const result = await sendMail({
    to: order.customer.email,
    ...mail,
  });
  await pushLog(order, {
    type: "customer_delivered",
    to: order.customer.email,
    subject: mail.subject,
    status: result.status,
    error: result.error || "",
  });
}
