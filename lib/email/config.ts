/**
 * SMTP / email setup — configure these in `.env` (see also `docs/EMAIL_SETUP.md`).
 *
 * Required for real sends:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Optional:
 *   DELIVERY_AGENCY_EMAIL, DELIVERY_AGENCY_NAME, SMTP_SECURE
 */
export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  agencyEmail: string;
  agencyName: string;
  configured: boolean;
};

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim() || "";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = process.env.SMTP_PASS?.trim() || "";
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "noreply@cultscribe.local";
  const secure =
    process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465;

  const configured = Boolean(host && user && pass);

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    from,
    agencyEmail: process.env.DELIVERY_AGENCY_EMAIL?.trim() || "",
    agencyName:
      process.env.DELIVERY_AGENCY_NAME?.trim() || "CultScribe Delivery Partner",
    configured,
  };
}
