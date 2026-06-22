import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("T-Bank webhook received:", payload);

    const password = process.env.TBANK_PASSWORD || "";

    // 1. Проверка подписи (Token)
    const { Token, ...dataWithoutToken } = payload;
    
    const dataWithPassword: Record<string, any> = {
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
      
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        // Обновляем статус платежа
        await supabase
          .from('payments')
          .update({ status: 'Оплачен', paid_at: new Date().toISOString() })
          .eq('external_payment_id', String(payload.PaymentId));

        // Находим к какому участнику и событию относится этот платеж
        const { data: payments } = await supabase
          .from('payments')
          .select('participant_id, event_id')
          .eq('external_payment_id', String(payload.PaymentId))
          .single();

        if (payments) {
          // Обновляем статус в enrollments
          await supabase
            .from('enrollments')
            .update({ payment_status: 'Оплачен' })
            .eq('participant_id', payments.participant_id)
            .eq('event_id', payments.event_id);
        }
      }
    } else if (payload.Status === "REJECTED" || payload.Status === "CANCELED") {
      // Платеж отклонен
      console.log(`Payment failed for OrderId: ${payload.OrderId}`);
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        await supabase
          .from('payments')
          .update({ status: 'Отклонен' })
          .eq('external_payment_id', String(payload.PaymentId));
      }
    }

    // Обязательно возвращаем OK Т-Банку
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}