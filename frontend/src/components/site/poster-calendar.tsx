"use client";

import { useMemo, useState } from "react";

type PosterEvent = {
  tone: string;
  date: string;
  time: string;
  title: string;
  description?: string;
  focus?: string;
  host?: string;
  price: string;
  label?: string;
};

type PosterCalendarProps = {
  events: PosterEvent[];
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const julyOffset = 2;
const julyDays = 31;

const getDayNumber = (date: string) => {
  const [day] = date.split(" ");
  return Number(day);
};

export function PosterCalendar({ events }: PosterCalendarProps) {
  const groupedEvents = useMemo(() => {
    const map = new Map<number, PosterEvent[]>();

    for (const event of events) {
      const day = getDayNumber(event.date);
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
            <h3>Календарь афиши РРК</h3>
            <p>Нажми на дату, чтобы увидеть все встречи, тренировки и коллаборации дня.</p>
          </div>
          <div className="poster-calendar-note">
            <strong>{events.length} событий в июле</strong>
            <p>На каждую тренировку 10 мест, запись через `@rrclubadmin`.</p>
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
            ) : (
              <button
                key={day}
                type="button"
                className={[
                  "poster-calendar-day",
                  groupedEvents.has(day) ? "has-event" : "",
                  day === selectedDay ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDay(day)}
                aria-pressed={day === selectedDay}
              >
                <span className="poster-calendar-day-number">{day}</span>
                {groupedEvents.has(day) ? (
                  <span className="poster-calendar-day-count">{groupedEvents.get(day)?.length}</span>
                ) : null}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="poster-calendar-detail">
        <div className="poster-calendar-detail-head">
          <span>Выбранная дата</span>
          <h3>{selectedDate}</h3>
          <p>
            {selectedEvents.length > 0
              ? `${selectedEvents.length} события на этот день`
              : "На эту дату пока нет открытых событий"}
          </p>
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
                {event.label ? <p className="poster-event-label">{event.label}</p> : null}
                <h4>{event.title}</h4>
                {event.description ? <p className="poster-event-description">{event.description}</p> : null}
                {event.focus ? <p className="poster-event-focus">({event.focus})</p> : null}
                {event.host ? <p className="poster-event-host">{event.host}</p> : null}
              </article>
            ))
          ) : (
            <div className="poster-event-empty">
              <p>Выбери дату с бордовой точкой, чтобы открыть событие.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
