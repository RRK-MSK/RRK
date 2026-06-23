"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function addParticipant(formData: FormData) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const fullName = formData.get("fullName") as string;
  const telegram = formData.get("telegram") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  if (!fullName) throw new Error("Name is required");

  const slug = telegram ? telegram.replace('@', '').toLowerCase() : `user-${Date.now()}`;

  const { error } = await supabase.from("participants").insert({
    slug,
    full_name: fullName,
    telegram: telegram || null,
    phone: phone || null,
    email: email || null,
    status: "Новый",
    source: "Добавлен вручную из CRM",
  });

  if (error) {
    console.error("Error adding participant:", error);
    throw new Error("Failed to add participant");
  }

  revalidatePath("/crm/participants");
  return { success: true };
}

export async function updateParticipantStatus(id: string, status: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("participants")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error("Failed to update status");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  return { success: true };
}

export async function updateParticipantTags(id: string, tags: string[]) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("participants")
    .update({ tags })
    .eq("id", id);

  if (error) throw new Error("Failed to update tags");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  return { success: true };
}

export async function updateEnrollment(enrollmentId: string, updates: { event_id?: string, status?: string }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("enrollments")
    .update(updates)
    .eq("id", enrollmentId);

  if (error) throw new Error("Failed to update enrollment");

  revalidatePath("/crm/participants");
  revalidatePath(`/crm/participants/[slug]`, "page");
  return { success: true };
}
