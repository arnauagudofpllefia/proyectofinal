"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { listAdminResource, normalizeResourceList } from "@/lib/admin";
import {
    ADMIN_GYM_SCOPE_EVENT,
    filterItemsByGym,
    normalizeGymId,
    readStoredAdminGymId,
} from "@/lib/gym";

function formatHourLabel(hourValue) {
    return `${String(hourValue).padStart(2, "0")}:00`;
}

function getReservationHour(reservation) {
    const candidates = [
        reservation?.startTime,
        reservation?.hora_inicio,
        reservation?.start_time,
        reservation?.hour,
        reservation?.hora,
        reservation?.time,
    ];

    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        const match = String(candidate).match(/(\d{2}):\d{2}/);
        if (match) {
            return match[1];
        }
    }

    return "";
}

function getMachineIdentifier(reservation) {
    return String(reservation?.machineId ?? reservation?.maquina_id ?? reservation?.machine_id ?? "").trim();
}

function buildMachineLookup(machines) {
    return new Map(
        machines.map((machine) => {
            const machineId = String(machine?.id ?? machine?.uuid ?? "").trim();
            const machineName = String(machine?.name ?? machine?.nombre ?? "").trim();
            return [machineId, machineName];
        })
    );
}

function aggregateCounts(items, getKey, getLabel) {
    const counts = new Map();

    for (const item of items) {
        const key = String(getKey(item) ?? "").trim();
        if (!key) {
            continue;
        }

        const current = counts.get(key) ?? { key, label: getLabel(item, key), count: 0 };
        current.count += 1;
        counts.set(key, current);
    }

    return [...counts.values()].sort((left, right) => {
        if (right.count !== left.count) {
            return right.count - left.count;
        }

        return String(left.label).localeCompare(String(right.label), "es");
    });
}

function ChartShell({ title, subtitle, children, emptyLabel, loading }) {
    return (
        <article className="surface-card p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{subtitle}</p>
                    <h3 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{title}</h3>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-[var(--muted)]">Cargando estadisticas...</p>
            ) : emptyLabel ? (
                <p className="text-sm text-[var(--muted)]">{emptyLabel}</p>
            ) : (
                children
            )}
        </article>
    );
}

function ChartTooltip({ active, payload, label, suffix = "reservas" }) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 shadow-[var(--shadow-md)]">
            <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
            <p className="text-sm text-[var(--muted)]">
                {payload[0]?.value ?? 0} {suffix}
            </p>
        </div>
    );
}

function StatCard({ label, value, hint }) {
    return (
        <article className="surface-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--primary-strong)]">{value}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p>
        </article>
    );
}

export default function AdminStatisticsPage() {
    const [selectedGymScopeId, setSelectedGymScopeId] = useState("");
    const [reservations, setReservations] = useState([]);
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

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
            setReservations([]);
            setMachines([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const loadStatistics = async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const token = localStorage.getItem("auth_token") || "";
                const [reservationsResponse, machinesResponse] = await Promise.all([
                    listAdminResource("reservations", token, { gymId: selectedGymScopeId }),
                    listAdminResource("machines", token, { gymId: selectedGymScopeId }),
                ]);

                if (cancelled) {
                    return;
                }

                const normalizedReservations = filterItemsByGym(
                    normalizeResourceList("reservations", reservationsResponse),
                    selectedGymScopeId
                );
                const normalizedMachines = filterItemsByGym(
                    normalizeResourceList("machines", machinesResponse),
                    selectedGymScopeId
                );

                setReservations(normalizedReservations);
                setMachines(normalizedMachines);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                if (error?.status === 401 || error?.status === 403) {
                    setErrorMessage("Solo administradores pueden acceder al backoffice.");
                    return;
                }

                setErrorMessage(error?.message || "No se pudieron cargar las estadisticas.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadStatistics();

        return () => {
            cancelled = true;
        };
    }, [selectedGymScopeId]);

    const machineLookup = useMemo(() => buildMachineLookup(machines), [machines]);

    const getResolvedMachineLabel = (reservation, key) => {
        const fallbackName = String(reservation?.machineName ?? reservation?.maquina_nombre ?? key ?? "Maquina sin nombre").trim();
        return machineLookup.get(key) || fallbackName;
    };

    const topMachines = useMemo(() => {
        return aggregateCounts(
            reservations,
            (reservation) => getMachineIdentifier(reservation) || String(reservation?.machineName ?? reservation?.maquina_nombre ?? "").trim(),
            getResolvedMachineLabel
        ).slice(0, 8);
    }, [machineLookup, reservations]);

    const hourCounts = useMemo(() => {
        return aggregateCounts(
            reservations,
            (reservation) => getReservationHour(reservation),
            (_, key) => formatHourLabel(key)
        ).slice(0, 8);
    }, [reservations]);

    const machineRanking = useMemo(() => {
        return aggregateCounts(
            reservations,
            (reservation) => getMachineIdentifier(reservation) || String(reservation?.machineName ?? reservation?.maquina_nombre ?? "").trim(),
            getResolvedMachineLabel
        ).slice(0, 10);
    }, [machineLookup, reservations]);

    const topMachinesChartData = useMemo(
        () => topMachines.map((item) => ({ ...item, value: item.count })),
        [topMachines]
    );

    const hourChartData = useMemo(
        () => hourCounts.map((item) => ({ ...item, value: item.count })),
        [hourCounts]
    );

    const rankingChartData = useMemo(
        () => machineRanking.slice().reverse().map((item) => ({ ...item, value: item.count })),
        [machineRanking]
    );

    const busiestHour = hourCounts[0];
    const mostUsedMachine = machineRanking[0];

    return (
        <section className="space-y-6">
            <header className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--muted)]">Analitica</p>
                <h2 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Estadisticas</h2>
                <p className="max-w-3xl text-sm text-[var(--muted)]">
                    Indicadores del gimnasio activo: maquinas mas reservadas, horas con mas actividad y ranking de uso.
                </p>
            </header>

            {!selectedGymScopeId ? (
                <div className="surface-card p-5 text-sm text-[var(--muted)]">
                    Selecciona primero un gimnasio para ver sus estadisticas.
                </div>
            ) : null}

            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

            {selectedGymScopeId ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Reservas totales"
                            value={loading ? "--" : reservations.length}
                            hint="Cantidad total de reservas en el gimnasio activo."
                        />
                        <StatCard
                            label="Maquinas con uso"
                            value={loading ? "--" : machineRanking.length}
                            hint="Maquinas distintas que han recibido al menos una reserva."
                        />
                        <StatCard
                            label="Hora mas activa"
                            value={loading || !busiestHour ? "--" : formatHourLabel(busiestHour.key)}
                            hint={loading || !busiestHour ? "Aun no hay datos suficientes." : `${busiestHour.count} reservas en esa franja.`}
                        />
                        <StatCard
                            label="Maquina lider"
                            value={loading || !mostUsedMachine ? "--" : mostUsedMachine.label}
                            hint={loading || !mostUsedMachine ? "Aun no hay datos suficientes." : `${mostUsedMachine.count} reservas registradas.`}
                        />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <ChartShell
                            title="Top maquinas"
                            subtitle="Maquinas mas reservadas"
                            loading={loading}
                            emptyLabel={!loading && !topMachinesChartData.length ? "Todavia no hay reservas para mostrar." : ""}
                        >
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={topMachinesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 24, 39, 0.08)" />
                                        <XAxis
                                            dataKey="label"
                                            interval={0}
                                            angle={-18}
                                            textAnchor="end"
                                            height={60}
                                            tick={{ fill: "#4b5563", fontSize: 12 }}
                                        />
                                        <YAxis allowDecimals={false} tick={{ fill: "#4b5563", fontSize: 12 }} />
                                        <Tooltip content={<ChartTooltip suffix="reservas" />} />
                                        <Legend />
                                        <Bar dataKey="value" name="Reservas" fill="var(--primary)" radius={[10, 10, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartShell>

                        <ChartShell
                            title="Picos de actividad"
                            subtitle="Horas con mas reservas"
                            loading={loading}
                            emptyLabel={!loading && !hourChartData.length ? "Aun no hay horas registradas para este gimnasio." : ""}
                        >
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={hourChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 24, 39, 0.08)" />
                                        <XAxis dataKey="label" tick={{ fill: "#4b5563", fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fill: "#4b5563", fontSize: 12 }} />
                                        <Tooltip content={<ChartTooltip suffix="reservas" />} />
                                        <Legend />
                                        <Bar dataKey="value" name="Reservas" fill="var(--accent)" radius={[10, 10, 0, 0]} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartShell>
                    </div>

                    <ChartShell
                        title="Clasificacion general"
                        subtitle="Ranking de maquinas mas usadas"
                        loading={loading}
                        emptyLabel={!loading && !rankingChartData.length ? "Todavia no hay reservas para construir el ranking." : ""}
                    >
                        <div className="h-[30rem] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart
                                    data={rankingChartData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 24, 39, 0.08)" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fill: "#4b5563", fontSize: 12 }} />
                                    <YAxis
                                        dataKey="label"
                                        type="category"
                                        width={180}
                                        tick={{ fill: "#111827", fontSize: 12 }}
                                    />
                                    <Tooltip content={<ChartTooltip suffix="reservas" />} />
                                    <Legend />
                                    <Bar dataKey="value" name="Reservas" fill="var(--primary-strong)" radius={[0, 10, 10, 0]}>
                                        {rankingChartData.map((entry, index) => (
                                            <Cell key={entry.key} fill={index % 2 === 0 ? "#16a34a" : "#111111"} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartShell>
                </>
            ) : null}
        </section>
    );
}