import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";

type SitePosterEvent = {
  id?: string;
  tone: string;
  date: string;
  time: string;
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
};

export async function getSitePosterEvents() {
  if (!hasSupabasePublicEnv()) {
    return [] as SitePosterEvent[];
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, subtitle, description, category, city, host, starts_at, ends_at, price_rub, capacity, booked_count, is_published",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Supabase public events query failed", error);
    return [] as SitePosterEvent[];
  }

  return ((data ?? []) as EventRow[]).map((event, index) => {
    const capacity = event.capacity ?? 10;
    const booked = Math.max(0, event.booked_count ?? 0);
    const seatsLeft = Math.max(capacity - booked, 0);
    const hideCapacity = capacity >= 10000 || event.title?.toLowerCase().includes("coffee jam");

    return {
      id: event.id,
      tone: getTone(event.category, index),
      date: formatSiteDate(event.starts_at),
      time: formatTimeRange(event.starts_at, event.ends_at),
      title: event.title,
      description: event.subtitle ?? undefined,
      focus: event.description ?? undefined,
      host: event.host ?? undefined,
      price: formatPrice(event.price_rub),
      label: getLabel(event.category, event.city),
      capacity,
      booked,
      seatsLeft,
      hideCapacity,
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

  const day = date.getDate();
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(date);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date);

  return `${day} ${month} (${weekday})`;
}

function formatTimeRange(startValue: string, endValue: string | null) {
  const start = new Date(startValue);
  const startTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(start);

  if (!endValue) {
    return startTime;
  }

  const end = new Date(endValue);
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
