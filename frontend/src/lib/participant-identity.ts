import {
  getPhoneLookupValues,
  getTelegramLookupValues,
  normalizeTelegram,
  phoneToE164,
} from "@/lib/booking-validation";

type ParticipantLookupRow = {
  id: string;
  full_name?: string | null;
  telegram?: string | null;
  phone?: string | null;
};

export type ParticipantIdentityInput = {
  fullName?: string;
  phone?: string;
  telegram?: string;
  email?: string;
};

function escapeSupabaseFilterValue(value: string) {
  if (/[,\s()]/.test(value) || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildOrFilter(column: "phone" | "telegram", values: string[]) {
  return values
    .map((value) => `${column}.eq.${escapeSupabaseFilterValue(value)}`)
    .join(",");
}

export function normalizePersonName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function isTelegramUsername(value: string) {
  const normalized = normalizeTelegram(value);
  return /^@[a-zA-Z0-9_]{2,32}$/.test(normalized);
}

export async function findExistingParticipantId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any },
  input: ParticipantIdentityInput,
  options?: { excludeIds?: string[] },
) {
  const excludeIds = new Set(options?.excludeIds ?? []);
  const telegram = normalizeTelegram(input.telegram ?? "");
  const phone = phoneToE164(input.phone ?? "") || String(input.phone ?? "").trim();
  const fullName = normalizePersonName(input.fullName);

  if (telegram && isTelegramUsername(telegram)) {
    const filter = buildOrFilter("telegram", getTelegramLookupValues(telegram));
    if (filter) {
      const { data } = await supabase.from("participants").select("id, full_name, telegram").or(filter).limit(10);
      const match = (data ?? []).find((row) => !excludeIds.has(row.id));
      if (match) {
        return match.id;
      }
    }
  }

  if (phone && fullName) {
    const filter = buildOrFilter("phone", getPhoneLookupValues(phone));
    if (filter) {
      const { data } = await supabase.from("participants").select("id, full_name, phone").or(filter).limit(20);
      const match = (data ?? []).find((row) => {
        if (normalizePersonName(row.full_name) !== fullName) {
          return false;
        }

        return !excludeIds.has(row.id);
      });

      if (match) {
        return match.id;
      }
    }
  }

  return null;
}
