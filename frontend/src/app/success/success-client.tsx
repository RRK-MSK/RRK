"use client";

import { useEffect } from "react";

export function SuccessClient({ eventId }: { eventId: string }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("rrk_booked_events");
      const bookedEvents = stored ? JSON.parse(stored) : [];
      if (!bookedEvents.includes(eventId)) {
        bookedEvents.push(eventId);
        localStorage.setItem("rrk_booked_events", JSON.stringify(bookedEvents));
      }
    } catch (e) {
      console.error("Failed to save booking to local storage", e);
    }
  }, [eventId]);

  return null;
}
