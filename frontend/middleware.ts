import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/auth", "/", "/forgot-password", "/reset-password", "/auth/callback"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicPath = publicPaths.includes(pathname);
  const token = request.cookies.get("kiri_token");

  if (!token && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  if (token && pathname === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/properties";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon\\.ico|logo\\.png|api/).*)" ],
};
