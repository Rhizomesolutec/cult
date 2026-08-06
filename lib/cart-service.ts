import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import type { CartDTO, CartItemDTO } from "@/lib/types/commerce";

export async function getCartDTO(sessionId: string): Promise<CartDTO> {
  await connectDB();
  const cart = await Cart.findOne({ sessionId }).lean();
  if (!cart?.items?.length) {
    return { items: [], itemCount: 0, subtotal: 0, currency: "INR" };
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
    items.push({
      productId: String(product._id),
      quantity,
      name: product.name,
      series: product.series,
      image: product.image,
      price: product.price,
      currency: product.currency || "INR",
      stock: product.stock,
      lineTotal: product.price * quantity,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items,
    itemCount,
    subtotal,
    currency: items[0]?.currency ?? "INR",
  };
}
