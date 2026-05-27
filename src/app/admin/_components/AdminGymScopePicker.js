"use client";

import { useEffect, useMemo, useState } from "react";
import { listAdminResource, normalizeResourceList } from "@/lib/admin";
import { normalizeGymId, readStoredAdminGymId, writeStoredAdminGymId } from "@/lib/gym";

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

    const optionLabel = useMemo(() => {
        const selectedOption = gymOptions.find((gym) => gym.value === selectedGymId);
        return selectedOption?.label ?? "Sin gimnasio seleccionado";
    }, [gymOptions, selectedGymId]);

    return (
        <section className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Ambito admin</p>
                    <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Gimnasio activo</h2>
                </div>
                <p className="text-xs text-[var(--muted)]">{loading ? "Cargando gimnasios..." : optionLabel}</p>
            </div>

            <label className="mt-3 block text-sm font-medium text-[var(--foreground)]">
                Selecciona gimnasio a administrar
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