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
    const [selectedGymScopeId, setSelectedGymScopeId] = useState("");

    useEffect(() => {
        const initTimer = setTimeout(() => {
            setSelectedGymScopeId(readStoredAdminGymId());
        }, 0);

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
            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {visibleResources.map((resource) => (
                    <Link
                        key={resource.key}
                        href={`/admin/${resource.slug}`}
                        className="surface-card surface-card-hover p-5"
                    >
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{resource.title}</p>
                        <p className="mt-2 text-3xl font-semibold text-[var(--primary-strong)]">{counts[resource.key] ?? "--"}</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">{resource.description}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                            Abrir gestion →
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}