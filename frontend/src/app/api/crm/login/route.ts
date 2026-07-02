import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, isValidCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const login = String(formData.get("login") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!isValidCredentials(login, password)) {
    return NextResponse.redirect(new URL("/crm/login?error=1", request.url), 303);
  }

  // Для Telegram Mini App и мобильных браузеров, которые блокируют cross-site cookies,
  // нам нужно обеспечить максимально лояльную политику cookie.
  // Vercel иногда проксирует запросы, поэтому лучше жестко установить lax для надежности.
  const response = NextResponse.redirect(new URL("/crm/dashboard", request.url), 303);
  response.cookies.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
