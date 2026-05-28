"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createReservation, getCurrentUser, getMachineById, getMachineReservations, getMachineSlots, getMyReservations } from "@/lib/api";
import { getGymIdFromUser, getUserRole, isAdminRole, normalizeGymId } from "@/lib/gym";
import { addAppNotification } from "@/lib/notifications";
import { resolvePublicImageUrl } from "@/lib/image";

function normalizeMachine(data, machineId) {
	return {
		id: String(data?.id ?? data?.uuid ?? machineId ?? ""),
		name: data?.name ?? data?.nombre ?? `Maquina #${machineId}`,
		status: data?.status ?? data?.estado ?? "",
		zone: data?.zone ?? data?.zona ?? "",
		description: data?.description ?? data?.descripcion ?? "",
		gymName: data?.gym?.name ?? data?.gym?.nombre ?? data?.gimnasio?.name ?? data?.gimnasio?.nombre ?? "-",
		gymId: String(data?.gym_id ?? data?.gimnasio_id ?? data?.gym?.id ?? ""),
		imageUrl: resolvePublicImageUrl(
			data?.image_url ?? data?.imagen_url ?? data?.imagen ?? data?.image ?? data?.foto ?? ""
		),
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

function normalizeDateValue(value) {
	if (typeof value !== "string" || !value) {
		return "";
	}

	if (value.includes("T")) {
		return value.split("T")[0];
	}

	return value;
}

function getReservationMachineId(item) {
	return String(item?.machine_id ?? item?.maquina_id ?? item?.machine?.id ?? item?.machineId ?? "");
}

function getReservationDateKey(item) {
	const directDate = normalizeDateValue(item?.date ?? item?.fecha ?? item?.hora_inicio ?? item?.start_time);
	if (directDate) {
		return directDate;
	}

	const fallbackTime = item?.hora_inicio ?? item?.start_time ?? item?.hora ?? item?.hour ?? "";
	const parsed = fallbackTime.includes("T") ? fallbackTime.split("T")[0] : "";
	return parsed;
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

function getMinutesBetweenTimes(startTime, endTime) {
	const startMatch = String(startTime).match(/^(\d{2}):(\d{2})$/);
	const endMatch = String(endTime).match(/^(\d{2}):(\d{2})$/);

	if (!startMatch || !endMatch) {
		return Number.NaN;
	}

	const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
	const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);

	return endMinutes - startMinutes;
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

function normalizeReservationTimeDisplay(value) {
	if (typeof value !== "string" || !value) {
		return "--:--";
	}

	if (value.includes("T")) {
		return value.split("T")[1]?.slice(0, 5) ?? "--:--";
	}

	return normalizeReservationHour(value);
}

function timeStringToMinutes(value) {
	const match = String(value).match(/^(\d{2}):(\d{2})$/);
	if (!match) {
		return Number.NaN;
	}

	return Number(match[1]) * 60 + Number(match[2]);
}

function getTodayDateKey() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getStartOfWeek(dateValue) {
	const date = new Date(dateValue);
	const day = (date.getDay() + 6) % 7;
	date.setDate(date.getDate() - day);
	date.setHours(0, 0, 0, 0);
	return date;
}

function getDateKeyFromDate(dateValue) {
	const year = dateValue.getFullYear();
	const month = String(dateValue.getMonth() + 1).padStart(2, "0");
	const day = String(dateValue.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function isOccupiedReservationStatus(statusValue) {
	const status = String(statusValue ?? "").toLowerCase();
	return status.includes("activa") || status.includes("active") || status.includes("ocupada");
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
			const horaFinValue = item?.hora_fin ?? item?.end_time ?? "";
			return {
				id: String(index),
				hora: horaValue,
				horaDisplay: normalizeReservationTimeDisplay(horaValue),
				horaFin: horaFinValue,
				horaFinDisplay: normalizeReservationTimeDisplay(horaFinValue),
				estado: item?.estado ?? "activa",
				plazas: item?.plazas ?? 0,
			};
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
	const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => getTodayDateKey());

	const loadMachineData = useCallback(async () => {
		if (!id) {
			return;
		}

		const token = localStorage.getItem("auth_token") || "";
		let userGymId = "";
		let userIsAdmin = false;

		try {
			const meResponse = await getCurrentUser(token);
			userGymId = getGymIdFromUser(meResponse);
			userIsAdmin = isAdminRole(getUserRole(meResponse));
		} catch {
			userGymId = "";
			userIsAdmin = false;
		}

		const machineResponse = await getMachineById(id, token);
		const normalizedMachine = normalizeMachine(machineResponse?.data ?? machineResponse, id);
		setMachine(normalizedMachine);

		if (
			!userIsAdmin &&
			normalizeGymId(userGymId) &&
			normalizeGymId(normalizedMachine.gymId) &&
			normalizeGymId(userGymId) !== normalizeGymId(normalizedMachine.gymId)
		) {
			setApiError("Esta maquina pertenece a otro gimnasio. Solo puedes ver maquinas de tu gimnasio.");
			setMachine(null);
			setSlots([]);
			setMachineReservations([]);
			return;
		}

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

		const durationMinutes = getMinutesBetweenTimes(form.startTime, form.endTime);
		if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
			setRequestState({
				loading: false,
				error: "La hora de fin debe ser posterior a la de inicio.",
				success: "",
			});
			return;
		}

		if (durationMinutes > 60) {
			setRequestState({
				loading: false,
				error: "La reserva solo puede durar 1 hora como maximo.",
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

		let myReservations = [];
		try {
			const reservationsResponse = await getMyReservations(token);
			myReservations = Array.isArray(reservationsResponse?.data ?? reservationsResponse)
				? (reservationsResponse?.data ?? reservationsResponse)
				: [];
		} catch {
			myReservations = [];
		}

		const requestedDateKey = form.date;
		const requestedMachineId = String(machine?.id ?? id);
		const activeReservationsForDay = myReservations.filter((item) => {
			const status = String(item?.status ?? item?.estado ?? "activa").toLowerCase();
			if (status === "cancelada" || status === "completada") {
				return false;
			}

			return getReservationDateKey(item) === requestedDateKey;
		});

		if (activeReservationsForDay.length >= 3) {
			setRequestState({
				loading: false,
				error: "Solo puedes hacer 3 reservas por dia.",
				success: "",
			});
			return;
		}

		const alreadyReservedMachine = myReservations.some((item) => {
			const status = String(item?.status ?? item?.estado ?? "activa").toLowerCase();
			if (status === "cancelada" || status === "completada") {
				return false;
			}

			const sameDay = getReservationDateKey(item) === requestedDateKey;
			const sameMachine = getReservationMachineId(item) === requestedMachineId || String(item?.machine_name ?? item?.maquina_nombre ?? item?.machine ?? item?.maquina ?? "") === String(machine?.name ?? "");
			return sameDay && sameMachine;
		});

		if (alreadyReservedMachine) {
			setRequestState({
				loading: false,
				error: "Solo puedes reservar una vez la misma maquina en el dia.",
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
			addAppNotification({
				type: "reservation-created",
				title: "Reserva creada",
				message: `${machine?.name ?? "Maquina"} - ${form.date} de ${form.startTime} a ${form.endTime}`,
				reservationId: response?.data?.id ?? response?.id ?? "",
				dedupeKey: `reservation-created-${machine?.id ?? id}-${form.date}-${form.startTime}-${form.endTime}`,
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

	const statusText = machine?.status ?? "";
	const canReserve = String(statusText).toLowerCase() !== "mantenimiento";
	const weekDays = useMemo(() => {
		const startOfWeek = getStartOfWeek(new Date());

		return Array.from({ length: 7 }, (_, index) => {
			const date = new Date(startOfWeek);
			date.setDate(startOfWeek.getDate() + index);
			const dateKey = getDateKeyFromDate(date);
			const occupiedCount = machineReservations.filter((reservation) => {
				const reservationDate = reservation.hora?.split("T")[0] ?? "";
				return reservationDate === dateKey && isOccupiedReservationStatus(reservation.estado);
			}).length;

			return {
				dateKey,
				label: date.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" }),
				occupiedCount,
			};
		});
	}, [machineReservations]);
	const selectedDayOccupiedReservations = useMemo(() => {
		return machineReservations
			.filter((reservation) => {
				const reservationDate = reservation.hora?.split("T")[0] ?? "";
				return reservationDate === selectedCalendarDate && isOccupiedReservationStatus(reservation.estado);
			})
			.sort((a, b) => timeStringToMinutes(a.horaDisplay) - timeStringToMinutes(b.horaDisplay));
	}, [machineReservations, selectedCalendarDate]);

	useEffect(() => {
		if (!weekDays.some((day) => day.dateKey === selectedCalendarDate) && weekDays.length) {
			setSelectedCalendarDate(weekDays[0].dateKey);
		}
	}, [selectedCalendarDate, weekDays]);

	return (
		<section className="rise-in space-y-6">
			<header className="surface-card p-6">
				<h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{machine?.name ?? `Maquina #${id}`}</h1>
				<p className="mt-2 text-sm text-[var(--muted)]">Consulta disponibilidad y reserva sin salir de esta pantalla.</p>
			</header>

			{machine ? (
				<div className="grid gap-5 lg:grid-cols-3">
					<article className="surface-card overflow-hidden lg:col-span-2">
						{machine.imageUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={machine.imageUrl} alt={machine.name} className="h-64 w-full bg-[var(--background-subtle)] object-contain" />
						) : null}
						<div className="p-6">
							<div className="flex flex-wrap items-center justify-between gap-3">
								{machine.zone ? <p className="text-sm text-[var(--muted)]">Zona: {machine.zone}</p> : null}
								{statusText ? (
									<span className={`badge ${/disponible|available/i.test(statusText) ? "badge-success" : "badge-muted"}`}>
										{statusText}
									</span>
								) : null}
							</div>
							<p className="mt-3 text-sm text-[var(--muted)]">Gimnasio: {machine.gymName}</p>
							<p className="mt-3 text-sm text-[var(--foreground)]">
								{machine.description || "Sin descripcion disponible para esta maquina."}
							</p>

							<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
								<h2 className="text-lg font-semibold text-[var(--foreground)]">Ocupacion actual</h2>
								<button
									type="button"
									onClick={() => setIsCalendarOpen((prev) => !prev)}
									className="btn-secondary"
								>
									{isCalendarOpen ? "Ocultar calendario" : "Ver calendario de hoy"}
								</button>
							</div>

							{isCalendarOpen ? (
								<>
									<div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--background-subtle)] p-3">
										<p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-strong)]">Calendario semanal</p>
										<div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
											{weekDays.map((day) => {
												const isSelected = day.dateKey === selectedCalendarDate;
												return (
													<button
														key={day.dateKey}
														type="button"
														onClick={() => setSelectedCalendarDate(day.dateKey)}
														className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
															isSelected
																? "border-[var(--line-strong)] bg-white text-[var(--foreground)]"
																: "border-[var(--line)] bg-white/70 text-[var(--muted-strong)] hover:bg-white"
														}`}
													>
														<p className="font-semibold">{day.label}</p>
														<p className="mt-0.5 text-xs text-[var(--muted)]">{day.occupiedCount} ocupada{day.occupiedCount === 1 ? "" : "s"}</p>
													</button>
												);
											})}
										</div>
									</div>

									{selectedDayOccupiedReservations.length === 0 ? (
										<p className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--background-subtle)] px-3 py-2 text-sm text-[var(--muted)]">
											{reservationsError || "No hay horas ocupadas para el dia seleccionado."}
										</p>
									) : null}
									<div className="mt-3 overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
										<table className="min-w-full border-collapse text-sm">
											<thead className="bg-[var(--background-subtle)]">
												<tr className="text-left text-[var(--muted-strong)]">
													<th className="px-3 py-2 font-semibold">Inicio</th>
													<th className="px-3 py-2 font-semibold">Fin</th>
													<th className="px-3 py-2 font-semibold">Estado</th>
												</tr>
											</thead>
											<tbody>
												{selectedDayOccupiedReservations.map((reservation) => (
													<tr key={reservation.id} className="border-t border-[var(--line)] even:bg-[var(--background-subtle)]/40">
														<td className="px-3 py-2 font-medium text-[var(--foreground)]">{reservation.horaDisplay}</td>
														<td className="px-3 py-2 text-[var(--foreground)]">{reservation.horaFinDisplay && reservation.horaFinDisplay !== "--:--" ? reservation.horaFinDisplay : "--:--"}</td>
														<td className="px-3 py-2">
															<span className="badge badge-danger">Ocupada</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</>
							) : null}
						</div>
					</article>

					<aside className="surface-card p-6">
						<h2 className="text-lg font-semibold text-[var(--foreground)]">Reservar ahora</h2>
						<p className="mt-1 text-xs text-[var(--muted)]">
							Maximo 3 reservas por dia y solo una vez por maquina al dia.
						</p>
						<p className="mt-1 text-xs text-[var(--muted)]">Duracion maxima permitida: 1 hora.</p>
						<form className="mt-4 space-y-3" onSubmit={handleReserve}>
							<label className="block text-sm font-medium text-[var(--foreground)]">
								Fecha
								<input
									type="date"
									value={form.date}
									onChange={(event) => handleChange("date", event.target.value)}
									className="field-input mt-1"
									required
								/>
							</label>
							<label className="block text-sm font-medium text-[var(--foreground)]">
								Hora inicio
								<input
									type="time"
									value={form.startTime}
									onChange={(event) => handleChange("startTime", event.target.value)}
									className="field-input mt-1"
									required
								/>
							</label>
							<label className="block text-sm font-medium text-[var(--foreground)]">
								Hora fin
								<input
									type="time"
									value={form.endTime}
									onChange={(event) => handleChange("endTime", event.target.value)}
									className="field-input mt-1"
									required
								/>
							</label>

							{requestState.error ? <p className="text-sm text-rose-600">{requestState.error}</p> : null}
							{requestState.success ? <p className="text-sm text-emerald-700">{requestState.success}</p> : null}

							<button
								type="submit"
								disabled={requestState.loading || !canReserve}
								className="btn-primary w-full"
							>
								{requestState.loading ? "Reservando..." : canReserve ? "Confirmar reserva" : "No disponible"}
							</button>
						</form>

						<Link href="/machines" className="mt-4 inline-block text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-strong)]">
							Volver al catalogo
						</Link>
					</aside>
				</div>
			) : (
				<article className="surface-card p-6">
					<p className="text-[var(--muted)]">No se pudo cargar la maquina: {apiError || "sin datos"}</p>
				</article>
			)}
		</section>
	);
}
