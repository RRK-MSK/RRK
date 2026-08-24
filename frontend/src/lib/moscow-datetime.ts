export const MOSCOW_TIME_ZONE = "Europe/Moscow";

const DATE_TIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const HAS_TIME_ZONE_PATTERN = /([zZ]|[+-]\d{2}:\d{2})$/;

/** ISO / timestamptz from Supabase -> value for `<input type="datetime-local">` in Moscow time. */
export function formatDateTimeLocalMoscow(value?: string | null) {
  if (!value?.trim()) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}

/** `<input type="datetime-local">` value (Moscow wall time) -> ISO UTC for Supabase. */
export function parseDateTimeLocalMoscow(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (DATE_TIME_LOCAL_PATTERN.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const date = new Date(`${withSeconds}+03:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (HAS_TIME_ZONE_PATTERN.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
