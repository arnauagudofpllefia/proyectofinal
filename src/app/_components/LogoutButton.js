"use client";

import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api";

function clearClientSession() {
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
}

export default function LogoutButton() {
    const router = useRouter();

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
            className="rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-400/10 hover:text-rose-100"
        >
            Logout
        </button>
    );
}