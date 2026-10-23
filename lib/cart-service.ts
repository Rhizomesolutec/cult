import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import {
  deliveryChargeForBooks,
  isSpecialEditionSeries,
  orderTotal,
  priceCartLines,
  productDisplayPrice,
} from "@/lib/pricing";
import type { CartDTO, CartItemDTO } from "@/lib/types/commerce";

type CartLine = {
  productId: { toString(): string };
  quantity: number;
};

type CartProduct = {
  _id: { toString(): string };
  name: string;
  series: string;
  image: string;
  price: number;
  currency?: string;
  stock: number;
  size?: "normal" | "a4";
};

const emptyCart = (): CartDTO => ({
  items: [],
  itemCount: 0,
  subtotal: 0,
  currency: "INR",
  comboApplied: false,
  comboSavings: 0,
  comboEligibleCount: 0,
  comboMessage: "",
  deliveryCharge: 0,
  total: 0,
});

export function assembleCart(lines: CartLine[], products: CartProduct[]): CartDTO {
  if (!lines.length || !products.length) return emptyCart();

  const byId = new Map(products.map((product) => [String(product._id), product]));
  const items: CartItemDTO[] = [];

  for (const line of lines) {
    const product = byId.get(String(line.productId));
    if (!product) continue;
    const quantity = Math.min(line.quantity, Math.max(product.stock, 0));
    if (quantity <= 0) continue;
    const specialEdition = isSpecialEditionSeries(product.series);
    const display = productDisplayPrice({
      specialEdition,
      series: product.series,
    });
    const unitPrice = product.price;
    items.push({
      productId: String(product._id),
      quantity,
      name: product.name,
      series: product.series,
      image: product.image,
      price: unitPrice,
      compareAtPrice: display.compareAt,
      currency: product.currency || "INR",
      stock: product.stock,
      lineTotal: unitPrice * quantity,
      size: product.size,
      specialEdition,
    });
  }

  const priced = priceCartLines(
    items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.price,
      size: item.size,
      series: item.series,
      specialEdition: item.specialEdition,
    })),
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryCharge = deliveryChargeForBooks(itemCount);

  return {
    items,
    itemCount,
    subtotal: priced.subtotal,
    currency: items[0]?.currency ?? "INR",
    comboApplied: priced.comboApplied,
    comboSavings: priced.comboSavings,
    comboEligibleCount: priced.eligibleCount,
    comboMessage: priced.comboMessage,
    deliveryCharge,
    total: orderTotal(priced.subtotal, deliveryCharge),
  };
}

export async function getCartDTO(sessionId: string): Promise<CartDTO> {
  await connectDB();
  const cart = await Cart.findOne({ sessionId }).lean();
  if (!cart?.items?.length) return emptyCart();

  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.productId) },
    active: true,
  }).lean();

  return assembleCart(cart.items, products);
}
