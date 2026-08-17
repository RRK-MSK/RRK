import { NextResponse } from "next/server";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseAuthServerClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore logout errors when Supabase env is missing.
  }

  return NextResponse.redirect(new URL("/crm/login", request.url), 303);
}
