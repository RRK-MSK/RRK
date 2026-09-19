export type ParticipantProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string;
  email: string;
};

const STORAGE_KEY = "rrk_participant_profile";

type TelegramWebAppUser = {
  first_name?: string;
  last_name?: string;
  username?: string;
};

function hasProfileValues(profile: Partial<ParticipantProfile> | null | undefined) {
  if (!profile) {
    return false;
  }

  return Boolean(profile.firstName || profile.lastName || profile.phone || profile.telegram || profile.email);
}

function normalizeProfile(profile: Partial<ParticipantProfile>): ParticipantProfile {
  return {
    firstName: profile.firstName?.trim() ?? "",
    lastName: profile.lastName?.trim() ?? "",
    phone: profile.phone?.trim() ?? "",
    telegram: profile.telegram?.trim() ?? "",
    email: profile.email?.trim() ?? "",
  };
}

export function loadParticipantProfile(): ParticipantProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ParticipantProfile>;
    if (!hasProfileValues(parsed)) {
      return null;
    }

    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

export function saveParticipantProfile(profile: ParticipantProfile) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProfile(profile)));
  } catch {
    // ignore quota errors
  }
}

export function loadTelegramProfile(): Partial<ParticipantProfile> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const user = (
    window as Window & {
      Telegram?: { WebApp?: { initDataUnsafe?: { user?: TelegramWebAppUser } } };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.user;

  if (!user) {
    return null;
  }

  const profile: Partial<ParticipantProfile> = {
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    telegram: user.username ? `@${user.username}` : "",
  };

  return hasProfileValues(profile) ? profile : null;
}

export function getPrefillProfile(): ParticipantProfile | null {
  const stored = loadParticipantProfile();
  const telegram = loadTelegramProfile();

  if (!stored && !telegram) {
    return null;
  }

  const merged = normalizeProfile({
    firstName: stored?.firstName || telegram?.firstName || "",
    lastName: stored?.lastName || telegram?.lastName || "",
    phone: stored?.phone || "",
    telegram: stored?.telegram || telegram?.telegram || "",
    email: stored?.email || "",
  });

  return hasProfileValues(merged) ? merged : null;
}
