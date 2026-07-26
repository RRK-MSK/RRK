import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPriceForNextBooking, type EventPriceTier } from "@/lib/event-pricing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";

type SitePosterEvent = {
  id?: string;
  tone: string;
  date: string;
  time: string;
  startsAt?: string;
  status?: string;
  title: string;
  description?: string;
  focus?: string;
  host?: string;
  price: string;
  label?: string;
  capacity?: number;
  booked?: number;
  seatsLeft?: number;
  hideCapacity?: boolean;
  bookingClosed?: boolean;
  bookingClosedMessage?: string;
  bookingOptions?: {
    label: string;
    price: string;
    priceRub: number;
    capacity: number;
    seatsLeft: number;
  }[];
};

type EventRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  host: string | null;
  starts_at: string;
  ends_at: string | null;
  price_rub: number | null;
  capacity: number | null;
  booked_count: number | null;
  is_published: boolean | null;
  status?: string | null;
};

type EventPriceTierRow = {
  event_id: string;
  seat_from: number;
  seat_to: number | null;
  price_rub: number;
};

type EnrollmentRow = {
  event_id: string;
  note: string | null;
  status: string | null;
};

export async function getSitePosterEvents() {
  const supabase = getSupabaseAdminClient() ?? (
    hasSupabasePublicEnv()
      ? createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null
  );

  if (!supabase) {
    return [] as SitePosterEvent[];
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, description, category, city, host, starts_at, ends_at, price_rub, capacity, booked_count, is_published, status",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Supabase public events query failed", error);
    return [] as SitePosterEvent[];
  }

  const { data: priceTiers } = await supabase
    .from("event_price_tiers")
    .select("event_id, seat_from, seat_to, price_rub")
    .order("seat_from", { ascending: true });

  const eventIds = ((data ?? []) as EventRow[]).map((event) => event.id);
  const { data: enrollments } = eventIds.length > 0
    ? await supabase
        .from("enrollments")
        .select("event_id, note, status")
        .in("event_id", eventIds)
    : { data: [] as EnrollmentRow[] };

  const tiersByEventId = new Map<string, EventPriceTierRow[]>();
  const tariffUsageByEventId = new Map<string, Map<string, number>>();

  for (const tier of ((priceTiers ?? []) as EventPriceTierRow[])) {
    const current = tiersByEventId.get(tier.event_id) ?? [];
    current.push(tier);
    tiersByEventId.set(tier.event_id, current);
  }

  for (const enrollment of ((enrollments ?? []) as EnrollmentRow[])) {
    const normalizedStatus = (enrollment.status ?? "").toLowerCase();
    if (normalizedStatus.includes("отмен")) {
      continue;
    }

    const note = enrollment.note?.trim();
    if (!note) {
      continue;
    }

    const eventUsage = tariffUsageByEventId.get(enrollment.event_id) ?? new Map<string, number>();
    eventUsage.set(note, (eventUsage.get(note) ?? 0) + 1);
    tariffUsageByEventId.set(enrollment.event_id, eventUsage);
  }

  return ((data ?? []) as EventRow[])
    .filter((event) => {
      const isPast = event.starts_at && new Date(event.starts_at).getTime() < Date.now();
      const isCanceled = event.status === "Отменено";
      return !isPast && !isCanceled;
    })
    .map((event, index) => {
    const eventTiers = tiersByEventId.get(event.id) ?? [];
    const basePrice = getEventBasePrice(event);
    const currentPrice = isCoffeeJamEvent(event) && eventTiers.length > 0
      ? getPriceForNextBooking(basePrice, event.booked_count, eventTiers as EventPriceTier[])
      : basePrice;
    const capacity = event.capacity ?? 10;
    const booked = Math.max(0, event.booked_count ?? 0);
    const seatsLeft = Math.max(capacity - booked, 0);
    const normalizedTitle = event.title?.toLowerCase() ?? "";
    const isAugustPicnic = isAugustPicnicEvent(event);
    const hideCapacity = capacity >= 10000 || normalizedTitle.includes("coffee jam") || normalizedTitle.includes("кофе джем");
    const bookingOptions = buildBookingOptions(
      event,
      eventTiers,
      tariffUsageByEventId.get(event.id),
    );

    return {
      id: event.id,
      tone: getTone(event.category, index),
      date: formatSiteDate(event.starts_at),
      time: formatTimeRange(event),
      startsAt: event.starts_at,
      title: event.title,
      description: event.subtitle ?? undefined,
      focus: event.description ?? undefined,
      host: event.host ?? undefined,
      price: isAugustPicnic ? "Скоро тут появится цена и адрес" : formatPrice(currentPrice),
      label: getLabel(event.category),
      capacity,
      booked,
      seatsLeft,
      hideCapacity: isAugustPicnic ? true : hideCapacity,
      bookingClosed: isAugustPicnic,
      bookingClosedMessage: isAugustPicnic ? "Запись скоро откроем" : undefined,
      bookingOptions,
      status: event.status ?? undefined,
    };
  });
}

function buildBookingOptions(
  event: EventRow,
  tiers: EventPriceTierRow[],
  usageByTariff: Map<string, number> | undefined,
) {
  if (!isAugustCommunityEvent(event) || tiers.length < 2) {
    return undefined;
  }

  const normalizedTiers = [...tiers].sort((left, right) => left.seat_from - right.seat_from);
  const speakerTier = normalizedTiers[0];
  const viewerTier = normalizedTiers[1];

  const options = [
    { label: "Быть спикером", note: "Тариф: Быть спикером", tier: speakerTier },
    { label: "Зритель", note: "Тариф: Зритель", tier: viewerTier },
  ];

  return options.map((option) => {
    const maxSeat = option.tier.seat_to ?? (event.capacity ?? option.tier.seat_from);
    const capacity = Math.max(maxSeat - option.tier.seat_from + 1, 0);
    const used = usageByTariff?.get(option.note) ?? 0;
    const seatsLeft = Math.max(capacity - used, 0);

    return {
      label: option.label,
      price: formatPrice(option.tier.price_rub),
      priceRub: option.tier.price_rub,
      capacity,
      seatsLeft,
    };
  });
}

function isAugustCommunityEvent(event: EventRow) {
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

function isAugustPicnicEvent(event: EventRow) {
  if (!event.starts_at) {
    return false;
  }

  const normalizedTitle = (event.title ?? "").toLowerCase();
  if (!normalizedTitle.includes("пикник")) {
    return false;
  }

  const moscowDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(event.starts_at));

  return moscowDate === "2026-08-30";
}

function getTone(category: string | null, index: number) {
  const normalized = (category ?? "").toLowerCase();

  if (normalized.includes("collab") || normalized.includes("коллаб")) {
    return "highlight";
  }

  if (normalized.includes("big") || normalized.includes("биг")) {
    return "solid";
  }

  return index % 2 === 0 ? "solid" : "soft";
}

function getLabel(category: string | null) {
  const normalizedCategory = (category ?? "").toLowerCase();

  if (normalizedCategory.includes("collab") || normalizedCategory.includes("коллаб")) {
    return "Коллаборация";
  }

  if (normalizedCategory.includes("big") || normalizedCategory.includes("биг")) {
    return "Большая тренировка";
  }

  return undefined;
}

function getEventBasePrice(event: Pick<EventRow, "title" | "category" | "price_rub">) {
  return isBigTrainingEvent(event) ? 5500 : (event.price_rub ?? 0);
}

function isCoffeeJamEvent(event: Pick<EventRow, "title" | "category">) {
  const normalizedTitle = (event.title ?? "").toLowerCase();
  const normalizedCategory = (event.category ?? "").toLowerCase();

  return normalizedTitle.includes("coffee jam")
    || normalizedTitle.includes("кофе джем")
    || normalizedCategory.includes("coffee jam")
    || normalizedCategory.includes("кофе джем");
}

function isBigTrainingEvent(event: Pick<EventRow, "title" | "category">) {
  const normalizedTitle = (event.title ?? "").toLowerCase();
  const normalizedCategory = (event.category ?? "").toLowerCase();

  return normalizedTitle.includes("большая тренировка")
    || normalizedTitle.includes("big тренировка")
    || normalizedCategory.includes("big")
    || normalizedCategory.includes("биг");
}

function formatSiteDate(value: string) {
  const date = new Date(value);

  const day = new Intl.DateTimeFormat("ru-RU", { day: "numeric", timeZone: "Europe/Moscow" }).format(date);
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long", timeZone: "Europe/Moscow" }).format(date);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "Europe/Moscow" }).format(date);

  return `${day} ${month} (${weekday})`;
}

function formatTimeRange(event: EventRow) {
  const normalizedCategory = (event.category ?? "").toLowerCase();

  if (normalizedCategory.includes("full day") || normalizedCategory.includes("full_day")) {
    return "FULL DAY";
  }

  const start = new Date(event.starts_at);
  const startTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(start);

  if (!event.ends_at) {
    return startTime;
  }

  const end = new Date(event.ends_at);
  const endTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(end);

  return `${startTime}-${endTime}`;
}

function formatPrice(value: number | null) {
  if (!value || value <= 0) {
    return "Регистрация";
  }

  return `${new Intl.NumberFormat("ru-RU").format(value)}₽`;
}
