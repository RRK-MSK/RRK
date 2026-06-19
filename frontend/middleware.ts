import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "./src/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isCrmRoute = pathname === "/crm" || pathname.startsWith("/crm/");

  if (!isCrmRoute) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === "/crm/login";
  const hasSession = request.cookies.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;

  if (!hasSession && !isLoginRoute) {
    return NextResponse.redirect(new URL("/crm/login", request.url));
  }

  if (hasSession && (pathname === "/crm" || isLoginRoute)) {
    return NextResponse.redirect(new URL("/crm/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*"],
};
