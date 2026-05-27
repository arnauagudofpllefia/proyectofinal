"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ADMIN_GYM_SCOPE_EVENT, normalizeGymId, readStoredAdminGymId } from "@/lib/gym";

const gymScopedNavItems = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/machines", label: "Maquinas" },
    { href: "/admin/reservations", label: "Reservas" },
    { href: "/admin/users", label: "Usuarios" },
];

export default function AdminScopedNav() {
    const [selectedGymScopeId, setSelectedGymScopeId] = useState(() => readStoredAdminGymId());

    useEffect(() => {
        const handleGymScopeChange = (event) => {
            const nextGymId = normalizeGymId(event?.detail?.gymId ?? readStoredAdminGymId());
            setSelectedGymScopeId(nextGymId);
        };

        window.addEventListener(ADMIN_GYM_SCOPE_EVENT, handleGymScopeChange);

        return () => {
            window.removeEventListener(ADMIN_GYM_SCOPE_EVENT, handleGymScopeChange);
        };
    }, []);

    const hasGymScope = Boolean(selectedGymScopeId);

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <Link
                    href="/admin/gyms"
                    className="rounded-xl border border-cyan-300/20 bg-slate-950/40 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
                >
                    Gimnasios
                </Link>

                {gymScopedNavItems.map((item) =>
                    hasGymScope ? (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-xl border border-cyan-300/20 bg-slate-950/40 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            key={item.href}
                            className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-500"
                            title="Selecciona primero un gimnasio"
                        >
                            {item.label}
                        </span>
                    )
                )}
            </div>

            {!hasGymScope ? (
                <p className="text-xs text-amber-200">
                    Elige primero un gimnasio para gestionar Resumen, Maquinas, Reservas y Usuarios.
                </p>
            ) : null}
        </section>
    );
}