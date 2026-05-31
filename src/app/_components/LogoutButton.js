
"use client";

import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api";

/**
 * Funcion: clearClientSession.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function clearClientSession() {
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
}

/**
 * Funcion: LogoutButton.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function LogoutButton() {
    const router = useRouter();

    /**
 * Funcion: handleLogout.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
    const handleLogout = async () => {
        const token = localStorage.getItem("auth_token") || "";

        try {
            if (token) {
                await logoutRequest(token);
            }
        } catch {
            // Si el backend ya invalido la sesion, limpiamos igual del lado cliente.
        } finally {
            clearClientSession();
            router.replace("/login");
            router.refresh();
        }
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/70 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
            Logout
        </button>
    );
}

