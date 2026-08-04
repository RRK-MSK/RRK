"use client";

import { useEffect } from "react";

export function SuccessClient({ eventId, orderId }: { eventId: string; orderId?: string }) {
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
    })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.confirmed) {
          return;
        }

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
      })
      .catch((error) => {
        console.error("Failed to reconcile payment after success redirect", error);
      });
  }, [eventId, orderId]);

  return null;
}
