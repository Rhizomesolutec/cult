import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  verifyAdminSessionTokenEdge,
} from "@/lib/admin-auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const secret =
    process.env.ADMIN_SESSION_SECRET || "cultscribe-admin-session-fallback";
  const username = process.env.ADMIN_USERNAME || "Cultscribe";
  const valid = await verifyAdminSessionTokenEdge(token, secret, username);

  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
