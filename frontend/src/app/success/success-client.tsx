"use client";

import { useEffect } from "react";

export function SuccessClient({ eventId, orderId }: { eventId: string; orderId?: string }) {
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

  useEffect(() => {
    if (!orderId) {
      return;
    }

    void fetch("/api/payment/reconcile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    }).catch((error) => {
      console.error("Failed to reconcile payment after success redirect", error);
    });
  }, [orderId]);

  return null;
}
