export function parseEventPaymentInput(raw: string) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { priceRub: 0, priceLabel: null as string | null };
  }

  const numericCandidate = trimmed
    .replace(/\s/g, "")
    .replace(/₽/g, "")
    .replace(/руб\.?/gi, "");

  if (/^\d+$/.test(numericCandidate)) {
    return { priceRub: Number(numericCandidate), priceLabel: null as string | null };
  }

  return { priceRub: 0, priceLabel: trimmed };
}

export function formatEventPaymentForForm(
  priceRub: number | null | undefined,
  priceLabel: string | null | undefined,
) {
  if (priceLabel?.trim()) {
    return priceLabel.trim();
  }

  if (priceRub && priceRub > 0) {
    return String(priceRub);
  }

  return "";
}

export function formatEventPriceDisplay(
  priceRub: number | null | undefined,
  priceLabel: string | null | undefined,
  formattedRubPrice: string,
) {
  if (priceLabel?.trim()) {
    return priceLabel.trim();
  }

  return formattedRubPrice;
}

export function hasTextOnlyEventPrice(priceLabel: string | null | undefined) {
  return Boolean(priceLabel?.trim());
}
