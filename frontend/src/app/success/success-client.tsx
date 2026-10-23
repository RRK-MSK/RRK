"use client";

import { useEffect, useState } from "react";

export function SuccessClient({ eventId, orderId }: { eventId?: string; orderId?: string }) {
  const [isNoticeOpen, setIsNoticeOpen] = useState(true);

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
          if (eventId && !bookedEvents.includes(eventId)) {
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

  if (!isNoticeOpen) {
    return null;
  }

  return (
    <div className="booking-modal-overlay" role="presentation">
      <div className="booking-modal payment-notice" role="dialog" aria-modal="true" aria-labelledby="payment-notice-title">
        <p id="payment-notice-title">Информацию о записи отправили тебе на почту!</p>
        <p>Если письма нет, проверь папку «Спам»</p>
        <button type="button" className="site-button primary full" onClick={() => setIsNoticeOpen(false)}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
