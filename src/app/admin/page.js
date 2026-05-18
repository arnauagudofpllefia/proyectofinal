"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminResources, listAdminResource, normalizeResourceList } from "@/lib/admin";

const resources = getAdminResources();

export default function AdminHomePage() {
    const [counts, setCounts] = useState({});
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const timer = setTimeout(async () => {
            const token = localStorage.getItem("auth_token") || "";

            try {
                const results = await Promise.all(
                    resources.map(async (resource) => {
                        const response = await listAdminResource(resource.key, token);
                        return [resource.key, normalizeResourceList(resource.key, response).length];
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
    }, []);

    return (
        <section className="space-y-6">
            <header className="glass-panel rounded-2xl p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Resumen</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Vista global del sistema</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Accede al CRUD de cada recurso desde paginas separadas dentro de la carpeta admin.
                </p>
                {errorMessage ? <p className="mt-3 text-sm text-rose-300">{errorMessage}</p> : null}
            </header>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {resources.map((resource) => (
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