import "server-only";

import {
  buildParticipantLookupOrFilter,
  validateAndNormalizeBooking,
  validateParticipantFields,
} from "@/lib/booking-validation";
import { buildCompanionsMarker, buildEnrollmentsMarker, buildPaymentNote } from "@/lib/booking-notes";
import { findExistingParticipantId } from "@/lib/participant-identity";
import { isCoffeeJamCategory } from "@/lib/event-categories";
import { hasTextOnlyEventPrice } from "@/lib/event-payment";
import { resolveCoffeeJamPrice, type EventPriceTier } from "@/lib/event-pricing";
import { getTariffNotesForCapacityCheck } from "@/lib/event-tariffs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram";
import { tbank } from "@/lib/tbank/client";

type BookingParticipantInput = {
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string;
  email: string;
  ticketLabel?: string;
  ticketPriceRub?: number;
  ticketCapacity?: number;
};

type PreparedParticipant = BookingParticipantInput & {
  participantId: string;
  enrollmentId: string;
  ticketNote: string | null;
};

function isPromoWithinDateRange(promoCode: { valid_from?: string | null; expires_at?: string | null }) {
  const now = Date.now();
  const validFrom = promoCode.valid_from ? new Date(promoCode.valid_from).getTime() : null;
  const expiresAt = promoCode.expires_at ? new Date(promoCode.expires_at).getTime() : null;
  if (validFrom && validFrom > now) return false;
  if (expiresAt && expiresAt < now) return false;
  return true;
}

function isBigTrainingBooking(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("большая тренировка") || normalized.includes("big тренировка");
}

function isCoffeeJamBooking(value: string | null | undefined, category?: string | null) {
  if (isCoffeeJamCategory(category, value)) return true;
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("coffee jam") || normalized.includes("кофе джем");
}

function isFallingChairsBooking(value: string | null | undefined) {
  return (value ?? "").toLowerCase().includes("падающими стульями");
}

function toKopecks(amountRub: number) {
  return Math.round(Number(amountRub) * 100);
}

function allocateReceiptItemKopecks(itemPricesRub: number[], payableRub: number) {
  const rawItemKopecks = itemPricesRub.map((price) => toKopecks(Math.max(0, price)));
  const rawTotalKopecks = rawItemKopecks.reduce((sum, value) => sum + value, 0);
  const amountKopecks = toKopecks(Math.max(0, payableRub));

  if (rawItemKopecks.length === 0 || rawTotalKopecks <= 0 || amountKopecks === rawTotalKopecks) {
    return { itemKopecks: rawItemKopecks, amountKopecks };
  }

  const itemKopecks = rawItemKopecks.map((itemKopecksValue, index) => {
    if (index === rawItemKopecks.length - 1) {
      return 0;
    }

    return Math.max(0, Math.round((itemKopecksValue / rawTotalKopecks) * amountKopecks));
  });
  const allocatedKopecks = itemKopecks.slice(0, -1).reduce((sum, value) => sum + value, 0);
  itemKopecks[itemKopecks.length - 1] = Math.max(0, amountKopecks - allocatedKopecks);

  return { itemKopecks, amountKopecks };
}

function parseEventReference(eventId: string) {
  if (eventId.includes("::")) {
    const [dbEventId, eventTitle] = eventId.split("::");
    return { dbEventId, eventTitle };
  }

  const eventTitleMatch = eventId.split(" - ")[1];
  const eventTitleRaw = eventTitleMatch || eventId;
  return {
    dbEventId: null as string | null,
    eventTitle: eventTitleRaw ? eventTitleRaw.replace(/\s*\([^)]*\)$/, "").trim() : null,
  };
}

function parseParticipantsPayload(data: Record<string, unknown>, eventId: string) {
  if (Array.isArray(data.participants) && data.participants.length > 0) {
    const parsed = [];

    for (const [index, rawParticipant] of data.participants.entries()) {
      const participant = rawParticipant as Record<string, unknown>;
      const validation = validateParticipantFields({
        firstName: String(participant.firstName ?? ""),
        lastName: String(participant.lastName ?? ""),
        phone: String(participant.phone ?? ""),
        telegram: String(participant.telegram ?? ""),
        email: String(participant.email ?? ""),
      }, { emailRequired: index === 0 });

      if (!validation.ok) {
        return { ok: false as const, error: `Участник ${index + 1}: ${validation.error}` };
      }

      parsed.push({
        ...validation.data,
        ticketLabel: typeof participant.ticketLabel === "string" ? participant.ticketLabel.trim() : "",
        ticketPriceRub: Number(participant.ticketPriceRub ?? 0),
        ticketCapacity: Number(participant.ticketCapacity ?? 0),
      });
    }

    return { ok: true as const, participants: parsed, eventId, paymentMethod: data.paymentMethod === "sbp" ? "sbp" as const : "card" as const };
  }

  const validation = validateAndNormalizeBooking({
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    phone: String(data.phone ?? ""),
    telegram: String(data.telegram ?? ""),
    email: String(data.email ?? ""),
    eventId: String(data.eventId ?? ""),
    paymentMethod: String(data.paymentMethod ?? "card"),
  });

  if (!validation.ok) {
    return { ok: false as const, error: validation.error };
  }

  return {
    ok: true as const,
    participants: [{
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      phone: validation.data.phone,
      telegram: validation.data.telegram,
      email: validation.data.email,
      ticketLabel: typeof data.ticketLabel === "string" ? data.ticketLabel.trim() : "",
      ticketPriceRub: Number(data.ticketPriceRub ?? 0),
      ticketCapacity: Number(data.ticketCapacity ?? 0),
    }],
    eventId: validation.data.eventId,
    paymentMethod: validation.data.paymentMethod,
  };
}

async function resolveEventPricing(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  dbEventId: string | null,
  eventTitle: string | null,
  eventId: string,
) {
  let priceRub = 4400;
  let bookedCount = 0;
  let eventBasePriceRub: number | null = null;
  let eventPriceLabel: string | null = null;
  let eventCategory: string | null = null;
  let resolvedEventId = dbEventId;

  if (!resolvedEventId && eventTitle) {
    const { data: events } = await supabase
      .from("events")
      .select("id, price_rub, price_label, booked_count, category, title")
      .ilike("title", `${eventTitle}%`)
      .limit(1);

    if (events?.[0]) {
      resolvedEventId = events[0].id;
      eventCategory = events[0].category ?? null;
      bookedCount = events[0].booked_count || 0;
      if (hasTextOnlyEventPrice(events[0].price_label)) {
        eventPriceLabel = events[0].price_label!.trim();
        priceRub = 0;
        eventBasePriceRub = 0;
      } else {
        eventBasePriceRub = events[0].price_rub ?? null;
        priceRub = isFallingChairsBooking(eventTitle)
          ? 2200
          : isBigTrainingBooking(eventTitle)
            ? 5500
            : (isCoffeeJamBooking(eventTitle, events[0].category)
              ? Math.max(events[0].price_rub ?? 0, 770)
              : (events[0].price_rub || priceRub));
      }
    }
  } else if (resolvedEventId) {
    const { data: eventRow } = await supabase
      .from("events")
      .select("price_rub, price_label, booked_count, category, title")
      .eq("id", resolvedEventId)
      .single();

    if (eventRow) {
      eventCategory = eventRow.category ?? null;
      bookedCount = eventRow.booked_count || 0;
      if (hasTextOnlyEventPrice(eventRow.price_label)) {
        eventPriceLabel = eventRow.price_label!.trim();
        priceRub = 0;
        eventBasePriceRub = 0;
      } else {
        eventBasePriceRub = eventRow.price_rub ?? null;
        priceRub = isFallingChairsBooking(eventTitle ?? eventId)
          ? 2200
          : isBigTrainingBooking(eventTitle ?? eventId)
            ? 5500
            : (isCoffeeJamBooking(eventTitle ?? eventId, eventRow.category)
              ? Math.max(eventRow.price_rub ?? 0, 770)
              : (eventRow.price_rub || priceRub));
      }
    }
  }

  if (resolvedEventId && !hasTextOnlyEventPrice(eventPriceLabel)) {
    const { data: priceTiers } = await supabase
      .from("event_price_tiers")
      .select("seat_from, seat_to, price_rub")
      .eq("event_id", resolvedEventId)
      .order("seat_from", { ascending: true });

    if ((priceTiers ?? []).length > 0) {
      priceRub = resolveCoffeeJamPrice(priceRub, bookedCount, (priceTiers ?? []) as EventPriceTier[]);
    }
  }

  return {
    dbEventId: resolvedEventId,
    priceRub,
    bookedCount,
    eventBasePriceRub,
    eventPriceLabel,
    eventCategory,
    eventTitle,
  };
}

function resolveParticipantPriceRub(
  participant: BookingParticipantInput,
  fallbackPriceRub: number,
  eventTitle: string | null,
  eventId: string,
  eventPriceLabel: string | null,
) {
  if ((participant.ticketPriceRub ?? 0) > 0 && !hasTextOnlyEventPrice(eventPriceLabel)) {
    return participant.ticketPriceRub ?? 0;
  }

  if (hasTextOnlyEventPrice(eventPriceLabel)) {
    return 0;
  }

  if (eventId.includes("Тестовое")) return 1;
  if (isFallingChairsBooking(eventTitle ?? eventId)) return 2200;
  if (isBigTrainingBooking(eventTitle ?? eventId) || eventId.includes("5000")) return 5500;
  if (eventId.includes("10 000")) return 10000;

  return fallbackPriceRub;
}

async function ensureParticipant(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  participant: BookingParticipantInput,
  source: string,
  usedParticipantIds: string[] = [],
) {
  const actualSource = source === "Telegram Mini App" ? "Telegram Mini App" : "Сайт (Оплата Т-Банк)";
  const fullName = `${participant.firstName} ${participant.lastName}`.trim();
  const existingId = await findExistingParticipantId(
    supabase,
    {
      fullName,
      phone: participant.phone,
      telegram: participant.telegram,
      email: participant.email,
    },
    { excludeIds: usedParticipantIds },
  );

  if (existingId) {
    return existingId;
  }

  const telegramSlug = participant.telegram?.replace("@", "").toLowerCase() || "";
  const slugs = [
    telegramSlug || `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    `${telegramSlug || "user"}-${Date.now().toString().slice(-6)}`,
  ];

  for (const slug of slugs) {
    const { data: newParticipant, error } = await supabase
      .from("participants")
      .insert({
        slug,
        full_name: fullName,
        phone: participant.phone || null,
        telegram: participant.telegram || null,
        email: participant.email || null,
        status: "Новый",
        source: actualSource,
      })
      .select("id")
      .single();

    if (!error && newParticipant?.id) {
      return newParticipant.id as string;
    }

    if (error && error.code !== "23505") {
      console.error("Participant insert error:", error);
      return null;
    }
  }

  console.error("Participant insert error: slug already exists");
  return null;
}

async function ensureEnrollment(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  participantId: string,
  dbEventId: string,
  ticketNote: string | null,
  source: string,
) {
  const actualSource = source === "Telegram Mini App" ? "Telegram Mini App" : "Сайт (Оплата Т-Банк)";
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .insert({
      participant_id: participantId,
      event_id: dbEventId,
      status: "Активна",
      payment_status: "Ждет оплату",
      source: actualSource,
      note: ticketNote,
    })
    .select("id")
    .single();

  if (!error && enrollment?.id) {
    return enrollment.id as string;
  }

  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("participant_id", participantId)
    .eq("event_id", dbEventId)
    .maybeSingle();

  return existingEnrollment?.id ?? null;
}

async function assertTariffCapacity(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  dbEventId: string,
  participants: BookingParticipantInput[],
) {
  const countsByTariff = new Map<string, { label: string; capacity: number; count: number }>();

  for (const participant of participants) {
    if (!participant.ticketLabel || (participant.ticketCapacity ?? 0) <= 0) {
      continue;
    }

    const current = countsByTariff.get(participant.ticketLabel) ?? {
      label: participant.ticketLabel,
      capacity: participant.ticketCapacity ?? 0,
      count: 0,
    };
    current.count += 1;
    countsByTariff.set(participant.ticketLabel, current);
  }

  for (const tariff of countsByTariff.values()) {
    const ticketNote = `Тариф: ${tariff.label}`;
    const tariffNotes = getTariffNotesForCapacityCheck(ticketNote);
    const { data: existingTariffBookings, error } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("event_id", dbEventId)
      .in("note", tariffNotes);

    if (error) {
      console.error("Tariff seats check error:", error);
      continue;
    }

    const tariffBookedCount = (existingTariffBookings ?? []).filter(
      (row) => !(row.status ?? "").toLowerCase().includes("отмен"),
    ).length;

    if (tariffBookedCount + tariff.count > tariff.capacity) {
      return `На тариф «${tariff.label}» недостаточно мест`;
    }
  }

  return null;
}

export async function createBookingRequest(data: Record<string, unknown>, request: Request) {
  const parsedPayload = parseParticipantsPayload(data, String(data.eventId ?? ""));
  if (!parsedPayload.ok) {
    return NextResponseLike(false, parsedPayload.error, 400);
  }

  const { participants, eventId, paymentMethod } = parsedPayload;
  const source = typeof data.source === "string" ? data.source : "Сайт";
  const promoCode = typeof data.promoCode === "string" ? data.promoCode.trim() : "";
  const payer = participants[0];
  const { dbEventId: initialEventId, eventTitle } = parseEventReference(eventId);
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponseLike(false, "Сервис временно недоступен", 500);
  }

  const pricing = await resolveEventPricing(supabase, initialEventId, eventTitle, eventId);
  const dbEventId = pricing.dbEventId;
  const resolvedEventTitle = pricing.eventTitle ?? eventTitle;

  const participantPrices = participants.map((participant) =>
    resolveParticipantPriceRub(
      participant,
      pricing.priceRub,
      resolvedEventTitle,
      eventId,
      pricing.eventPriceLabel,
    ),
  );
  let priceRub = participantPrices.reduce((sum, value) => sum + value, 0);

  if (dbEventId) {
    const capacityError = await assertTariffCapacity(supabase, dbEventId, participants);
    if (capacityError) {
      return NextResponseLike(false, capacityError, 400);
    }
  }

  const preparedParticipants: PreparedParticipant[] = [];
  const usedParticipantIds: string[] = [];

  for (const [index, participant] of participants.entries()) {
    const participantId = await ensureParticipant(supabase, participant, source, usedParticipantIds);
    if (!participantId || !dbEventId) {
      return NextResponseLike(false, "Не удалось подготовить запись к оплате. Попробуйте еще раз.", 500);
    }

    usedParticipantIds.push(participantId);

    const ticketNote = participant.ticketLabel ? `Тариф: ${participant.ticketLabel}` : null;
    const enrollmentId = await ensureEnrollment(supabase, participantId, dbEventId, ticketNote, source);
    if (!enrollmentId) {
      return NextResponseLike(false, `Не удалось создать запись для участника ${index + 1}`, 500);
    }

    preparedParticipants.push({
      ...participant,
      participantId,
      enrollmentId,
      ticketNote,
    });
  }

  const participantId = preparedParticipants[0]?.participantId ?? null;
  const enrollmentId = preparedParticipants[0]?.enrollmentId ?? null;
  const enrollmentIds = preparedParticipants.map((participant) => participant.enrollmentId);
  const participantIds = preparedParticipants.map((participant) => participant.participantId);

  if (dbEventId && participantId && resolvedEventTitle) {
    const { data: eventForDate } = await supabase
      .from("events")
      .select("starts_at")
      .eq("id", dbEventId)
      .single();

    await supabase
      .from("participants")
      .update({
        next_event_title: resolvedEventTitle,
        next_event_at: eventForDate?.starts_at || null,
      })
      .eq("id", participantId);
  }

  const isFree = hasTextOnlyEventPrice(pricing.eventPriceLabel)
    || (!isFallingChairsBooking(resolvedEventTitle ?? eventId)
      && !isBigTrainingBooking(resolvedEventTitle ?? eventId)
      && priceRub <= 0);

  let promoCodeId: string | null = null;
  let discountAmountRub = 0;

  if (promoCode && !isFree && participantId) {
    const { data: promoData } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .single();

    if (promoData && promoData.is_active && isPromoWithinDateRange(promoData)) {
      let canUse = true;

      if (promoData.usage_limit) {
        const { count } = await supabase
          .from("promo_code_usages")
          .select("id", { count: "exact", head: true })
          .eq("promo_code_id", promoData.id);
        if ((count ?? 0) >= promoData.usage_limit) canUse = false;
      }

      if (promoData.is_single_use) {
        const { data: usage } = await supabase
          .from("promo_code_usages")
          .select("id")
          .eq("promo_code_id", promoData.id)
          .eq("participant_id", participantId)
          .single();
        if (usage) canUse = false;
      }

      if (canUse) {
        promoCodeId = promoData.id;
        discountAmountRub = Math.round(priceRub * (promoData.discount_percent / 100));
        priceRub = Math.max(0, priceRub - discountAmountRub);
      }
    }
  }

  const isActuallyFree = isFree || priceRub === 0;

  if (isActuallyFree) {
    const freePaymentId = `FREE-${Date.now()}`;

    for (const prepared of preparedParticipants) {
      await supabase
        .from("enrollments")
        .update({ payment_status: "Оплачен", confirmation_status: "Подтверждено" })
        .eq("id", prepared.enrollmentId);
    }

    if (dbEventId && participantId) {
      await supabase.from("payments").insert({
        participant_id: participantId,
        event_id: dbEventId,
        enrollment_id: enrollmentId,
        amount_rub: 0,
        method: promoCodeId ? "Промокод" : "Без оплаты",
        status: "Оплачен",
        external_payment_id: freePaymentId,
        promo_code_id: promoCodeId,
        discount_amount_rub: discountAmountRub,
        note: buildPaymentNote([
          buildEnrollmentsMarker(enrollmentIds),
          buildCompanionsMarker(preparedParticipants.map((item) => ({
            fullName: `${item.firstName} ${item.lastName}`.trim(),
            telegram: item.telegram,
          }))),
          `[order:${freePaymentId}]`,
        ]),
      });

      if (promoCodeId) {
        await supabase.from("promo_code_usages").insert({
          promo_code_id: promoCodeId,
          participant_id: participantId,
          order_id: freePaymentId,
        });
      }

      const { data: event } = await supabase
        .from("events")
        .select("title, capacity, booked_count, starts_at")
        .eq("id", dbEventId)
        .single();

      if (event) {
        const spotsLeft = Math.max((event.capacity || 0) - (event.booked_count || 0), 0);
        const formatDate = (dateStr?: string | null) => {
          if (!dateStr) return "";
          return new Date(dateStr).toLocaleString("ru-RU", {
            timeZone: "Europe/Moscow",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        await sendTelegramNotification({
          eventName: event.title,
          spotsLeft,
          name: preparedParticipants.map((item) => `${item.firstName} ${item.lastName}`.trim()).join(", "),
          phone: payer.phone || "",
          telegram: payer.telegram || "",
          orderNumber: freePaymentId,
          eventDate: formatDate(event.starts_at),
          source,
          promoCodeUsed: !!promoCodeId,
        });

        try {
          const { sendEmailNotification } = await import("@/lib/email");
          await sendEmailNotification({
            eventName: event.title,
            fullName: preparedParticipants.map((item) => `${item.firstName} ${item.lastName}`.trim()).join(", "),
            phone: payer.phone || "",
            telegram: payer.telegram || "",
            orderId: freePaymentId,
            participants: preparedParticipants.map((item) => ({
              fullName: `${item.firstName} ${item.lastName}`.trim(),
              phone: item.phone,
              telegram: item.telegram,
            })),
          });
        } catch (error) {
          console.error("Failed to send email for free event:", error);
        }
      }
    }

    return NextResponseLike(true, undefined, 200, {
      bookingMode: "free",
      paymentUrl: "https://t.me/rrclubadmin",
    });
  }

  const orderId = `RRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { itemKopecks, amountKopecks } = allocateReceiptItemKopecks(participantPrices, priceRub);
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const receiptItems = preparedParticipants.map((participant, index) => {
    const itemAmountKopecks = Math.round(itemKopecks[index] ?? 0);
    return {
      Name: `Участие в РРК: ${resolvedEventTitle || "Событие"}${participant.ticketLabel ? ` (${participant.ticketLabel})` : ""} — ${participant.firstName} ${participant.lastName}`.slice(0, 128),
      Price: itemAmountKopecks,
      Quantity: 1,
      Amount: itemAmountKopecks,
      PaymentMethod: "full_prepayment",
      PaymentObject: "service",
      Tax: "none",
      MeasurementUnit: "шт",
    };
  });
  const receiptSumKopecks = receiptItems.reduce((sum, item) => sum + item.Amount, 0);

  console.log("[tbank-receipt] Fiscal receipt configured", {
    email: payer.email,
    phone: payer.phone,
    items: receiptItems.length,
    orderId,
    amountKopecks,
    receiptSumKopecks,
    discountAmountRub,
    itemAmounts: receiptItems.map((item) => item.Amount),
  });

  if (receiptSumKopecks !== amountKopecks) {
    console.error("T-Bank receipt sum mismatch, refusing Init", {
      amountKopecks,
      receiptSumKopecks,
      discountAmountRub,
      orderId,
    });
    return NextResponseLike(false, "Не удалось открыть оплату: не совпала сумма чека. Попробуйте еще раз.", 502);
  }

  const tbankResponse = await tbank.initPayment({
    OrderId: orderId,
    Amount: receiptSumKopecks,
    Description: `Участие в РРК: ${resolvedEventTitle || "Событие"} (${preparedParticipants.length} бил.)`,
    SuccessURL: `${baseUrl}/success?event_id=${dbEventId || ""}&event_title=${encodeURIComponent(resolvedEventTitle || "")}&order_id=${encodeURIComponent(orderId)}`,
    FailURL: `${baseUrl}/fail`,
    NotificationURL: "https://rrclub.site/api/payment/webhook",
    PayType: paymentMethod === "sbp" ? "O" : undefined,
    DATA: {
      Email: payer.email || "",
      Phone: payer.phone || "",
      Telegram: payer.telegram || "",
      FullName: `${payer.firstName} ${payer.lastName}`.trim(),
      Source: source,
      ParticipantId: participantId || "",
      ParticipantIds: participantIds.join(","),
      EnrollmentId: enrollmentId || "",
      EnrollmentIds: enrollmentIds.join(","),
      EventId: dbEventId || "",
      TicketNote: preparedParticipants.map((item) => item.ticketNote).filter(Boolean).join("; "),
    },
    Receipt: {
      Email: payer.email || "",
      Phone: payer.phone || "",
      Taxation: "usn_income",
      Items: receiptItems,
      Payments: {
        Electronic: receiptSumKopecks,
        Cash: 0,
        AdvancePayment: 0,
        Credit: 0,
        Provision: 0,
      },
    },
  });

  if (!tbankResponse.Success || !tbankResponse.PaymentURL) {
    console.error("T-Bank init error:", tbankResponse);
    return NextResponseLike(false, "Не удалось открыть оплату через Т-Банк. Попробуйте еще раз чуть позже.", 502);
  }

  if (participantId && dbEventId) {
    const paymentNote = buildPaymentNote([
      preparedParticipants.map((item) => item.ticketNote).filter(Boolean).join("; ") || null,
      buildEnrollmentsMarker(enrollmentIds),
      buildCompanionsMarker(preparedParticipants.map((item) => ({
        fullName: `${item.firstName} ${item.lastName}`.trim(),
        telegram: item.telegram,
      }))),
      `[order:${orderId}]`,
    ]);

    const { error: paymentInsertError } = await supabase.from("payments").insert({
      participant_id: participantId,
      event_id: dbEventId,
      enrollment_id: enrollmentId,
      amount_rub: priceRub,
      method: "Т-Банк",
      status: "Ждет",
      external_payment_id: String(tbankResponse.PaymentId),
      note: paymentNote,
      promo_code_id: promoCodeId,
      discount_amount_rub: discountAmountRub,
    });

    if (paymentInsertError) {
      console.error("Payment insert error after T-Bank init:", paymentInsertError);
      return NextResponseLike(false, "Не удалось сохранить оплату в системе. Попробуйте еще раз.", 500);
    }
  }

  return NextResponseLike(true, undefined, 200, { paymentUrl: tbankResponse.PaymentURL });
}

function NextResponseLike(
  success: boolean,
  error?: string,
  status = 200,
  extra: Record<string, unknown> = {},
) {
  return {
    body: success ? { success: true, ...extra } : { success: false, error },
    status,
  };
}
