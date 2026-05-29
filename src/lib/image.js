// Resumen del archivo: src\lib\image.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

/**
 * Funcion: deriveBackendBaseFromApi.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

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

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

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

