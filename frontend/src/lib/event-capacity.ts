export const UNLIMITED_EVENT_CAPACITY = 10000;

export function isUnlimitedCapacity(capacity: number | null | undefined) {
  return (capacity ?? 0) >= UNLIMITED_EVENT_CAPACITY;
}

export function formatEventCapacityLabel(
  capacity: number | null | undefined,
  bookedCount: number | null | undefined,
) {
  if (isUnlimitedCapacity(capacity)) {
    return `${bookedCount ?? 0} записано · без лимита`;
  }

  const safeCapacity = capacity ?? 0;
  const safeBooked = bookedCount ?? 0;

  if (safeBooked >= safeCapacity) {
    return "Мест нет";
  }

  return `${safeBooked} из ${safeCapacity}`;
}
