"use client";

import { useMemo, useState } from "react";

export type PosterEvent = {
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

type PosterCalendarProps = {
  events: PosterEvent[];
};

type DayKind = "standard" | "collab" | "spb" | "big";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const julyOffset = 2;
const julyDays = 31;

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
  if (dayEvents.some((event) => event.title.includes("ПИТЕРЕ"))) {
    return "spb";
  }

  if (dayEvents.some((event) => event.label?.includes("ДК x РРК") || event.title.includes("COFFEE JAM"))) {
    return "collab";
  }

  if (dayEvents.some((event) => event.title === "БИГ-ТРЕНИРОВКА")) {
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

export function PosterCalendar({ events }: PosterCalendarProps) {
  const groupedEvents = useMemo(() => {
    const map = new Map<number, PosterEvent[]>();

    for (const event of events) {
      const day = getDayNumber(event.date);
      if (Number.isNaN(day)) continue;
      
      const current = map.get(day) ?? [];
      current.push(event);
      map.set(day, current);
    }

    return map;
  }, [events]);

  const activeDays = useMemo(
    () => Array.from(groupedEvents.keys()).sort((left, right) => left - right),
    [groupedEvents],
  );

  const [selectedDay, setSelectedDay] = useState(activeDays[0] ?? 1);

  const selectedEvents = groupedEvents.get(selectedDay) ?? [];
  const selectedDate = selectedEvents[0]?.date ?? `${selectedDay} июля`;
  const selectedDateParts = splitDateLabel(selectedDate);
  const selectedDateLabel = selectedDateParts.meta
    ? `${selectedDateParts.main} ${selectedDateParts.meta}`
    : selectedDateParts.main;

  const calendarCells = useMemo(
    () =>
      Array.from({ length: julyOffset + julyDays }, (_, index) => {
        if (index < julyOffset) {
          return null;
        }

        return index - julyOffset + 1;
      }),
    [],
  );

  return (
    <div className="poster-calendar">
      <div className="poster-calendar-board">
        <div className="poster-calendar-head">
          <div>
            <span>Июль 2026</span>
            <div className="poster-calendar-legend" aria-label="Типы событий">
              <span className="poster-calendar-legend-item kind-standard">Стандарт</span>
              <span className="poster-calendar-legend-item kind-collab">Коллаборация</span>
              <span className="poster-calendar-legend-item kind-spb">Питер</span>
              <span className="poster-calendar-legend-item kind-big">Биг-тренировка</span>
            </div>
          </div>
          <div className="poster-calendar-note">
            <strong>{events.length} событий в июле</strong>
            <p>На каждую тренировку 10 мест.</p>
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
                    day === selectedDay ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={day === selectedDay}
                >
                  <span className="poster-calendar-day-number">{day}</span>
                  {dayEvents.length > 0 && !dayEvents.some(e => e.hideCapacity || (e.capacity ?? 10) >= 10000) ? (
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
                <div className="poster-event-top">
                  <span>{event.time}</span>
                  <span>{event.price}</span>
                </div>
                {event.hideCapacity || getEventCapacity(event) >= 10000 ? null : (
                  <div className="poster-event-spots">
                    <strong>Осталось {getEventSeatsLeft(event)} мест</strong>
                    <span>
                      {getEventBooked(event)} из {getEventCapacity(event)} уже записались
                    </span>
                  </div>
                )}
                {event.label ? <p className="poster-event-label">{event.label}</p> : null}
                <h4>{event.title}</h4>
                {event.description ? <p className="poster-event-description">{event.description}</p> : null}
                {event.focus ? <p className="poster-event-focus">({event.focus})</p> : null}
                {event.host ? <p className="poster-event-host">{event.host}</p> : null}
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
