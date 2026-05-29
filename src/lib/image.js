// Resumen del archivo: src\lib\image.js
// Este modulo esta comentado en estilo docente: explica que hace cada parte, por que existe y como encaja en el flujo general.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

/**
 * Funcion: deriveBackendBaseFromApi.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function deriveBackendBaseFromApi(apiUrl) {
    if (!apiUrl) {
        return "";
    }

    const normalized = String(apiUrl).trim().replace(/\/+$/, "");
    if (!normalized) {
        return "";
    }

    return normalized.replace(/\/api$/i, "");
}

/**
 * Funcion: getBackendBaseUrl.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function getBackendBaseUrl() {
    const explicitBase = String(BACKEND_BASE_URL || "").trim().replace(/\/+$/, "");
    if (explicitBase) {
        return explicitBase;
    }

    return deriveBackendBaseFromApi(API_BASE_URL);
}

export function resolvePublicImageUrl(value) {
    const rawValue = String(value ?? "").trim();
    if (!rawValue) {
        return "";
    }

    if (/^(https?:|data:|blob:)/i.test(rawValue)) {
        return rawValue;
    }

    if (rawValue.startsWith("//")) {
        return `https:${rawValue}`;
    }

    const backendBase = getBackendBaseUrl();
    if (!backendBase) {
        return rawValue;
    }

    if (rawValue.startsWith("/")) {
        return `${backendBase}${rawValue}`;
    }

    return `${backendBase}/${rawValue}`;
}

