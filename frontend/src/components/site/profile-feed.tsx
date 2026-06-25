"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ProfileFeed() {
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        let telegramId = null;
        let telegramUsername = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const user = (window as any).Telegram.WebApp.initDataUnsafe.user;
          telegramId = user.id;
          telegramUsername = user.username;
        }

        // If not in telegram, try to get stored bookings
        const stored = localStorage.getItem("rrk_booked_events");
        const localBookings = stored ? JSON.parse(stored) : [];

        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId, telegramUsername, localBookings })
        });

        if (!res.ok) throw new Error("Failed to fetch profile");
        
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Не удалось загрузить данные профиля.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Загрузка...</div>;
  }

  if (error) {
    return <div style={{ textAlign: "center", padding: "40px", color: "var(--brand)" }}>{error}</div>;
  }

  if (!data || data.enrollments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", background: "rgba(255,255,255,0.5)", borderRadius: "16px", border: "1px solid var(--line)" }}>
        <p style={{ color: "var(--muted)", marginBottom: "16px" }}>У вас пока нет записей на тренировки.</p>
        <Link href="/" className="site-button primary">Выбрать тренировку</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {data.enrollments.map((enrollment: any) => (
        <article key={enrollment.id} style={{ padding: "20px", background: "var(--surface-strong)", borderRadius: "16px", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {new Date(enrollment.event.starts_at).toLocaleDateString('ru-RU')}
            </span>
            <span className={`status-badge ${enrollment.payment_status?.toLowerCase().includes('paid') || enrollment.payment_status?.toLowerCase().includes('оплач') ? 'tone-green' : 'tone-sand'}`} style={{ fontSize: "11px", minHeight: "24px" }}>
              {enrollment.payment_status}
            </span>
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: "18px" }}>{enrollment.event.title}</h3>
          <p style={{ margin: "0", color: "var(--muted)", fontSize: "14px" }}>
            {new Date(enrollment.event.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </article>
      ))}
    </div>
  );
}