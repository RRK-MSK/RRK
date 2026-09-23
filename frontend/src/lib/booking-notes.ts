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

export function buildCompanionsMarker(people: Array<{ fullName: string; telegram?: string | null }>) {
  if (people.length <= 1) {
    return null;
  }

  const guests = people
    .slice(1)
    .map((person) => [person.fullName, person.telegram].filter(Boolean).join(" "))
    .filter(Boolean);

  if (guests.length === 0) {
    return null;
  }

  return `[companions:${guests.join("; ")}]`;
}

export function parseCompanionsMarker(note: string | null | undefined) {
  const match = note?.match(/\[companions:([^\]]+)\]/);
  if (!match?.[1]) {
    return [] as string[];
  }

  return match[1].split(";").map((value) => value.trim()).filter(Boolean);
}
