"use client";

import { useMemo, useState, useEffect } from "react";

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
  price: string;
  displayPrice?: string;
  label?: string;
  capacity?: number;
  booked?: number;
  seatsLeft?: number;
  hideCapacity?: boolean;
  bookingClosed?: boolean;
  bookingClosedMessage?: string;
  bookingLink?: string;
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

type DayKind = "standard" | "collab" | "big";
type CalendarMonth = {
  key: string;
  monthIndex: number;
  year: number;
  label: string;
  shortLabel: string;
  offset: number;
  daysInMonth: number;
  groupedEvents: Map<number, PosterEvent[]>;
  activeDays: number[];
  filteredEventsCount: number;
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
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

const splitDateLabel = (date: string) => {
  const match = date.match(/^(.*?)(\s*\(.*\))$/);

  if (!match) {
    return { main: date, meta: "" };
  }

  return { main: match[1].trim(), meta: match[2].trim() };
};

const getDayKind = (dayEvents: PosterEvent[]): DayKind => {
  if (dayEvents.some((event) => {
    const title = event.title.toLowerCase();
    return event.label?.includes("ДК x РРК") || title.includes("coffee jam") || title.includes("кофе джем");
  })) {
    return "collab";
  }

  if (dayEvents.some((event) => {
    const title = event.title.toLowerCase();
    return title.includes("биг-тренировка") || title.includes("большая тренировка");
  })) {
    return "big";
  }

  return "standard";
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

const getDaySeatsLeft = (dayEvents: PosterEvent[]) =>
  dayEvents.reduce((sum, event) => sum + getEventSeatsLeft(event), 0);

function getMonthInfo(event: PosterEvent) {
  if (event.startsAt) {
    const date = new Date(event.startsAt);
    const parts = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: "Europe/Moscow",
    }).formatToParts(date);

    const day = Number(parts.find((part) => part.type === "day")?.value ?? "1");
    const month = Number(parts.find((part) => part.type === "month")?.value ?? "1") - 1;
    const year = Number(parts.find((part) => part.type === "year")?.value ?? String(new Date().getFullYear()));

    return { day, monthIndex: month, year };
  }

  const day = getDayNumber(event.date);
  const normalizedDate = event.date.toLowerCase();
  const monthIndex = monthNames.findIndex((month) => normalizedDate.includes(month));

  return {
    day: Number.isNaN(day) ? 1 : day,
    monthIndex: monthIndex >= 0 ? monthIndex : 0,
    year: 2026,
  };
}

function getMonthOffset(year: number, monthIndex: number) {
  const day = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return (day + 6) % 7;
}

function getMonthLabel(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex, 1));

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(date);
}

export function PosterCalendar({ events }: PosterCalendarProps) {
  const [bookedEventIds, setBookedEventIds] = useState<string[]>([]);
  const [selectedKind, setSelectedKind] = useState<DayKind | null>(null);

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

  const filteredEvents = useMemo(() => {
    if (!selectedKind) return events;
    return events.filter(e => getDayKind([e]) === selectedKind);
  }, [events, selectedKind]);

  const months = useMemo(() => {
    const map = new Map<string, CalendarMonth>();

    for (const event of filteredEvents) {
      const { day, monthIndex, year } = getMonthInfo(event);
      const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
      const existing = map.get(key);

      if (existing) {
        const current = existing.groupedEvents.get(day) ?? [];
        current.push(event);
        existing.groupedEvents.set(day, current);
        existing.activeDays = Array.from(existing.groupedEvents.keys()).sort((left, right) => left - right);
        existing.filteredEventsCount += 1;
        continue;
      }

      const groupedEvents = new Map<number, PosterEvent[]>();
      groupedEvents.set(day, [event]);

      map.set(key, {
        key,
        monthIndex,
        year,
        label: getMonthLabel(year, monthIndex),
        shortLabel: monthNames[monthIndex] ?? "",
        offset: getMonthOffset(year, monthIndex),
        daysInMonth: new Date(year, monthIndex + 1, 0).getDate(),
        groupedEvents,
        activeDays: [day],
        filteredEventsCount: 1,
      });
    }

    return Array.from(map.values()).sort((left, right) => {
      if (left.year !== right.year) return left.year - right.year;
      return left.monthIndex - right.monthIndex;
    });
  }, [filteredEvents]);

  const defaultMonthKey = useMemo(() => months[months.length - 1]?.key ?? "", [months]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(defaultMonthKey);
  const effectiveSelectedMonthKey = months.some((month) => month.key === selectedMonthKey)
    ? selectedMonthKey
    : defaultMonthKey;

  const selectedMonthIndex = useMemo(
    () => Math.max(months.findIndex((month) => month.key === effectiveSelectedMonthKey), 0),
    [months, effectiveSelectedMonthKey],
  );

  const selectedMonth = months[selectedMonthIndex];
  const groupedEvents = selectedMonth?.groupedEvents ?? new Map<number, PosterEvent[]>();
  const activeDays = selectedMonth?.activeDays ?? [];

  const [selectedDay, setSelectedDay] = useState(activeDays[0] ?? 1);
  const effectiveSelectedDay = activeDays.includes(selectedDay) ? selectedDay : (activeDays[0] ?? 1);

  const selectedEvents = groupedEvents.get(effectiveSelectedDay) ?? [];
  const selectedDate = selectedEvents[0]?.date ?? `${effectiveSelectedDay} ${selectedMonth?.shortLabel ?? "июля"}`;
  const selectedDateParts = splitDateLabel(selectedDate);
  const selectedDateLabel = selectedDateParts.meta
    ? `${selectedDateParts.main} ${selectedDateParts.meta}`
    : selectedDateParts.main;

  const calendarCells = useMemo(
    () =>
      Array.from({ length: (selectedMonth?.offset ?? 0) + (selectedMonth?.daysInMonth ?? 31) }, (_, index) => {
        if (index < (selectedMonth?.offset ?? 0)) {
          return null;
        }

        return index - (selectedMonth?.offset ?? 0) + 1;
      }),
    [selectedMonth],
  );

  return (
    <div className="poster-calendar">
      <div className="poster-calendar-board">
        <div className="poster-calendar-head">
          <div>
            <div className="poster-calendar-month-switcher">
              <button
                type="button"
                className="poster-calendar-month-arrow"
                onClick={() => setSelectedMonthKey(months[Math.max(selectedMonthIndex - 1, 0)]?.key ?? selectedMonthKey)}
                disabled={selectedMonthIndex <= 0}
                aria-label="Предыдущий месяц"
              >
                ←
              </button>
              <span>{selectedMonth?.label ?? "Афиша"}</span>
              <button
                type="button"
                className="poster-calendar-month-arrow"
                onClick={() => setSelectedMonthKey(months[Math.min(selectedMonthIndex + 1, Math.max(months.length - 1, 0))]?.key ?? selectedMonthKey)}
                disabled={selectedMonthIndex >= months.length - 1}
                aria-label="Следующий месяц"
              >
                →
              </button>
            </div>
            <div className="poster-calendar-legend" aria-label="Типы событий">
              <span 
                className={`poster-calendar-legend-item kind-standard ${selectedKind === 'standard' ? 'is-active' : ''}`}
                style={{ cursor: 'pointer', opacity: selectedKind && selectedKind !== 'standard' ? 0.5 : 1 }}
                onClick={() => setSelectedKind(selectedKind === 'standard' ? null : 'standard')}
              >Стандарт</span>
              <span 
                className={`poster-calendar-legend-item kind-collab ${selectedKind === 'collab' ? 'is-active' : ''}`}
                style={{ cursor: 'pointer', opacity: selectedKind && selectedKind !== 'collab' ? 0.5 : 1 }}
                onClick={() => setSelectedKind(selectedKind === 'collab' ? null : 'collab')}
              >Коллаборация</span>
              <span 
                className={`poster-calendar-legend-item kind-big ${selectedKind === 'big' ? 'is-active' : ''}`}
                style={{ cursor: 'pointer', opacity: selectedKind && selectedKind !== 'big' ? 0.5 : 1 }}
                onClick={() => setSelectedKind(selectedKind === 'big' ? null : 'big')}
              >Биг-тренировка</span>
            </div>
          </div>
          <div className="poster-calendar-note">
            <strong>{selectedMonth?.filteredEventsCount ?? 0} событий в {selectedMonth?.shortLabel ?? "месяце"}</strong>
            <p>Количество мест указано в карточке каждого события.</p>
          </div>
        </div>

        <div className="poster-calendar-weekdays" aria-hidden="true">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="poster-calendar-grid">
          {calendarCells.map((day, index) =>
            day === null ? (
              <span key={`empty-${index}`} className="poster-calendar-empty" />
            ) : (() => {
              const dayEvents = groupedEvents.get(day) ?? [];
              const dayKind = dayEvents.length > 0 ? getDayKind(dayEvents) : "";
              const daySeatsLeft = getDaySeatsLeft(dayEvents);

              return (
                <button
                  key={day}
                  type="button"
                  className={[
                    "poster-calendar-day",
                    dayEvents.length > 0 ? "has-event" : "",
                    dayKind ? `kind-${dayKind}` : "",
                    day === effectiveSelectedDay ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={day === effectiveSelectedDay}
                >
                  <span className="poster-calendar-day-number">{day}</span>
                  {dayEvents.length > 0 && !dayEvents.some(e => e.hideCapacity || (e.capacity ?? 10) >= 10000) && daySeatsLeft > 0 ? (
                    <span className="poster-calendar-day-count">{daySeatsLeft}</span>
                  ) : null}
                </button>
              );
            })(),
          )}
        </div>
      </div>

      <div className="poster-calendar-detail">
        <div className="poster-calendar-detail-head">
          <span className="poster-calendar-detail-date-label">{selectedDateLabel}</span>
        </div>

        <div className="poster-calendar-events">
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <article
                key={`${event.date}-${event.time}-${event.title}`}
                className={`poster-event-card poster-event-${event.tone}`}
              >
                {event.id && bookedEventIds.includes(event.id) ? (
                  <div style={{ background: 'var(--brand)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Вы записаны
                  </div>
                ) : null}
                <div className="poster-event-top">
                  <span>{event.time}</span>
                  <span className={event.bookingClosed ? "poster-event-price-note" : undefined}>{event.displayPrice ?? event.price}</span>
                </div>
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
                      <strong style={{ color: 'var(--brand)' }}>Мест нет</strong>
                    ) : (
                      <strong>{getEventSeatsLeft(event)} мест</strong>
                    )}
                  </div>
                )}
                {event.label ? <p className="poster-event-label">{event.label}</p> : null}
                <h4>{event.title}</h4>
                {event.description ? <p className="poster-event-description">{event.description}</p> : null}
                {event.focus ? <p className="poster-event-focus">({event.focus})</p> : null}
                {event.host ? <p className="poster-event-host">{event.host}</p> : null}
                {event.bookingOptions?.length ? (
                  <div className="poster-event-tariffs">
                    {event.bookingOptions.map((option) => (
                      <div key={`${event.id}-${option.label}`} className="poster-event-tariff">
                        <strong>{option.label}</strong>
                        <span>{option.price} · {option.seatsLeft} из {option.capacity} мест</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="poster-event-empty">
              <p>Выбери дату с цветной меткой, чтобы открыть событие.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
