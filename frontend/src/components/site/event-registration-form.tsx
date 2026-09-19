"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  bookingFieldLimits,
  formatPhoneDisplay,
  normalizeTelegram,
  phoneToE164,
  validateParticipantFields,
} from "@/lib/booking-validation";
import { getPrefillProfile, saveParticipantProfile } from "@/lib/participant-storage";

import type { PosterEvent } from "./poster-calendar";

type TicketSelection = {
  label: string;
  price: string;
  priceRub: number;
  capacity: number;
  seatsLeft: number;
};

type ParticipantForm = {
  key: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string;
  email: string;
  ticketLabel: string;
  ticketPriceRub: number;
  ticketCapacity: number;
};

type EventRegistrationFormProps = {
  event: PosterEvent;
  initialTicketLabel?: string;
  className?: string;
};

function createParticipant(
  ticket: TicketSelection,
  profile?: ReturnType<typeof loadParticipantProfile>,
): ParticipantForm {
  return {
    key: `${Date.now()}-${Math.random()}`,
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    telegram: profile?.telegram ?? "",
    email: profile?.email ?? "",
    ticketLabel: ticket.label,
    ticketPriceRub: ticket.priceRub,
    ticketCapacity: ticket.capacity,
  };
}

function parsePriceRubFromLabel(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(/\s/g, "").replace(/₽/g, "");
  const match = normalized.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getDefaultTicket(event: PosterEvent): TicketSelection {
  if (event.bookingOptions?.length) {
    const available = event.bookingOptions.find((option) => option.seatsLeft > 0) ?? event.bookingOptions[0];
    return {
      label: available.label,
      price: available.price,
      priceRub: available.priceRub,
      capacity: available.capacity,
      seatsLeft: available.seatsLeft,
    };
  }

  const priceRub = event.priceRub && event.priceRub > 0
    ? event.priceRub
    : parsePriceRubFromLabel(event.price)
      || parsePriceRubFromLabel(event.displayPrice)
      || event.priceRub
      || 0;

  return {
    label: "",
    price: event.displayPrice ?? event.price,
    priceRub,
    capacity: event.capacity ?? 10,
    seatsLeft: event.seatsLeft ?? Math.max((event.capacity ?? 10) - (event.booked ?? 0), 0),
  };
}

function isFreeTicket(ticket: TicketSelection, event: PosterEvent) {
  if (ticket.priceRub > 0) {
    return false;
  }

  const normalizedPrice = `${event.price} ${event.displayPrice ?? ""}`.toLowerCase();
  return normalizedPrice.includes("бесплатно") || normalizedPrice.includes("регистрация");
}

function getMaxParticipants(event: PosterEvent, ticketOptions: PosterEvent["bookingOptions"]) {
  if (ticketOptions?.length) {
    const totalOptionSeats = ticketOptions.reduce((sum, option) => sum + option.seatsLeft, 0);
    if (totalOptionSeats > 0) {
      return totalOptionSeats;
    }
  }

  if (event.hideCapacity || (event.capacity ?? 10) >= 10000) {
    return Math.max(event.seatsLeft ?? 20, 1);
  }

  return Math.max(event.seatsLeft ?? 0, 0);
}

export function EventRegistrationForm({
  event,
  initialTicketLabel,
  className,
}: EventRegistrationFormProps) {
  const defaultTicket = useMemo(() => {
    const base = getDefaultTicket(event);
    if (!initialTicketLabel || !event.bookingOptions?.length) {
      return base;
    }

    const matched = event.bookingOptions.find((option) => option.label === initialTicketLabel);
    if (!matched) {
      return base;
    }

    return {
      label: matched.label,
      price: matched.price,
      priceRub: matched.priceRub,
      capacity: matched.capacity,
      seatsLeft: matched.seatsLeft,
    };
  }, [event, initialTicketLabel]);

  const [participants, setParticipants] = useState<ParticipantForm[]>(() => [
    createParticipant(defaultTicket),
  ]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "sbp">("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const ticketOptions = event.bookingOptions ?? [];
  const isFreeEvent = isFreeTicket(defaultTicket, event);
  const maxParticipants = useMemo(
    () => getMaxParticipants(event, ticketOptions),
    [event, ticketOptions],
  );

  useEffect(() => {
    const profile = getPrefillProfile();
    setParticipants((current) => {
      const first = current[0];
      const nextProfile = {
        firstName: first?.firstName || profile?.firstName || "",
        lastName: first?.lastName || profile?.lastName || "",
        phone: formatPhoneDisplay(first?.phone || profile?.phone || ""),
        telegram: first?.telegram || profile?.telegram || "",
        email: first?.email || profile?.email || "",
      };
      const samePersonalData = Boolean(
        first &&
        first.firstName === nextProfile.firstName &&
        first.lastName === nextProfile.lastName &&
        first.phone === nextProfile.phone &&
        first.telegram === nextProfile.telegram &&
        first.email === nextProfile.email,
      );
      const sameTicket = Boolean(
        first &&
        first.ticketLabel === defaultTicket.label &&
        first.ticketPriceRub === defaultTicket.priceRub &&
        first.ticketCapacity === defaultTicket.capacity,
      );

      if (samePersonalData && sameTicket && current.length === 1) {
        return current;
      }

      return [createParticipant(defaultTicket, nextProfile)];
    });
  }, [defaultTicket, event.id, initialTicketLabel]);

  useEffect(() => {
    const first = participants[0];
    if (!first || (!first.firstName && !first.lastName && !first.phone && !first.telegram && !first.email)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveParticipantProfile({
        firstName: first.firstName,
        lastName: first.lastName,
        phone: first.phone,
        telegram: first.telegram,
        email: first.email,
      });
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [
    participants,
  ]);

  const subtotalRub = participants.reduce((sum, participant) => sum + participant.ticketPriceRub, 0);
  const totalRub = discountPercent > 0
    ? Math.max(0, subtotalRub - Math.round(subtotalRub * (discountPercent / 100)))
    : subtotalRub;

  const updateParticipant = (key: string, patch: Partial<ParticipantForm>) => {
    setParticipants((current) => current.map((participant) => (
      participant.key === key ? { ...participant, ...patch } : participant
    )));
    setFormError("");
  };

  const handlePhoneChange = (key: string, value: string) => {
    updateParticipant(key, { phone: formatPhoneDisplay(value) });
  };

  const handleTicketChange = (key: string, label: string) => {
    const option = ticketOptions.find((ticket) => ticket.label === label);
    if (!option) {
      return;
    }

    updateParticipant(key, {
      ticketLabel: option.label,
      ticketPriceRub: option.priceRub,
      ticketCapacity: option.capacity,
    });
    setPromoError("");
    setPromoSuccess("");
    setDiscountPercent(0);
  };

  const addParticipant = () => {
    if (participants.length >= maxParticipants) {
      setFormError(`Можно добавить не больше ${maxParticipants} участников`);
      return;
    }

    setParticipants((current) => {
      const next = [...current, createParticipant(defaultTicket)];
      window.requestAnimationFrame(() => {
        const blocks = document.querySelectorAll(".booking-participant-block");
        blocks[blocks.length - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return next;
    });
    setFormError("");
  };

  const removeParticipant = (key: string) => {
    if (participants.length <= 1) {
      return;
    }

    setParticipants((current) => current.filter((participant) => participant.key !== key));
    setFormError("");
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      return;
    }

    const payer = participants[0];
    if (!payer) {
      return;
    }

    setPromoError("");
    setPromoSuccess("");
    setDiscountPercent(0);

    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          phone: phoneToE164(payer.phone),
          telegram: normalizeTelegram(payer.telegram),
          ticketPriceRub: subtotalRub,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setPromoSuccess(`Скидка ${data.discount_percent}% применена!`);
        setDiscountPercent(data.discount_percent);
      } else {
        setPromoError(data.error || "Промокод недействителен");
      }
    } catch {
      setPromoError("Ошибка при проверке промокода");
    }
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setFormError("");

    try {
      const normalizedParticipants = [];

      for (const [index, participant] of participants.entries()) {
        const validation = validateParticipantFields(participant);
        if (!validation.ok) {
          setFormError(`Участник ${index + 1}: ${validation.error}`);
          return;
        }

        normalizedParticipants.push({
          ...validation.data,
          ticketLabel: participant.ticketLabel || undefined,
          ticketPriceRub: participant.ticketPriceRub,
          ticketCapacity: participant.ticketCapacity,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isTelegramApp = typeof window !== "undefined" && !!(window as any).Telegram?.WebApp?.initData;
      const eventId = `${event.id}::${event.title}`;

      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          participants: normalizedParticipants,
          paymentMethod,
          promoCode: promoCode.trim() || undefined,
          source: isTelegramApp ? "Telegram Mini App" : "Сайт",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setFormError(result.error || "Не удалось открыть оплату");
        return;
      }

      saveParticipantProfile({
        firstName: participants[0]?.firstName ?? "",
        lastName: participants[0]?.lastName ?? "",
        phone: participants[0]?.phone ?? "",
        telegram: participants[0]?.telegram ?? "",
        email: participants[0]?.email ?? "",
      });

      if (result.paymentUrl && result.paymentUrl !== "https://t.me/rrclubadmin") {
        window.location.href = result.paymentUrl;
        return;
      }

      if (result.bookingMode === "free") {
        try {
          if (event.id) {
            const stored = localStorage.getItem("rrk_booked_events");
            const bookedEvents = stored ? JSON.parse(stored) : [];
            if (!bookedEvents.includes(event.id)) {
              bookedEvents.push(event.id);
              localStorage.setItem("rrk_booked_events", JSON.stringify(bookedEvents));
            }
            window.dispatchEvent(new Event("rrk_booking_updated"));
          }
        } catch (storageError) {
          console.error(storageError);
        }

        setSuccessMessage("Спасибо за регистрацию, всю информацию отправим в Telegram");
        return;
      }

      setFormError("Не удалось открыть оплату");
    } catch (error) {
      console.error(error);
      setFormError("Произошла ошибка при бронировании");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className={`event-registration-form event-registration-success ${className ?? ""}`.trim()}>
        <h2>Успешно!</h2>
        <p>{successMessage}</p>
      </div>
    );
  }

  if (event.bookingClosed) {
    return (
      <div className={`event-registration-form ${className ?? ""}`.trim()}>
        <p>{event.bookingClosedMessage ?? "Запись на это событие закрыта."}</p>
        {event.bookingLink ? (
          <a href={event.bookingLink} target="_blank" rel="noreferrer" className="site-button primary">
            Написать администратору
          </a>
        ) : null}
      </div>
    );
  }

  const soldOut = maxParticipants <= 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={`event-registration-form booking-form ${className ?? ""}`.trim()}
      autoComplete="on"
    >
      {formError ? <div className="booking-form-error">{formError}</div> : null}

      {participants.map((participant, index) => (
        <div key={participant.key} className="booking-participant-block">
          <div className="booking-participant-head">
            <h3>{index === 0 ? "Ваши данные" : `Участник ${index + 1}`}</h3>
            {participants.length > 1 ? (
              <button type="button" className="booking-participant-remove" onClick={() => removeParticipant(participant.key)}>
                Удалить
              </button>
            ) : null}
          </div>

          {ticketOptions.length > 0 ? (
            <div className="booking-field">
              <label>Тариф</label>
              <select
                required
                value={participant.ticketLabel}
                onChange={(e) => handleTicketChange(participant.key, e.target.value)}
              >
                {ticketOptions.map((option) => (
                  <option key={option.label} value={option.label} disabled={option.seatsLeft <= 0}>
                    {option.label} · {option.price} · {option.seatsLeft} мест
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="booking-field-row">
            <div className="booking-field">
              <label htmlFor={index === 0 ? "booking-first-name" : undefined}>Имя</label>
              <input
                id={index === 0 ? "booking-first-name" : undefined}
                type="text"
                name={index === 0 ? "given-name" : undefined}
                autoComplete={index === 0 ? "given-name" : "off"}
                required
                value={participant.firstName}
                maxLength={bookingFieldLimits.nameMax}
                onChange={(e) => updateParticipant(participant.key, { firstName: e.target.value })}
                placeholder="Иван"
              />
            </div>
            <div className="booking-field">
              <label htmlFor={index === 0 ? "booking-last-name" : undefined}>Фамилия</label>
              <input
                id={index === 0 ? "booking-last-name" : undefined}
                type="text"
                name={index === 0 ? "family-name" : undefined}
                autoComplete={index === 0 ? "family-name" : "off"}
                required
                value={participant.lastName}
                maxLength={bookingFieldLimits.nameMax}
                onChange={(e) => updateParticipant(participant.key, { lastName: e.target.value })}
                placeholder="Иванов"
              />
            </div>
          </div>

          <div className="booking-field-row">
            <div className="booking-field">
              <label htmlFor={index === 0 ? "booking-phone" : undefined}>Телефон</label>
              <input
                id={index === 0 ? "booking-phone" : undefined}
                type="tel"
                name={index === 0 ? "tel" : undefined}
                required
                inputMode="tel"
                autoComplete={index === 0 ? "tel" : "off"}
                value={participant.phone}
                onChange={(e) => handlePhoneChange(participant.key, e.target.value)}
                placeholder="+7 (999) 999-99-99"
              />
            </div>
            <div className="booking-field">
              <label htmlFor={index === 0 ? "booking-telegram" : undefined}>Telegram</label>
              <input
                id={index === 0 ? "booking-telegram" : undefined}
                type="text"
                name={index === 0 ? "nickname" : undefined}
                autoComplete={index === 0 ? "nickname" : "off"}
                required
                value={participant.telegram}
                maxLength={bookingFieldLimits.telegramMax}
                onChange={(e) => updateParticipant(participant.key, { telegram: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="booking-field">
            <label htmlFor={index === 0 ? "booking-email" : undefined}>Email для чека</label>
            <input
              id={index === 0 ? "booking-email" : undefined}
              type="email"
              name={index === 0 ? "email" : undefined}
              required
              value={participant.email}
              maxLength={bookingFieldLimits.emailMax}
              autoComplete={index === 0 ? "email" : "off"}
              onChange={(e) => updateParticipant(participant.key, { email: e.target.value })}
              placeholder="hello@example.com"
            />
          </div>
        </div>
      ))}

      {!soldOut && participants.length < maxParticipants ? (
        <button type="button" className="booking-add-participant" onClick={addParticipant}>
          + Добавить ещё человека
        </button>
      ) : null}

      <div className="booking-extras">
        {!isFreeEvent ? (
          <div className="booking-payment-methods">
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              Картой
            </label>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="sbp"
                checked={paymentMethod === "sbp"}
                onChange={() => setPaymentMethod("sbp")}
              />
              СБП
            </label>
          </div>
        ) : null}

        {!isFreeEvent ? (
          <div className="booking-promo-section">
            <button
              type="button"
              className="booking-promo-toggle"
              onClick={() => setPromoOpen((open) => !open)}
              aria-expanded={promoOpen}
            >
              <ChevronDown size={16} className={promoOpen ? "is-open" : undefined} />
              Промокод
            </button>
            {promoOpen ? (
              <div className="booking-promo-panel">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError("");
                    setPromoSuccess("");
                    setDiscountPercent(0);
                  }}
                  placeholder="Введите промокод"
                />
                <button type="button" onClick={handleValidatePromo} className="booking-promo-apply">
                  Применить
                </button>
                {promoError ? <div className="booking-form-error">{promoError}</div> : null}
                {promoSuccess ? <div className="booking-form-success">{promoSuccess}</div> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="booking-consent">
        Оплачивая, вы принимаете <a href="/offer" target="_blank">оферту</a> и <a href="/privacy" target="_blank">политику</a>.
      </p>

      <div className="booking-checkout">
        <div className="booking-checkout-summary">
          <strong>
            {participants.length} {participants.length === 1 ? "участник" : participants.length < 5 ? "участника" : "участников"}
          </strong>
          <span>{isFreeEvent ? "Бесплатно" : `${totalRub.toLocaleString("ru-RU")} ₽`}</span>
        </div>
        <button
          type="submit"
          className="site-button primary booking-submit"
          disabled={isSubmitting || soldOut}
        >
          {isSubmitting
            ? "Обработка..."
            : soldOut
              ? "Мест нет"
              : isFreeEvent
                ? "Зарегистрироваться"
                : `Оплатить ${totalRub.toLocaleString("ru-RU")} ₽`}
        </button>
      </div>
    </form>
  );
}
