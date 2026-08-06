"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "../AdminShell";
import { formatINR } from "@/lib/commerce-client";
import styles from "../admin.module.css";

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  series: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  stock: number;
  featured: boolean;
  active: boolean;
};

const emptyForm = {
  name: "",
  slug: "",
  series: "",
  description: "",
  price: "60",
  currency: "INR",
  image: "",
  stock: "50",
  featured: true,
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rowUploadingId, setRowUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load products");
    setProducts(data.products ?? []);
  }, []);

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load products"),
    );
  }, [load]);

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const onImageSelected = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
      setSuccess("Image uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      setError("Please upload a product image");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          series: form.series,
          description: form.description,
          price: Number(form.price),
          currency: form.currency,
          image: form.image,
          stock: Number(form.stock),
          featured: form.featured,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      setSuccess(`Added “${data.product.name}”`);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (product: AdminProduct) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const replaceProductImage = async (product: AdminProduct, file: File) => {
    setRowUploadingId(product.id);
    setError("");
    setSuccess("");
    try {
      const url = await uploadImage(file);
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update image");
      setSuccess(`Updated image for “${product.name}”`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update image");
    } finally {
      setRowUploadingId(null);
      const input = rowFileRefs.current[product.id];
      if (input) input.value = "";
    }
  };

  const remove = async (product: AdminProduct) => {
    if (!window.confirm(`Delete “${product.name}”?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <AdminShell>
      <h1 className={styles.pageTitle}>Products</h1>
      <p className={styles.pageLead}>
        Add notebooks with full details. Upload a product photo (JPG, PNG, WEBP,
        or GIF — max 5MB).
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <section className={styles.panel}>
        <h2>Add product</h2>
        <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
          <div className={styles.formRow}>
            <div>
              <label className={styles.label} htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={styles.label} htmlFor="slug">
                Slug (optional)
              </label>
              <input
                id="slug"
                className={styles.input}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto from name"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label} htmlFor="series">
                Series
              </label>
              <input
                id="series"
                className={styles.input}
                value={form.series}
                onChange={(e) =>
                  setForm((f) => ({ ...f, series: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={styles.label} htmlFor="image-upload">
                Product image
              </label>
              <div className={styles.uploadBox}>
                <div className={styles.uploadPreview}>
                  {form.image ? (
                    <Image
                      src={form.image}
                      alt="Product preview"
                      fill
                      className={styles.uploadPreviewImg}
                      sizes="120px"
                    />
                  ) : (
                    <div className={styles.uploadPreviewEmpty}>No image</div>
                  )}
                </div>
                <input
                  id="image-upload"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading || busy}
                  onChange={(e) =>
                    void onImageSelected(e.target.files?.[0] ?? undefined)
                  }
                />
                <p className={styles.uploadHint}>
                  {uploading
                    ? "Uploading…"
                    : form.image
                      ? `Saved as ${form.image}`
                      : "Choose a photo to upload"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className={styles.label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className={styles.textarea}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              required
            />
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label} htmlFor="price">
                Price
              </label>
              <input
                id="price"
                type="number"
                min={0}
                step="1"
                className={styles.input}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={styles.label} htmlFor="currency">
                Currency
              </label>
              <input
                id="currency"
                className={styles.input}
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div>
              <label className={styles.label} htmlFor="stock">
                Stock
              </label>
              <input
                id="stock"
                type="number"
                min={0}
                step="1"
                className={styles.input}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                required
              />
            </div>
            <div className={styles.checkRow} style={{ paddingTop: "1.6rem" }}>
              <label>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, featured: e.target.checked }))
                  }
                />
                Featured
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                />
                Active
              </label>
            </div>
          </div>

          <button
            className={styles.btn}
            type="submit"
            disabled={busy || uploading || !form.image}
          >
            {busy ? "Saving…" : "Add product"}
          </button>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>All products</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Image
                      src={p.image}
                      alt=""
                      width={44}
                      height={56}
                      className={styles.thumb}
                    />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    <div className={styles.muted}>
                      {p.series} · {p.slug}
                    </div>
                  </td>
                  <td>{formatINR(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        p.active ? styles.badgePaid : styles.badgePending
                      }`}
                    >
                      {p.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <input
                        ref={(el) => {
                          rowFileRefs.current[p.id] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void replaceProductImage(p, file);
                        }}
                      />
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        disabled={rowUploadingId === p.id}
                        onClick={() => rowFileRefs.current[p.id]?.click()}
                      >
                        {rowUploadingId === p.id ? "Uploading…" : "Change photo"}
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={() => void toggleActive(p)}
                      >
                        {p.active ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={() => void remove(p)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 ? (
            <p className={styles.muted}>No products yet.</p>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
