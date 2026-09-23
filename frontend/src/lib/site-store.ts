import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getEventCategoryTone,
  isCoffeeJamCategory,
} from "@/lib/event-categories";
import { isUnlimitedCapacity } from "@/lib/event-capacity";
import { resolveCoffeeJamPrice, type EventPriceTier } from "@/lib/event-pricing";
import { formatEventPriceDisplay, hasTextOnlyEventPrice } from "@/lib/event-payment";
import { buildEventTariffOptions } from "@/lib/event-tariffs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";
import { defaultHeroCarouselSlides, type HeroCarouselSlide } from "@/lib/hero-carousel-slides";
import { getSiteMediaItems } from "@/lib/site-media";
import { normalizeEventBookingMode, type EventBookingMode } from "@/lib/event-booking-mode";
import {
  normalizeEventCardAnimation,
  normalizeEventCardColor,
  type EventCardAnimation,
  type EventCardColor,
} from "@/lib/event-card-style";

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
  venueAddress?: string;
  venueMapUrl?: string;
  price: string;
  priceRub?: number;
  displayPrice?: string;
  label?: string;
  capacity?: number;
  booked?: number;
  seatsLeft?: number;
  hideCapacity?: boolean;
  bookingClosed?: boolean;
  bookingClosedMessage?: string;
  bookingLink?: string;
  bookingMode?: EventBookingMode;
  cardColor?: EventCardColor;
  cardAnimation?: EventCardAnimation;
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
  price_label?: string | null;
  venue_address?: string | null;
  venue_map_url?: string | null;
  capacity: number | null;
  booked_count: number | null;
  is_published: boolean | null;
  status?: string | null;
  booking_mode?: string | null;
  card_color?: string | null;
  card_animation?: string | null;
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

  const firstResult = await supabase
    .from("events")
    .select(
      "id, title, subtitle, description, category, city, host, starts_at, ends_at, price_rub, price_label, venue_address, venue_map_url, capacity, booked_count, is_published, status, booking_mode, card_color, card_animation",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true });

  let data = (firstResult.data ?? []) as EventRow[];
  let error = firstResult.error;

  if (error?.message && /card_color|card_animation/.test(error.message)) {
    const fallback = await supabase
      .from("events")
      .select(
        "id, title, subtitle, description, category, city, host, starts_at, ends_at, price_rub, price_label, venue_address, venue_map_url, capacity, booked_count, is_published, status, booking_mode",
      )
      .eq("is_published", true)
      .order("starts_at", { ascending: true });

    data = (fallback.data ?? []) as EventRow[];
    error = fallback.error;
  }

  if (error) {
    console.error("Supabase public events query failed", error);
    return [] as SitePosterEvent[];
  }

  const { data: priceTiers } = await supabase
    .from("event_price_tiers")
    .select("event_id, seat_from, seat_to, price_rub")
    .order("seat_from", { ascending: true });

  const eventIds = data.map((event) => event.id);
  const { data: enrollments } = eventIds.length > 0
    ? await supabase
        .from("enrollments")
        .select("event_id, note, status")
        .in("event_id", eventIds)
    : { data: [] as EnrollmentRow[] };

  const tiersByEventId = new Map<string, EventPriceTierRow[]>();

  for (const tier of ((priceTiers ?? []) as EventPriceTierRow[])) {
    const current = tiersByEventId.get(tier.event_id) ?? [];
    current.push(tier);
    tiersByEventId.set(tier.event_id, current);
  }

  const tariffUsageByEventId = new Map<string, Map<string, number>>();

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

  return mapEventRowsToPosterEvents(data, tiersByEventId, tariffUsageByEventId);
}

function mapEventRowsToPosterEvents(
  rows: EventRow[],
  tiersByEventId: Map<string, EventPriceTierRow[]>,
  tariffUsageByEventId: Map<string, Map<string, number>>,
) {
  return rows
    .filter((event) => {
      const isPast = event.starts_at && new Date(event.starts_at).getTime() < Date.now();
      const isCanceled = event.status === "Отменено";
      return !isPast && !isCanceled;
    })
    .map((event, index) => {
    const eventTiers = tiersByEventId.get(event.id) ?? [];
    const basePrice = getEventBasePrice(event);
    const currentPrice = eventTiers.length > 0
      ? resolveCoffeeJamPrice(basePrice, event.booked_count, eventTiers as EventPriceTier[])
      : basePrice;
    const minTierPrice = eventTiers.length > 0
      ? Math.min(...eventTiers.map((tier) => tier.price_rub))
      : null;
    const capacity = event.capacity ?? 10;
    const booked = Math.max(0, event.booked_count ?? 0);
    const seatsLeft = Math.max(capacity - booked, 0);
    const hideCapacity = isUnlimitedCapacity(capacity)
      || isCoffeeJamCategory(event.category, event.title);
    const bookingOptions = buildBookingOptions(
      event,
      eventTiers,
      tariffUsageByEventId.get(event.id),
    );
    const formattedRubPrice = formatPrice(currentPrice);
    const price = formatEventPriceDisplay(event.price_rub, event.price_label, formattedRubPrice);
    const displayPrice = !hasTextOnlyEventPrice(event.price_label)
      && minTierPrice !== null
      ? `от ${formatPrice(minTierPrice)}`
      : undefined;

    return {
      id: event.id,
      tone: getEventCategoryTone(event.category, event.title, index),
      date: formatSiteDate(event.starts_at),
      time: formatTimeRange(event),
      startsAt: event.starts_at,
      title: event.title,
      description: event.subtitle ?? undefined,
      focus: event.description ?? undefined,
      host: event.host ?? undefined,
      venueAddress: event.venue_address ?? undefined,
      venueMapUrl: event.venue_map_url ?? undefined,
      price,
      priceRub: hasTextOnlyEventPrice(event.price_label) && currentPrice <= 0 ? 0 : currentPrice,
      displayPrice,
      capacity,
      booked,
      seatsLeft,
      hideCapacity,
      bookingMode: normalizeEventBookingMode(event.booking_mode),
      cardColor: normalizeEventCardColor(event.card_color),
      cardAnimation: normalizeEventCardAnimation(event.card_animation),
      bookingOptions,
      status: event.status ?? undefined,
    };
  });
}

export async function getSiteEventById(id: string) {
  const events = await getSitePosterEvents();
  return events.find((event) => event.id === id) ?? null;
}

const fallbackGalleryPhotos = [
  { src: "/RRK-0001.jpg", alt: "Встреча РРК" },
  { src: "/RRK-0002.jpg", alt: "Встреча РРК" },
  { src: "/RRK-0003.jpg", alt: "Встреча РРК" },
  { src: "/RRK-0005.jpg", alt: "Встреча РРК" },
  { src: "/IMG_0030.JPG", alt: "Встреча РРК" },
  { src: "/IMG_0032.JPG", alt: "Встреча РРК" },
  { src: "/IMG_0034.JPG", alt: "Встреча РРК" },
  { src: "/IMG_0309.JPG", alt: "Встреча РРК" },
  { src: "/IMG_0310.JPG", alt: "Встреча РРК" },
];

export async function getSiteHeroSlides(): Promise<HeroCarouselSlide[]> {
  const items = await getSiteMediaItems("hero");
  if (items.length === 0) {
    return defaultHeroCarouselSlides;
  }

  return items.map((item) => ({
    id: item.id,
    type: item.mediaType,
    src: item.src,
    poster: item.poster,
    sortOrder: item.sortOrder,
  }));
}

export async function getSiteGalleryPhotos() {
  const items = await getSiteMediaItems("gallery");
  if (items.length === 0) {
    return fallbackGalleryPhotos;
  }

  return items
    .filter((item) => item.mediaType === "image")
    .map((item) => ({
      src: item.src,
      alt: "Встреча РРК",
    }));
}

export function getNearestSiteEvent(events: SitePosterEvent[]) {
  return events
    .filter((event) => event.id && event.status !== "Отменено")
    .sort((left, right) => {
      const leftTime = left.startsAt ? new Date(left.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.startsAt ? new Date(right.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })[0] ?? null;
}

export type { SitePosterEvent };

function buildBookingOptions(
  event: EventRow,
  tiers: EventPriceTierRow[],
  usageByTariff: Map<string, number> | undefined,
) {
  const options = buildEventTariffOptions(event, tiers, usageByTariff);
  if (!options) {
    return undefined;
  }

  return options.map((option) => ({
    label: option.label,
    price: formatPrice(option.priceRub),
    priceRub: option.priceRub,
    capacity: option.capacity,
    seatsLeft: option.seatsLeft,
  }));
}

function isFallingChairsEvent(event: Pick<EventRow, "title">) {
  const normalizedTitle = (event.title ?? "").toLowerCase();
  return normalizedTitle.includes("падающими стульями");
}

function getEventBasePrice(event: Pick<EventRow, "title" | "category" | "price_rub">) {
  if (isCoffeeJamCategory(event.category, event.title)) {
    return Math.max(event.price_rub ?? 0, 770);
  }

  if (isFallingChairsEvent(event)) {
    return 2200;
  }

  return event.price_rub ?? 0;
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
    return `с ${startTime}`;
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
