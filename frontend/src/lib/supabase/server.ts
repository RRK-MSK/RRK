import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey, getSupabaseUrl, hasSupabaseServiceRoleEnv } from "@/lib/supabase/env";

export function getSupabaseAdminClient() {
  if (!hasSupabaseServiceRoleEnv()) {
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
