import "server-only";

import type { User } from "@supabase/supabase-js";

import { isCrmAuthBypassEnabled, isCrmEmailAllowed } from "@/lib/crm-auth-config";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

const DEV_USER: User = {
  id: "dev-bypass",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
  email: "dev@local",
};

export async function requireCrmUser(): Promise<User> {
  if (isCrmAuthBypassEnabled()) {
    return DEV_USER;
  }

  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  if (!isCrmEmailAllowed(user.email)) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function getCrmUser(): Promise<User | null> {
  if (isCrmAuthBypassEnabled()) {
    return DEV_USER;
  }

  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isCrmEmailAllowed(user.email)) {
    return null;
  }

  return user;
}
