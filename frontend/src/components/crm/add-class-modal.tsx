"use client";

import { useState } from "react";
import { addEvent } from "@/app/crm/actions";

export function AddClassModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await addEvent(formData);
      setIsOpen(false);
    } catch (err: any) {
      alert(err.message || "Ошибка при добавлении");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Добавить занятие
      </button>
    );
  }

  return (
    <>
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Добавить занятие
      </button>
      
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface-strong)', color: 'var(--text)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Новое занятие</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Название *</label>
              <input name="title" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Категория</label>
              <select name="category" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }}>
                <option style={{color: 'black'}} value="Обычное">Обычное</option>
                <option style={{color: 'black'}} value="BIG">BIG</option>
                <option style={{color: 'black'}} value="Бесплатное">Бесплатное</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Дата и время начала *</label>
              <input type="datetime-local" name="startsAt" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Дата и время окончания *</label>
              <input type="datetime-local" name="endsAt" required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Вместимость *</label>
              <input type="number" name="capacity" defaultValue={10} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--muted)' }}>Цена (Руб) *</label>
              <input type="number" name="price" defaultValue={4400} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button type="button" className="ghost-button" style={{ flex: 1 }} onClick={() => setIsOpen(false)}>Отмена</button>
              <button type="submit" className="primary-button" style={{ flex: 1 }} disabled={isSubmitting}>
                {isSubmitting ? "..." : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}