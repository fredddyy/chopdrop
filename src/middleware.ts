import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "chopdrop-admin-token";
const USER_COOKIE = "chopdrop-user-token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages except login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Protect admin API routes except auth
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protect customer pages — require user token
  const protectedPages = ["/menu", "/cart", "/orders", "/account", "/restaurant"];
  const isProtected = protectedPages.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const token = request.cookies.get(USER_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Protect customer API routes that need auth
  if (pathname.startsWith("/api/orders") && !pathname.startsWith("/api/orders/mine")) {
    // Allow order creation and lookup without strict gating for now
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/menu", "/cart", "/orders", "/account", "/restaurant/:path*"],
};
