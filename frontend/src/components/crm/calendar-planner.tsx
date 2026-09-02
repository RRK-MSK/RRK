"use client";

import { useMemo, useState } from "react";

import { EventFormModal, buildEventFormInitialFromRow } from "@/components/crm/event-form-modal";
import { EVENT_CATEGORY_KVARTIRNIK } from "@/lib/event-categories";
import type { TableRow } from "@/lib/crm-data";

type CalendarEvent = {
  id: string;
  title: string;
  status: string;
  time: string;
  format: string;
  host: string;
  price: string;
  startsAt: string;
  endsAt: string;
  raw: TableRow;
};

type CalendarMonth = {
  key: string;
  year: number;
  month: number;
  label: string;
  shortLabel: string;
  offset: number;
  daysInMonth: number;
  groupedEvents: Map<number, CalendarEvent[]>;
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CrmCalendarPlanner({ rows }: { rows: TableRow[] }) {
  const events = useMemo(() => rows.map(normalizeCalendarEvent).filter(Boolean) as CalendarEvent[], [rows]);

  const months = useMemo(() => {
    const map = new Map<string, CalendarMonth>();

    for (const event of events) {
      const date = new Date(event.startsAt);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const monthParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Moscow",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);

      const year = Number(monthParts.find((part) => part.type === "year")?.value ?? "0");
      const month = Number(monthParts.find((part) => part.type === "month")?.value ?? "1");
      const day = Number(monthParts.find((part) => part.type === "day")?.value ?? "1");
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          year,
          month,
          label: getMonthLabel(year, month - 1),
          shortLabel: getShortMonthLabel(year, month - 1),
          offset: getMonthOffset(year, month - 1),
          daysInMonth: getDaysInMonth(year, month - 1),
          groupedEvents: new Map<number, CalendarEvent[]>(),
        });
      }

      const currentMonth = map.get(key);
      if (!currentMonth) {
        continue;
      }

      const currentEvents = currentMonth.groupedEvents.get(day) ?? [];
      currentEvents.push(event);
      currentMonth.groupedEvents.set(day, currentEvents.sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
    }

    return Array.from(map.values()).sort((left, right) => left.key.localeCompare(right.key));
  }, [events]);

  const defaultMonthKey = useMemo(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(now);
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const currentKey = `${year}-${month}`;

    return months.some((monthItem) => monthItem.key === currentKey)
      ? currentKey
      : (months[0]?.key ?? "");
  }, [months]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);
  const activeMonthKey = months.some((month) => month.key === selectedMonthKey) ? selectedMonthKey : defaultMonthKey;
  const selectedMonthIndex = Math.max(months.findIndex((month) => month.key === activeMonthKey), 0);
  const selectedMonth = months[selectedMonthIndex];

  const initialSelectedDay = useMemo(() => {
    if (!selectedMonth) {
      return 1;
    }

    const todayParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const todayYear = Number(todayParts.find((part) => part.type === "year")?.value ?? "0");
    const todayMonth = Number(todayParts.find((part) => part.type === "month")?.value ?? "0");
    const todayDay = Number(todayParts.find((part) => part.type === "day")?.value ?? "1");

    if (selectedMonth.year === todayYear && selectedMonth.month === todayMonth) {
      return todayDay;
    }

    const firstDayWithEvent = Array.from(selectedMonth.groupedEvents.keys()).sort((left, right) => left - right)[0];
    return firstDayWithEvent ?? 1;
  }, [selectedMonth]);

  const [selectedDay, setSelectedDay] = useState(initialSelectedDay);
  const activeSelectedDay = selectedMonth && selectedDay <= selectedMonth.daysInMonth ? selectedDay : initialSelectedDay;

  const selectedDayEvents = selectedMonth?.groupedEvents.get(activeSelectedDay) ?? [];
  const selectedDateLabel = selectedMonth ? `${activeSelectedDay} ${selectedMonth.shortLabel}` : "Выберите дату";
  const calendarCells = selectedMonth
    ? Array.from({ length: selectedMonth.offset + selectedMonth.daysInMonth }, (_, index) => {
        if (index < selectedMonth.offset) {
          return null;
        }

        return index - selectedMonth.offset + 1;
      })
    : [];

  return (
    <div className="crm-calendar-planner">
      <div className="crm-calendar-board">
        <div className="crm-calendar-board-head">
          <div className="crm-calendar-month-switcher">
            <button
              type="button"
              className="crm-calendar-month-arrow"
              disabled={selectedMonthIndex <= 0}
              onClick={() => setSelectedMonthKey(months[Math.max(selectedMonthIndex - 1, 0)]?.key ?? activeMonthKey)}
            >
              ←
            </button>
            <div>
              <strong>{selectedMonth?.label ?? "Календарь"}</strong>
              <p>Нажмите на день, чтобы увидеть занятия или сразу добавить новое.</p>
            </div>
            <button
              type="button"
              className="crm-calendar-month-arrow"
              disabled={selectedMonthIndex >= months.length - 1}
              onClick={() => setSelectedMonthKey(months[Math.min(selectedMonthIndex + 1, months.length - 1)]?.key ?? activeMonthKey)}
            >
              →
            </button>
          </div>
          <EventFormModal
            key={`create-${selectedMonth?.key ?? "empty"}-${activeSelectedDay}`}
            triggerLabel="Добавить в выбранный день"
            initialData={buildNewEventInitialData(selectedMonth, activeSelectedDay)}
          />
        </div>

        <div className="crm-calendar-weekdays">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="crm-calendar-grid">
          {calendarCells.map((day, index) =>
            day === null ? (
              <span key={`empty-${index}`} className="crm-calendar-empty" />
            ) : (
              <button
                key={day}
                type="button"
                className={[
                  "crm-calendar-day",
                  day === activeSelectedDay ? "is-selected" : "",
                  (selectedMonth?.groupedEvents.get(day)?.length ?? 0) > 0 ? "has-events" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDay(day)}
              >
                <span className="crm-calendar-day-number">{day}</span>
                <span className="crm-calendar-day-meta">
                  {(selectedMonth?.groupedEvents.get(day)?.length ?? 0) > 0
                    ? `${selectedMonth?.groupedEvents.get(day)?.length ?? 0} шт`
                    : "Свободно"}
                </span>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="crm-calendar-detail">
        <div className="crm-calendar-detail-head">
          <div>
            <span>Выбранная дата</span>
            <h3>{selectedDateLabel}</h3>
            <p>
              {selectedDayEvents.length > 0
                ? `На этот день уже запланировано ${selectedDayEvents.length} занятий.`
                : "На этот день пока ничего не запланировано."}
            </p>
          </div>
          <EventFormModal
            key={`detail-create-${selectedMonth?.key ?? "empty"}-${activeSelectedDay}`}
            triggerLabel="Добавить занятие"
            initialData={buildNewEventInitialData(selectedMonth, activeSelectedDay)}
          />
        </div>

        <div className="crm-calendar-event-list">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event) => (
              <div key={event.id} className="crm-calendar-event-card">
                <div className="crm-calendar-event-top">
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.time} · {event.price}</p>
                  </div>
                  <span className="status-badge tone-gray">{event.status}</span>
                </div>
                <div className="crm-calendar-event-meta">
                  <span>{event.format}</span>
                  <span>{event.host}</span>
                </div>
                <EventFormModal
                  key={`edit-${event.id}`}
                  triggerLabel="Редактировать"
                  triggerClassName="ghost-button"
                  initialData={{
                    ...buildEventFormInitialFromRow(event.raw as Record<string, unknown>),
                    pricingTiers: parsePricingTiers(event.raw.pricingTiersRaw),
                  }}
                />
              </div>
            ))
          ) : (
            <div className="crm-calendar-empty-state">
              <p>Нажмите «Добавить занятие» и заполните цену, время, вместимость и остальные параметры.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeCalendarEvent(row: TableRow) {
  const id = String(row.id ?? "");
  const startsAt = String(row.startsAtRaw ?? "");
  const status = String(row.status ?? "Открыто");

  if (!id || !startsAt || status === "Прошло") {
    return null;
  }

  return {
    id,
    title: String(row.title ?? ""),
    status,
    time: String(row.time ?? ""),
    format: String(row.format ?? "Практика"),
    host: String(row.host ?? "Команда РРК"),
    price: String(row.currentPrice ?? row.revenue ?? "0 Р"),
    startsAt,
    endsAt: String(row.endsAtRaw ?? ""),
    raw: row,
  } satisfies CalendarEvent;
}

function getMonthOffset(year: number, monthIndex: number) {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay();
  return (firstDay + 6) % 7;
}

function getMonthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

function getShortMonthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    timeZone: "Europe/Moscow",
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
}

function buildNewEventInitialData(month: CalendarMonth | undefined, day: number) {
  if (!month) {
    return undefined;
  }

  const monthValue = String(month.month).padStart(2, "0");
  const dayValue = String(day).padStart(2, "0");

  return {
    startsAt: `${month.year}-${monthValue}-${dayValue}T19:00`,
    endsAt: `${month.year}-${monthValue}-${dayValue}T22:00`,
    category: EVENT_CATEGORY_KVARTIRNIK,
    isPublished: true,
    status: "Открыто",
  };
}

function parsePricingTiers(value: unknown) {
  if (typeof value !== "string" || !value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as Array<{ seat_from: number; seat_to: number | null; price_rub: number }>;
    return parsed.map((tier) => ({
      seatFrom: tier.seat_from,
      seatTo: tier.seat_to,
      priceRub: tier.price_rub,
    }));
  } catch {
    return [];
  }
}
