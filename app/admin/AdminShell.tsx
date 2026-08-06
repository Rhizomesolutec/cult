"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./admin.module.css";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const linkClass = (href: string) => {
    const active =
      pathname === href || (href !== "/admin" && pathname.startsWith(href));
    return active ? styles.navLinkActive : undefined;
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/admin">
          CultScribe Admin
        </Link>
        <nav className={styles.nav} aria-label="Admin">
          <Link href="/admin" className={linkClass("/admin")}>
            Dashboard
          </Link>
          <Link href="/admin/products" className={linkClass("/admin/products")}>
            Products
          </Link>
          <Link href="/admin/orders" className={linkClass("/admin/orders")}>
            Purchases
          </Link>
          <Link
            href="/admin/email-setup"
            className={linkClass("/admin/email-setup")}
          >
            Email setup
          </Link>
          <Link href="/" className={styles.homeBtn}>
            Home
          </Link>
          <button type="button" className={styles.logout} onClick={() => void logout()}>
            Log out
          </button>
        </nav>
      </header>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
