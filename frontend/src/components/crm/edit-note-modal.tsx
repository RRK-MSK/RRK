"use client";

import { useState } from "react";
import { updateParticipantNote } from "@/app/crm/actions";

export function EditNoteModal({ participantId, currentNote }: { participantId: string, currentNote: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState(currentNote === "Комментарий пока не добавлен." ? "" : currentNote);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateParticipantNote(participantId, note);
      setIsOpen(false);
    } catch (err) {
      alert("Ошибка при сохранении комментария");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="ghost-button link-button" style={{ marginLeft: "8px", fontSize: "12px", padding: "4px 8px" }} onClick={() => setIsOpen(true)}>
        Изменить
      </button>
    );
  }

  return (
    <>
      <button className="ghost-button link-button" style={{ marginLeft: "8px", fontSize: "12px", padding: "4px 8px" }} onClick={() => setIsOpen(true)}>
        Изменить
      </button>
      
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface-strong)', color: 'var(--text)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'
        }}>
          <h2 style={{ marginBottom: '16px' }}>Комментарий</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <textarea 
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', color: 'inherit', minHeight: '100px' }} 
                placeholder="Напишите всё, что важно помнить об этом участнике..."
              />
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