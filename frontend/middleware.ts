import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/auth", "/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const hasToken = request.cookies.has("kiri_token");

  if (!hasToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (hasToken && pathname === "/auth") {
    return NextResponse.redirect(new URL("/properties", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|properties/).*)"],
};
