"use client";

import { useState } from "react";
import { addParticipant } from "@/app/crm/actions";
import { PrimaryButton } from "./ui";

export function AddParticipantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      await addParticipant(formData);
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при добавлении участника");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Добавить участника
      </button>
    );
  }

  return (
    <>
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Добавить участника
      </button>
      
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface-strong)', color: 'var(--text)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Новый участник</h2>
          {errorMsg && (
            <div style={{ color: 'var(--brand)', marginBottom: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '6px' }}>
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Имя и Фамилия *</label>
              <input name="fullName" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Telegram</label>
              <input name="telegram" placeholder="@username" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Телефон</label>
              <input name="phone" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Email</label>
              <input name="email" type="email" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
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