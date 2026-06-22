import { NextResponse } from "next/server";
// import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // В реальном проекте здесь будет логика создания participant и enrollment
    // const { firstName, lastName, phone, telegram, eventId } = data;
    // const supabase = await createServerClient();
    console.log("New booking request:", data);

    
    // ... логика Supabase ...

    // Ссылка для оплаты Т-Банк. Пока ставим заглушку на СБП QR
    const paymentUrl = "https://qr.nspk.ru/AS1A0035DTF29DBK8M0O7UIQGRBGRG93";

    return NextResponse.json({ success: true, paymentUrl });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to book" }, { status: 500 });
  }
}
