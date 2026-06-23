"use client";

import { useState } from "react";
import type { PosterEvent } from "./poster-calendar";

type BookingModalProps = {
  events: PosterEvent[];
  isOpen: boolean;
  onClose: () => void;
};

export function BookingModal({ events, isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    telegram: "",
    eventId: "",
    price: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    
    try {
      const response = await fetch('/api/book', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) 
      });
      
      const result = await response.json();
      if (result.paymentUrl && result.paymentUrl !== "https://t.me/rrclubadmin") {
        window.location.href = result.paymentUrl;
      } else if (result.paymentUrl === "https://t.me/rrclubadmin" || formData.price?.toLowerCase().includes("бесплатно") || formData.price?.toLowerCase().includes("регистрация")) {
        setSuccessMessage("Спасибо за регистрацию, всю информацию отправим в тг");
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при бронировании');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <button type="button" className="booking-modal-close" onClick={onClose}>&times;</button>
        
        {successMessage ? (
          <div className="booking-success-message" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2>Успешно!</h2>
            <p style={{ marginTop: "16px", fontSize: "18px", color: "var(--muted)" }}>{successMessage}</p>
          </div>
        ) : (
          <>
            <h2>Запись на тренировку</h2>
            <p>Заполните данные для бронирования места и оплаты. Если событие бесплатно — мы пришлем всю информацию в Telegram.</p>
            
            <form onSubmit={handleSubmit} className="booking-form">
          <div className="booking-field">
            <label>Имя</label>
            <input 
              type="text" 
              required 
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
              placeholder="Иван"
            />
          </div>
          
          <div className="booking-field">
            <label>Фамилия</label>
            <input 
              type="text" 
              required 
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
              placeholder="Иванов"
            />
          </div>
          
          <div className="booking-field">
            <label>Номер телефона</label>
            <input 
              type="tel" 
              required 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+7 (999) 000-00-00"
            />
          </div>
          
          <div className="booking-field">
            <label>Telegram (никнейм или номер)</label>
            <input 
              type="text" 
              required 
              value={formData.telegram}
              onChange={e => setFormData({...formData, telegram: e.target.value})}
              placeholder="@username"
            />
          </div>
          
          <div className="booking-field">
            <label>Куда бронируем?</label>
            <select 
              required 
              value={formData.eventId}
              onChange={e => {
                const selectedIndex = e.target.selectedIndex;
                const selectedOption = e.target.options[selectedIndex];
                const price = selectedOption.getAttribute('data-price') || '';
                setFormData({...formData, eventId: e.target.value, price});
              }}
            >
              <option value="" disabled>Выберите событие</option>
              {events.map((ev, i) => (
                <option key={i} value={ev.id ? `${ev.id}::${ev.title}` : `${ev.date} | ${ev.time} - ${ev.title}`} data-price={ev.price}>
                  {ev.date} | {ev.time} | {ev.title} ({ev.price})
                </option>
              ))}
            </select>
          </div>
          
          <div className="booking-consent">
            Нажимая кнопку, вы соглашаетесь с <a href="/offer" target="_blank">Офертой</a>, <a href="/privacy" target="_blank">Политикой конфиденциальности</a> и даете <a href="/consent" target="_blank">согласие на обработку ПД</a>.
          </div>
          
          <button type="submit" className="site-button primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
            {isSubmitting ? "Обработка..." : (formData.price?.toLowerCase().includes("бесплатно") || formData.price?.toLowerCase().includes("регистрация") ? "Зарегистрироваться" : "Оплатить")}
          </button>
        </form>
          </>
        )}
      </div>
    </div>
  );
}