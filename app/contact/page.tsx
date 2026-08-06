"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SiteHeader } from "../components/SiteHeader";
import { WHATSAPP_DISPLAY, whatsAppUrl } from "../config/whatsapp";
import styles from "./page.module.css";

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();

  const parent = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.1,
          delayChildren: reduceMotion ? 0 : 0.06,
        },
      },
    }),
    [reduceMotion],
  );

  const child = useMemo(
    () => ({
      hidden: reduceMotion
        ? { opacity: 0 }
        : { opacity: 0, y: 20, filter: "blur(8px)" },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
          duration: reduceMotion ? 0.01 : 0.62,
          ease: easeOut,
        },
      },
    }),
    [reduceMotion],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    const text = [
      "Hi, I'm reaching out from the CultScribe site.",
      "",
      message.trim(),
      "",
      "—",
      `Name: ${name.trim() || "(not provided)"}`,
      `Email: ${email.trim()}`,
    ].join("\n");

    window.open(whatsAppUrl(text), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <SiteHeader />
      <div className={styles.glow} aria-hidden />
      <div className={styles.page}>
        <motion.div
          className={styles.content}
          variants={parent}
          initial="hidden"
          animate="show"
        >
          <motion.span className={styles.eyebrow} variants={child}>
            Get in touch
          </motion.span>
          <motion.h1 className={styles.title} variants={child}>
            Let&apos;s write the next page
          </motion.h1>
          <motion.p className={styles.lead} variants={child}>
            Wholesales, custom drops, or questions about the collection—send a
            note. We read every message.
          </motion.p>

          <motion.form
            className={styles.block}
            onSubmit={handleSubmit}
            noValidate
            variants={child}
          >
            <p className={styles.hint}>
              Sends your message to our WhatsApp at{" "}
              <a
                className={styles.hintLink}
                href={whatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {WHATSAPP_DISPLAY}
              </a>
              .
            </p>
            <label className={styles.label} htmlFor="contact-name">
              Name
            </label>
            <input
              id="contact-name"
              className={styles.input}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className={styles.label} htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              className={styles.input}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className={styles.label} htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              className={styles.textarea}
              name="message"
              placeholder="Tell us what you need—orders, partnerships, or a hello."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
            />
            <button className={styles.submit} type="submit">
              Send message
            </button>
          </motion.form>

          <motion.div variants={child}>
            <Link className={styles.back} href="/">
              ← Back to home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
