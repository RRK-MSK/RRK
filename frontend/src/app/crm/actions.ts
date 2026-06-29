"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function addParticipant(formData: FormData) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const fullName = formData.get("fullName") as string;
  const telegram = formData.get("telegram") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  if (!fullName) throw new Error("Name is required");

  const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;

  const { error } = await supabase.from("participants").insert({
    slug,
    full_name: fullName,
    telegram: telegram || null,
    phone: phone || null,
    email: email || null,
    status: "Новый",
    source: "Добавлен вручную из CRM",
  });

  if (error) {
    console.error("Error adding participant:", error);
    throw new Error(error.message || "Failed to add participant");
  }

  revalidatePath("/crm/participants");
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

  const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;

  // 1. Убедимся что участник есть
  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("slug", slug)
    .single();

  let participantId = existing?.id;

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
  const { data: event } = await supabase.from("events").select("price_rub, title, starts_at").eq("id", eventId).single();

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
    amount_rub: event?.price_rub || 0,
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
  return { success: true };
}

export async function addParticipantEnrollment(formData: FormData) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const participantId = formData.get("participantId") as string;
  const eventId = formData.get("eventId") as string;
  const isPaid = formData.get("isPaid") === "on";

  if (!participantId || !eventId) throw new Error("Participant and Event are required");

  const { data: event } = await supabase.from("events").select("price_rub, title, starts_at").eq("id", eventId).single();

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
    amount_rub: event?.price_rub || 0,
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
