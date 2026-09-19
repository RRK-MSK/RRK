"use client";

import Link from "next/link";

import type { PosterEvent } from "./poster-calendar";

type BookingModalProps = {
  events: PosterEvent[];
  isOpen: boolean;
  onClose: () => void;
};

export function BookingModal({ events, isOpen, onClose }: BookingModalProps) {
  if (!isOpen) {
    return null;
  }

  const availableEvents = events.filter((event) => event.id && !event.bookingClosed);

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <button type="button" className="booking-modal-close" onClick={onClose}>&times;</button>
        <h2>Выберите событие</h2>
        <p>Запись теперь открывается на отдельной странице события.</p>
        <div className="booking-modal-links">
          {availableEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="site-button"
              onClick={onClose}
            >
              {event.date} · {event.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
