export function isCrmEmailAllowed(email: string | undefined): boolean {
  if (!email) {
    return false;
  }

  const allowlist = process.env.CRM_ALLOWED_EMAILS?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist?.length) {
    return true;
  }

  return allowlist.includes(email.toLowerCase());
}

export function isCrmAuthBypassEnabled(): boolean {
  return process.env.CRM_BYPASS_AUTH === "true" && process.env.NODE_ENV === "development";
}
