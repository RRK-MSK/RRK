export function buildEnrollmentsMarker(enrollmentIds: string[]) {
  if (enrollmentIds.length === 0) {
    return null;
  }

  return `[enrollments:${enrollmentIds.join(",")}]`;
}

export function parseEnrollmentsMarker(note: string | null | undefined) {
  const match = note?.match(/\[enrollments:([^\]]+)\]/);
  if (!match?.[1]) {
    return [] as string[];
  }

  return match[1].split(",").map((value) => value.trim()).filter(Boolean);
}

export function buildPaymentNote(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" | ") || null;
}
