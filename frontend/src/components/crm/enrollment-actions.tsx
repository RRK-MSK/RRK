"use client";

import { useState } from "react";
import { updateEnrollment } from "@/app/crm/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EnrollmentActions({ enrollmentId, currentEventId, availableEvents, paymentStatus }: { enrollmentId: string, currentEventId?: string, availableEvents: any[], paymentStatus?: string }) {
  const [isTransferring, setIsTransferring] = useState(false);

  const handleCancel = async () => {
    if (confirm("Точно отменить запись?")) {
      await updateEnrollment(enrollmentId, { status: "Отменена" });
    }
  };

  const handleTogglePayment = async () => {
    const isPaid = paymentStatus?.toLowerCase().includes('paid') || paymentStatus?.toLowerCase().includes('оплач');
    const newStatus = isPaid ? "Ожидает" : "Оплачен";
    if (confirm(`Изменить статус оплаты на "${newStatus}"?`)) {
      await updateEnrollment(enrollmentId, { payment_status: newStatus });
    }
  };

  const handleTransfer = async (newEventId: string) => {
    if (!newEventId) return;
    await updateEnrollment(enrollmentId, { event_id: newEventId });
    setIsTransferring(false);
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {isTransferring ? (
        <div style={{ display: "flex", gap: "4px" }}>
          <select 
            onChange={e => handleTransfer(e.target.value)}
            defaultValue=""
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit', fontSize: '12px', maxWidth: '150px' }}
          >
            <option value="" disabled>Выберите занятие</option>
            {availableEvents.filter(e => e.id !== currentEventId).map(e => (
              <option key={e.id} value={e.id}>
                {new Date(e.starts_at).toLocaleDateString('ru-RU')} | {e.title}
              </option>
            ))}
          </select>
          <button className="ghost-button" onClick={() => setIsTransferring(false)}>✕</button>
        </div>
      ) : (
        <>
          <button className="ghost-button link-button" onClick={handleTogglePayment}>
            {paymentStatus?.toLowerCase().includes('paid') || paymentStatus?.toLowerCase().includes('оплач') ? 'Отменить оплату' : 'Отметить оплату'}
          </button>
          <button className="ghost-button link-button" onClick={() => setIsTransferring(true)}>Перенести</button>
          <button className="ghost-button link-button" style={{ color: "var(--muted)" }} onClick={handleCancel}>Отменить</button>
        </>
      )}
    </div>
  );
}