import { NextResponse } from "next/server";
import crypto from "crypto";
// import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("T-Bank webhook received:", payload);

    const password = process.env.TBANK_PASSWORD || "";

    // 1. Проверка подписи (Token)
    const { Token, ...dataWithoutToken } = payload;
    
    const dataWithPassword = {
      ...dataWithoutToken,
      Password: password,
    };

    const keys = Object.keys(dataWithPassword).filter(
      (key) =>
        dataWithPassword[key] !== undefined &&
        dataWithPassword[key] !== null &&
        typeof dataWithPassword[key] !== 'object'
    );

    keys.sort();
    const valuesString = keys.map((key) => String(dataWithPassword[key])).join('');
    const calculatedToken = crypto.createHash('sha256').update(valuesString).digest('hex');

    if (calculatedToken !== Token) {
      console.error("Invalid token from T-Bank webhook");
      return new NextResponse("Invalid Token", { status: 400 });
    }

    // 2. Обработка статуса
    if (payload.Status === "CONFIRMED" || payload.Status === "AUTHORIZED") {
      // Платеж успешен
      console.log(`Payment successful for OrderId: ${payload.OrderId}, Amount: ${payload.Amount}`);
      
      // Здесь мы будем обновлять статус в Supabase (enrollments -> payment_status = 'Оплачен')
      // const supabase = await createServerClient();
      // await supabase.from('payments').update({ status: 'Оплачен', paid_at: new Date() }).eq('external_payment_id', payload.PaymentId);
    } else if (payload.Status === "REJECTED" || payload.Status === "CANCELED") {
      // Платеж отклонен
      console.log(`Payment failed for OrderId: ${payload.OrderId}`);
    }

    // Обязательно возвращаем OK Т-Банку
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}