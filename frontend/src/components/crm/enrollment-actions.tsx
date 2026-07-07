"use client";

import { useState } from "react";
import { updateEnrollmentStatus, transferParticipant, markEnrollmentPaid } from "@/app/crm/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EnrollmentActions({ 
  enrollmentId, 
  currentEventId, 
  availableEvents, 
  paymentStatus,
  onUpdate 
}: { 
  enrollmentId: string;
  currentEventId?: string;
  availableEvents: any[];
  paymentStatus?: string;
  onUpdate?: () => void;
}) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Отменить запись?")) return;
    setIsUpdating(true);
    try {
      await updateEnrollmentStatus(enrollmentId, "Отменена");
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm("Отметить как оплаченное?")) return;
    setIsUpdating(true);
    try {
      await markEnrollmentPaid(enrollmentId);
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTransfer = async (newEventId: string) => {
    if (!newEventId) return;
    setIsUpdating(true);
    try {
      await transferParticipant(enrollmentId, newEventId);
      setIsTransferring(false);
      if (onUpdate) onUpdate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {isTransferring ? (
        <div style={{ display: "flex", gap: "4px" }}>
          <select 
            onChange={e => handleTransfer(e.target.value)}
            defaultValue=""
            disabled={isUpdating}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit', fontSize: '12px', maxWidth: '150px' }}
          >
            <option value="" disabled>Выберите занятие</option>
            {availableEvents.filter(e => e.id !== currentEventId).map(e => (
              <option key={e.id} value={e.id}>
                {new Date(e.starts_at).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })} {new Date(e.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })} | {e.title}
              </option>
            ))}
          </select>
          <button className="ghost-button" disabled={isUpdating} onClick={() => setIsTransferring(false)}>✕</button>
        </div>
      ) : (
        <>
          <button className="ghost-button link-button" disabled={isUpdating} onClick={handleMarkPaid}>
            {paymentStatus?.toLowerCase().includes('paid') || paymentStatus?.toLowerCase().includes('оплач') ? 'Оплачено' : 'Отметить оплату'}
          </button>
          <button className="ghost-button link-button" disabled={isUpdating} onClick={() => setIsTransferring(true)}>Перенести</button>
          <button className="ghost-button link-button" disabled={isUpdating} style={{ color: "var(--muted)" }} onClick={handleCancel}>Отменить</button>
        </>
      )}
    </div>
  );
}