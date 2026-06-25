"use client";

import { useState } from "react";
import { addParticipantEnrollment } from "@/app/crm/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AddParticipantRecordModal({ participantId, events }: { participantId: string, events: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("participantId", participantId);
      await addParticipantEnrollment(formData);
      setIsOpen(false);
    } catch (err) {
      alert("Ошибка при добавлении записи");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Записать на занятие
      </button>
      
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-strong)', color: 'var(--text)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'
          }}>
            <h2 style={{ marginBottom: '16px' }}>Записать на занятие</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Событие *</label>
                <select name="eventId" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }}>
                  <option value="" style={{ color: 'black' }}>Выберите занятие...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id} style={{ color: 'black' }}>
                      {ev.title} ({new Date(ev.starts_at).toLocaleDateString('ru-RU')})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="isPaid" id="isPaid" defaultChecked />
                <label htmlFor="isPaid" style={{ fontSize: '14px' }}>Уже оплачено (наличные/перевод)</label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="ghost-button" style={{ flex: 1 }} onClick={() => setIsOpen(false)}>Отмена</button>
                <button type="submit" className="primary-button" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}