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
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/70 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
            Logout
        </button>
    );
}