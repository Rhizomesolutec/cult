import { NextResponse } from "next/server";

/**
 * Demo payment is disabled.
 * Ordinary orders must be confirmed only via NTT DATA UAT verification.
 * A client-supplied outcome (e.g. outcome: "success") cannot mark an order paid.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Demo payment is disabled. Orders are confirmed only after NTT DATA UAT server-side verification.",
    },
    { status: 403 },
  );
}
