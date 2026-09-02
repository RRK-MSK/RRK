export const EVENT_CATEGORY_KVARTIRNIK = "Квартирник";
export const EVENT_CATEGORY_COFFEE_JAM = "КофеДжем";

export const EVENT_CATEGORY_OPTIONS = [
  EVENT_CATEGORY_KVARTIRNIK,
  EVENT_CATEGORY_COFFEE_JAM,
] as const;

export type EventCategoryKind = "standard" | "collab";

export function normalizeEventCategory(
  category: string | null | undefined,
  title?: string | null,
): typeof EVENT_CATEGORY_KVARTIRNIK | typeof EVENT_CATEGORY_COFFEE_JAM {
  const normalizedCategory = (category ?? "").toLowerCase();
  const normalizedTitle = (title ?? "").toLowerCase();

  if (
    normalizedCategory.includes("кофеджем")
    || normalizedCategory.includes("coffee jam")
    || normalizedCategory.includes("кофе джем")
    || normalizedCategory.includes("коллаб")
    || normalizedCategory.includes("collab")
    || normalizedTitle.includes("coffee jam")
    || normalizedTitle.includes("кофе джем")
  ) {
    return EVENT_CATEGORY_COFFEE_JAM;
  }

  return EVENT_CATEGORY_KVARTIRNIK;
}

export function getEventDayKind(
  category: string | null | undefined,
  title?: string | null,
): EventCategoryKind {
  return normalizeEventCategory(category, title) === EVENT_CATEGORY_COFFEE_JAM ? "collab" : "standard";
}

export function getEventCategoryLabel(
  category: string | null | undefined,
  title?: string | null,
): string {
  return normalizeEventCategory(category, title);
}

export function isCoffeeJamCategory(
  category: string | null | undefined,
  title?: string | null,
): boolean {
  return normalizeEventCategory(category, title) === EVENT_CATEGORY_COFFEE_JAM;
}

export function getEventCategoryTone(
  category: string | null | undefined,
  title: string | null | undefined,
  index: number,
): string {
  return isCoffeeJamCategory(category, title) ? "highlight" : (index % 2 === 0 ? "solid" : "soft");
}

export function resolveEventCategoryForForm(
  category: string | null | undefined,
  title?: string | null,
): typeof EVENT_CATEGORY_KVARTIRNIK | typeof EVENT_CATEGORY_COFFEE_JAM {
  return normalizeEventCategory(category, title);
}
