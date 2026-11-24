export function getSupabaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    // Dashboard "Data API" URL includes /rest/v1 — createClient adds that itself.
    if (url.pathname === "/rest/v1" || url.pathname === "/rest/v1/") {
      url.pathname = "/";
    }
    return url.origin;
  } catch {
    return raw.replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
  }
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function hasSupabasePublicEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function hasSupabaseServiceRoleEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}
