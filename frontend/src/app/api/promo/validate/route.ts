import { NextResponse } from "next/server";
import { buildParticipantLookupOrFilter } from "@/lib/booking-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { code, phone, telegram } = data;

    if (!code) {
      return NextResponse.json({ success: false, error: "Промокод не указан" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Ошибка сервера (Supabase)" }, { status: 500 });
    }

    // 1. Ищем промокод
    const { data: promoCode } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (!promoCode || !promoCode.is_active) {
      return NextResponse.json({ success: false, error: "Промокод не найден или недействителен" });
    }

    if (promoCode.valid_from && new Date(promoCode.valid_from) > new Date()) {
      return NextResponse.json({ success: false, error: "Промокод еще не активен" });
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Срок действия промокода истек" });
    }

    if (promoCode.usage_limit) {
      const { count } = await supabase
        .from("promo_code_usages")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", promoCode.id);

      if ((count ?? 0) >= promoCode.usage_limit) {
        return NextResponse.json({ success: false, error: "Лимит использования промокода исчерпан" });
      }
    }

    // 2. Если одноразовый, проверяем, не использовал ли его уже этот пользователь
    if (promoCode.is_single_use && (phone || telegram)) {
      const participantLookupFilter = buildParticipantLookupOrFilter(
        String(phone ?? ""),
        String(telegram ?? ""),
        "",
      );

      if (participantLookupFilter) {
        const { data: existingParticipants } = await supabase
          .from("participants")
          .select("id")
          .or(participantLookupFilter)
          .limit(1);

        if (existingParticipants && existingParticipants.length > 0) {
          const participantId = existingParticipants[0].id;
          
          const { data: usage } = await supabase
            .from("promo_code_usages")
            .select("id")
            .eq("promo_code_id", promoCode.id)
            .eq("participant_id", participantId)
            .single();
            
          if (usage) {
            return NextResponse.json({ success: false, error: "Вы уже использовали этот промокод" });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      discount_percent: promoCode.discount_percent,
      promo_code_id: promoCode.id
    });

  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json({ success: false, error: "Ошибка проверки промокода" }, { status: 500 });
  }
}
