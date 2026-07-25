export type EventPriceTier = {
  id?: string;
  event_id?: string;
  seat_from: number;
  seat_to: number | null;
  price_rub: number;
};

export function normalizeEventPriceTiers<T extends EventPriceTier>(tiers: T[]) {
  return [...tiers].sort((left, right) => left.seat_from - right.seat_from);
}

export function getPriceForNextBooking(
  basePriceRub: number | null | undefined,
  bookedCount: number | null | undefined,
  tiers: EventPriceTier[],
) {
  const normalizedBasePrice = basePriceRub ?? 0;
  const nextSeatNumber = Math.max(bookedCount ?? 0, 0) + 1;

  const matchingTier = normalizeEventPriceTiers(tiers).find((tier) => {
    const startsInRange = nextSeatNumber >= tier.seat_from;
    const endsInRange = tier.seat_to === null ? true : nextSeatNumber <= tier.seat_to;
    return startsInRange && endsInRange;
  });

  return matchingTier?.price_rub ?? normalizedBasePrice;
}

export function formatPriceTierLabel(tier: EventPriceTier) {
  const rangeLabel = tier.seat_to === null
    ? `${tier.seat_from}+`
    : `${tier.seat_from}-${tier.seat_to}`;

  return `${rangeLabel}: ${formatRub(tier.price_rub)}`;
}

export function formatPriceTierSummary(tiers: EventPriceTier[]) {
  const normalizedTiers = normalizeEventPriceTiers(tiers);

  if (normalizedTiers.length === 0) {
    return "Базовая цена";
  }

  return normalizedTiers.map(formatPriceTierLabel).join(" | ");
}

function formatRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} Р`;
}
