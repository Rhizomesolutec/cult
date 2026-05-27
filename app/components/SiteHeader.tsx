"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const t = window.setTimeout(() => drawerCloseRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  const contactActive = pathname === "/contact";

  const linkClass = (active: boolean) =>
    active ? `${styles.navLinkActive} ${styles.mobileNavLink}` : styles.mobileNavLink;

  return (
    <header
      className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}
      role="banner"
    >
      <Link className={styles.navLogo} href="/" aria-label="CultScribe home">
        <Image
          className={styles.navLogoImage}
          src="/logo.png"
          alt="CultScribe — Raw. Real. Written."
          width={260}
          height={100}
          sizes="(max-width: 480px) 160px, 200px"
          priority
        />
      </Link>

      <nav className={styles.navLinks} aria-label="Primary">
        <Link href="/#identity">Identity</Link>
        <Link href="/#ledger">Ledger</Link>
        <Link href="/#notebooks">Notebooks</Link>
        <Link
          href="/contact"
          className={contactActive ? styles.navLinkActive : ""}
        >
          Contact
        </Link>
      </nav>

      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuToggle}
        aria-expanded={menuOpen}
        aria-controls={menuId}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className={styles.menuIcon} aria-hidden>
          <span
            className={`${styles.menuBar} ${menuOpen ? styles.menuBarTopOpen : ""}`}
          />
          <span
            className={`${styles.menuBar} ${menuOpen ? styles.menuBarMidOpen : ""}`}
          />
          <span
            className={`${styles.menuBar} ${menuOpen ? styles.menuBarBotOpen : ""}`}
          />
        </span>
      </button>

      <div
        className={`${styles.mobileBackdrop} ${menuOpen ? styles.mobileBackdropOpen : ""}`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />

      <div
        id={menuId}
        className={`${styles.mobileDrawer} ${menuOpen ? styles.mobileDrawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!menuOpen}
      >
        <div className={styles.mobileDrawerTop}>
          <button
            ref={drawerCloseRef}
            type="button"
            className={styles.drawerClose}
            aria-label="Close menu"
            onClick={() => {
              closeMenu();
              menuButtonRef.current?.focus();
            }}
          >
            <span className={styles.drawerCloseIcon} aria-hidden>
              <span className={styles.drawerCloseBar} />
              <span className={styles.drawerCloseBar} />
            </span>
          </button>
        </div>
        <nav className={styles.mobileNav} aria-label="Primary mobile">
          <Link
            href="/#identity"
            className={linkClass(false)}
            onClick={closeMenu}
          >
            Identity
          </Link>
          <Link
            href="/#ledger"
            className={linkClass(false)}
            onClick={closeMenu}
          >
            Ledger
          </Link>
          <Link
            href="/#notebooks"
            className={linkClass(false)}
            onClick={closeMenu}
          >
            Notebooks
          </Link>
          <Link
            href="/contact"
            className={linkClass(contactActive)}
            onClick={closeMenu}
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
