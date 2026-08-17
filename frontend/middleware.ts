import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isCrmAuthBypassEnabled, isCrmEmailAllowed } from "./src/lib/crm-auth-config";
import { createSupabaseMiddlewareClient } from "./src/lib/supabase/middleware-client";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isCrmRoute = pathname === "/crm" || pathname.startsWith("/crm/");

  if (!isCrmRoute) {
    return NextResponse.next();
  }

  if (isCrmAuthBypassEnabled()) {
    return NextResponse.next();
  }

  const isLoginRoute = pathname === "/crm/login";
  const { supabase, supabaseResponse } = await createSupabaseMiddlewareClient(request);

  if (!supabase) {
    if (isLoginRoute) {
      return supabaseResponse;
    }

    return NextResponse.redirect(new URL("/crm/login?error=config", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isLoginRoute) {
      return supabaseResponse;
    }

    return NextResponse.redirect(new URL("/crm/login", request.url));
  }

  if (!isCrmEmailAllowed(user.email)) {
    if (isLoginRoute) {
      return supabaseResponse;
    }

    return NextResponse.redirect(new URL("/crm/login?error=forbidden", request.url));
  }

  if (pathname === "/crm" || isLoginRoute) {
    return NextResponse.redirect(new URL("/crm/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/crm/:path*"],
};
