"use client";

import { useState } from "react";
import { cancelEnrollment, transferParticipant, markEnrollmentPaid } from "@/app/crm/actions";
import { EnrollmentTariffControl } from "@/components/crm/enrollment-tariff-control";
import type { EventTariffOption } from "@/lib/event-tariffs";

type TransferEventOption = {
  id: string;
  title: string;
  starts_at: string;
  status: string | null;
};

export function EnrollmentActions({ 
  enrollmentId, 
  currentEventId, 
  availableEvents, 
  paymentStatus,
  tariffOptions = [],
  currentTariffNote,
  enrollmentStatus,
  compactTariff = false,
  onUpdate 
}: { 
  enrollmentId: string;
  currentEventId?: string;
  availableEvents: TransferEventOption[];
  paymentStatus?: string;
  tariffOptions?: EventTariffOption[];
  currentTariffNote?: string | null;
  enrollmentStatus?: string | null;
  compactTariff?: boolean;
  onUpdate?: () => void;
}) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isCancelled = (enrollmentStatus ?? "").toLowerCase().includes("отмен");

  const runAction = async (action: () => Promise<void>) => {
    setIsUpdating(true);
    try {
      await action();
      if (onUpdate) onUpdate();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось выполнить действие";
        alert(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelWithCredit = async () => {
    if (!confirm("Отменить запись и сохранить оплату для будущей даты?")) return;
    await runAction(async () => {
      await cancelEnrollment(enrollmentId, "credit");
    });
  };

  const handleRefund = async () => {
    if (!confirm("Отменить запись и оформить полный возврат?")) return;
    await runAction(async () => {
      await cancelEnrollment(enrollmentId, "refund");
    });
  };

  const handleMarkPaid = async () => {
    if (!confirm("Отметить как оплаченное?")) return;
    await runAction(async () => {
      await markEnrollmentPaid(enrollmentId);
    });
  };

  const handleTransfer = async (newEventId: string) => {
    if (!newEventId) return;
    await runAction(async () => {
      await transferParticipant(enrollmentId, newEventId);
      setIsTransferring(false);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <EnrollmentTariffControl
        enrollmentId={enrollmentId}
        options={tariffOptions}
        currentNote={currentTariffNote}
        paymentStatus={paymentStatus}
        disabled={isCancelled || isUpdating}
        compact={compactTariff}
        onUpdate={onUpdate}
      />

      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
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
            <button className="ghost-button link-button" disabled={isUpdating} style={{ color: "var(--muted)" }} onClick={handleCancelWithCredit}>В депозит</button>
            <button className="ghost-button link-button" disabled={isUpdating} style={{ color: "var(--brand)" }} onClick={handleRefund}>Возврат</button>
          </>
        )}
      </div>
    </div>
  );
}
