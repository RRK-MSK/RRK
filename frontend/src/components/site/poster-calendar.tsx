"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getEventCtaLabel, type EventBookingMode } from "@/lib/event-booking-mode";

export type PosterEvent = {
  id?: string;
  tone: string;
  date: string;
  time: string;
  startsAt?: string;
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
  bookingOptions?: {
    label: string;
    price: string;
    priceRub: number;
    capacity: number;
    seatsLeft: number;
  }[];
};

type PosterCalendarProps = {
  events: PosterEvent[];
};

const monthNames = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const getDayNumber = (date: string) => {
  const match = date.match(/\d+/);
  return match ? Number(match[0]) : NaN;
};

const getEventCapacity = (event: PosterEvent) => event.capacity ?? 10;

const getEventBooked = (event: PosterEvent) => {
  if (typeof event.booked === "number") {
    return Math.max(0, event.booked);
  }

  if (typeof event.seatsLeft === "number") {
    return Math.max(getEventCapacity(event) - event.seatsLeft, 0);
  }

  return 0;
};

const getEventSeatsLeft = (event: PosterEvent) =>
  typeof event.seatsLeft === "number"
    ? Math.max(0, event.seatsLeft)
    : Math.max(getEventCapacity(event) - getEventBooked(event), 0);

function getEventSortValue(event: PosterEvent) {
  if (event.startsAt) {
    const timestamp = new Date(event.startsAt).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const day = getDayNumber(event.date);
  const monthIndex = monthNames.findIndex((month) => event.date.toLowerCase().includes(month));

  return Date.UTC(2026, monthIndex >= 0 ? monthIndex : 0, Number.isNaN(day) ? 1 : day);
}

export function PosterCalendar({ events }: PosterCalendarProps) {
  const router = useRouter();
  const [bookedEventIds, setBookedEventIds] = useState<string[]>([]);

  useEffect(() => {
    const updateBookedEvents = () => {
      try {
        const stored = localStorage.getItem("rrk_booked_events");
        if (stored) {
          setBookedEventIds(JSON.parse(stored));
        }
      } catch {}
    };

    updateBookedEvents();
    window.addEventListener("rrk_booking_updated", updateBookedEvents);
    return () => window.removeEventListener("rrk_booking_updated", updateBookedEvents);
  }, []);

  const sortedEvents = useMemo(
    () => [...events].sort((left, right) => getEventSortValue(left) - getEventSortValue(right)),
    [events],
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="poster-event-empty">
        <p>Скоро здесь появятся ближайшие события клуба.</p>
      </div>
    );
  }

  return (
    <div className="poster-events-grid">
      {sortedEvents.map((event) => (
        <article
          key={`${event.id ?? event.title}-${event.date}-${event.time}`}
          className={`poster-event-card poster-event-${event.tone}${event.id ? " is-clickable" : ""}`}
          onClick={event.id ? () => router.push(`/events/${event.id}`) : undefined}
          onKeyDown={
            event.id
              ? (keyboardEvent) => {
                  if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                    keyboardEvent.preventDefault();
                    router.push(`/events/${event.id}`);
                  }
                }
              : undefined
          }
          role={event.id ? "link" : undefined}
          tabIndex={event.id ? 0 : undefined}
        >
          {event.id && bookedEventIds.includes(event.id) ? (
            <div className="poster-event-booked">Вы записаны</div>
          ) : null}
          <div className="poster-event-head">
            <h4>{event.title}</h4>
          </div>
          {event.description ? <p className="poster-event-description">{event.description}</p> : null}
          {event.focus ? <p className="poster-event-focus">{event.focus}</p> : null}
          {event.bookingClosedMessage ? (
            <div className="poster-event-spots">
              <strong>{event.bookingClosedMessage}</strong>
              {event.bookingLink ? (
                <a
                  href={event.bookingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="poster-event-admin-link"
                >
                  Написать администратору
                </a>
              ) : null}
            </div>
          ) : null}
          {event.hideCapacity || getEventCapacity(event) >= 10000 ? null : (
            <div className="poster-event-spots">
              {getEventSeatsLeft(event) <= 0 ? (
                <strong style={{ color: "var(--brand)" }}>Мест нет</strong>
              ) : (
                <strong>{getEventSeatsLeft(event)} мест</strong>
              )}
            </div>
          )}
          {event.venueAddress ? (
            <p className="poster-event-address">
              {event.venueMapUrl ? (
                <a href={event.venueMapUrl} target="_blank" rel="noreferrer">
                  {event.venueAddress}
                </a>
              ) : (
                event.venueAddress
              )}
            </p>
          ) : null}
          {event.host ? <p className="poster-event-host">{event.host}</p> : null}
          {event.bookingOptions?.length ? (
            <div className="poster-event-tariffs">
              {event.bookingOptions.map((option) => (
                <div key={`${event.id}-${option.label}`} className="poster-event-tariff">
                  <strong>{option.label}</strong>
                  <span>
                    {option.price} · {option.seatsLeft} из {option.capacity} мест
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="poster-event-meta">
            <p className="poster-event-datetime">
              <strong>{event.date}</strong>
              <span>{event.time}</span>
            </p>
            <p className={`poster-event-price${event.bookingClosed ? " poster-event-price-note" : ""}`}>
              {event.displayPrice ?? event.price}
            </p>
          </div>
          {event.id && !event.bookingClosed ? (
            <Link
              href={`/events/${event.id}`}
              className="site-button primary poster-event-register"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
              {getEventCtaLabel(event.bookingMode)}
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}
