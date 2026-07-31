import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram";

type PaymentMetadata = Record<string, string | null | undefined>;

type ConfirmTBankPaymentInput = {
  paymentId: string;
  orderId?: string | null;
  amountKopecks?: number | null;
  data?: PaymentMetadata | null;
  reason?: string;
};

function getMetaValue(data: PaymentMetadata | null | undefined, key: string) {
  const value = data?.[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function appendOrderMarker(note: string | null | undefined, orderId?: string | null) {
  const marker = orderId ? `[order:${orderId}]` : null;
  if (!marker) {
    return note ?? null;
  }

  if ((note ?? "").includes(marker)) {
    return note ?? null;
  }

  return [note, marker].filter(Boolean).join(" | ");
}

async function ensureParticipantId(data: PaymentMetadata | null | undefined) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const directParticipantId = getMetaValue(data, "ParticipantId");
  if (directParticipantId) {
    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("id", directParticipantId)
      .maybeSingle();

    if (participant?.id) {
      return participant.id;
    }
  }

  const phone = getMetaValue(data, "Phone");
  const telegram = getMetaValue(data, "Telegram");
  const email = getMetaValue(data, "Email");
  const source = getMetaValue(data, "Source") ?? "Сайт (Оплата Т-Банк)";
  const fullName = getMetaValue(data, "FullName") ?? "Участник РРК";

  const orConditions: string[] = [];
  if (phone) orConditions.push(`phone.eq.${phone}`);
  if (telegram) orConditions.push(`telegram.eq.${telegram}`);
  if (email) orConditions.push(`email.eq.${email}`);

  if (orConditions.length > 0) {
    const { data: existingParticipant } = await supabase
      .from("participants")
      .select("id")
      .or(orConditions.join(","))
      .limit(1)
      .maybeSingle();

    if (existingParticipant?.id) {
      return existingParticipant.id;
    }
  }

  if (!phone && !telegram && !email && !fullName) {
    return null;
  }

  const slugBase = (telegram ?? email?.split("@")[0] ?? `user-${Date.now()}`).replace("@", "").toLowerCase();
  const { data: createdParticipant, error } = await supabase
    .from("participants")
    .insert({
      slug: slugBase,
      full_name: fullName,
      phone,
      telegram,
      email,
      status: "Новый",
      source,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to recover participant from payment metadata:", error);
  }

  return createdParticipant?.id ?? null;
}

async function ensureEnrollmentId(
  participantId: string | null,
  eventId: string | null,
  data: PaymentMetadata | null | undefined,
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !participantId || !eventId) {
    return null;
  }

  const directEnrollmentId = getMetaValue(data, "EnrollmentId");
  if (directEnrollmentId) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("id", directEnrollmentId)
      .maybeSingle();

    if (enrollment?.id) {
      return enrollment.id;
    }
  }

  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("participant_id", participantId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingEnrollment?.id) {
    return existingEnrollment.id;
  }

  const source = getMetaValue(data, "Source") ?? "Сайт (Оплата Т-Банк)";
  const ticketNote = getMetaValue(data, "TicketNote");

  const { data: createdEnrollment, error } = await supabase
    .from("enrollments")
    .insert({
      participant_id: participantId,
      event_id: eventId,
      source,
      status: "Активна",
      payment_status: "Оплачен",
      confirmation_status: "Подтверждено",
      note: ticketNote,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to recover enrollment from payment metadata:", error);
  }

  return createdEnrollment?.id ?? null;
}

function formatMoscowDate(dateStr?: string | null) {
  if (!dateStr) return "";

  return new Date(dateStr).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function confirmTBankPayment({
  paymentId,
  orderId,
  amountKopecks,
  data,
  reason = "T-Банк подтвердил оплату",
}: ConfirmTBankPaymentInput) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { ok: false as const, error: "supabase_unavailable" };
  }

  const externalPaymentId = String(paymentId);

  const paymentLookup = await supabase
    .from("payments")
    .select("id, participant_id, event_id, enrollment_id, amount_rub, status, promo_code_id, note")
    .eq("external_payment_id", externalPaymentId)
    .maybeSingle();
  let paymentInfo = paymentLookup.data;
  const paymentError = paymentLookup.error;

  if (paymentError) {
    console.error("Failed to load payment by external_payment_id:", paymentError);
  }

  const participantId = paymentInfo?.participant_id ?? await ensureParticipantId(data);
  const eventId = paymentInfo?.event_id ?? getMetaValue(data, "EventId");
  const enrollmentId = paymentInfo?.enrollment_id ?? await ensureEnrollmentId(participantId, eventId, data);
  const amountRub = paymentInfo?.amount_rub ?? Math.round((amountKopecks ?? 0) / 100);
  const paymentNoteBase = appendOrderMarker(paymentInfo?.note ?? null, orderId);
  const paymentNote = !paymentInfo
    ? [paymentNoteBase, "Восстановлено из webhook/redirect"].filter(Boolean).join(" | ")
    : paymentNoteBase;

  if (!paymentInfo && participantId && eventId) {
    const { data: createdPayment, error } = await supabase
      .from("payments")
      .insert({
        participant_id: participantId,
        event_id: eventId,
        enrollment_id: enrollmentId,
        amount_rub: amountRub,
        method: "Т-Банк",
        status: "Ждет",
        external_payment_id: externalPaymentId,
        note: paymentNote || null,
        paid_at: new Date().toISOString(),
      })
      .select("id, participant_id, event_id, enrollment_id, amount_rub, status, promo_code_id, note")
      .single();

    if (error) {
      console.error("Failed to create recovered payment:", error);
      return { ok: false as const, error: "payment_recovery_failed" };
    }

    paymentInfo = createdPayment;
  }

  if (!paymentInfo) {
    return { ok: false as const, error: "payment_not_found" };
  }

  const isAlreadyPaid = paymentInfo.status === "Оплачен";
  const nextParticipantId = participantId ?? paymentInfo.participant_id;
  const nextEventId = eventId ?? paymentInfo.event_id;
  const nextEnrollmentId = enrollmentId ?? paymentInfo.enrollment_id;

  await supabase
    .from("payments")
    .update({
      participant_id: nextParticipantId,
      event_id: nextEventId,
      enrollment_id: nextEnrollmentId,
      status: "Оплачен",
      paid_at: new Date().toISOString(),
      note: paymentNote || paymentInfo.note,
    })
    .eq("id", paymentInfo.id);

  if (nextEnrollmentId) {
    await supabase
      .from("enrollments")
      .update({ payment_status: "Оплачен", confirmation_status: "Подтверждено" })
      .eq("id", nextEnrollmentId);
  } else if (nextParticipantId && nextEventId) {
    await supabase
      .from("enrollments")
      .update({ payment_status: "Оплачен", confirmation_status: "Подтверждено" })
      .eq("participant_id", nextParticipantId)
      .eq("event_id", nextEventId);
  }

  if (paymentInfo.promo_code_id && !isAlreadyPaid) {
    try {
      await supabase.from("promo_code_usages").insert({
        promo_code_id: paymentInfo.promo_code_id,
        participant_id: nextParticipantId,
        order_id: externalPaymentId,
      });
    } catch (error) {
      console.error("Failed to store promo usage on payment confirmation:", error);
    }
  }

  if (!isAlreadyPaid) {
    await supabase.from("revenue_audit_log").insert({
      payment_id: paymentInfo.id,
      participant_id: nextParticipantId,
      enrollment_id: nextEnrollmentId,
      event_id: nextEventId,
      direction: "plus",
      operation_type: "payment_confirmed",
      amount_rub: amountRub,
      reason,
    });
  }

  const [{ data: participant }, { data: event }] = await Promise.all([
    nextParticipantId
      ? supabase
          .from("participants")
          .select("full_name, phone, telegram, source")
          .eq("id", nextParticipantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    nextEventId
      ? supabase
          .from("events")
          .select("title, capacity, booked_count, starts_at")
          .eq("id", nextEventId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!isAlreadyPaid && participant && event) {
    const spotsLeft = Math.max((event.capacity || 0) - (event.booked_count || 0), 0);
    const paymentDate = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendTelegramNotification({
      eventName: event.title,
      spotsLeft,
      name: participant.full_name,
      phone: participant.phone || getMetaValue(data, "Phone") || "",
      telegram: participant.telegram || getMetaValue(data, "Telegram") || "",
      orderNumber: String(orderId || externalPaymentId),
      eventDate: formatMoscowDate(event.starts_at),
      source: getMetaValue(data, "Source") || participant.source,
      paymentDate,
      promoCodeUsed: !!paymentInfo.promo_code_id,
    });

    try {
      const { sendEmailNotification } = await import("@/lib/email");
      await sendEmailNotification({
        eventName: event.title,
        fullName: participant.full_name,
        phone: participant.phone || getMetaValue(data, "Phone") || "",
        telegram: participant.telegram || getMetaValue(data, "Telegram") || "",
        orderId: String(orderId || externalPaymentId),
      });
    } catch (error) {
      console.error("Failed to send payment confirmation email:", error);
    }
  }

  return {
    ok: true as const,
    isAlreadyPaid,
    participantId: nextParticipantId,
    eventId: nextEventId,
    enrollmentId: nextEnrollmentId,
  };
}
