
export const ADMIN_GYM_SCOPE_KEY = "admin_active_gym_id";
export const ADMIN_GYM_SCOPE_EVENT = "admin-gym-scope-change";

export function normalizeGymId(value) {
    const raw = String(value ?? "").trim();

    if (!raw) {
        return "";
    }

    if (/^\d+$/.test(raw)) {
        return raw;
    }

    const fallbackMatch = raw.match(/^gym-(\d+)$/i);
    return fallbackMatch ? fallbackMatch[1] : raw;
}

export function getGymIdFromUser(payload) {
    const user = payload?.data ?? payload;
    const candidate = user?.gym_id ?? user?.gimnasio_id ?? user?.gym?.id ?? user?.gimnasio?.id;
    return normalizeGymId(candidate);
}

export function getGymNameFromUser(payload) {
    const user = payload?.data ?? payload;
    return user?.gym?.name ?? user?.gym?.nombre ?? user?.gimnasio?.name ?? user?.gimnasio?.nombre ?? "";
}

export function getUserRole(payload) {
    const user = payload?.data ?? payload;
    const role = user?.role ?? user?.rol ?? user?.tipo ?? user?.data?.role ?? user?.data?.rol ?? user?.data?.tipo;
    return String(role ?? "").trim().toLowerCase();
}

export function isAdminRole(role) {
    return String(role ?? "").trim().toLowerCase() === "admin";
}

export function getGymIdFromItem(item) {
    if (!item || typeof item !== "object") {
        return "";
    }

    const candidate =
        item?.gymId ??
        item?.gym_id ??
        item?.gimnasio_id ??
        item?.gym?.id ??
        item?.gimnasio?.id ??
        item?.machine?.gym_id ??
        item?.machine?.gimnasio_id ??
        item?.maquina?.gym_id ??
        item?.maquina?.gimnasio_id;

    return normalizeGymId(candidate);
}

export function filterItemsByGym(items, gymId) {
    const normalizedGymId = normalizeGymId(gymId);

    if (!normalizedGymId || !Array.isArray(items)) {
        return Array.isArray(items) ? items : [];
    }

    return items.filter((item) => getGymIdFromItem(item) === normalizedGymId);
}

export function readStoredAdminGymId() {
    if (typeof window === "undefined") {
        return "";
    }

    return normalizeGymId(window.localStorage.getItem(ADMIN_GYM_SCOPE_KEY) || "");
}

export function writeStoredAdminGymId(gymId) {
    if (typeof window === "undefined") {
        return;
    }

    const normalizedGymId = normalizeGymId(gymId);

    if (!normalizedGymId) {
        window.localStorage.removeItem(ADMIN_GYM_SCOPE_KEY);
    } else {
        window.localStorage.setItem(ADMIN_GYM_SCOPE_KEY, normalizedGymId);
    }

    window.dispatchEvent(
        new CustomEvent(ADMIN_GYM_SCOPE_EVENT, {
            detail: { gymId: normalizedGymId },
        })
    );
}

