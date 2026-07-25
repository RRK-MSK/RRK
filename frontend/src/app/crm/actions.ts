"use server";

import { revalidatePath } from "next/cache";
import { getPriceForNextBooking, type EventPriceTier } from "@/lib/event-pricing";
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

function revalidateCrmAndSite() {
  revalidatePath("/crm/classes");
  revalidatePath("/crm/dashboard");
  revalidatePath("/crm/promos");
  revalidatePath("/crm/analytics");
  revalidatePath("/");
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeIsoDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
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

async function getDynamicEventPrice(eventId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("price_rub, booked_count")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return 0;
  }

  const { data: tiers } = await supabase
    .from("event_price_tiers")
    .select("seat_from, seat_to, price_rub")
    .eq("event_id", eventId)
    .order("seat_from", { ascending: true });

  return getPriceForNextBooking(
    event.price_rub,
    event.booked_count,
    ((tiers ?? []) as EventPriceTier[]),
  );
}

export async function addParticipant(formData: FormData) {
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

export async function updateParticipantStatus(id: string, status: string) {
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
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const updates: any = {
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
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const fullName = formData.get("fullName") as string;
  const telegram = formData.get("telegram") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const eventId = formData.get("eventId") as string;
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
  const currentPriceRub = await getDynamicEventPrice(eventId);

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
    })
    .select("id")
    .single();

  if (eError) throw new Error("Failed to add enrollment");

  // 4. Создадим платеж
  await supabase.from("payments").insert({
    participant_id: participantId,
    event_id: eventId,
    amount_rub: currentPriceRub,
    method: isPaid ? "Наличные / Перевод" : "Ожидает",
    status: isPaid ? "Оплачен" : "Ожидает",
    external_payment_id: `MANUAL-${Date.now()}`,
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
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("enrollments")
    .update({ payment_status: "Оплачен" })
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to mark paid: " + error.message);

  revalidatePath("/crm/classes");
  revalidatePath("/crm/dashboard");
  revalidatePath("/crm/participants");
  revalidatePath("/crm/records");
  return { success: true };
}

export async function transferParticipant(enrollmentId: string, newEventId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("enrollments")
    .update({ event_id: newEventId })
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to transfer: " + error.message);

  revalidatePath("/crm/classes");
  revalidatePath("/crm/dashboard");
  revalidatePath("/crm/participants");
  return { success: true };
}

export async function updateEnrollmentStatus(enrollmentId: string, status: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to update status: " + error.message);

  revalidatePath("/crm/classes");
  revalidatePath("/crm/dashboard");
  revalidatePath("/crm/participants");
  return { success: true };
}

export async function updateEnrollment(enrollmentId: string, updates: { event_id?: string, status?: string, payment_status?: string }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("enrollments")
    .update(updates)
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to update enrollment");

  // If payment_status is being updated, we should also try to update or insert a payment record
  if (updates.payment_status) {
    const { data: enrollment } = await supabase.from("enrollments").select("participant_id, event_id, events(price_rub)").eq("id", enrollmentId).single();
    if (enrollment) {
      const isPaid = updates.payment_status === "Оплачен";
      
      if (isPaid) {
        // Upsert payment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const price = (enrollment.events as any)?.price_rub || 0;
        const { data: existingPayment } = await supabase.from("payments")
          .select("id").eq("participant_id", enrollment.participant_id).eq("event_id", enrollment.event_id).limit(1).maybeSingle();
          
        if (existingPayment) {
          await supabase.from("payments").update({ status: "Оплачен", amount_rub: price }).eq("id", existingPayment.id);
        } else {
          await supabase.from("payments").insert({
            participant_id: enrollment.participant_id,
            event_id: enrollment.event_id,
            amount_rub: price,
            method: "Наличные / Перевод",
            status: "Оплачен",
            external_payment_id: `MANUAL-${Date.now()}`,
          });
        }
      } else {
        // Mark payment as waiting or delete it? We'll just mark it as pending
        await supabase.from("payments").update({ status: "Ожидает" })
          .eq("participant_id", enrollment.participant_id).eq("event_id", enrollment.event_id);
      }
    }
  }

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  revalidatePath("/");
  return { success: true };
}

export async function updateParticipantNote(id: string, note: string) {
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
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const participantId = formData.get("participantId") as string;
  const eventId = formData.get("eventId") as string;
  const isPaid = formData.get("isPaid") === "on";

  if (!participantId || !eventId) throw new Error("Participant and Event are required");

  const { data: event } = await supabase.from("events").select("title, starts_at").eq("id", eventId).single();
  const currentPriceRub = await getDynamicEventPrice(eventId);

  const { error: eError } = await supabase
    .from("enrollments")
    .insert({
      participant_id: participantId,
      event_id: eventId,
      source: "CRM (Вручную)",
      status: "Активна",
      payment_status: isPaid ? "Оплачен" : "Ожидает",
      confirmation_status: "Подтверждено",
    });

  if (eError) throw new Error("Failed to add enrollment");

  await supabase.from("payments").insert({
    participant_id: participantId,
    event_id: eventId,
    amount_rub: currentPriceRub,
    method: isPaid ? "Наличные / Перевод" : "Ожидает",
    status: isPaid ? "Оплачен" : "Ожидает",
    external_payment_id: `MANUAL-${Date.now()}`,
  });

  if (event) {
    await supabase.from("participants").update({
      next_event_title: event.title,
      next_event_at: event.starts_at,
    }).eq("id", participantId);
  }

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  revalidatePath("/");
  return { success: true };
}
export async function getEventParticipants(eventId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Supabase client not configured", data: [] };

  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id,
      status,
      payment_status,
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

  return { error: null, data: data as any[] };
}

export async function getAvailableEventsForTransfer() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { error: "Supabase not configured", data: [] };

  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, status")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) return { error: error.message, data: [] };
  return { error: null, data: data as any[] };
}
