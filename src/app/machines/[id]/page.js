"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createReservation, getCurrentUser, getMachineById, getMachineReservations, getMachineSlots } from "@/lib/api";

function normalizeMachine(data, machineId) {
	return {
		id: String(data?.id ?? data?.uuid ?? machineId ?? ""),
		name: data?.name ?? data?.nombre ?? `Maquina #${machineId}`,
		status: data?.status ?? data?.estado ?? "Sin estado",
		zone: data?.zone ?? data?.zona ?? "Sin zona",
		description: data?.description ?? data?.descripcion ?? "",
		gymName: data?.gym?.name ?? data?.gym?.nombre ?? data?.gimnasio?.name ?? data?.gimnasio?.nombre ?? "-",
		gymId: String(data?.gym_id ?? data?.gimnasio_id ?? data?.gym?.id ?? ""),
	};
}

function normalizeSlots(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((slot, index) => ({
		id: String(slot?.id ?? slot?.uuid ?? index + 1),
		hour: slot?.hour ?? slot?.hora ?? slot?.time ?? "--:--",
		spots: slot?.spots ?? slot?.plazas ?? slot?.available ?? 0,
		status: slot?.status ?? slot?.estado ?? "disponible",
	}));
}

function toIsoDateTime(date, time) {
	return `${date}T${time}:00`;
}

function normalizeHourValue(value) {
	if (typeof value !== "string") {
		return "";
	}

	const match = value.match(/(\d{2}:\d{2})/);
	return match ? match[1] : "";
}

function addMinutesToTime(time, minutesToAdd) {
	const [hourString, minuteString] = String(time).split(":");
	const hours = Number.parseInt(hourString, 10);
	const minutes = Number.parseInt(minuteString, 10);

	if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
		return "";
	}

	const totalMinutes = hours * 60 + minutes + minutesToAdd;
	const normalizedTotal = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
	const finalHours = String(Math.floor(normalizedTotal / 60)).padStart(2, "0");
	const finalMinutes = String(normalizedTotal % 60).padStart(2, "0");

	return `${finalHours}:${finalMinutes}`;
}

function isSlotReservable(slot) {
	const status = String(slot?.status ?? "").toLowerCase();
	const blockedStatuses = ["mantenimiento", "cerrado", "ocupado", "completo", "full"];
	const isBlocked = blockedStatuses.some((blocked) => status.includes(blocked));
	const spots = Number(slot?.spots ?? 0);

	return !isBlocked && spots > 0;
}

function extractUserId(userPayload) {
	const user = userPayload?.data ?? userPayload;
	const candidate = user?.id ?? user?.user_id ?? user?.usuario_id ?? user?.uuid;
	return candidate != null ? String(candidate) : "";
}

function normalizeReservationDate(value) {
	if (typeof value !== "string" || !value) {
		return "Sin fecha";
	}

	if (value.includes("T")) {
		return value.split("T")[0];
	}

	return value;
}

function normalizeReservationHour(value) {
	if (typeof value !== "string" || !value) {
		return "--:--";
	}

	const match = value.match(/(\d{2}:\d{2})/);
	return match ? match[1] : "--:--";
}

function getReservationTimestamp(item) {
	const rawDateTime = item?.hora_inicio ?? item?.start_time;
	if (typeof rawDateTime === "string" && rawDateTime) {
		const parsed = Date.parse(rawDateTime);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}

	const rawDate = item?.date ?? item?.fecha;
	const rawHour = item?.hour ?? item?.hora;
	if (typeof rawDate === "string" && rawDate) {
		const combined = rawHour ? `${rawDate}T${rawHour}` : rawDate;
		const parsed = Date.parse(combined);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}

	return 0;
}

function normalizePublicReservations(payload) {
	const reservasArray = payload?.reservas ?? payload?.data ?? [];
	if (!Array.isArray(reservasArray)) {
		return [];
	}

	return reservasArray
		.sort((a, b) => {
			const timeA = Date.parse(a?.hora ?? "");
			const timeB = Date.parse(b?.hora ?? "");
			return timeA - timeB;
		})
		.map((item, index) => {
			const horaValue = item?.hora ?? "";
			return {
				id: String(index),
				hora: horaValue,
				horaDisplay: horaValue.includes("T") ? horaValue.split("T")[1]?.slice(0, 5) : "--:--",
				estado: item?.estado ?? "activa",
				plazas: item?.plazas ?? 0,
			};
		});
}

function getDayLabel(dateValue) {
	if (typeof dateValue !== "string" || !dateValue) {
		return "Sin fecha";
	}

	const parsedDate = new Date(dateValue);
	if (Number.isNaN(parsedDate.getTime())) {
		return dateValue;
	}

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const startOfDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
	const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

	if (diffDays === 0) {
		return "Hoy";
	}

	if (diffDays === 1) {
		return "Ayer";
	}

	return parsedDate.toLocaleDateString("es-ES", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

export default function MachineDetailPage() {
	const params = useParams();
	const id = params?.id;
	const [machine, setMachine] = useState(null);
	const [slots, setSlots] = useState([]);
	const [machineReservations, setMachineReservations] = useState([]);
	const [apiError, setApiError] = useState("");
	const [reservationsError, setReservationsError] = useState("");
	const [form, setForm] = useState({ date: "", startTime: "", endTime: "" });
	const [requestState, setRequestState] = useState({ loading: false, error: "", success: "" });
	const [expandedDays, setExpandedDays] = useState({});

	const availableSlots = useMemo(() => {
		return slots
			.map((slot) => ({ ...slot, hour: normalizeHourValue(slot.hour) }))
			.filter((slot) => slot.hour && isSlotReservable(slot));
	}, [slots]);

	const availableHourSet = useMemo(() => {
		return new Set(availableSlots.map((slot) => slot.hour));
	}, [availableSlots]);

	const loadMachineData = useCallback(async () => {
		if (!id) {
			return;
		}

		const token = localStorage.getItem("auth_token") || "";
		const machineResponse = await getMachineById(id, token);
		const normalizedMachine = normalizeMachine(machineResponse?.data ?? machineResponse, id);
		setMachine(normalizedMachine);

		try {
			const slotsResponse = await getMachineSlots(id, token);
			setSlots(normalizeSlots(slotsResponse));
		} catch {
			setSlots([]);
		}

		try {
			const reservationsResponse = await getMachineReservations(id, token);
			setMachineReservations(normalizePublicReservations(reservationsResponse));
			setReservationsError("");
		} catch (error) {
			setMachineReservations([]);
			setReservationsError("");
		}
	}, [id]);

	useEffect(() => {
		if (!id) {
			return;
		}

		const timer = setTimeout(async () => {
			try {
				await loadMachineData();
				setApiError("");
			} catch (error) {
				setApiError(error.message);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, [id, loadMachineData]);

	const handleChange = (field, value) => {
		setForm((prev) => {
			if (field === "startTime") {
				return {
					...prev,
					startTime: value,
					endTime: value ? addMinutesToTime(value, 60) : "",
				};
			}

			return { ...prev, [field]: value };
		});
	};

	const handleReserve = async (event) => {
		event.preventDefault();
		setRequestState({ loading: true, error: "", success: "" });

		if (!form.date || !form.startTime || !form.endTime) {
			setRequestState({
				loading: false,
				error: "Completa fecha, hora de inicio y hora de fin.",
				success: "",
			});
			return;
		}

		if (form.endTime <= form.startTime) {
			setRequestState({
				loading: false,
				error: "La hora de fin debe ser posterior a la de inicio.",
				success: "",
			});
			return;
		}

		if (availableSlots.length && !availableHourSet.has(form.startTime)) {
			setRequestState({
				loading: false,
				error: "Selecciona una franja disponible para evitar solapamientos.",
				success: "",
			});
			return;
		}

		const token = localStorage.getItem("auth_token") || "";
		if (!token) {
			setRequestState({
				loading: false,
				error: "Inicia sesion para poder reservar.",
				success: "",
			});
			return;
		}

		let userId = "";
		try {
			const meResponse = await getCurrentUser(token);
			userId = extractUserId(meResponse);
		} catch {
			userId = "";
		}

		if (!userId) {
			setRequestState({
				loading: false,
				error: "No se pudo identificar tu usuario. Vuelve a iniciar sesion.",
				success: "",
			});
			return;
		}

		const payload = {
			usuario_id: userId,
			user_id: userId,
			maquina_id: machine?.id ?? String(id),
			machine_id: machine?.id ?? String(id),
			gimnasio_id: machine?.gymId || undefined,
			gym_id: machine?.gymId || undefined,
			hora_inicio: toIsoDateTime(form.date, form.startTime),
			hora_fin: toIsoDateTime(form.date, form.endTime),
			estado: "activa",
		};

		try {
			const response = await createReservation(payload, token);
			setRequestState({
				loading: false,
				error: "",
				success: response?.message ?? "Reserva creada correctamente.",
			});
			setForm({ date: "", startTime: "", endTime: "" });
			await loadMachineData();
		} catch (error) {
			setRequestState({
				loading: false,
				error: error.message || "No se pudo crear la reserva.",
				success: "",
			});
		}
	};

	const statusText = machine?.status ?? "Sin estado";
	const canReserve = String(statusText).toLowerCase() !== "mantenimiento";
	const canReserveBySlots = !availableSlots.length || Boolean(form.startTime && availableHourSet.has(form.startTime));
	const groupedReservations = useMemo(() => {
		return machineReservations.reduce((groups, reservation) => {
			const dateFromHora = reservation.hora?.split("T")[0] ?? "Sin fecha";
			const label = getDayLabel(dateFromHora);
			if (!groups[label]) {
				groups[label] = [];
			}
			groups[label].push(reservation);
			return groups;
		}, {});
	}, [machineReservations]);
	const groupedReservationEntries = useMemo(() => Object.entries(groupedReservations), [groupedReservations]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setExpandedDays((prev) => {
				const next = {};
				for (const [dayLabel] of groupedReservationEntries) {
					if (Object.prototype.hasOwnProperty.call(prev, dayLabel)) {
						next[dayLabel] = prev[dayLabel];
						continue;
					}

					next[dayLabel] = dayLabel === "Hoy" || dayLabel === "Ayer";
				}
				return next;
			});
		}, 0);

		return () => clearTimeout(timer);
	}, [groupedReservationEntries]);

	const toggleDayGroup = (dayLabel) => {
		setExpandedDays((prev) => ({
			...prev,
			[dayLabel]: !prev[dayLabel],
		}));
	};

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Detalle de maquina</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">{machine?.name ?? `Maquina #${id}`}</h1>
				<p className="mt-2 text-sm text-slate-300">Consulta disponibilidad y reserva sin salir de esta pantalla.</p>
			</header>

			{machine ? (
				<div className="grid gap-5 lg:grid-cols-3">
					<article className="glass-panel rounded-2xl p-6 lg:col-span-2">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="text-sm text-slate-300">Zona: {machine.zone}</p>
							<span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
								{statusText}
							</span>
						</div>
						<p className="mt-3 text-sm text-slate-300">Gimnasio: {machine.gymName}</p>
						<p className="mt-3 text-sm text-slate-400">
							{machine.description || "Sin descripcion disponible para esta maquina."}
						</p>

						<h2 className="mt-6 text-lg font-semibold text-white">Ocupacion actual</h2>
						{machineReservations.length ? (
							<div className="mt-3 space-y-4">
								{groupedReservationEntries.map(([dayLabel, occupancy]) => (
									<div key={dayLabel} className="space-y-2">
										<button
											type="button"
											onClick={() => toggleDayGroup(dayLabel)}
											className="flex w-full items-center justify-between rounded-lg border border-cyan-300/25 bg-cyan-400/5 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/90 transition hover:bg-cyan-400/10"
										>
											<span>{dayLabel}</span>
											<span>
												{occupancy.length} franja{occupancy.length === 1 ? "" : "s"}
												{expandedDays[dayLabel] ? " - Ocultar" : " - Ver"}
											</span>
										</button>
										{expandedDays[dayLabel]
											? occupancy.map((slot) => (
													<div
														key={slot.id}
														className={`rounded-xl border p-3 text-sm ${
															slot.estado === "activa"
																? "border-rose-700/50 bg-rose-950/30 text-rose-300"
																: "border-slate-700 bg-slate-950/50 text-slate-300"
														}`}
													>
														<p className="font-semibold text-white">{slot.horaDisplay}</p>
														<p className="text-sm">
															{slot.estado === "activa" ? "Ocupada" : "Disponible"}
														</p>
													</div>
												))
											: null}
									</div>
								))}
							</div>
						) : (
							<p className="mt-3 text-sm text-slate-400">
								{reservationsError || "Todavia no hay reservas registradas para esta maquina."}
							</p>
						)}
					</article>

					<aside className="glass-panel rounded-2xl p-6">
						<h2 className="text-lg font-semibold text-white">Reservar ahora</h2>
						<p className="mt-1 text-xs text-slate-400">
							{availableSlots.length
								? "El inicio se selecciona solo entre franjas disponibles."
								: "No hay franjas detectadas; puedes introducir hora manualmente."}
						</p>
						<form className="mt-4 space-y-3" onSubmit={handleReserve}>
							<label className="block text-xs text-slate-300">
								Fecha
								<input
									type="date"
									value={form.date}
									onChange={(event) => handleChange("date", event.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none"
									required
								/>
							</label>
							<label className="block text-xs text-slate-300">
								Hora inicio
								{availableSlots.length ? (
									<select
										value={form.startTime}
										onChange={(event) => handleChange("startTime", event.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none"
										required
									>
										<option value="">Selecciona una franja</option>
										{availableSlots.map((slot) => (
											<option key={slot.id} value={slot.hour}>
												{slot.hour} ({slot.spots} plazas)
											</option>
										))}
									</select>
								) : (
									<input
										type="time"
										value={form.startTime}
										onChange={(event) => handleChange("startTime", event.target.value)}
										className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none"
										required
									/>
								)}
							</label>
							<label className="block text-xs text-slate-300">
								Hora fin
								<input
									type="time"
									value={form.endTime}
									onChange={(event) => handleChange("endTime", event.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none"
									readOnly={availableSlots.length > 0}
									required
								/>
							</label>

							{requestState.error ? <p className="text-sm text-rose-300">{requestState.error}</p> : null}
							{requestState.success ? <p className="text-sm text-emerald-300">{requestState.success}</p> : null}

							<button
								type="submit"
								disabled={requestState.loading || !canReserve || !canReserveBySlots}
								className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{requestState.loading ? "Reservando..." : canReserve ? "Confirmar reserva" : "No disponible"}
							</button>
						</form>

						<Link
							href="/machines"
							className="mt-4 inline-block text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
						>
							Volver al catalogo
						</Link>
					</aside>
				</div>
			) : (
				<article className="glass-panel rounded-2xl p-6">
					<p className="text-slate-300">No se pudo cargar la maquina: {apiError || "sin datos"}</p>
				</article>
			)}
		</section>
	);
}
