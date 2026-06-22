import { NextResponse } from "next/server";
import { tbank } from "@/lib/tbank/client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("New booking request:", data);

    const { firstName, lastName, phone, telegram, eventId } = data;
    
    // Пытаемся найти ID события в базе (по title)
    // eventId с фронта сейчас выглядит как "4 июля (сб) - Ошибки как топливо"
    // Мы можем найти событие по названию
    const eventTitleMatch = eventId ? eventId.split(" - ")[1] : null;
    const eventTitle = eventTitleMatch || eventId;
    
    const supabase = getSupabaseAdminClient();
    
    let dbEventId = null;
    let priceRub = 4400;
    let participantId = null;

    if (supabase) {
      // 1. Ищем событие в БД
      if (eventTitle) {
        const { data: events } = await supabase
          .from("events")
          .select("id, price_rub")
          .ilike("title", `${eventTitle}%`)
          .limit(1);
          
        if (events && events.length > 0) {
          dbEventId = events[0].id;
          priceRub = events[0].price_rub || priceRub;
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
      
      if (phoneOrTg) {
        const { data: existingParticipants } = await supabase
          .from("participants")
          .select("id")
          .or(`phone.eq.${phone},telegram.eq.${telegram}`)
          .limit(1);
          
        if (existingParticipants && existingParticipants.length > 0) {
          participantId = existingParticipants[0].id;
        } else {
          // Создаем нового
          const { data: newParticipant } = await supabase
            .from("participants")
            .insert({
              full_name: `${firstName} ${lastName}`.trim(),
              phone: phone || null,
              telegram: telegram || null,
              status: "Новый",
              source: "Сайт (Оплата Т-Банк)",
            })
            .select("id")
            .single();
            
          if (newParticipant) participantId = newParticipant.id;
        }
      }

      // 3. Создаем запись (enrollment)
      if (participantId && dbEventId) {
        await supabase
          .from("enrollments")
          .insert({
            participant_id: participantId,
            event_id: dbEventId,
            status: "Записан",
            payment_status: "Ожидает",
            source: "Сайт (Оплата Т-Банк)",
          });
      }
    } else {
      // Фолбек цены, если нет БД
      if (eventId && eventId.includes("Тестовое")) priceRub = 1;
      else if (eventId && eventId.includes("5000")) priceRub = 5000;
      else if (eventId && eventId.includes("10 000")) priceRub = 10000;
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
      FailURL: `${baseUrl}/?payment=fail`,
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
