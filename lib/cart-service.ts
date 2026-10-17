import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import {
  isSpecialEditionSeries,
  priceCartLines,
  productDisplayPrice,
} from "@/lib/pricing";
import type { CartDTO, CartItemDTO } from "@/lib/types/commerce";

export async function getCartDTO(sessionId: string): Promise<CartDTO> {
  await connectDB();
  const cart = await Cart.findOne({ sessionId }).lean();
  if (!cart?.items?.length) {
    return {
      items: [],
      itemCount: 0,
      subtotal: 0,
      currency: "INR",
      comboApplied: false,
      comboSavings: 0,
      comboEligibleCount: 0,
      comboMessage: "",
    };
  }

  const ids = cart.items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: ids },
    active: true,
  }).lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items: CartItemDTO[] = [];

  for (const line of cart.items) {
    const product = byId.get(String(line.productId));
    if (!product) continue;
    const quantity = Math.min(line.quantity, Math.max(product.stock, 0));
    if (quantity <= 0) continue;
    const specialEdition = isSpecialEditionSeries(product.series);
    const display = productDisplayPrice({
      specialEdition,
      series: product.series,
    });
    // Prefer DB price, but keep display helpers aligned with catalog rules.
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
    items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.price,
      size: i.size,
      series: i.series,
      specialEdition: i.specialEdition,
    })),
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    itemCount,
    subtotal: priced.subtotal,
    currency: items[0]?.currency ?? "INR",
    comboApplied: priced.comboApplied,
    comboSavings: priced.comboSavings,
    comboEligibleCount: priced.eligibleCount,
    comboMessage: priced.comboMessage,
  };
}
