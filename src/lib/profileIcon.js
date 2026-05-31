
import { resolvePublicImageUrl } from "@/lib/image";

export const DEFAULT_PROFILE_ICON_ID = "avatar4";
export const PROFILE_ICON_UPDATED_EVENT = "profile-icon-updated";

export const PROFILE_ICON_PRESETS = [
  { id: "avatar1", label: "Avatar 1" },
  { id: "avatar2", label: "Avatar 2" },
  { id: "avatar3", label: "Avatar 3" },
  { id: "avatar4", label: "Avatar 4" },
  { id: "avatar5", label: "Avatar 5" },
  { id: "avatar6", label: "Avatar 6" },
  { id: "avatar7", label: "Avatar 7" },
  { id: "avatar8", label: "Avatar 8" },
  { id: "avatar9", label: "Avatar 9" },
  { id: "avatar10", label: "Avatar 10" },
];

const LEGACY_GLYPH_ICON = {
  id: "legacy",
  paths: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 20a8 8 0 0 1 16 0"],
};

const AVATAR_ID_PATTERN = /^avatar(?:10|[1-9])(?:\.[a-z0-9]+)?$/i;

/**
 * Funcion: isAvatarId.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function isAvatarId(iconId) {
  return AVATAR_ID_PATTERN.test(String(iconId || "").trim());
}

/**
 * Funcion: normalizeIconId.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function normalizeIconId(iconId) {
  const normalized = String(iconId || "").trim();
  if (!normalized) {
    return DEFAULT_PROFILE_ICON_ID;
  }

  return isAvatarId(normalized) ? normalized : DEFAULT_PROFILE_ICON_ID;
}

/**
 * Funcion: getStorageKey.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
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

  const storageKey = getStorageKey(identity);
  const saved = localStorage.getItem(storageKey);
  if (saved && isAvatarId(saved)) {
    return normalizeIconId(saved);
  }

  localStorage.setItem(storageKey, DEFAULT_PROFILE_ICON_ID);
  return DEFAULT_PROFILE_ICON_ID;
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

export function getProfileAvatarUrl(iconId) {
  const normalized = normalizeIconId(iconId);
  const encoded = encodeURIComponent(normalized);
  return resolvePublicImageUrl(`/api/avatar-images/${encoded}`);
}

export function getProfileIconDefinition(iconId) {
  if (isAvatarId(iconId)) {
    return LEGACY_GLYPH_ICON;
  }

  return LEGACY_GLYPH_ICON;
}

