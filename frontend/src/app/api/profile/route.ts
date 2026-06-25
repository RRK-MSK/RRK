import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { telegramId, telegramUsername, localBookings } = await request.json();
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json({ enrollments: [] });
    }

    let participantId = null;

    if (telegramUsername) {
      const { data } = await supabase
        .from("participants")
        .select("id")
        .ilike("telegram", `%${telegramUsername.replace('@', '')}%`)
        .limit(1);
      
      if (data && data.length > 0) {
        participantId = data[0].id;
      }
    }

    let query = supabase
      .from("enrollments")
      .select(`
        id,
        status,
        payment_status,
        event:events (
          id,
          title,
          starts_at
        )
      `)
      .order('created_at', { ascending: false });

    if (participantId) {
      if (localBookings && localBookings.length > 0) {
        query = query.or(`participant_id.eq.${participantId},event_id.in.(${localBookings.map((id: string) => `"${id}"`).join(',')})`);
      } else {
        query = query.eq("participant_id", participantId);
      }
    } else if (localBookings && localBookings.length > 0) {
      query = query.in("event_id", localBookings);
    } else {
      return NextResponse.json({ enrollments: [] });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ enrollments: [] });
    }

    return NextResponse.json({ enrollments: data || [] });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}