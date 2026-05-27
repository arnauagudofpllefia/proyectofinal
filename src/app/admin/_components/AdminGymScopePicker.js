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
        <section className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Ambito admin</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">Gimnasio activo</h2>
                </div>
                <p className="text-xs text-slate-400">{loading ? "Cargando gimnasios..." : optionLabel}</p>
            </div>

            <label className="mt-3 block text-sm text-slate-300">
                Selecciona gimnasio a administrar
                <select
                    value={selectedGymId}
                    onChange={(event) => {
                        const nextGymId = normalizeGymId(event.target.value);
                        setSelectedGymId(nextGymId);
                        writeStoredAdminGymId(nextGymId);
                    }}
                    disabled={loading}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70 disabled:opacity-60"
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