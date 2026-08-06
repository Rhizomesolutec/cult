import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSmtpConfig } from "@/lib/email/config";

/** Shows where SMTP / agency email is configured (no secrets). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfg = getSmtpConfig();
  return NextResponse.json({
    setupFile: "docs/EMAIL_SETUP.md",
    envFile: ".env",
    smtp: {
      configured: cfg.configured,
      host: cfg.host || "(not set)",
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user ? `${cfg.user.slice(0, 2)}***` : "(not set)",
      from: cfg.from,
    },
    deliveryAgency: {
      name: cfg.agencyName,
      email: cfg.agencyEmail || "(not set — set DELIVERY_AGENCY_EMAIL)",
    },
    flow: [
      "Payment success → customer confirmation + agency dispatch emails",
      "Admin marks Shipped → customer shipped email",
      "Admin marks Delivered → customer delivered email",
    ],
    codePaths: [
      "lib/email/config.ts",
      "lib/email/mailer.ts",
      "lib/email/templates.ts",
      "lib/email/order-notifications.ts",
      "app/api/payments/demo/route.ts",
      "app/api/admin/orders/[id]/route.ts",
    ],
  });
}
