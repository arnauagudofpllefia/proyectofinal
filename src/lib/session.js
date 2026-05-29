// Resumen del archivo: src\lib\session.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/api";

/**
 * Funcion: normalizeRole.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

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

