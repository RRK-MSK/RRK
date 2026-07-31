import { NextResponse } from "next/server";

import { confirmTBankPayment } from "@/lib/tbank/confirm-payment";
import { tbank } from "@/lib/tbank/client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json({ success: false, error: "order_id_required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "supabase_unavailable" }, { status: 503 });
    }

    const { data: payment, error } = await supabase
      .from("payments")
      .select("id, external_payment_id, status")
      .ilike("note", `%[order:${orderId}]%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to find payment by order note:", error);
      return NextResponse.json({ success: false, error: "payment_lookup_failed" }, { status: 500 });
    }

    if (!payment?.external_payment_id) {
      return NextResponse.json({ success: false, error: "payment_not_found" }, { status: 404 });
    }

    if (payment.status === "Оплачен") {
      return NextResponse.json({ success: true, confirmed: true, source: "db" });
    }

    const state = await tbank.getPaymentState({ PaymentId: payment.external_payment_id });

    if (!state.Success) {
      return NextResponse.json({
        success: false,
        confirmed: false,
        error: state.Message || state.Details || "bank_state_failed",
      }, { status: 502 });
    }

    if (state.Status === "CONFIRMED") {
      await confirmTBankPayment({
        paymentId: payment.external_payment_id,
        orderId,
        amountKopecks: state.Amount ?? null,
        data: state.Data ?? null,
        reason: "Оплата подтверждена после возврата с платежной формы",
      });

      return NextResponse.json({ success: true, confirmed: true, source: "bank" });
    }

    return NextResponse.json({
      success: true,
      confirmed: false,
      status: state.Status ?? "UNKNOWN",
    });
  } catch (error) {
    console.error("Payment reconcile error:", error);
    return NextResponse.json({ success: false, error: "reconcile_failed" }, { status: 500 });
  }
}
