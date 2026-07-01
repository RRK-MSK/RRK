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

    let enrollments: any[] = [];

    if (participantId) {
      const { data, error } = await supabase
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
        .eq("participant_id", participantId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        enrollments = data;
      } else if (error) {
        console.error("Error fetching enrollments:", error);
      }
    }

    if (localBookings && localBookings.length > 0) {
      const existingEventIds = enrollments.map(e => e.event?.id).filter(Boolean);
      const missingEventIds = localBookings.filter((id: string) => !existingEventIds.includes(id));

      if (missingEventIds.length > 0) {
        const { data: eventsData } = await supabase
          .from("events")
          .select("id, title, starts_at")
          .in("id", missingEventIds);

        if (eventsData) {
          const fakeEnrollments = eventsData.map(event => ({
            id: `local-${event.id}`,
            status: "Записан",
            payment_status: "Ожидает",
            event: event
          }));
          enrollments = [...enrollments, ...fakeEnrollments];
        }
      }
    }

    enrollments.sort((a, b) => {
      const dateA = a.event?.starts_at ? new Date(a.event.starts_at).getTime() : 0;
      const dateB = b.event?.starts_at ? new Date(b.event.starts_at).getTime() : 0;
      return dateA - dateB;
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}