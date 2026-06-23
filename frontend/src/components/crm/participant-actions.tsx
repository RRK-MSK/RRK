"use client";

import { useState } from "react";
import { updateParticipantStatus, updateParticipantTags } from "@/app/crm/actions";

export function ParticipantActions({ profile }: { profile: any }) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const statuses = ["Новый", "В работе", "Постоянный", "Отвал"];
  
  const handleAddTag = async () => {
    if (!newTag.trim()) {
      setIsAddingTag(false);
      return;
    }
    const tags = [...(profile.tags || []), newTag.trim()];
    await updateParticipantTags(profile.id, tags);
    setNewTag("");
    setIsAddingTag(false);
  };

  const handleStatusChange = async (status: string) => {
    await updateParticipantStatus(profile.id, status);
    setIsChangingStatus(false);
  };

  return (
    <div className="profile-actions" style={{ position: 'relative' }}>
      <button className="primary-button">Записать на занятие</button>
      <button className="ghost-button">Отметить оплату</button>

      {/* Add Tag */}
      {isAddingTag ? (
        <div style={{ display: 'inline-flex', gap: '4px' }}>
          <input 
            autoFocus
            value={newTag} 
            onChange={e => setNewTag(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            placeholder="Новый тег"
            style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'transparent', color: 'inherit' }}
          />
          <button className="ghost-button" onClick={handleAddTag}>Ок</button>
          <button className="ghost-button" onClick={() => setIsAddingTag(false)}>Отмена</button>
        </div>
      ) : (
        <button className="ghost-button" onClick={() => setIsAddingTag(true)}>Добавить тег</button>
      )}

      {/* Change Status */}
      {isChangingStatus ? (
        <div style={{ display: 'inline-flex', gap: '4px' }}>
          <select 
            onChange={e => handleStatusChange(e.target.value)}
            value={profile.status}
            style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface-sunken)', color: 'inherit' }}
          >
            <option disabled>Выберите статус</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="ghost-button" onClick={() => setIsChangingStatus(false)}>Отмена</button>
        </div>
      ) : (
        <button className="ghost-button" onClick={() => setIsChangingStatus(true)}>Изменить статус</button>
      )}

      <button className="ghost-button">Добавить отзыв</button>
      <button className="ghost-button">Добавить комментарий</button>
    </div>
  );
}