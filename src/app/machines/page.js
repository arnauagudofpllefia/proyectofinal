"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createReservation, getCurrentUser, getMachines } from "@/lib/api";

const machinesFallback = [
	{ id: "1", name: "Cinta X9", status: "Disponible", zone: "Cardio", gymId: "1", description: "" },
	{ id: "2", name: "Remo Pro", status: "En uso", zone: "Cardio", gymId: "1", description: "" },
	{ id: "3", name: "Leg Press V2", status: "Mantenimiento", zone: "Fuerza", gymId: "1", description: "" },
];

function normalizeMachines(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((machine, index) => ({
		id: String(machine?.id ?? machine?.uuid ?? index + 1),
		name: machine?.name ?? machine?.nombre ?? `Maquina ${index + 1}`,
		status: machine?.status ?? machine?.estado ?? "Sin estado",
		zone: machine?.zone ?? machine?.zona ?? "Sin zona",
		gymId: String(machine?.gym_id ?? machine?.gimnasio_id ?? machine?.gym?.id ?? ""),
		description: machine?.description ?? machine?.descripcion ?? "",
	}));
}

function toIsoDateTime(date, time) {
	return `${date}T${time}:00`;
}

function extractUserId(userPayload) {
	const user = userPayload?.data ?? userPayload;
	const candidate = user?.id ?? user?.user_id ?? user?.usuario_id ?? user?.uuid;
	return candidate != null ? String(candidate) : "";
}

export default function MachinesPage() {
	const [machines, setMachines] = useState(machinesFallback);
	const [apiError, setApiError] = useState("");
	const [reservationForms, setReservationForms] = useState({});
	const [reservationState, setReservationState] = useState({});

	const reloadMachines = async () => {
		const token = localStorage.getItem("auth_token") || "";

		try {
			const response = await getMachines(token);
			const normalized = normalizeMachines(response);
			if (normalized.length) {
				setMachines(normalized);
			}
			setApiError("");
		} catch (error) {
			setApiError(error.message);
		}
	};

	useEffect(() => {
		const timer = setTimeout(async () => {
			await reloadMachines();
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	const handleReservationFieldChange = (machineId, field, value) => {
		setReservationForms((prev) => ({
			...prev,
			[machineId]: {
				...prev[machineId],
				[field]: value,
			},
		}));
	};

	const handleReservationSubmit = async (event, machine) => {
		event.preventDefault();
		const machineId = machine.id;
		const form = reservationForms[machineId] ?? { date: "", startTime: "", endTime: "" };

		setReservationState((prev) => ({
			...prev,
			[machineId]: { loading: true, error: "", success: "" },
		}));

		if (!form.date || !form.startTime || !form.endTime) {
			setReservationState((prev) => ({
				...prev,
				[machineId]: {
					loading: false,
					error: "Completa fecha, hora de inicio y hora de fin.",
					success: "",
				},
			}));
			return;
		}

		if (form.endTime <= form.startTime) {
			setReservationState((prev) => ({
				...prev,
				[machineId]: {
					loading: false,
					error: "La hora de fin debe ser posterior a la de inicio.",
					success: "",
				},
			}));
			return;
		}

		const token = localStorage.getItem("auth_token") || "";
		if (!token) {
			setReservationState((prev) => ({
				...prev,
				[machineId]: {
					loading: false,
					error: "Inicia sesion para poder reservar.",
					success: "",
				},
			}));
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
			setReservationState((prev) => ({
				...prev,
				[machineId]: {
					loading: false,
					error: "No se pudo identificar tu usuario. Vuelve a iniciar sesion.",
					success: "",
				},
			}));
			return;
		}

		const startDateTime = toIsoDateTime(form.date, form.startTime);
		const endDateTime = toIsoDateTime(form.date, form.endTime);
		const payload = {
			usuario_id: userId,
			user_id: userId,
			maquina_id: machineId,
			machine_id: machineId,
			gimnasio_id: machine.gymId || undefined,
			gym_id: machine.gymId || undefined,
			hora_inicio: startDateTime,
			hora_fin: endDateTime,
			estado: "activa",
		};

		try {
			const response = await createReservation(payload, token);
			setReservationState((prev) => ({
				...prev,
				[machineId]: {
					loading: false,
					error: "",
					success: response?.message ?? "Reserva creada correctamente.",
				},
			}));
			setReservationForms((prev) => ({
				...prev,
				[machineId]: { date: "", startTime: "", endTime: "" },
			}));
			await reloadMachines();
		} catch (error) {
			setReservationState((prev) => ({
				...prev,
				[machineId]: {
					loading: false,
					error: error.message || "No se pudo crear la reserva.",
					success: "",
				},
			}));
		}
	};

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Maquinas</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Catalogo de equipos</h1>
				<p className="mt-2 text-sm text-slate-300">
					{apiError ? `Usando datos temporales: ${apiError}` : "Listado cargado desde tu API."}
				</p>
			</header>

			<div className="grid gap-4">
				{machines.map((machine) => (
					(() => {
						const machineForm = reservationForms[machine.id] ?? { date: "", startTime: "", endTime: "" };
						const machineRequestState = reservationState[machine.id] ?? {
							loading: false,
							error: "",
							success: "",
						};
						const canReserve = String(machine.status).toLowerCase() !== "mantenimiento";

						return (
					<article
						key={machine.id}
						className="energy-ring glass-panel rounded-2xl p-5 transition hover:-translate-y-0.5"
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-xl font-semibold text-white">{machine.name}</h2>
								<p className="mt-1 text-sm text-slate-300">Zona: {machine.zone}</p>
								{machine.description ? (
									<p className="mt-1 text-sm text-slate-400">{machine.description}</p>
								) : null}
							</div>
							<span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
								{machine.status}
							</span>
						</div>

						<Link
							href={`/machines/${machine.id}`}
							className="mt-4 inline-block rounded-lg border border-cyan-300/35 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
						>
							Ver detalle
						</Link>
					</article>
						);
					})()
				))}
			</div>
		</section>
	);
}