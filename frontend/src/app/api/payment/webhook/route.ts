import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { confirmTBankPayment } from "@/lib/tbank/confirm-payment";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("T-Bank webhook received:", payload);

    const password = process.env.TBANK_PASSWORD || "";

    // 1. Проверка подписи (Token)
    const { Token, ...dataWithoutToken } = payload;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (payload.Status === "CONFIRMED") {
      // Платеж успешен
      console.log(`Payment successful for OrderId: ${payload.OrderId}, Amount: ${payload.Amount}`);
      
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        await confirmTBankPayment({
          paymentId: String(payload.PaymentId),
          orderId: payload.OrderId ? String(payload.OrderId) : null,
          amountKopecks: typeof payload.Amount === "number" ? payload.Amount : null,
          data: payload.Data ?? null,
        });
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
