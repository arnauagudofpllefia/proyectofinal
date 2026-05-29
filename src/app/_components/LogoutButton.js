// Resumen del archivo: src\app\_components\LogoutButton.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api";

/**
 * Funcion: clearClientSession.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function clearClientSession() {
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
}

/**
 * Funcion: LogoutButton.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function LogoutButton() {
    const router = useRouter();

    /**
 * Funcion auxiliar: handleLogout.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

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

