
"use client";

import { useEffect, useState } from "react";
import { listAdminResource, normalizeResourceList } from "@/lib/admin";
import { normalizeGymId, readStoredAdminGymId, writeStoredAdminGymId } from "@/lib/gym";

/**
 * Funcion: AdminGymScopePicker.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function AdminGymScopePicker() {
    const [gymOptions, setGymOptions] = useState([]);
    const [selectedGymId, setSelectedGymId] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            (async () => {
                const token = localStorage.getItem("auth_token") || "";
                const storedGymId = readStoredAdminGymId();

                try {
                    const gymsResponse = await listAdminResource("gyms", token);
                    const normalizedGyms = normalizeResourceList("gyms", gymsResponse);
                    const nextOptions = normalizedGyms
                        .map((gym) => {
                            const gymId = normalizeGymId(gym?.id);

                            if (!gymId) {
                                return null;
                            }

                            return {
                                value: gymId,
                                label: gym?.name || `Gimnasio ${gymId}`,
                            };
                        })
                        .filter(Boolean);

                    setGymOptions(nextOptions);

                    const hasStoredGym = nextOptions.some((gym) => gym.value === storedGymId);
                    const defaultGymId = hasStoredGym ? storedGymId : "";
                    setSelectedGymId(defaultGymId);
                    writeStoredAdminGymId(defaultGymId);
                } catch {
                    setGymOptions([]);
                    setSelectedGymId("");
                    writeStoredAdminGymId("");
                } finally {
                    setLoading(false);
                }
            })();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="surface-card p-5">
            <label className="block text-sm font-medium text-[var(--foreground)]">
                Selecciona un gimnasio
                <select
                    value={selectedGymId}
                    onChange={(event) => {
                        const nextGymId = normalizeGymId(event.target.value);
                        setSelectedGymId(nextGymId);
                        writeStoredAdminGymId(nextGymId);
                    }}
                    disabled={loading}
                    className="field-input mt-1"
                >
                    <option value="">Selecciona un gimnasio</option>
                    {gymOptions.map((gym) => (
                        <option key={gym.value} value={gym.value}>
                            {gym.label}
                        </option>
                    ))}
                </select>
            </label>
        </section>
    );
}

