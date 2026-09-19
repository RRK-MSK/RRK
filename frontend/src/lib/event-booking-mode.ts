export const EVENT_BOOKING_PAYMENT = "payment";
export const EVENT_BOOKING_SIGNUP = "signup";
export const EVENT_SIGNUP_TELEGRAM = "rrclubadmin";

export type EventBookingMode = typeof EVENT_BOOKING_PAYMENT | typeof EVENT_BOOKING_SIGNUP;

export function normalizeEventBookingMode(value: string | null | undefined): EventBookingMode {
  return value === EVENT_BOOKING_SIGNUP ? EVENT_BOOKING_SIGNUP : EVENT_BOOKING_PAYMENT;
}

export function isSignupOnlyEvent(value: string | null | undefined) {
  return normalizeEventBookingMode(value) === EVENT_BOOKING_SIGNUP;
}

export function getEventBookingModeLabel(value: string | null | undefined) {
  return isSignupOnlyEvent(value) ? "Под запись" : "Под оплату";
}

export function getEventCtaLabel(value: string | null | undefined) {
  return isSignupOnlyEvent(value) ? "Записаться" : "Купить";
}

export function getEventSignupTelegramUrl(title?: string | null) {
  const eventTitle = title?.trim();
  const text = eventTitle
    ? `Здравствуйте! Хочу записаться на «${eventTitle}»`
    : "Здравствуйте! Хочу записаться на мероприятие";

  return `https://t.me/${EVENT_SIGNUP_TELEGRAM}?text=${encodeURIComponent(text)}`;
}
