import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyJWT } from "@/src/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  const payload = token ? await verifyJWT(token) : null;

  console.log("pathname:", pathname);
  console.log("has token:", !!token);
  console.log("payload:", payload);

  // Login page
  if (pathname === "/admin-panel/login") {
    // Already logged in → don't allow login page
    if (payload) {
      return NextResponse.redirect(
        new URL("/admin-panel/menu", request.url)
      );
    }

    // Not logged in → allow login page
    return NextResponse.next();
  }

  // All other admin-panel routes require authentication
  if (pathname.startsWith("/admin-panel") && !payload) {
    const loginUrl = new URL(
      "/admin-panel/login",
      request.url
    );

    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-panel/:path*"],
};