"use client";

import { useState, useEffect } from "react";
import { addRecord } from "@/app/crm/actions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AddRecordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      supabase.from("events").select("id, title, starts_at").gte("starts_at", new Date().toISOString()).order("starts_at").then(({ data }) => {
        if (data) setEvents(data);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await addRecord(formData);
      setIsOpen(false);
    } catch (err) {
      alert("Ошибка при добавлении записи");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Добавить запись
      </button>
    );
  }

  return (
    <>
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Добавить запись
      </button>
      
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface-elevated)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Новая запись</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Событие *</label>
              <select name="eventId" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }}>
                <option value="" style={{ color: 'black' }}>Выберите занятие...</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id} style={{ color: 'black' }}>
                    {ev.title} ({new Date(ev.starts_at).toLocaleDateString('ru-RU')})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Имя и Фамилия *</label>
              <input name="fullName" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Telegram</label>
              <input name="telegram" placeholder="@username" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Телефон</label>
              <input name="phone" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }} />
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
    </>
  );
}
