import { NextResponse } from "next/server";
import { tbank } from "@/lib/tbank/client";
// import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // В реальном проекте здесь будет логика создания participant и enrollment
    // const { firstName, lastName, phone, telegram, eventId } = data;
    // const supabase = await createServerClient();
    console.log("New booking request:", data);
    
    // Генерируем уникальный OrderId для Т-Банка
    const orderId = `RRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Получаем цену (в реальности нужно брать из БД, а не доверять фронту)
    // Сейчас для примера ставим 4400 рублей (в копейках это 440000)
    // В зависимости от события цена может быть 5000 или 10000
    let priceRub = 4400;
    if (data.eventId && data.eventId.includes("5000")) priceRub = 5000;
    if (data.eventId && data.eventId.includes("10 000")) priceRub = 10000;
    
    const amountKopecks = priceRub * 100;

    // Инициализируем платеж в Т-Банке
    const tbankResponse = await tbank.initPayment({
      OrderId: orderId,
      Amount: amountKopecks,
      Description: `Участие в РРК: ${data.eventId || 'Событие'}`,
      // Эти URL можно настроить на страницы успеха/ошибки
      SuccessURL: "https://rrclub.site",
      FailURL: "https://rrclub.site",
      // Webhook для получения статуса платежа
      NotificationURL: "https://rrclub.site/api/payment/webhook",
    });

    if (tbankResponse.Success && tbankResponse.PaymentURL) {
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
