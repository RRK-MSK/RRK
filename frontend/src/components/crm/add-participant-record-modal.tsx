"use client";

import { useEffect, useState } from "react";
import { addParticipantEnrollment } from "@/app/crm/actions";
import { CrmTariffField } from "@/components/crm/crm-tariff-field";
import { pickDefaultTariffNote, type EventTariffOption } from "@/lib/event-tariffs";

type ParticipantEventOption = {
  id: string;
  title: string;
  starts_at: string;
  status?: string | null;
  tariffOptions?: EventTariffOption[];
};

export function AddParticipantRecordModal({
  participantId,
  events,
}: {
  participantId: string;
  events: ParticipantEventOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTicketNote, setSelectedTicketNote] = useState("");
  const [tariffOptions, setTariffOptions] = useState<EventTariffOption[]>([]);

  useEffect(() => {
    if (!selectedEventId) {
      setTariffOptions([]);
      setSelectedTicketNote("");
      return;
    }

    const options = events.find((event) => event.id === selectedEventId)?.tariffOptions ?? [];
    setTariffOptions(options);
    setSelectedTicketNote(pickDefaultTariffNote(options));
  }, [selectedEventId, events]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("participantId", participantId);
      await addParticipantEnrollment(formData);
      setIsOpen(false);
      setSelectedEventId("");
      setSelectedTicketNote("");
      setTariffOptions([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка при добавлении записи";
      alert(message);
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
                <select
                  name="eventId"
                  required
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }}
                >
                  <option value="" style={{ color: 'black' }}>Выберите занятие...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id} style={{ color: 'black' }}>
                      {ev.title} ({new Date(ev.starts_at).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })} {new Date(ev.starts_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })})
                    </option>
                  ))}
                </select>
              </div>

              <CrmTariffField
                options={tariffOptions}
                value={selectedTicketNote}
                onChange={setSelectedTicketNote}
              />

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
