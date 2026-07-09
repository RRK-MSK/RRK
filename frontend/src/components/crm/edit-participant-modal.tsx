"use client";

import { useState } from "react";
import { updateParticipantData } from "@/app/crm/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EditParticipantModal({ profile }: { profile: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData(e.currentTarget);
      await updateParticipantData(profile.id, {
        fullName: formData.get("fullName") as string,
        telegram: formData.get("telegram") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
      });
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при обновлении участника");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="ghost-button" onClick={() => setIsOpen(true)} style={{ fontSize: '13px', padding: '4px 10px', height: 'auto', minHeight: '32px' }}>
        Редактировать
      </button>
    );
  }

  return (
    <>
      <button className="ghost-button" onClick={() => setIsOpen(true)} style={{ fontSize: '13px', padding: '4px 10px', height: 'auto', minHeight: '32px' }}>
        Редактировать
      </button>
      
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface-strong)', color: 'var(--text)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Редактировать данные</h2>
          {errorMsg && (
            <div style={{ color: 'var(--brand)', marginBottom: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', borderRadius: '6px' }}>
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Имя и Фамилия *</label>
              <input name="fullName" defaultValue={profile.name} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Telegram</label>
              <input name="telegram" defaultValue={profile.telegram !== "-" ? profile.telegram : ""} placeholder="@username" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Телефон</label>
              <input name="phone" defaultValue={profile.phone !== "-" ? profile.phone : ""} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Email</label>
              <input name="email" defaultValue={profile.email !== "-" ? profile.email : ""} type="email" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button type="submit" className="primary-button" style={{ flex: 1 }} disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </button>
              <button type="button" className="ghost-button" onClick={() => setIsOpen(false)} style={{ flex: 1 }}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
