// Resumen del archivo: src\lib\session.js
// Este modulo esta comentado en estilo docente: explica que hace cada parte, por que existe y como encaja en el flujo general.

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/api";

/**
 * Funcion: normalizeRole.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function normalizeRole(user) {
    const rawRole =
        user?.role ??
        user?.rol ??
        user?.tipo ??
        user?.data?.role ??
        user?.data?.rol ??
        user?.data?.tipo ??
        "";

    return String(rawRole).trim().toLowerCase();
}

export async function getServerSessionInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || "";

    if (!token) {
        return {
            token: "",
            user: null,
            role: "",
            isAuthenticated: false,
            isAdmin: false,
        };
    }

    try {
        const user = await getCurrentUser(token);
        const role = normalizeRole(user);

        return {
            token,
            user,
            role,
            isAuthenticated: true,
            isAdmin: role === "admin",
        };
    } catch {
        return {
            token,
            user: null,
            role: "",
            isAuthenticated: true,
            isAdmin: false,
        };
    }
}

