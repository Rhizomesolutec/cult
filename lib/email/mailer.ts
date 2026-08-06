import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/lib/email/config";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendMailResult = {
  status: "sent" | "skipped" | "failed";
  error?: string;
  messageId?: string;
};

/**
 * Sends mail via SMTP when configured.
 * If SMTP env vars are missing, returns `skipped` (safe for demo / local).
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const cfg = getSmtpConfig();

  if (!cfg.configured) {
    console.info(
      `[email:skipped] To=${input.to} Subject="${input.subject}" (configure SMTP_* in .env)`,
    );
    return {
      status: "skipped",
      error: "SMTP not configured — set SMTP_HOST/USER/PASS in .env",
    };
  }

  if (!input.to?.trim()) {
    return { status: "failed", error: "Missing recipient" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });

    const info = await transporter.sendMail({
      from: cfg.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { status: "sent", messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    console.error("[email:failed]", message);
    return { status: "failed", error: message };
  }
}
