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

  const tiersByEventId = new Map<string, EventPriceTierRow[]>();

  for (const tier of ((priceTiers ?? []) as EventPriceTierRow[])) {
    const current = tiersByEventId.get(tier.event_id) ?? [];
    current.push(tier);
    tiersByEventId.set(tier.event_id, current);
  }

  return ((data ?? []) as EventRow[])
    .filter((event) => {
      const isPast = event.starts_at && new Date(event.starts_at).getTime() < Date.now();
      const isCanceled = event.status === "Отменено";
      return !isPast && !isCanceled;
    })
    .map((event, index) => {
    const eventTiers = tiersByEventId.get(event.id) ?? [];
    const currentPrice = getPriceForNextBooking(event.price_rub, event.booked_count, eventTiers as EventPriceTier[]);
    const capacity = event.capacity ?? 10;
    const booked = Math.max(0, event.booked_count ?? 0);
    const seatsLeft = Math.max(capacity - booked, 0);
    const normalizedTitle = event.title?.toLowerCase() ?? "";
    const hideCapacity = capacity >= 10000 || normalizedTitle.includes("coffee jam") || normalizedTitle.includes("кофе джем");

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
      price: formatPrice(currentPrice),
      label: getLabel(event.category, event.city),
      capacity,
      booked,
      seatsLeft,
      hideCapacity,
      status: event.status ?? undefined,
    };
  });
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

function getLabel(category: string | null, city: string | null) {
  const normalizedCategory = (category ?? "").toLowerCase();
  const normalizedCity = (city ?? "").toLowerCase();

  if (normalizedCategory.includes("collab") || normalizedCategory.includes("коллаб")) {
    return "Коллаборация";
  }

  if (normalizedCity.includes("питер") || normalizedCity.includes("санкт")) {
    return "Питер";
  }

  if (normalizedCategory.includes("big") || normalizedCategory.includes("биг")) {
    return "Большая тренировка";
  }

  return undefined;
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
