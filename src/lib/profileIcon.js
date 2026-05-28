export const DEFAULT_PROFILE_ICON_ID = "user";
export const PROFILE_ICON_UPDATED_EVENT = "profile-icon-updated";

export const PROFILE_ICON_PRESETS = [
  {
    id: "user",
    label: "Clasico",
    paths: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 20a8 8 0 0 1 16 0"],
  },
  {
    id: "bolt",
    label: "Energia",
    paths: ["M13 2 5 14h6l-1 8 8-12h-6z"],
  },
  {
    id: "dumbbell",
    label: "Fuerza",
    paths: ["M3 10h2v4H3z", "M19 10h2v4h-2z", "M5 11h3v2H5z", "M16 11h3v2h-3z", "M8 10h8v4H8z"],
  },
  {
    id: "star",
    label: "Pro",
    paths: ["m12 3 2.8 5.8L21 9.7l-4.6 4.5 1.1 6.3L12 17.8 6.5 20.5l1.1-6.3L3 9.7l6.2-.9Z"],
  },
  {
    id: "flame",
    label: "Racha",
    paths: ["M12 2c2.2 2 3.4 4.1 3.4 6.2 0 1.7-.8 3.3-2.2 4.5 2.1-.2 4.1 1.5 4.1 4.1A5.3 5.3 0 0 1 12 22a5.3 5.3 0 0 1-5.3-5.2c0-2.6 1.7-4.6 3.8-6.3 1.2-1 1.8-2.2 1.5-3.5Z"],
  },
  {
    id: "shield",
    label: "Guardian",
    paths: ["M12 3 5.5 6v5.4c0 4.3 2.7 7.8 6.5 9.6 3.8-1.8 6.5-5.3 6.5-9.6V6z"],
  },
];

function normalizeIconId(iconId) {
  if (!iconId) {
    return DEFAULT_PROFILE_ICON_ID;
  }

  const exists = PROFILE_ICON_PRESETS.some((icon) => icon.id === iconId);
  return exists ? iconId : DEFAULT_PROFILE_ICON_ID;
}

function getStorageKey(identity) {
  return `profile_icon:${identity || "anonymous"}`;
}

export function extractProfileIdentity(payload) {
  const user = payload?.data ?? payload ?? {};
  return String(
    user?.id ?? user?.user_id ?? user?.usuario_id ?? user?.uuid ?? user?.email ?? user?.nombre ?? "anonymous"
  );
}

export function readStoredProfileIcon(identity) {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE_ICON_ID;
  }

  const saved = localStorage.getItem(getStorageKey(identity));
  return normalizeIconId(saved);
}

export function saveStoredProfileIcon(identity, iconId) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeIconId(iconId);
  localStorage.setItem(getStorageKey(identity), normalized);
  window.dispatchEvent(
    new CustomEvent(PROFILE_ICON_UPDATED_EVENT, {
      detail: { identity, iconId: normalized },
    })
  );
}

export function getProfileIconDefinition(iconId) {
  const normalized = normalizeIconId(iconId);
  return (
    PROFILE_ICON_PRESETS.find((icon) => icon.id === normalized) ||
    PROFILE_ICON_PRESETS.find((icon) => icon.id === DEFAULT_PROFILE_ICON_ID)
  );
}