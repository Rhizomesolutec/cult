"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../AdminShell";
import styles from "../admin.module.css";

type SetupInfo = {
  setupFile: string;
  envFile: string;
  smtp: {
    configured: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    from: string;
  };
  deliveryAgency: { name: string; email: string };
  flow: string[];
  codePaths: string[];
};

export default function AdminEmailSetupPage() {
  const [info, setInfo] = useState<SetupInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/email-setup", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load setup");
        if (!cancelled) setInfo(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load setup");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell>
      <h1 className={styles.pageTitle}>Email / SMTP setup</h1>
      <p className={styles.pageLead}>
        Structure for real-gateway auto-mails: customer confirmation, delivery
        agency dispatch, shipped, and delivered notices.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      {info ? (
        <>
          <section className={styles.panel}>
            <h2>Where to configure</h2>
            <p className={styles.muted}>
              Edit <code>{info.envFile}</code> in the project root. Full guide:{" "}
              <code>{info.setupFile}</code>
            </p>
            <div className={styles.orderMeta} style={{ marginTop: "1rem" }}>
              <div>
                SMTP ready:{" "}
                <strong>{info.smtp.configured ? "Yes" : "No — fill SMTP_*"}</strong>
              </div>
              <div>
                Host: <strong>{info.smtp.host}</strong>
              </div>
              <div>
                Port: <strong>{info.smtp.port}</strong> (secure:{" "}
                {String(info.smtp.secure)})
              </div>
              <div>
                User: <strong>{info.smtp.user}</strong>
              </div>
              <div>
                From: <strong>{info.smtp.from}</strong>
              </div>
              <div>
                Default agency: <strong>{info.deliveryAgency.name}</strong>
              </div>
              <div>
                Agency email: <strong>{info.deliveryAgency.email}</strong>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h2>Email flow</h2>
            <ul className={styles.itemList}>
              {info.flow.map((step) => (
                <li key={step}>
                  <span>{step}</span>
                  <span />
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel}>
            <h2>Code paths</h2>
            <ul className={styles.itemList}>
              {info.codePaths.map((p) => (
                <li key={p}>
                  <span>
                    <code>{p}</code>
                  </span>
                  <span />
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel}>
            <h2>.env keys</h2>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                color: "var(--cult-ash)",
                fontSize: "0.85rem",
              }}
            >{`SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=CultScribe <noreply@yourdomain.com>
DELIVERY_AGENCY_NAME=Your Courier Partner
DELIVERY_AGENCY_EMAIL=dispatch@courier.com`}</pre>
          </section>
        </>
      ) : (
        !error && <p className={styles.muted}>Loading setup…</p>
      )}
    </AdminShell>
  );
}
