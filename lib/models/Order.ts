import {
  Schema,
  models,
  model,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

export type OrderItemAttrs = {
  productId: Types.ObjectId;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
};

export type EmailLogAttrs = {
  type:
    | "customer_confirmation"
    | "agency_dispatch"
    | "customer_delivered"
    | "customer_shipped";
  to: string;
  subject: string;
  status: "sent" | "skipped" | "failed";
  error?: string;
  sentAt: Date;
};

export type OrderAttrs = {
  orderNumber: string;
  sessionId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  items: OrderItemAttrs[];
  subtotal: number;
  currency: string;
  /** Payment lifecycle */
  status: "pending_payment" | "paid" | "failed" | "cancelled";
  /** Fulfillment / delivery lifecycle */
  fulfillmentStatus:
    | "awaiting_payment"
    | "confirmed"
    | "packed"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment: {
    provider: string;
    demoRef: string;
    gatewayPaymentId?: string;
    paidAt?: Date;
    /** NTT DATA / Atom merchant transaction id */
    merchTxnId?: string;
    /** yyyy-MM-dd used by Status/Requery API */
    merchTxnDate?: string;
    atomTokenId?: string;
    atomTxnId?: string;
    bankTxnId?: string;
    lastStatusCode?: string;
    lastStatusMessage?: string;
    verifiedAt?: Date;
  };
  delivery: {
    agencyName: string;
    agencyEmail: string;
    trackingNumber: string;
    notes: string;
    dispatchedAt?: Date;
    deliveredAt?: Date;
  };
  emailLog: EmailLogAttrs[];
};

const OrderItemSchema = new Schema<OrderItemAttrs>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const EmailLogSchema = new Schema<EmailLogAttrs>(
  {
    type: {
      type: String,
      enum: [
        "customer_confirmation",
        "agency_dispatch",
        "customer_delivered",
        "customer_shipped",
      ],
      required: true,
    },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["sent", "skipped", "failed"],
      required: true,
    },
    error: { type: String, default: "" },
    sentAt: { type: Date, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderAttrs>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending_payment", "paid", "failed", "cancelled"],
      default: "pending_payment",
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: [
        "awaiting_payment",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "awaiting_payment",
      index: true,
    },
    payment: {
      provider: { type: String, default: "demo" },
      demoRef: { type: String, default: "" },
      gatewayPaymentId: { type: String, default: "" },
      paidAt: { type: Date },
      merchTxnId: { type: String, default: "" },
      merchTxnDate: { type: String, default: "" },
      atomTokenId: { type: String, default: "" },
      atomTxnId: { type: String, default: "" },
      bankTxnId: { type: String, default: "" },
      lastStatusCode: { type: String, default: "" },
      lastStatusMessage: { type: String, default: "" },
      verifiedAt: { type: Date },
    },
    delivery: {
      agencyName: { type: String, default: "" },
      agencyEmail: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      notes: { type: String, default: "" },
      dispatchedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    emailLog: { type: [EmailLogSchema], default: [] },
  },
  { timestamps: true },
);

// Unique only when a real merchant txn id is present (empty string allowed on create).
OrderSchema.index(
  { "payment.merchTxnId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "payment.merchTxnId": { $type: "string", $gt: "" },
    },
  },
);

export type OrderDocument = HydratedDocument<OrderAttrs>;
export type OrderModel = Model<OrderAttrs>;

export const Order: OrderModel =
  (models.Order as OrderModel) || model<OrderAttrs>("Order", OrderSchema);
