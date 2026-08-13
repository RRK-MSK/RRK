import { NextResponse } from "next/server";
import { validateAndNormalizeBooking } from "@/lib/booking-validation";
import { getCoffeeJamPriceTiers, getPriceForNextBooking, type EventPriceTier } from "@/lib/event-pricing";
import { tbank } from "@/lib/tbank/client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram";

function isPromoWithinDateRange(promoCode: { valid_from?: string | null; expires_at?: string | null }) {
  const now = Date.now();
  const validFrom = promoCode.valid_from ? new Date(promoCode.valid_from).getTime() : null;
  const expiresAt = promoCode.expires_at ? new Date(promoCode.expires_at).getTime() : null;

  if (validFrom && validFrom > now) {
    return false;
  }

  if (expiresAt && expiresAt < now) {
    return false;
  }

  return true;
}

function isBigTrainingBooking(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("большая тренировка") || normalized.includes("big тренировка");
}

function isCoffeeJamBooking(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("coffee jam") || normalized.includes("кофе джем");
}

function isFallingChairsBooking(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("падающими стульями");
}

function buildPaymentNote(ticketNote: string | null, orderId?: string | null) {
  return [ticketNote, orderId ? `[order:${orderId}]` : null].filter(Boolean).join(" | ") || null;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("New booking request:", data);
    // #region debug-point A:book-entry
    void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "paid-bookings-missing", runId: "pre-fix", hypothesisId: "A", location: "src/app/api/book/route.ts:POST:start", msg: "[DEBUG] booking request received", data: { eventId: data?.eventId ?? null, paymentMethod: data?.paymentMethod ?? null, hasPhone: Boolean(data?.phone), hasTelegram: Boolean(data?.telegram), hasEmail: Boolean(data?.email) }, ts: Date.now() }) }).catch(() => {});
    // #endregion

    const validation = validateAndNormalizeBooking({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      telegram: data.telegram,
      email: data.email,
      eventId: data.eventId,
      paymentMethod: data.paymentMethod,
    });

    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { firstName, lastName, phone, telegram, email, eventId, paymentMethod } = validation.data;
    const { source, promoCode } = data;
    const selectedTicketLabel = typeof data.ticketLabel === "string" ? data.ticketLabel.trim() : "";
    const selectedTicketPriceRub = Number(data.ticketPriceRub ?? 0);
    const selectedTicketCapacity = Number(data.ticketCapacity ?? 0);
    const ticketNote = selectedTicketLabel ? `Тариф: ${selectedTicketLabel}` : null;
    
    // Пытаемся найти ID события в базе (по title)
    // eventId с фронта сейчас выглядит как "uuid::Название" или "5 июля (вс) | 19:00-22:30 - Название"
    let dbEventId = null;
    let eventTitle = null;
    
    if (eventId && eventId.includes('::')) {
      const parts = eventId.split('::');
      dbEventId = parts[0];
      eventTitle = parts[1];
    } else {
      const eventTitleMatch = eventId ? eventId.split(" - ")[1] : null;
      const eventTitleRaw = eventTitleMatch || eventId;
      eventTitle = eventTitleRaw ? eventTitleRaw.replace(/\s*\([^)]*\)$/, '').trim() : null;
    }
    
    const supabase = getSupabaseAdminClient();
    
    let priceRub = 4400;
    let participantId = null;
    let bookedCount = 0;
    let enrollmentId = null;
    let eventBasePriceRub: number | null = null;

    if (supabase) {
      // 1. Ищем событие в БД
      if (!dbEventId && eventTitle) {
        const { data: events } = await supabase
          .from("events")
          .select("id, price_rub, booked_count")
          .ilike("title", `${eventTitle}%`)
          .limit(1);
          
        if (events && events.length > 0) {
          dbEventId = events[0].id;
          eventBasePriceRub = events[0].price_rub ?? null;
          priceRub = isFallingChairsBooking(eventTitle)
            ? 2200
            : isBigTrainingBooking(eventTitle)
            ? 5500
            : (isCoffeeJamBooking(eventTitle) ? Math.max(events[0].price_rub ?? 0, 770) : (events[0].price_rub || priceRub));
          bookedCount = events[0].booked_count || 0;
        }
      } else if (dbEventId) {
        const { data: eventRow } = await supabase
          .from("events")
          .select("price_rub, booked_count")
          .eq("id", dbEventId)
          .single();
        if (eventRow) {
          eventBasePriceRub = eventRow.price_rub ?? null;
          priceRub = isFallingChairsBooking(eventTitle ?? eventId)
            ? 2200
            : isBigTrainingBooking(eventTitle ?? eventId)
            ? 5500
            : (isCoffeeJamBooking(eventTitle ?? eventId) ? Math.max(eventRow.price_rub ?? 0, 770) : (eventRow.price_rub || priceRub));
          bookedCount = eventRow.booked_count || 0;
        }
      }

      if (dbEventId) {
        const { data: priceTiers } = await supabase
          .from("event_price_tiers")
          .select("seat_from, seat_to, price_rub")
          .eq("event_id", dbEventId)
          .order("seat_from", { ascending: true });

        if (isCoffeeJamBooking(eventTitle ?? eventId)) {
          const effectivePriceTiers = getCoffeeJamPriceTiers((priceTiers ?? []) as EventPriceTier[]);
          priceRub = getPriceForNextBooking(
            priceRub,
            bookedCount,
            effectivePriceTiers,
          );
        }
      }

      if (selectedTicketPriceRub > 0) {
        priceRub = selectedTicketPriceRub;
      }

      // Если это тестовое событие (1 рубль)
      if (eventId && eventId.includes("Тестовое")) {
        priceRub = 1;
      } else if (isFallingChairsBooking(eventTitle ?? eventId)) {
        priceRub = 2200;
      } else if (isBigTrainingBooking(eventTitle ?? eventId) || (eventId && eventId.includes("5000"))) {
        priceRub = 5500;
      } else if (eventId && eventId.includes("10 000")) {
        priceRub = 10000;
      }

      // 2. Ищем или создаем участника
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
        } else {
          // Создаем нового
          const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;
          const actualSource = source === "Telegram Mini App" ? "Telegram Mini App" : "Сайт (Оплата Т-Банк)";
          
          const { data: newParticipant, error: pError } = await supabase
            .from("participants")
            .insert({
              slug,
              full_name: `${firstName} ${lastName}`.trim(),
              phone: phone || null,
              telegram: telegram || null,
              email: email || null,
              status: "Новый",
              source: actualSource,
            })
            .select("id")
            .single();
            
          if (pError) console.error("Participant insert error:", pError);
          if (newParticipant) participantId = newParticipant.id;
        }
      } else {
        const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;
        const actualSource = source === "Telegram Mini App" ? "Telegram Mini App" : "Сайт (Оплата Т-Банк)";

        const { data: newParticipant, error: pError } = await supabase
          .from("participants")
          .insert({
            slug,
            full_name: `${firstName} ${lastName}`.trim(),
            phone: phone || null,
            telegram: telegram || null,
            email: email || null,
            status: "Новый",
            source: actualSource,
          })
          .select("id")
          .single();

        if (pError) console.error("Participant insert error:", pError);
        if (newParticipant) participantId = newParticipant.id;
      }

      // 3. Создаем запись (enrollment)
      if (participantId && dbEventId) {
        if (ticketNote && selectedTicketCapacity > 0) {
          const { data: existingTariffBookings, error: tariffError } = await supabase
            .from("enrollments")
            .select("id, status")
            .eq("event_id", dbEventId)
            .eq("note", ticketNote);

          if (tariffError) {
            console.error("Tariff seats check error:", tariffError);
          }

          const tariffBookedCount = (existingTariffBookings ?? []).filter((row) => !(row.status ?? "").toLowerCase().includes("отмен")).length;
          if (tariffBookedCount >= selectedTicketCapacity) {
            return NextResponse.json(
              { success: false, error: `На тариф «${selectedTicketLabel}» мест больше нет` },
              { status: 400 },
            );
          }
        }

        const actualSource = source === "Telegram Mini App" ? "Telegram Mini App" : "Сайт (Оплата Т-Банк)";
        const { data: enrollment, error: eError } = await supabase
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
        if (eError) {
          console.error("Enrollment insert error:", eError);

          const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
            .from("enrollments")
            .select("id")
            .eq("participant_id", participantId)
            .eq("event_id", dbEventId)
            .maybeSingle();

          if (existingEnrollmentError) {
            console.error("Enrollment fetch after insert error:", existingEnrollmentError);
          }

          enrollmentId = existingEnrollment?.id ?? null;
        } else {
          enrollmentId = enrollment?.id ?? null;
        }

        // Обновляем участнику next_event, чтобы было видно в базе
        if (eventTitle) {
          const { data: eventForDate } = await supabase
            .from("events")
            .select("starts_at")
            .eq("id", dbEventId)
            .single();

          await supabase
            .from("participants")
            .update({
              next_event_title: eventTitle,
              next_event_at: eventForDate?.starts_at || null
            })
            .eq("id", participantId);
        }
      }

      if (!dbEventId || !participantId || !enrollmentId) {
        // #region debug-point C:book-linking-failed
        void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "paid-bookings-missing", runId: "pre-fix", hypothesisId: "C", location: "src/app/api/book/route.ts:POST:linking-failed", msg: "[DEBUG] booking flow missing required relations", data: { dbEventId, participantId, enrollmentId, eventTitle }, ts: Date.now() }) }).catch(() => {});
        // #endregion
        console.error("Booking flow stopped before payment init", {
          dbEventId,
          participantId,
          enrollmentId,
          eventTitle,
          phone,
          telegram,
          email,
        });

        return NextResponse.json(
          { success: false, error: "Не удалось подготовить запись к оплате. Попробуйте еще раз." },
          { status: 500 },
        );
      }
    } else {
      // Фолбек цены, если нет БД
      if (eventId && eventId.includes("Тестовое")) priceRub = 1;
      else if (isFallingChairsBooking(eventTitle ?? eventId)) priceRub = 2200;
      else if (isBigTrainingBooking(eventTitle ?? eventId) || (eventId && eventId.includes("5000"))) priceRub = 5500;
      else if (eventId && eventId.includes("10 000")) priceRub = 10000;
    }

    if (supabase && participantId && dbEventId && enrollmentId) {
      const { data: detachedPaidPayments } = await supabase
        .from("payments")
        .select("id, amount_rub, status")
        .eq("participant_id", participantId)
        .is("event_id", null)
        .order("created_at", { ascending: false })
        .limit(10);

      const reusablePayment = (detachedPaidPayments ?? []).find((row) => {
        const normalizedStatus = (row.status ?? "").toLowerCase();
        return (
          (normalizedStatus.includes("paid") || normalizedStatus.includes("оплач")) &&
          !normalizedStatus.includes("refund") &&
          !normalizedStatus.includes("возврат")
        );
      });

      if (reusablePayment) {
        await supabase
          .from("payments")
          .update({
            event_id: dbEventId,
            enrollment_id: enrollmentId,
            note: "Оплата повторно привязана при новой записи с сайта",
          })
          .eq("id", reusablePayment.id);

        await supabase
          .from("enrollments")
          .update({ payment_status: "Оплачен", confirmation_status: "Подтверждено" })
          .eq("id", enrollmentId);

        await supabase.from("revenue_audit_log").insert({
          payment_id: reusablePayment.id,
          participant_id: participantId,
          enrollment_id: enrollmentId,
          event_id: dbEventId,
          direction: "neutral",
          operation_type: "payment_reused",
          amount_rub: reusablePayment.amount_rub ?? 0,
          reason: "Повторная запись клиента с автоматическим переносом существующей оплаты",
        });

        return NextResponse.json({ success: true, paymentUrl: "https://t.me/rrclubadmin", note: "Existing payment reused" });
      }
    }

    const isFree = !isFallingChairsBooking(eventTitle ?? eventId)
      && !isBigTrainingBooking(eventTitle ?? eventId)
      && selectedTicketPriceRub <= 0
      && (eventBasePriceRub ?? priceRub) <= 0;
    // #region debug-point A:free-decision
    void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "tbank-instant-success", runId: "post-fix", hypothesisId: "A", location: "src/app/api/book/route.ts:POST:free-decision", msg: "[DEBUG] booking api calculated payment mode", data: { eventId: eventId ?? null, dbEventId, eventTitle, selectedTicketLabel: selectedTicketLabel || null, selectedTicketPriceRub, eventBasePriceRub, priceRub, isFree, paymentMethod: paymentMethod ?? null }, ts: Date.now() }) }).catch(() => {});
    // #endregion

    let promoCodeId = null;
    let discountAmountRub = 0;

    // 4. Применяем промокод, если есть
    if (promoCode && !isFree && supabase && participantId) {
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

          if ((count ?? 0) >= promoData.usage_limit) {
            canUse = false;
          }
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
          priceRub = priceRub - discountAmountRub;
          if (priceRub < 0) priceRub = 0;
        }
      }
    }

    // Если после применения промокода цена стала 0, обрабатываем как бесплатное
    const isActuallyFree = isFree || priceRub === 0;

    // Если это бесплатное событие (например, COFFEE JAM) или цена стала 0 из-за промокода
    if (isActuallyFree) {
      // #region debug-point A:free-branch
      void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "tbank-instant-success", runId: "post-fix", hypothesisId: "A", location: "src/app/api/book/route.ts:POST:free-branch", msg: "[DEBUG] booking api entered free branch", data: { eventId: eventId ?? null, dbEventId, eventTitle, promoCode: promoCode ?? null, priceRub, isFree, isActuallyFree, selectedTicketLabel: selectedTicketLabel || null }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      const freePaymentId = `FREE-${Date.now()}`;
      if (supabase && participantId && dbEventId) {
        await supabase
          .from("enrollments")
          .update({ payment_status: "Оплачен", confirmation_status: "Подтверждено" })
          .eq("id", enrollmentId);

        await supabase
          .from("payments")
          .insert({
            participant_id: participantId,
            event_id: dbEventId,
            enrollment_id: enrollmentId,
            amount_rub: 0,
            method: promoCodeId ? "Промокод" : "Без оплаты",
            status: "Оплачен", // Сразу считаем подтвержденным
            external_payment_id: freePaymentId,
            promo_code_id: promoCodeId,
            discount_amount_rub: discountAmountRub
          });
          
        if (promoCodeId) {
          await supabase.from("promo_code_usages").insert({
            promo_code_id: promoCodeId,
            participant_id: participantId,
            order_id: freePaymentId
          });
        }
          
        // Получаем данные события для Telegram
        const { data: event } = await supabase
          .from('events')
          .select('title, capacity, booked_count, starts_at')
          .eq('id', dbEventId)
          .single();

        if (event) {
          // Рассчитываем оставшиеся места. Не прибавляем 1, так как booked_count уже обновился.
          const spotsLeft = Math.max((event.capacity || 0) - (event.booked_count || 0), 0);
          
          const formatDate = (dateStr?: string | null) => {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleString('ru-RU', {
              timeZone: 'Europe/Moscow',
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
          };

          await sendTelegramNotification({
            eventName: event.title,
            spotsLeft: spotsLeft,
            name: `${firstName} ${lastName}`.trim(),
            phone: phone || '',
            telegram: telegram || '',
            orderNumber: freePaymentId,
            eventDate: formatDate(event.starts_at),
            source: data.source,
            promoCodeUsed: !!promoCodeId,
            paymentDate: isActuallyFree && !promoCodeId ? undefined : new Date().toLocaleString('ru-RU', {
              timeZone: 'Europe/Moscow',
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          });

          // Send Email notification for free event
          try {
            const { sendEmailNotification } = await import('@/lib/email');
            await sendEmailNotification({
              eventName: event.title,
              fullName: `${firstName} ${lastName}`.trim(),
              phone: phone || '',
              telegram: telegram || '',
              orderId: freePaymentId
            });
          } catch (e) {
            console.error("Failed to send email for free event:", e);
          }
        }
      }
      
      // Перекидываем на Телеграм-админа для регистрации
      return NextResponse.json({
        success: true,
        bookingMode: "free",
        paymentUrl: "https://t.me/rrclubadmin",
        note: "Free event, redirect to admin",
      });
    }

    // Генерируем уникальный OrderId для Т-Банка
    const orderId = `RRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const amountKopecks = priceRub * 100;

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Инициализируем платеж в Т-Банке
    const tbankResponse = await tbank.initPayment({
      OrderId: orderId,
      Amount: amountKopecks,
      Description: `Участие в РРК: ${data.eventId || 'Событие'}`,
      // Эти URL можно настроить на страницы успеха/ошибки
      SuccessURL: `${baseUrl}/success?event_id=${dbEventId || ''}&event_title=${encodeURIComponent(eventTitle || '')}&order_id=${encodeURIComponent(orderId)}`,
      FailURL: `${baseUrl}/fail`,
      // Webhook для получения статуса платежа (всегда продакшен, так как локалхост банк не достанет)
      NotificationURL: "https://rrclub.site/api/payment/webhook",
      PayType: paymentMethod === "sbp" ? "O" : undefined,
      DATA: {
        Email: email || "",
        Phone: phone || "",
        Telegram: telegram || "",
        FullName: `${firstName} ${lastName}`.trim(),
        Source: data.source || "Сайт",
        ParticipantId: participantId || "",
        EnrollmentId: enrollmentId || "",
        EventId: dbEventId || "",
        TicketNote: ticketNote || "",
      },
      Receipt: {
        Email: email || "",
        Phone: phone || "",
        Taxation: "usn_income", // УСН Доходы (замените если другая система налогообложения)
        Items: [
          {
            Name: `Участие в РРК: ${eventTitle || 'Событие'}${selectedTicketLabel ? ` (${selectedTicketLabel})` : ""}`,
            Price: amountKopecks,
            Quantity: 1.00,
            Amount: amountKopecks,
            PaymentMethod: "full_prepayment",
            PaymentObject: "service",
            Tax: "none"
          }
        ]
      }
    });
    // #region debug-point C:tbank-init-result
    void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "tbank-instant-success", runId: "post-fix", hypothesisId: "C", location: "src/app/api/book/route.ts:POST:tbank-init-result", msg: "[DEBUG] booking api received tbank init result", data: { orderId, success: Boolean(tbankResponse?.Success), hasPaymentUrl: Boolean(tbankResponse?.PaymentURL), paymentUrl: tbankResponse?.PaymentURL ?? null, errorCode: tbankResponse?.ErrorCode ?? null, message: tbankResponse?.Message ?? null }, ts: Date.now() }) }).catch(() => {});
    // #endregion

    if (tbankResponse.Success && tbankResponse.PaymentURL) {
      // 4. Записываем ожидаемый платеж в БД
      if (supabase && participantId && dbEventId) {
        const paymentNote = buildPaymentNote(ticketNote, orderId);
        const { error: paymentInsertError } = await supabase
          .from("payments")
          .insert({
            participant_id: participantId,
            event_id: dbEventId,
            enrollment_id: enrollmentId,
            amount_rub: priceRub,
            method: "Т-Банк",
            status: "Ждет",
            external_payment_id: String(tbankResponse.PaymentId),
            note: paymentNote,
            promo_code_id: promoCodeId,
            discount_amount_rub: discountAmountRub
          });

        if (paymentInsertError) {
          // #region debug-point C:payment-row-insert-error
          void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "paid-bookings-missing", runId: "pre-fix", hypothesisId: "C", location: "src/app/api/book/route.ts:POST:payment-insert-error", msg: "[DEBUG] payment row insert failed after init", data: { participantId, dbEventId, enrollmentId, paymentId: tbankResponse.PaymentId ?? null, orderId }, ts: Date.now() }) }).catch(() => {});
          // #endregion
          console.error("Payment insert error after T-Bank init:", paymentInsertError);
          return NextResponse.json(
            { success: false, error: "Не удалось сохранить оплату в системе. Попробуйте еще раз." },
            { status: 500 },
          );
        }
      }

      // #region debug-point C:book-init-success
      void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "paid-bookings-missing", runId: "pre-fix", hypothesisId: "C", location: "src/app/api/book/route.ts:POST:init-success", msg: "[DEBUG] payment initialized and stored", data: { participantId, dbEventId, enrollmentId, orderId, paymentId: tbankResponse.PaymentId ?? null, hasPaymentUrl: Boolean(tbankResponse.PaymentURL) }, ts: Date.now() }) }).catch(() => {});
      // #endregion

      return NextResponse.json({ success: true, paymentUrl: tbankResponse.PaymentURL });
    } else {
      // #region debug-point A:book-init-failed
      void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "paid-bookings-missing", runId: "pre-fix", hypothesisId: "A", location: "src/app/api/book/route.ts:POST:init-failed", msg: "[DEBUG] tbank init failed and fallback used", data: { orderId, errorCode: tbankResponse?.ErrorCode ?? null, success: tbankResponse?.Success ?? null }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      // #region debug-point C:fallback-return
      void fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "tbank-instant-success", runId: "post-fix", hypothesisId: "C", location: "src/app/api/book/route.ts:POST:fallback-return", msg: "[DEBUG] booking api aborted because tbank init failed", data: { orderId, errorCode: tbankResponse?.ErrorCode ?? null, success: Boolean(tbankResponse?.Success), message: tbankResponse?.Message ?? null }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      console.error("T-Bank init error:", tbankResponse);
      return NextResponse.json(
        {
          success: false,
          error: "Не удалось открыть оплату через Т-Банк. Попробуйте еще раз чуть позже.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to book" }, { status: 500 });
  }
}
