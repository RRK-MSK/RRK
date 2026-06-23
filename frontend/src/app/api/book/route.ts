import { NextResponse } from "next/server";
import { tbank } from "@/lib/tbank/client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("New booking request:", data);

    const { firstName, lastName, phone, telegram, eventId } = data;
    
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

    if (supabase) {
      // 1. Ищем событие в БД
      if (!dbEventId && eventTitle) {
        const { data: events } = await supabase
          .from("events")
          .select("id, price_rub")
          .ilike("title", `${eventTitle}%`)
          .limit(1);
          
        if (events && events.length > 0) {
          dbEventId = events[0].id;
          priceRub = events[0].price_rub || priceRub;
        }
      } else if (dbEventId) {
        const { data: eventRow } = await supabase
          .from("events")
          .select("price_rub")
          .eq("id", dbEventId)
          .single();
        if (eventRow) {
          priceRub = eventRow.price_rub || priceRub;
        }
      }

      // Если это тестовое событие (1 рубль)
      if (eventId && eventId.includes("Тестовое")) {
        priceRub = 1;
      } else if (eventId && eventId.includes("5000")) {
        priceRub = 5000;
      } else if (eventId && eventId.includes("10 000")) {
        priceRub = 10000;
      }

      // 2. Ищем или создаем участника
      const phoneOrTg = phone || telegram;
        const orConditions = [];
        if (phone) orConditions.push(`phone.eq.${phone}`);
        if (telegram) orConditions.push(`telegram.eq.${telegram}`);
        
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
            const { data: newParticipant, error: pError } = await supabase
              .from("participants")
              .insert({
                slug,
                full_name: `${firstName} ${lastName}`.trim(),
                phone: phone || null,
                telegram: telegram || null,
                status: "Новый",
                source: "Сайт (Оплата Т-Банк)",
              })
              .select("id")
              .single();
            
          if (pError) console.error("Participant insert error:", pError);
          if (newParticipant) participantId = newParticipant.id;
        }
      }

      // 3. Создаем запись (enrollment)
      if (participantId && dbEventId) {
        const { error: eError } = await supabase
          .from("enrollments")
          .insert({
            participant_id: participantId,
            event_id: dbEventId,
            status: "Активна",
            payment_status: "Ждет оплату",
            source: "Сайт (Оплата Т-Банк)",
          });
        if (eError) console.error("Enrollment insert error:", eError);
      }
    } else {
      // Фолбек цены, если нет БД
      if (eventId && eventId.includes("Тестовое")) priceRub = 1;
      else if (eventId && eventId.includes("5000")) priceRub = 5000;
      else if (eventId && eventId.includes("10 000")) priceRub = 10000;
    }

    const isFree = data.price === "Участие бесплатно, регистрация" || data.price === "Бесплатно" || data.price === "Регистрация";

    // Если это бесплатное событие (например, COFFEE JAM)
    if (isFree) {
      const freePaymentId = `FREE-${Date.now()}`;
      if (supabase && participantId && dbEventId) {
        await supabase
          .from("payments")
          .insert({
            participant_id: participantId,
            event_id: dbEventId,
            amount_rub: 0,
            method: "Без оплаты",
            status: "Оплачен", // Сразу считаем подтвержденным
            external_payment_id: freePaymentId
          });
          
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
            paymentDate: isFree ? undefined : new Date().toLocaleString('ru-RU', {
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
      return NextResponse.json({ success: true, paymentUrl: "https://t.me/rrclubadmin", note: "Free event, redirect to admin" });
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
      SuccessURL: `${baseUrl}/success`,
      FailURL: `${baseUrl}/fail`,
      // Webhook для получения статуса платежа (всегда продакшен, так как локалхост банк не достанет)
      NotificationURL: "https://rrclub.site/api/payment/webhook",
    });

    if (tbankResponse.Success && tbankResponse.PaymentURL) {
      // 4. Записываем ожидаемый платеж в БД
      if (supabase && participantId && dbEventId) {
        await supabase
          .from("payments")
          .insert({
            participant_id: participantId,
            event_id: dbEventId,
            amount_rub: priceRub,
            method: "Т-Банк",
            status: "Ждет",
            external_payment_id: String(tbankResponse.PaymentId)
          });
      }

      return NextResponse.json({ success: true, paymentUrl: tbankResponse.PaymentURL });
    } else {
      console.error("T-Bank init error:", tbankResponse);
      // Если ключи еще не подхватились или ошибка, возвращаем старую заглушку
      const fallbackUrl = "https://qr.nspk.ru/AS1A0035DTF29DBK8M0O7UIQGRBGRG93";
      return NextResponse.json({ success: true, paymentUrl: fallbackUrl, note: "Fallback to SBP" });
    }
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to book" }, { status: 500 });
  }
}
