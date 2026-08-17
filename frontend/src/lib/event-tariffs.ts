export type EventTariffTier = {
  seat_from: number;
  seat_to: number | null;
  price_rub: number;
};

export type EventTariffOption = {
  label: string;
  note: string;
  priceRub: number;
  capacity: number;
  seatsLeft: number;
};

export type EventForTariffOptions = {
  id?: string;
  title?: string | null;
  starts_at?: string | null;
  capacity?: number | null;
};

export type EnrollmentNoteForTariffUsage = {
  note?: string | null;
  status?: string | null;
};

type EventForTariffs = Pick<EventForTariffOptions, "title" | "starts_at" | "capacity">;
type EnrollmentForTariffUsage = EnrollmentNoteForTariffUsage;

const SPEAKER_TARIFF = {
  label: "Спикер",
  note: "Тариф: Спикер",
  legacyNotes: ["Тариф: Быть спикером"],
} as const;

const VIEWER_TARIFF = {
  label: "Зритель",
  note: "Тариф: Зритель",
  legacyNotes: [] as const,
} as const;

function countTariffUsage(
  usageByTariff: Map<string, number> | undefined,
  canonicalNote: string,
  legacyNotes: readonly string[],
) {
  const notes = [canonicalNote, ...legacyNotes];
  return notes.reduce((sum, note) => sum + (usageByTariff?.get(note) ?? 0), 0);
}

export function isAugustCommunityEvent(event: EventForTariffs) {
  if (!event.starts_at) {
    return false;
  }

  const normalizedTitle = (event.title ?? "").toLowerCase();
  if (!normalizedTitle.includes("реально разговорный клуб")) {
    return false;
  }

  const moscowDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(event.starts_at));

  return moscowDate === "2026-08-26";
}

export function buildTariffUsageMap(enrollments: EnrollmentForTariffUsage[]) {
  const usageByTariff = new Map<string, number>();

  for (const enrollment of enrollments) {
    const normalizedStatus = (enrollment.status ?? "").toLowerCase();
    if (normalizedStatus.includes("отмен")) {
      continue;
    }

    const note = enrollment.note?.trim();
    if (!note) {
      continue;
    }

    usageByTariff.set(note, (usageByTariff.get(note) ?? 0) + 1);
  }

  return usageByTariff;
}

export function buildEventTariffOptions(
  event: EventForTariffs,
  tiers: EventTariffTier[],
  usageByTariff: Map<string, number> | undefined,
): EventTariffOption[] | undefined {
  if (!isAugustCommunityEvent(event) || tiers.length < 2) {
    return undefined;
  }

  const normalizedTiers = [...tiers].sort((left, right) => left.seat_from - right.seat_from);
  const speakerTier = normalizedTiers[0];
  const viewerTier = normalizedTiers[1];

  const definitions = [
    { ...SPEAKER_TARIFF, tier: speakerTier },
    { ...VIEWER_TARIFF, tier: viewerTier },
  ];

  return definitions.map((option) => {
    const maxSeat = option.tier.seat_to ?? (event.capacity ?? option.tier.seat_from);
    const capacity = Math.max(maxSeat - option.tier.seat_from + 1, 0);
    const used = countTariffUsage(usageByTariff, option.note, option.legacyNotes);
    const seatsLeft = Math.max(capacity - used, 0);

    return {
      label: option.label,
      note: option.note,
      priceRub: option.tier.price_rub,
      capacity,
      seatsLeft,
    };
  });
}

export function formatEnrollmentTariffLabel(note: string | null | undefined) {
  if (!note?.trim()) {
    return "-";
  }

  if (note.startsWith("Тариф: ")) {
    const label = note.slice("Тариф: ".length);
    if (label === "Быть спикером") {
      return SPEAKER_TARIFF.label;
    }
    return label;
  }

  return note;
}

export function getTariffNotesForCapacityCheck(ticketNote: string | null | undefined) {
  if (!ticketNote) {
    return [];
  }

  if (ticketNote === SPEAKER_TARIFF.note || (SPEAKER_TARIFF.legacyNotes as readonly string[]).includes(ticketNote)) {
    return [SPEAKER_TARIFF.note, ...SPEAKER_TARIFF.legacyNotes];
  }

  return [ticketNote];
}

export function findEventTariffOption(
  options: EventTariffOption[] | undefined,
  ticketNote: string | null | undefined,
) {
  if (!options?.length || !ticketNote) {
    return null;
  }

  const directMatch = options.find((option) => option.note === ticketNote);
  if (directMatch) {
    return directMatch;
  }

  if ((SPEAKER_TARIFF.legacyNotes as readonly string[]).includes(ticketNote)) {
    return options.find((option) => option.note === SPEAKER_TARIFF.note) ?? null;
  }

  return null;
}

export function pickDefaultTariffNote(options: EventTariffOption[] | undefined) {
  return options?.find((option) => option.seatsLeft > 0)?.note ?? "";
}

export function resolveEventTariffOptions(
  event: EventForTariffOptions,
  tiers: EventTariffTier[],
  enrollments: EnrollmentNoteForTariffUsage[] | undefined,
): EventTariffOption[] {
  return buildEventTariffOptions(event, tiers, buildTariffUsageMap(enrollments ?? [])) ?? [];
}
