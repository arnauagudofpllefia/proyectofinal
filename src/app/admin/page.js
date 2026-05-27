"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminResources, listAdminResource, normalizeResourceList } from "@/lib/admin";
import { ADMIN_GYM_SCOPE_EVENT, filterItemsByGym, normalizeGymId, readStoredAdminGymId } from "@/lib/gym";

const resources = getAdminResources();
const gymScopedResourceKeys = new Set(["machines", "reservations", "users"]);

export default function AdminHomePage() {
    const [counts, setCounts] = useState({});
    const [errorMessage, setErrorMessage] = useState("");
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

    useEffect(() => {
        if (!selectedGymScopeId) {
            return;
        }

        const timer = setTimeout(async () => {
            const token = localStorage.getItem("auth_token") || "";

            try {
                const results = await Promise.all(
                    resources.map(async (resource) => {
                        const response = await listAdminResource(resource.key, token, { gymId: selectedGymScopeId });
                        const normalized = normalizeResourceList(resource.key, response);
                        const scopedItems =
                            selectedGymScopeId && gymScopedResourceKeys.has(resource.key)
                                ? filterItemsByGym(normalized, selectedGymScopeId)
                                : normalized;

                        return [resource.key, scopedItems.length];
                    })
                );

                setCounts(Object.fromEntries(results));
            } catch (error) {
                if (error?.status === 401 || error?.status === 403) {
                    setErrorMessage("Solo administradores pueden acceder al backoffice.");
                    return;
                }

                setErrorMessage(error.message || "No se pudo cargar el resumen del backoffice.");
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [selectedGymScopeId]);

    const visibleResources = resources.filter((resource) => {
        if (resource.key === "gyms") {
            return true;
        }

        if (!selectedGymScopeId && gymScopedResourceKeys.has(resource.key)) {
            return false;
        }

        return true;
    });

    return (
        <section className="space-y-6">
            <header className="glass-panel rounded-2xl p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Resumen</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Vista global del sistema</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Accede al CRUD de cada recurso desde paginas separadas dentro de la carpeta admin.
                </p>
                {selectedGymScopeId ? (
                    <p className="mt-2 text-xs text-cyan-100">Filtrando por gimnasio {selectedGymScopeId}.</p>
                ) : (
                    <p className="mt-2 text-xs text-amber-200">Selecciona un gimnasio para habilitar Resumen, Maquinas, Reservas y Usuarios.</p>
                )}
                {errorMessage ? <p className="mt-3 text-sm text-rose-300">{errorMessage}</p> : null}
            </header>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {visibleResources.map((resource) => (
                    <Link
                        key={resource.key}
                        href={`/admin/${resource.slug}`}
                        className="glass-panel rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/35"
                    >
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{resource.title}</p>
                        <p className="mt-3 text-4xl font-semibold text-cyan-200">{counts[resource.key] ?? "--"}</p>
                        <p className="mt-3 text-sm text-slate-300">{resource.description}</p>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                            Abrir gestion
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}