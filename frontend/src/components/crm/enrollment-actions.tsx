"use client";

import { useState } from "react";
import { updateEnrollment } from "@/app/crm/actions";

export function EnrollmentActions({ enrollmentId, currentEventId, availableEvents }: { enrollmentId: string, currentEventId?: string, availableEvents: any[] }) {
  const [isTransferring, setIsTransferring] = useState(false);

  const handleCancel = async () => {
    if (confirm("Точно отменить запись?")) {
      await updateEnrollment(enrollmentId, { status: "Отменена" });
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
            style={{ padding: '4px', borderRadius: '4px', background: 'var(--surface-sunken)', color: 'inherit', border: '1px solid var(--border)' }}
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
          <button className="ghost-button link-button" onClick={() => setIsTransferring(true)}>Перенести</button>
          <button className="ghost-button link-button" style={{ color: "var(--muted)" }} onClick={handleCancel}>Отменить</button>
        </>
      )}
    </div>
  );
}