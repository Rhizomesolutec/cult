import {
  Schema,
  models,
  model,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

export type CartItemAttrs = {
  productId: Types.ObjectId;
  quantity: number;
};

export type CartAttrs = {
  sessionId: string;
  items: CartItemAttrs[];
};

const CartItemSchema = new Schema<CartItemAttrs>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const CartSchema = new Schema<CartAttrs>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

export type CartDocument = HydratedDocument<CartAttrs>;
export type CartModel = Model<CartAttrs>;

export const Cart: CartModel =
  (models.Cart as CartModel) || model<CartAttrs>("Cart", CartSchema);
