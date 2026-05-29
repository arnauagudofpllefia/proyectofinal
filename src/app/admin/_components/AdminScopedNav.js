// Resumen del archivo: src\app\admin\_components\AdminScopedNav.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ADMIN_GYM_SCOPE_EVENT, normalizeGymId, readStoredAdminGymId } from "@/lib/gym";

const gymScopedNavItems = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/machines", label: "Maquinas" },
    { href: "/admin/reservations", label: "Reservas" },
    { href: "/admin/estadisticas", label: "Estadisticas" },
    { href: "/admin/users", label: "Usuarios" },
];

/**
 * Funcion: AdminScopedNav.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function AdminScopedNav() {
    const [selectedGymScopeId, setSelectedGymScopeId] = useState("");

    useEffect(() => {
        const initTimer = setTimeout(() => {
            setSelectedGymScopeId(readStoredAdminGymId());
        }, 0);

        /**
 * Funcion auxiliar: handleGymScopeChange.

         * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

         * Contexto: se usa como callback o helper dentro del flujo del componente.

         */
        const handleGymScopeChange = (event) => {
            const nextGymId = normalizeGymId(event?.detail?.gymId ?? readStoredAdminGymId());
            setSelectedGymScopeId(nextGymId);
        };

        window.addEventListener(ADMIN_GYM_SCOPE_EVENT, handleGymScopeChange);

        return () => {
            clearTimeout(initTimer);
            window.removeEventListener(ADMIN_GYM_SCOPE_EVENT, handleGymScopeChange);
        };
    }, []);

    const hasGymScope = Boolean(selectedGymScopeId);

    return (
        <section className="space-y-2">
            <div className="flex flex-wrap justify-center gap-2">
                {gymScopedNavItems.map((item) =>
                    hasGymScope ? (
                        <Link key={item.href} href={item.href} className="btn-secondary">{item.label}</Link>
                    ) : (
                        <span
                            key={item.href}
                            className="btn-ghost cursor-not-allowed opacity-60"
                            title="Selecciona primero un gimnasio"
                        >
                            {item.label}
                        </span>
                    )
                )}

                <Link href="/admin/gyms" className="btn-secondary">Gimnasios</Link>
            </div>

            {!hasGymScope ? (
                <p className="text-xs text-amber-700">
                    Elige primero un gimnasio para gestionar Resumen, Maquinas, Reservas, Estadisticas y Usuarios.
                </p>
            ) : null}
        </section>
    );
}

