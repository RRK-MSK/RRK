"use server";

import { revalidatePath } from "next/cache";
import { requireCrmUser } from "@/lib/crm-auth";
import { getCrmEnrollmentFormData as loadCrmEnrollmentFormData } from "@/lib/crm-store";
import { parseDateTimeLocalMoscow } from "@/lib/moscow-datetime";
import { getCoffeeJamPriceTiers, getPriceForNextBooking, type EventPriceTier } from "@/lib/event-pricing";
import {
  buildEventTariffOptions,
  buildTariffUsageMap,
  findEventTariffOption,
  formatEnrollmentTariffLabel,
  type EventTariffOption,
} from "@/lib/event-tariffs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type EventTierInput = {
  seatFrom: number;
  seatTo: number | null;
  priceRub: number;
};

type EventPayload = {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  city?: string;
  host?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  price: number;
  isPublished: boolean;
  status?: string;
  pricingTiers?: EventTierInput[];
};

type PromoCodePayload = {
  id?: string;
  code: string;
  description?: string;
  discountPercent: number;
  validFrom?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  isSingleUse: boolean;
  isActive: boolean;
  applicableServices?: string[];
};

type PaymentPayload = {
  id?: string;
  participantId: string;
  eventId?: string | null;
  amountRub: number;
  method?: string;
  status?: string;
  paidAt?: string;
  promoCodeId?: string | null;
  discountAmountRub?: number;
};

type CancelEnrollmentMode = "credit" | "refund";

type RevenueAuditEntry = {
  paymentId?: string | null;
  participantId?: string | null;
  enrollmentId?: string | null;
  eventId?: string | null;
  direction: "plus" | "minus" | "neutral";
  operationType: string;
  amountRub: number;
  reason: string;
};

type PaymentRow = {
  id: string;
  participant_id: string | null;
  event_id: string | null;
  enrollment_id?: string | null;
  amount_rub: number | null;
  method: string | null;
  status: string | null;
  note?: string | null;
  paid_at?: string | null;
};

type EnrollmentDetailsRow = {
  id: string;
  participant_id: string;
  event_id: string;
  status: string | null;
  payment_status: string | null;
  confirmation_status?: string | null;
  source?: string | null;
  note?: string | null;
  event?: {
    id?: string | null;
    title?: string | null;
    starts_at?: string | null;
    price_rub?: number | null;
  } | null;
};

function revalidateCrmAndSite() {
  revalidatePath("/crm/calendar");
  revalidatePath("/crm/classes");
  revalidatePath("/crm/dashboard");
  revalidatePath("/crm/promos");
  revalidatePath("/crm/analytics");
  revalidatePath("/crm/payments");
  revalidatePath("/crm/records");
  revalidatePath("/crm/participants");
  revalidatePath("/");
}

function normalizeStatus(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isPaidPaymentStatus(value?: string | null) {
  const normalized = normalizeStatus(value);
  return normalized.includes("paid") || normalized.includes("оплач");
}

function isRefundPaymentStatus(value?: string | null) {
  const normalized = normalizeStatus(value);
  return normalized.includes("refund") || normalized.includes("возврат");
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeIsoDate(value?: string | null) {
  return parseDateTimeLocalMoscow(value);
}

function normalizePricingTiers(tiers: EventTierInput[] = []) {
  return [...tiers]
    .map((tier) => ({
      seat_from: Number(tier.seatFrom),
      seat_to: tier.seatTo === null || tier.seatTo === undefined || tier.seatTo === 0 ? null : Number(tier.seatTo),
      price_rub: Number(tier.priceRub),
    }))
    .filter((tier) => tier.seat_from > 0 && tier.price_rub >= 0)
    .sort((left, right) => left.seat_from - right.seat_from);
}

function isCoffeeJamEvent(event: { title?: string | null; category?: string | null }) {
  const normalizedTitle = normalizeStatus(event.title);
  const normalizedCategory = normalizeStatus(event.category);

  return normalizedTitle.includes("coffee jam")
    || normalizedTitle.includes("кофе джем")
    || normalizedCategory.includes("coffee jam")
    || normalizedCategory.includes("кофе джем");
}

function isFallingChairsEvent(event: { title?: string | null }) {
  const normalizedTitle = normalizeStatus(event.title);
  return normalizedTitle.includes("падающими стульями");
}

async function logRevenueAudit(entry: RevenueAuditEntry) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase.from("revenue_audit_log").insert({
    payment_id: entry.paymentId ?? null,
    participant_id: entry.participantId ?? null,
    enrollment_id: entry.enrollmentId ?? null,
    event_id: entry.eventId ?? null,
    direction: entry.direction,
    operation_type: entry.operationType,
    amount_rub: Math.max(Number(entry.amountRub) || 0, 0),
    reason: entry.reason,
  });
}

async function getEnrollmentDetails(enrollmentId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, participant_id, event_id, status, payment_status, confirmation_status, source, note, event:events(id, title, starts_at, price_rub)")
    .eq("id", enrollmentId)
    .single();

  if (error || !data) {
    return null;
  }

  const raw = data as EnrollmentDetailsRow & { event?: EnrollmentDetailsRow["event"] | EnrollmentDetailsRow["event"][] };

  return {
    ...raw,
    event: Array.isArray(raw.event) ? (raw.event[0] ?? null) : (raw.event ?? null),
  } as EnrollmentDetailsRow;
}

async function findPaymentForEnrollment(participantId: string, eventId: string, enrollmentId?: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  if (enrollmentId) {
    const { data: linkedPayment } = await supabase
      .from("payments")
      .select("id, participant_id, event_id, enrollment_id, amount_rub, method, status, note, paid_at")
      .eq("enrollment_id", enrollmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (linkedPayment) {
      return linkedPayment as PaymentRow;
    }
  }

  const { data: exactPayment } = await supabase
    .from("payments")
    .select("id, participant_id, event_id, enrollment_id, amount_rub, method, status, note, paid_at")
    .eq("participant_id", participantId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (exactPayment as PaymentRow | null) ?? null;
}

async function findReusableCreditPayment(participantId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("payments")
    .select("id, participant_id, event_id, enrollment_id, amount_rub, method, status, note, paid_at")
    .eq("participant_id", participantId)
    .is("event_id", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const payment = ((data ?? []) as PaymentRow[]).find((row) => !isRefundPaymentStatus(row.status));
  return payment ?? null;
}

async function syncPaymentForEnrollment({
  participantId,
  eventId,
  enrollmentId,
  isPaid,
  amountRub,
  method,
  note,
  reason,
}: {
  participantId: string;
  eventId: string;
  enrollmentId: string;
  isPaid: boolean;
  amountRub: number;
  method?: string | null;
  note?: string | null;
  reason: string;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const exactPayment = await findPaymentForEnrollment(participantId, eventId, enrollmentId);
  const creditPayment = exactPayment ? null : await findReusableCreditPayment(participantId);
  const payment = exactPayment ?? creditPayment;

  const nextStatus = payment
    ? (isPaidPaymentStatus(payment.status) ? "Оплачен" : (isPaid ? "Оплачен" : "Ожидает"))
    : (isPaid ? "Оплачен" : "Ожидает");
  const nextAmount = payment && isPaidPaymentStatus(payment.status)
    ? Math.max(Number(payment.amount_rub) || 0, 0)
    : Math.max(Number(amountRub) || 0, 0);
  const nextMethod = method ?? payment?.method ?? (isPaid ? "Наличные / Перевод" : "Ожидает");
  const nextNote = normalizeText(note) ?? payment?.note ?? null;
  const enrollmentUpdates = nextStatus === "Оплачен"
    ? { payment_status: nextStatus, confirmation_status: "Подтверждено" }
    : { payment_status: nextStatus };

  if (payment) {
    const previousPaid = isPaidPaymentStatus(payment.status);
    const movedAcrossEvents = payment.event_id !== eventId || payment.enrollment_id !== enrollmentId;

    const { error } = await supabase
      .from("payments")
      .update({
        event_id: eventId,
        enrollment_id: enrollmentId,
        amount_rub: nextAmount,
        method: nextMethod,
        status: nextStatus,
        note: nextNote,
        paid_at: nextStatus === "Оплачен" ? (payment.paid_at ?? new Date().toISOString()) : payment.paid_at,
      })
      .eq("id", payment.id);

    if (error) {
      throw new Error("Не удалось обновить оплату: " + error.message);
    }

    if (!previousPaid && nextStatus === "Оплачен") {
      await logRevenueAudit({
        paymentId: payment.id,
        participantId,
        enrollmentId,
        eventId,
        direction: "plus",
        operationType: "payment_confirmed",
        amountRub: nextAmount,
        reason,
      });
    } else if (movedAcrossEvents) {
      await logRevenueAudit({
        paymentId: payment.id,
        participantId,
        enrollmentId,
        eventId,
        direction: "neutral",
        operationType: creditPayment ? "payment_reused" : "payment_transferred",
        amountRub: nextAmount,
        reason,
      });
    }

    await supabase
      .from("enrollments")
      .update(enrollmentUpdates)
      .eq("id", enrollmentId);

    return { paymentId: payment.id, status: nextStatus, reused: Boolean(creditPayment) };
  }

  const externalPaymentId = `MANUAL-${Date.now()}`;
  const { data: createdPayment, error } = await supabase
    .from("payments")
    .insert({
      participant_id: participantId,
      event_id: eventId,
      enrollment_id: enrollmentId,
      amount_rub: nextAmount,
      method: nextMethod,
      status: nextStatus,
      note: nextNote,
      external_payment_id: externalPaymentId,
    })
    .select("id")
    .single();

  if (error || !createdPayment) {
    throw new Error("Не удалось создать оплату: " + error?.message);
  }

  if (nextStatus === "Оплачен") {
    await logRevenueAudit({
      paymentId: createdPayment.id,
      participantId,
      enrollmentId,
      eventId,
      direction: "plus",
      operationType: "payment_created",
      amountRub: nextAmount,
      reason,
    });
  }

  await supabase
    .from("enrollments")
    .update(enrollmentUpdates)
    .eq("id", enrollmentId);

  return { paymentId: createdPayment.id, status: nextStatus, reused: false };
}

async function getDynamicEventPrice(eventId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("title, category, price_rub, booked_count")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return 0;
  }

  if (isFallingChairsEvent(event)) {
    return 2200;
  }

  if (!isCoffeeJamEvent(event)) {
    return event.price_rub ?? 0;
  }

  const { data: tiers } = await supabase
    .from("event_price_tiers")
    .select("seat_from, seat_to, price_rub")
    .eq("event_id", eventId)
    .order("seat_from", { ascending: true });

  return getPriceForNextBooking(
    Math.max(event.price_rub ?? 0, 770),
    event.booked_count,
    getCoffeeJamPriceTiers((tiers ?? []) as EventPriceTier[]),
  );
}

async function loadEventTariffOptions(eventId: string): Promise<EventTariffOption[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const [{ data: event, error: eventError }, { data: tiers, error: tiersError }, { data: enrollments, error: enrollmentsError }] =
    await Promise.all([
      supabase
        .from("events")
        .select("title, starts_at, capacity")
        .eq("id", eventId)
        .single(),
      supabase
        .from("event_price_tiers")
        .select("seat_from, seat_to, price_rub")
        .eq("event_id", eventId)
        .order("seat_from", { ascending: true }),
      supabase
        .from("enrollments")
        .select("note, status")
        .eq("event_id", eventId),
    ]);

  if (eventError || tiersError || enrollmentsError || !event) {
    return [];
  }

  return buildEventTariffOptions(
    event,
    tiers ?? [],
    buildTariffUsageMap(enrollments ?? []),
  ) ?? [];
}

async function resolveManualEnrollmentDetails(eventId: string, ticketNote: string | null) {
  const tariffOptions = await loadEventTariffOptions(eventId);

  if (tariffOptions.length === 0) {
    return {
      priceRub: await getDynamicEventPrice(eventId),
      ticketNote: null as string | null,
    };
  }

  const selectedTariff = findEventTariffOption(tariffOptions, ticketNote);
  if (!selectedTariff) {
    throw new Error("Выберите тариф");
  }

  if (selectedTariff.seatsLeft <= 0) {
    throw new Error(`На тариф «${selectedTariff.label}» мест больше нет`);
  }

  return {
    priceRub: selectedTariff.priceRub,
    ticketNote: selectedTariff.note,
  };
}

export async function getEventTariffOptions(eventId: string): Promise<EventTariffOption[]> {
  await requireCrmUser();

  if (!eventId) {
    return [];
  }

  return loadEventTariffOptions(eventId);
}

export async function getCrmEnrollmentFormData() {
  await requireCrmUser();
  return loadCrmEnrollmentFormData();
}

export async function addParticipant(formData: FormData) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const fullName = formData.get("fullName") as string;
  const telegram = formData.get("telegram") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  if (!fullName) throw new Error("Full name is required");

  // Убедимся что участника еще нет
  const orConditions = [];
  if (phone) orConditions.push(`phone.eq.${phone}`);
  if (telegram) orConditions.push(`telegram.eq.${telegram}`);
  if (email) orConditions.push(`email.eq.${email}`);

  if (orConditions.length > 0) {
    const { data: existingParticipants } = await supabase
      .from("participants")
      .select("id")
      .or(orConditions.join(','))
      .limit(1);
    
    if (existingParticipants && existingParticipants.length > 0) {
      throw new Error("Участник с таким телефоном, Telegram или Email уже существует");
    }
  }

  const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;

  const { error } = await supabase
    .from("participants")
    .insert({
      slug,
      full_name: fullName,
      telegram: telegram || null,
      phone: phone || null,
      email: email || null,
      source: "CRM (Вручную)",
      status: "Новый",
    });

  if (error) throw new Error("Failed to add participant");

  revalidatePath("/crm/participants");
  revalidatePath("/");
  return { success: true };
}

export async function toggleEventVisibility(eventId: string, isPublished: boolean) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("events")
    .update({ is_published: isPublished })
    .eq("id", eventId);

  if (error) throw new Error("Failed to update event visibility");

  revalidateCrmAndSite();
  return { success: true };
}

export async function updateEventStatus(eventId: string, status: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (error) throw new Error("Failed to update event status: " + error.message);

  revalidateCrmAndSite();
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) throw new Error("Failed to delete event: " + error.message);

  revalidateCrmAndSite();
  return { success: true };
}

export async function addEvent(formData: FormData) {
  await requireCrmUser();
  return saveEvent({
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    city: String(formData.get("city") ?? "Москва"),
    host: String(formData.get("host") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    capacity: parseInt(String(formData.get("capacity") ?? "10"), 10) || 10,
    price: parseInt(String(formData.get("price") ?? "4400"), 10) || 4400,
    isPublished: formData.get("isPublished") !== "false",
    status: String(formData.get("status") ?? "Открыто"),
    pricingTiers: [],
  });
}

export async function saveEvent(payload: EventPayload) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  if (!payload.title?.trim() || !payload.startsAt || !payload.endsAt) {
    throw new Error("Заполните название, дату начала и дату окончания");
  }

  const normalizedPayload = {
    title: payload.title.trim(),
    subtitle: normalizeText(payload.subtitle),
    description: normalizeText(payload.description),
    category: normalizeText(payload.category),
    city: normalizeText(payload.city) ?? "Москва",
    host: normalizeText(payload.host),
    starts_at: normalizeIsoDate(payload.startsAt),
    ends_at: normalizeIsoDate(payload.endsAt),
    capacity: Math.max(Number(payload.capacity) || 0, 1),
    price_rub: Math.max(Number(payload.price) || 0, 0),
    is_published: payload.isPublished,
    status: normalizeText(payload.status) ?? "Открыто",
  };

  let eventId = payload.id;

  if (payload.id) {
    const { error } = await supabase
      .from("events")
      .update(normalizedPayload)
      .eq("id", payload.id);

    if (error) {
      throw new Error("Не удалось обновить занятие: " + error.message);
    }
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert(normalizedPayload)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Не удалось создать занятие: " + error?.message);
    }

    eventId = data.id;
  }

  const pricingTiers = normalizePricingTiers(payload.pricingTiers);

  if (eventId) {
    const { error: deleteTiersError } = await supabase
      .from("event_price_tiers")
      .delete()
      .eq("event_id", eventId);

    if (deleteTiersError) {
      throw new Error("Не удалось обновить ценовые пороги: " + deleteTiersError.message);
    }

    if (pricingTiers.length > 0) {
      const { error: insertTiersError } = await supabase
        .from("event_price_tiers")
        .insert(pricingTiers.map((tier) => ({ ...tier, event_id: eventId })));

      if (insertTiersError) {
        throw new Error("Не удалось сохранить ценовые пороги: " + insertTiersError.message);
      }
    }
  }

  revalidateCrmAndSite();
  return { success: true, eventId };
}

export async function savePromoCode(payload: PromoCodePayload) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  if (!payload.code?.trim()) {
    throw new Error("Укажите код промокода");
  }

  const normalizedCode = payload.code.trim().toUpperCase();
  const normalizedPayload = {
    code: normalizedCode,
    description: normalizeText(payload.description),
    discount_percent: Math.min(Math.max(Number(payload.discountPercent) || 0, 1), 100),
    valid_from: normalizeIsoDate(payload.validFrom),
    expires_at: normalizeIsoDate(payload.expiresAt),
    usage_limit: payload.usageLimit ? Math.max(Number(payload.usageLimit), 1) : null,
    is_single_use: payload.isSingleUse,
    is_active: payload.isActive,
    applicable_services: payload.applicableServices?.length ? payload.applicableServices : ["all"],
  };

  if (payload.id) {
    const { error } = await supabase
      .from("promo_codes")
      .update(normalizedPayload)
      .eq("id", payload.id);

    if (error) {
      throw new Error("Не удалось обновить промокод: " + error.message);
    }
  } else {
    const { error } = await supabase
      .from("promo_codes")
      .insert(normalizedPayload);

    if (error) {
      throw new Error("Не удалось создать промокод: " + error.message);
    }
  }

  revalidateCrmAndSite();
  return { success: true };
}

export async function deletePromoCode(id: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Не удалось удалить промокод: " + error.message);
  }

  revalidateCrmAndSite();
  return { success: true };
}

export async function savePayment(payload: PaymentPayload) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  if (!payload.participantId) {
    throw new Error("Выберите участника");
  }

  const normalizedEventId = payload.eventId?.trim() ? payload.eventId : null;
  const normalizedStatus = normalizeText(payload.status) ?? "Оплачен";
  const normalizedMethod = normalizeText(payload.method) ?? "Наличные / Перевод";
  const normalizedPromoCodeId = payload.promoCodeId?.trim() ? payload.promoCodeId : null;
  const normalizedPaidAt = normalizeIsoDate(payload.paidAt) ?? new Date().toISOString();
  const normalizedAmount = Math.max(Number(payload.amountRub) || 0, 0);
  const normalizedDiscount = Math.max(Number(payload.discountAmountRub) || 0, 0);

  let existingPayment: PaymentRow | null = null;
  if (payload.id) {
    const { data } = await supabase
      .from("payments")
      .select("id, participant_id, event_id, enrollment_id, amount_rub, method, status, note, paid_at")
      .eq("id", payload.id)
      .single();
    existingPayment = (data as PaymentRow | null) ?? null;
  }

  let enrollmentId: string | null = null;
  if (normalizedEventId) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("participant_id", payload.participantId)
      .eq("event_id", normalizedEventId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    enrollmentId = enrollment?.id ?? null;
  }

  const paymentPayload = {
    participant_id: payload.participantId,
    event_id: normalizedEventId,
    enrollment_id: enrollmentId,
    amount_rub: normalizedAmount,
    method: normalizedMethod,
    status: normalizedStatus,
    paid_at: normalizedPaidAt,
    promo_code_id: normalizedPromoCodeId,
    discount_amount_rub: normalizedDiscount,
    note: normalizedEventId ? null : "Оплата без привязки к конкретной записи",
    external_payment_id: payload.id ? undefined : `MANUAL-${Date.now()}`,
  };

  let savedPaymentId = payload.id ?? null;

  if (payload.id) {
    const { error } = await supabase
      .from("payments")
      .update(paymentPayload)
      .eq("id", payload.id);

    if (error) {
      throw new Error("Не удалось обновить оплату: " + error.message);
    }
  } else {
    const { data: createdPayment, error } = await supabase
      .from("payments")
      .insert(paymentPayload)
      .select("id")
      .single();

    if (error) {
      throw new Error("Не удалось создать оплату: " + error.message);
    }

    savedPaymentId = createdPayment?.id ?? null;
  }

  if (normalizedEventId) {
    await supabase
      .from("enrollments")
      .update({
        payment_status: normalizedStatus,
      })
      .eq("participant_id", payload.participantId)
      .eq("event_id", normalizedEventId);
  }

  const previousPaid = isPaidPaymentStatus(existingPayment?.status);
  const nextPaid = isPaidPaymentStatus(normalizedStatus);
  const previousAmount = Math.max(Number(existingPayment?.amount_rub) || 0, 0);

  if (!previousPaid && nextPaid) {
    await logRevenueAudit({
      paymentId: savedPaymentId,
      participantId: payload.participantId,
      enrollmentId,
      eventId: normalizedEventId,
      direction: "plus",
      operationType: payload.id ? "payment_confirmed" : "payment_created",
      amountRub: normalizedAmount,
      reason: payload.id ? "Ручное подтверждение оплаты" : "Ручное добавление оплаченного платежа",
    });
  } else if (previousPaid && !nextPaid && isRefundPaymentStatus(normalizedStatus)) {
    await logRevenueAudit({
      paymentId: savedPaymentId,
      participantId: payload.participantId,
      enrollmentId,
      eventId: normalizedEventId,
      direction: "minus",
      operationType: "refund_issued",
      amountRub: previousAmount,
      reason: "Ручной возврат оплаты",
    });
  } else if (previousPaid && nextPaid && previousAmount !== normalizedAmount) {
    await logRevenueAudit({
      paymentId: savedPaymentId,
      participantId: payload.participantId,
      enrollmentId,
      eventId: normalizedEventId,
      direction: normalizedAmount > previousAmount ? "plus" : "minus",
      operationType: "payment_amount_adjusted",
      amountRub: Math.abs(normalizedAmount - previousAmount),
      reason: "Ручная корректировка суммы уже оплаченного платежа",
    });
  }

  revalidateCrmAndSite();

  return { success: true };
}

export async function updateParticipantStatus(id: string, status: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("participants")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error("Failed to update status");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  revalidatePath("/");
  return { success: true };
}

export async function updateParticipantData(id: string, data: { fullName: string, telegram: string, phone: string, email: string }) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const updates: {
    full_name: string;
    telegram?: string;
    phone?: string;
    email?: string;
  } = {
    full_name: data.fullName,
  };
  
  if (data.telegram) updates.telegram = data.telegram;
  if (data.phone) updates.phone = data.phone;
  if (data.email) updates.email = data.email;

  const { error } = await supabase
    .from("participants")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error("Failed to update participant data");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  revalidatePath("/");
  return { success: true };
}

export async function updateParticipantTags(id: string, tags: string[]) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("participants")
    .update({ tags })
    .eq("id", id);

  if (error) throw new Error("Failed to update tags");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  revalidatePath("/");
  return { success: true };
}

export async function addRecord(formData: FormData) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const fullName = formData.get("fullName") as string;
  const telegram = formData.get("telegram") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const eventId = formData.get("eventId") as string;
  const ticketNoteRaw = String(formData.get("ticketNote") ?? "").trim();
  const ticketNote = ticketNoteRaw || null;
  const isPaid = formData.get("isPaid") === "on";

  if (!fullName) throw new Error("Name is required");
  if (!eventId) throw new Error("Event is required");

  // 1. Убедимся что участник есть
  let participantId = null;
  const orConditions = [];
  if (phone) orConditions.push(`phone.eq.${phone}`);
  if (telegram) orConditions.push(`telegram.eq.${telegram}`);
  if (email) orConditions.push(`email.eq.${email}`);

  if (orConditions.length > 0) {
    const { data: existingParticipants } = await supabase
      .from("participants")
      .select("id")
      .or(orConditions.join(','))
      .limit(1);
    
    if (existingParticipants && existingParticipants.length > 0) {
      participantId = existingParticipants[0].id;
    }
  }

  // Fallback to name if no contact info was provided or matched, to prevent duplicates
  if (!participantId) {
    const { data: existingByName } = await supabase
      .from("participants")
      .select("id")
      .ilike("full_name", fullName)
      .limit(1);
      
    if (existingByName && existingByName.length > 0) {
      participantId = existingByName[0].id;
    }
  }

  const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;

  if (!participantId) {
    const { data: newParticipant, error: pError } = await supabase
      .from("participants")
      .insert({
        slug,
        full_name: fullName,
        telegram: telegram || null,
        phone: phone || null,
        email: email || null,
        status: "Новый",
        source: "Добавлен вручную из CRM",
      })
      .select("id")
      .single();
    if (pError) throw new Error("Failed to add participant");
    participantId = newParticipant.id;
  }

  // 2. Получим данные о событии
  const { data: event } = await supabase.from("events").select("title, starts_at").eq("id", eventId).single();
  const { priceRub, ticketNote: enrollmentNote } = await resolveManualEnrollmentDetails(eventId, ticketNote);

  // 3. Создадим запись
  const { data: enrollment, error: eError } = await supabase
    .from("enrollments")
    .insert({
      participant_id: participantId,
      event_id: eventId,
      source: "CRM (Вручную)",
      status: "Активна",
      payment_status: isPaid ? "Оплачен" : "Ожидает",
      confirmation_status: "Подтверждено",
      note: enrollmentNote,
    })
    .select("id")
    .single();

  if (eError) throw new Error("Failed to add enrollment");

  await syncPaymentForEnrollment({
    participantId,
    eventId,
    enrollmentId: enrollment.id,
    isPaid,
    amountRub: priceRub,
    method: isPaid ? "Наличные / Перевод" : "Ожидает",
    note: enrollmentNote ? `CRM: ${enrollmentNote}` : "CRM: запись из вкладки Записи",
    reason: "Новая запись участника в CRM",
  });

  // 5. Обновим next_event_title
  if (event) {
    await supabase.from("participants").update({
      next_event_title: event.title,
      next_event_at: event.starts_at,
    }).eq("id", participantId);
  }

  revalidatePath("/crm/records");
  revalidatePath("/crm/dashboard");
  revalidatePath("/crm/participants");
  revalidatePath("/");
  return { success: true };
}

export async function markEnrollmentPaid(enrollmentId: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const enrollment = await getEnrollmentDetails(enrollmentId);
  if (!enrollment) {
    throw new Error("Запись не найдена");
  }

  const tariffOptions = await loadEventTariffOptions(enrollment.event_id);
  const tariffFromNote = findEventTariffOption(tariffOptions, enrollment.note);
  const currentPriceRub = tariffFromNote?.priceRub ?? await getDynamicEventPrice(enrollment.event_id);
  await syncPaymentForEnrollment({
    participantId: enrollment.participant_id,
    eventId: enrollment.event_id,
    enrollmentId,
    isPaid: true,
    amountRub: currentPriceRub,
    method: "Наличные / Перевод",
    note: enrollment.note ?? null,
    reason: "Оплата подтверждена в CRM",
  });

  revalidateCrmAndSite();
  return { success: true };
}

export async function changeEnrollmentTariff(enrollmentId: string, ticketNote: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const enrollment = await getEnrollmentDetails(enrollmentId);
  if (!enrollment) {
    throw new Error("Запись не найдена");
  }

  if (normalizeStatus(enrollment.status).includes("отмен")) {
    throw new Error("Нельзя менять тариф у отменённой записи");
  }

  const currentNote = normalizeText(enrollment.note);
  const nextNote = normalizeText(ticketNote);
  if (!nextNote) {
    throw new Error("Выберите тариф");
  }

  if (currentNote === nextNote) {
    return { success: true };
  }

  const tariffOptions = await loadEventTariffOptions(enrollment.event_id);
  if (tariffOptions.length === 0) {
    throw new Error("У этого занятия нет тарифов");
  }

  const selectedTariff = findEventTariffOption(tariffOptions, nextNote);
  if (!selectedTariff) {
    throw new Error("Выберите тариф");
  }

  if (selectedTariff.seatsLeft <= 0) {
    throw new Error(`На тариф «${selectedTariff.label}» мест больше нет`);
  }

  const { error: enrollmentError } = await supabase
    .from("enrollments")
    .update({ note: nextNote })
    .eq("id", enrollmentId);

  if (enrollmentError) {
    throw new Error("Не удалось обновить тариф: " + enrollmentError.message);
  }

  const payment = await findPaymentForEnrollment(
    enrollment.participant_id,
    enrollment.event_id,
    enrollmentId,
  );

  if (payment) {
    const previousAmount = Math.max(Number(payment.amount_rub) || 0, 0);
    const previousPaid = isPaidPaymentStatus(payment.status);
    const nextAmount = selectedTariff.priceRub;

    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        amount_rub: nextAmount,
        note: `CRM: ${nextNote}`,
      })
      .eq("id", payment.id);

    if (paymentError) {
      throw new Error("Не удалось обновить сумму оплаты: " + paymentError.message);
    }

    if (previousPaid && previousAmount !== nextAmount) {
      await logRevenueAudit({
        paymentId: payment.id,
        participantId: enrollment.participant_id,
        enrollmentId,
        eventId: enrollment.event_id,
        direction: nextAmount > previousAmount ? "plus" : "minus",
        operationType: "tariff_changed",
        amountRub: Math.abs(nextAmount - previousAmount),
        reason: `Смена тарифа: ${formatEnrollmentTariffLabel(currentNote)} → ${selectedTariff.label}`,
      });
    }
  }

  revalidateCrmAndSite();
  return { success: true };
}

export async function transferParticipant(enrollmentId: string, newEventId: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const enrollment = await getEnrollmentDetails(enrollmentId);
  if (!enrollment) {
    throw new Error("Запись не найдена");
  }

  const linkedPayment = await findPaymentForEnrollment(enrollment.participant_id, enrollment.event_id, enrollmentId);
  const nextEventPrice = await getDynamicEventPrice(newEventId);

  const { error } = await supabase
    .from("enrollments")
    .update({ event_id: newEventId })
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to transfer: " + error.message);

  if (linkedPayment) {
    const amountRub = isPaidPaymentStatus(linkedPayment.status)
      ? Math.max(Number(linkedPayment.amount_rub) || 0, 0)
      : nextEventPrice;

    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        event_id: newEventId,
        enrollment_id: enrollmentId,
        amount_rub: amountRub,
        note: `Перенос из занятия ${enrollment.event_id}`,
      })
      .eq("id", linkedPayment.id);

    if (paymentError) {
      throw new Error("Не удалось перенести оплату: " + paymentError.message);
    }

    await logRevenueAudit({
      paymentId: linkedPayment.id,
      participantId: enrollment.participant_id,
      enrollmentId,
      eventId: newEventId,
      direction: "neutral",
      operationType: "payment_transferred",
      amountRub,
      reason: "Запись перенесена на новую дату без создания нового платежа",
    });
  } else {
    await syncPaymentForEnrollment({
      participantId: enrollment.participant_id,
      eventId: newEventId,
      enrollmentId,
      isPaid: isPaidPaymentStatus(enrollment.payment_status),
      amountRub: nextEventPrice,
      method: isPaidPaymentStatus(enrollment.payment_status) ? "Наличные / Перевод" : "Ожидает",
      note: enrollment.note ?? null,
      reason: "При переносе создана или привязана существующая оплата",
    });
  }

  revalidateCrmAndSite();
  return { success: true };
}

export async function updateEnrollmentStatus(enrollmentId: string, status: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to update status: " + error.message);

  revalidateCrmAndSite();
  return { success: true };
}

export async function cancelEnrollment(enrollmentId: string, mode: CancelEnrollmentMode = "credit") {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const enrollment = await getEnrollmentDetails(enrollmentId);
  if (!enrollment) {
    throw new Error("Запись не найдена");
  }

  const linkedPayment = await findPaymentForEnrollment(enrollment.participant_id, enrollment.event_id, enrollmentId);
  const nextPaymentStatus = mode === "refund"
    ? "Возврат"
    : (linkedPayment?.status ?? enrollment.payment_status ?? "Ожидает");

  const { error } = await supabase
    .from("enrollments")
    .update({
      status: "Отменена",
      confirmation_status: "Отменена",
      payment_status: nextPaymentStatus,
    })
    .eq("id", enrollmentId);

  if (error) {
    throw new Error("Не удалось отменить запись: " + error.message);
  }

  if (linkedPayment) {
    const updatedPayment = {
      event_id: null,
      enrollment_id: null,
      status: mode === "refund" ? "Возврат" : linkedPayment.status,
      note: mode === "refund" ? "Возврат после отмены записи" : "Оплата сохранена после отмены записи",
    };

    const { error: paymentError } = await supabase
      .from("payments")
      .update(updatedPayment)
      .eq("id", linkedPayment.id);

    if (paymentError) {
      throw new Error("Не удалось обновить оплату при отмене: " + paymentError.message);
    }

    await logRevenueAudit({
      paymentId: linkedPayment.id,
      participantId: enrollment.participant_id,
      enrollmentId,
      eventId: enrollment.event_id,
      direction: mode === "refund" ? "minus" : "neutral",
      operationType: mode === "refund" ? "refund_issued" : "cancellation_credit_retained",
      amountRub: Math.max(Number(linkedPayment.amount_rub) || 0, 0),
      reason: mode === "refund"
        ? "Отмена записи с полным возвратом средств"
        : "Отмена записи с сохранением оплаты для повторной записи",
    });
  }

  revalidateCrmAndSite();
  return { success: true };
}

export async function updateEnrollment(enrollmentId: string, updates: { event_id?: string, status?: string, payment_status?: string }) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const currentEnrollment = await getEnrollmentDetails(enrollmentId);
  if (!currentEnrollment) {
    throw new Error("Запись не найдена");
  }

  if (updates.event_id && updates.event_id !== currentEnrollment.event_id) {
    await transferParticipant(enrollmentId, updates.event_id);
  }

  if (updates.status && updates.status !== currentEnrollment.status) {
    if (normalizeStatus(updates.status).includes("отмен")) {
      await cancelEnrollment(enrollmentId, "credit");
    } else {
      await updateEnrollmentStatus(enrollmentId, updates.status);
    }
  }

  if (updates.payment_status && updates.payment_status !== currentEnrollment.payment_status) {
    const currentPriceRub = await getDynamicEventPrice(currentEnrollment.event_id);
    await syncPaymentForEnrollment({
      participantId: currentEnrollment.participant_id,
      eventId: currentEnrollment.event_id,
      enrollmentId,
      isPaid: isPaidPaymentStatus(updates.payment_status),
      amountRub: currentPriceRub,
      method: isPaidPaymentStatus(updates.payment_status) ? "Наличные / Перевод" : "Ожидает",
      note: currentEnrollment.note ?? null,
      reason: "Статус оплаты обновлен вручную в CRM",
    });
  }

  revalidateCrmAndSite();
  return { success: true };
}

export async function updateParticipantNote(id: string, note: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("participants")
    .update({ note })
    .eq("id", id);

  if (error) throw new Error("Failed to update note");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  revalidatePath("/");
  return { success: true };
}

export async function addParticipantEnrollment(formData: FormData) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const participantId = formData.get("participantId") as string;
  const eventId = formData.get("eventId") as string;
  const ticketNoteRaw = String(formData.get("ticketNote") ?? "").trim();
  const ticketNote = ticketNoteRaw || null;
  const isPaid = formData.get("isPaid") === "on";

  if (!participantId || !eventId) throw new Error("Participant and Event are required");

  const { data: event } = await supabase.from("events").select("title, starts_at").eq("id", eventId).single();
  const { priceRub, ticketNote: enrollmentNote } = await resolveManualEnrollmentDetails(eventId, ticketNote);

  const { data: enrollment, error: eError } = await supabase
    .from("enrollments")
    .insert({
      participant_id: participantId,
      event_id: eventId,
      source: "CRM (Вручную)",
      status: "Активна",
      payment_status: isPaid ? "Оплачен" : "Ожидает",
      confirmation_status: "Подтверждено",
      note: enrollmentNote,
    })
    .select("id")
    .single();

  if (eError) throw new Error("Failed to add enrollment");

  await syncPaymentForEnrollment({
    participantId,
    eventId,
    enrollmentId: enrollment.id,
    isPaid,
    amountRub: priceRub,
    method: isPaid ? "Наличные / Перевод" : "Ожидает",
    note: enrollmentNote ? `CRM: ${enrollmentNote}` : "CRM: запись из карточки участника",
    reason: "Новая запись из карточки участника",
  });

  if (event) {
    await supabase.from("participants").update({
      next_event_title: event.title,
      next_event_at: event.starts_at,
    }).eq("id", participantId);
  }

  revalidateCrmAndSite();
  return { success: true };
}
export async function getEventParticipants(eventId: string) {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Supabase client not configured", data: [] };

  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id,
      status,
      payment_status,
      note,
      participant:participants (
        id,
        full_name,
        telegram,
        slug
      )
    `)
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching event participants:", error);
    return { error: error.message, data: [] };
  }

  const normalizedRows = ((data ?? []) as Array<{
    id: string;
    status: string | null;
    payment_status: string | null;
    note: string | null;
    participant:
      | {
          id: string;
          full_name: string | null;
          telegram: string | null;
          slug: string | null;
        }
      | Array<{
          id: string;
          full_name: string | null;
          telegram: string | null;
          slug: string | null;
        }>
      | null;
  }>).map((row) => ({
    ...row,
    participant: Array.isArray(row.participant) ? (row.participant[0] ?? null) : row.participant,
  }));

  return { error: null, data: normalizedRows as Array<{
    id: string;
    status: string | null;
    payment_status: string | null;
    note: string | null;
    participant: {
      id: string;
      full_name: string | null;
      telegram: string | null;
      slug: string | null;
    } | null;
  }> };
}

export async function getAvailableEventsForTransfer() {
  await requireCrmUser();
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Supabase not configured", data: [] };

  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, status")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) return { error: error.message, data: [] };
  return { error: null, data: (data ?? []) as Array<{ id: string; title: string; starts_at: string; status: string | null }> };
}
