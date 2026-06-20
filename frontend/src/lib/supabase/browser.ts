import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";

export function getSupabaseBrowserClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}
