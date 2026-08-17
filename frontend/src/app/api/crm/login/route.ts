import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isCrmEmailAllowed } from "@/lib/crm-auth-config";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/crm/login?error=config", request.url), 303);
  }

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/crm/login?error=1", request.url), 303);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/crm/login?error=1", request.url), 303);
  }

  if (!isCrmEmailAllowed(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/crm/login?error=forbidden", request.url), 303);
  }

  return NextResponse.redirect(new URL("/crm/dashboard", request.url), 303);
}
