"use client";

import { useState } from "react";
import Link from "next/link";
import { getEventParticipants, getAvailableEventsForTransfer, addRecord } from "@/app/crm/actions";
import { EnrollmentActions } from "@/components/crm/enrollment-actions";

import type { ClassLoadSummary } from "@/lib/crm-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClassCard({ item, variant = "classes" }: { item: ClassLoadSummary | any, variant?: "classes" | "dashboard" }) {
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [participants, setParticipants] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    setErrorMsg(null);
    setIsAdding(false);
    if (!item.id || item.id.startsWith("fallback")) return;
    setIsLoading(true);
    try {
      const [res, eventsRes] = await Promise.all([
        getEventParticipants(item.id),
        getAvailableEventsForTransfer()
      ]);
      if (res.error) setErrorMsg(res.error);
      else setParticipants(res.data || []);
      
      if (!eventsRes.error) setAvailableEvents(eventsRes.data || []);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("eventId", item.id);
      const res = await addRecord(formData);
      if (res.success) {
        setIsAdding(false);
        // Refresh participants
        const fresh = await getEventParticipants(item.id);
        if (!fresh.error) setParticipants(fresh.data || []);
      }
    } catch (err: any) {
      alert(err.message || "Ошибка при добавлении");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {variant === "classes" ? (
        <article className="crm-class-load-card" onClick={handleOpen} style={{ cursor: "pointer", transition: "transform 0.2s" }}>
          <div className="class-badges">
            <span className="status-badge tone-gray">{item.format}</span>
            <span className={`status-badge ${item.status === "SOLD OUT" ? "tone-burgundy" : item.status?.includes("Почти") ? "tone-sand" : "tone-green"}`}>
              {item.status}
            </span>
          </div>
          <h3>{item.title}</h3>
          <p className="crm-class-load-meta">
            {item.date} · {item.time} · {item.host}
          </p>
          <div className="crm-class-load-stats">
            <div>
              <span>Записалось</span>
              <strong>
                {item.booked}/{item.capacity}
              </strong>
            </div>
            <div>
              <span>Оплачено</span>
              <strong>{item.paid}</strong>
            </div>
            <div>
              <span>Ждут</span>
              <strong>{item.pending}</strong>
            </div>
            <div>
              <span>Свободно</span>
              <strong>{item.free}</strong>
            </div>
            <div>
              <span>Вейтлист</span>
              <strong>{item.waitlist}</strong>
            </div>
          </div>
          <div className="crm-class-load-progress" aria-hidden="true">
            <span style={{ width: `${item.capacity > 0 ? Math.min((item.booked / item.capacity) * 100, 100) : 0}%` }} />
          </div>
          <p className="crm-class-load-revenue">Выручка: {item.revenue}</p>
        </article>
      ) : (
        <article className="class-card" onClick={handleOpen} style={{ cursor: "pointer" }}>
          <div className="class-card-main">
            <div className="class-badges">
              <span className={`status-badge ${item.status === "SOLD OUT" ? "tone-burgundy" : item.status?.includes("Почти") ? "tone-sand" : "tone-green"}`}>{item.status}</span>
              <span className="status-badge tone-gray">{item.format}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.subtitle}</p>
          </div>
          <dl className="class-meta">
            <div>
              <dt>Дата</dt>
              <dd>{item.date}</dd>
            </div>
            <div>
              <dt>Время</dt>
              <dd>{item.time}</dd>
            </div>
            <div>
              <dt>Ведущий</dt>
              <dd>{item.host}</dd>
            </div>
            <div>
              <dt>Цена</dt>
              <dd>{item.price}</dd>
            </div>
          </dl>
        </article>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setIsOpen(false)}>
          <div style={{
            background: 'var(--surface-strong)', color: 'var(--text)', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
            border: '1px solid var(--line)', boxShadow: 'var(--modal-shadow)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Записались на {item.title}</h2>
              <button className="ghost-button" style={{ padding: '4px 8px', minHeight: 'auto' }} onClick={() => setIsOpen(false)}>✕</button>
            </div>
            
            {!isLoading && !errorMsg && (
              <div style={{ marginBottom: '16px' }}>
                {!isAdding ? (
                  <button className="primary-button" style={{ width: '100%', padding: '8px' }} onClick={() => setIsAdding(true)}>
                    + Записать участника
                  </button>
                ) : (
                  <form onSubmit={handleAddParticipant} style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>Новая запись</h3>
                    <input name="fullName" placeholder="Имя и Фамилия *" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
                    <input name="telegram" placeholder="Telegram (@username)" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" name="isPaid" id={`isPaid-${item.id}`} />
                      <label htmlFor={`isPaid-${item.id}`} style={{ fontSize: '13px' }}>Уже оплачено</label>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="ghost-button" style={{ flex: 1 }} onClick={() => setIsAdding(false)}>Отмена</button>
                      <button type="submit" className="primary-button" style={{ flex: 1 }} disabled={isSubmitting}>
                        {isSubmitting ? "..." : "Сохранить"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            
            {isLoading ? (
              <p style={{ color: 'var(--muted)' }}>Загрузка...</p>
            ) : errorMsg ? (
              <div style={{ color: 'var(--brand)', padding: '16px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <strong>Ошибка загрузки:</strong> {errorMsg}
                <br /><br />
                <small style={{ color: 'var(--muted)' }}>Debug ID: {item.id}</small>
              </div>
            ) : participants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {participants.map(p => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ display: 'block', textDecoration: p.status === 'Отменена' ? 'line-through' : 'none', opacity: p.status === 'Отменена' ? 0.5 : 1 }}>
                          {p.participant?.full_name || 'Без имени'}
                        </strong>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{p.participant?.telegram || p.participant?.slug || 'Нет контакта'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.status === 'Отменена' ? (
                          <span className="status-badge tone-gray" style={{ fontSize: '11px', minHeight: '24px', padding: '0 8px' }}>Отменена</span>
                        ) : (
                          <span className={`status-badge ${p.payment_status?.toLowerCase().includes('paid') || p.payment_status?.toLowerCase().includes('оплач') ? 'tone-green' : 'tone-sand'}`} style={{ fontSize: '11px', minHeight: '24px', padding: '0 8px' }}>
                            {p.payment_status || 'Не указан'}
                          </span>
                        )}
                        {p.participant?.slug && (
                          <Link href={`/crm/participants/${p.participant.slug}`} className="ghost-button link-button" style={{ fontSize: '12px', padding: '4px 8px', minHeight: 'auto' }}>
                            Открыть
                          </Link>
                        )}
                      </div>
                    </div>
                    {p.status !== 'Отменена' && (
                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px', marginTop: '4px' }}>
                        <EnrollmentActions 
                          enrollmentId={p.id} 
                          currentEventId={item.id} 
                          availableEvents={availableEvents}
                          paymentStatus={p.payment_status}
                          onUpdate={async () => {
                            const fresh = await getEventParticipants(item.id);
                            if (!fresh.error) setParticipants(fresh.data || []);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>Пока никто не записался</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}