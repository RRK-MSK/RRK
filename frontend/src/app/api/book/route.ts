import { NextResponse } from "next/server";

import { createBookingRequest } from "@/lib/create-booking";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("New booking request:", {
      eventId: data?.eventId ?? null,
      participantsCount: Array.isArray(data?.participants) ? data.participants.length : 1,
    });

    const result = await createBookingRequest(data, request);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to book" }, { status: 500 });
  }
}
