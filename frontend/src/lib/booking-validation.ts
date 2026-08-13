const NAME_MIN = 1;
const NAME_MAX = 50;
const TELEGRAM_MIN = 2;
const TELEGRAM_MAX = 32;
const EMAIL_MAX = 254;
const TBANK_PHONE_MAX = 30;

const NAME_PATTERN = /^[\p{L}\s'-]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_USERNAME_PATTERN = /^@?[a-zA-Z0-9_]{2,32}$/;

export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (!digits.startsWith("7")) {
    digits = `7${digits}`;
  }

  return digits.slice(0, 11);
}

export function formatPhoneDisplay(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (!digits) return "";

  const national = digits.startsWith("7") ? digits.slice(1) : digits;

  if (national.length <= 3) {
    return `+7 (${national}`;
  }

  if (national.length <= 6) {
    return `+7 (${national.slice(0, 3)}) ${national.slice(3)}`;
  }

  if (national.length <= 8) {
    return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  }

  return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 8)}-${national.slice(8, 10)}`;
}

export function phoneToE164(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (digits.length !== 11 || !digits.startsWith("7")) {
    return "";
  }

  return `+${digits}`;
}

function isTelegramUsername(value: string): boolean {
  if (!TELEGRAM_USERNAME_PATTERN.test(value)) {
    return false;
  }

  const username = value.startsWith("@") ? value.slice(1) : value;
  return !/^\d+$/.test(username);
}

export function normalizeTelegram(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("@")) {
    return trimmed;
  }

  if (isTelegramUsername(trimmed)) {
    return `@${trimmed}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) {
    if (
      digits.length === 10 ||
      (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8")))
    ) {
      const e164 = phoneToE164(trimmed);
      if (e164) return e164;
    }

    return `+${digits}`;
  }

  return `@${trimmed}`;
}

function escapeSupabaseFilterValue(value: string): string {
  if (/[,\s()]/.test(value) || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function getPhoneLookupValues(normalizedPhone: string): string[] {
  if (!normalizedPhone) return [];

  const digits = normalizedPhone.replace(/\D/g, "");
  const values = new Set<string>([normalizedPhone]);

  if (digits) {
    values.add(digits);
    values.add(`+${digits}`);
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    const national = digits.slice(1);
    values.add(`8${national}`);
    values.add(national);
    values.add(formatPhoneDisplay(normalizedPhone));
  }

  return [...values];
}

export function getTelegramLookupValues(normalizedTelegram: string): string[] {
  if (!normalizedTelegram) return [];

  const values = new Set<string>([normalizedTelegram]);

  if (normalizedTelegram.startsWith("@")) {
    const withoutAt = normalizedTelegram.slice(1);
    values.add(withoutAt);
    values.add(normalizedTelegram.toLowerCase());
    values.add(withoutAt.toLowerCase());
  } else if (normalizedTelegram.startsWith("+")) {
    for (const value of getPhoneLookupValues(normalizedTelegram)) {
      values.add(value);
    }
  } else {
    values.add(`@${normalizedTelegram}`);
  }

  return [...values];
}

export function buildParticipantLookupOrFilter(
  phone: string,
  telegram: string,
  email: string,
): string {
  const conditions: string[] = [];

  for (const value of getPhoneLookupValues(phone)) {
    conditions.push(`phone.eq.${escapeSupabaseFilterValue(value)}`);
  }
  for (const value of getTelegramLookupValues(telegram)) {
    conditions.push(`telegram.eq.${escapeSupabaseFilterValue(value)}`);
  }
  if (email) {
    conditions.push(`email.ilike.${escapeSupabaseFilterValue(email)}`);
  }

  return conditions.join(",");
}

function validateName(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN) {
    return `${label} обязательно`;
  }
  if (trimmed.length > NAME_MAX) {
    return `${label} не длиннее ${NAME_MAX} символов`;
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return `${label} может содержать только буквы, пробелы и дефис`;
  }
  return null;
}

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Email обязателен";
  }
  if (trimmed.length > EMAIL_MAX) {
    return `Email не длиннее ${EMAIL_MAX} символов`;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Введите корректный email";
  }
  return null;
}

function validatePhone(value: string): string | null {
  const e164 = phoneToE164(value);
  if (!e164) {
    return "Введите номер телефона полностью: +7 (999) 999-99-99";
  }
  if (e164.length > TBANK_PHONE_MAX) {
    return `Номер телефона не длиннее ${TBANK_PHONE_MAX} символов`;
  }
  return null;
}

function validateTelegram(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Telegram обязателен";
  }

  if (isTelegramUsername(trimmed)) {
    const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
    if (username.length >= TELEGRAM_MIN && username.length <= TELEGRAM_MAX) {
      return null;
    }
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) {
    return null;
  }

  return "Telegram: укажите @username или номер телефона";
}

export type BookingValidationInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  eventId?: string;
  paymentMethod?: string;
  isFree?: boolean;
};

export type NormalizedBookingFields = {
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string;
  email: string;
  eventId: string;
  paymentMethod: "card" | "sbp";
};

export function validateAndNormalizeBooking(
  input: BookingValidationInput,
): { ok: true; data: NormalizedBookingFields } | { ok: false; error: string } {
  const firstNameError = validateName(String(input.firstName ?? ""), "Имя");
  if (firstNameError) return { ok: false, error: firstNameError };

  const lastNameError = validateName(String(input.lastName ?? ""), "Фамилия");
  if (lastNameError) return { ok: false, error: lastNameError };

  const phoneError = validatePhone(String(input.phone ?? ""));
  if (phoneError) return { ok: false, error: phoneError };

  const telegramError = validateTelegram(String(input.telegram ?? ""));
  if (telegramError) return { ok: false, error: telegramError };

  const emailError = validateEmail(String(input.email ?? ""));
  if (emailError) return { ok: false, error: emailError };

  const eventId = String(input.eventId ?? "").trim();
  if (!eventId) {
    return { ok: false, error: "Выберите событие" };
  }

  const paymentMethod = input.paymentMethod === "sbp" ? "sbp" : "card";
  if (!input.isFree && input.paymentMethod && !["card", "sbp"].includes(input.paymentMethod)) {
    return { ok: false, error: "Некорректный способ оплаты" };
  }

  return {
    ok: true,
    data: {
      firstName: String(input.firstName).trim(),
      lastName: String(input.lastName).trim(),
      phone: phoneToE164(String(input.phone ?? "")),
      telegram: normalizeTelegram(String(input.telegram ?? "")),
      email: String(input.email).trim().toLowerCase(),
      eventId,
      paymentMethod,
    },
  };
}

export const bookingFieldLimits = {
  nameMax: NAME_MAX,
  emailMax: EMAIL_MAX,
  telegramMax: TELEGRAM_MAX + 1,
} as const;
