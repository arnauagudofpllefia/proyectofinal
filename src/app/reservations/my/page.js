"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, getMyReservations } from "@/lib/api";
import { getGymIdFromUser, normalizeGymId } from "@/lib/gym";

const myReservationsFallback = [
	{ id: "R-1042", machine: "Cinta X9", date: "15/05/2026", hour: "08:00" },
	{ id: "R-1043", machine: "Remo Pro", date: "16/05/2026", hour: "10:00" },
];

function extractText(value, fallback = "") {
	if (typeof value === "string") {
		return value;
	}

	if (value && typeof value === "object") {
		const objectText =
			value?.name ??
			value?.nombre ??
			value?.title ??
			value?.descripcion ??
			value?.description ??
			"";

		if (typeof objectText === "string") {
			return objectText;
		}
	}

	return fallback;
}

function extractDate(dateSource) {
	if (typeof dateSource !== "string" || !dateSource) {
		return "Sin fecha";
	}

	if (dateSource.includes("T")) {
		return dateSource.split("T")[0];
	}

	return dateSource;
}

function extractHour(timeSource) {
	if (typeof timeSource !== "string" || !timeSource) {
		return "--:--";
	}

	const match = timeSource.match(/(\d{2}:\d{2})/);
	return match ? match[1] : "--:--";
}

function normalizeMyReservations(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((item, index) => ({
		id: item?.id ?? item?.code ?? `R-${index + 1}`,
		machine:
			extractText(item?.machine_name) ||
			extractText(item?.maquina_nombre) ||
			extractText(item?.machine) ||
			extractText(item?.maquina) ||
			"Sin maquina",
		gymId: String(item?.gym_id ?? item?.gimnasio_id ?? item?.gym?.id ?? item?.gimnasio?.id ?? ""),
		gymName: extractText(item?.gym?.name) || extractText(item?.gym?.nombre) || extractText(item?.gimnasio) || "",
		date: extractDate(item?.date ?? item?.fecha ?? item?.hora_inicio ?? item?.start_time),
		hour: extractHour(item?.hour ?? item?.hora ?? item?.hora_inicio ?? item?.start_time),
	}));
}

export default function MyReservationsPage() {
	const [myReservations, setMyReservations] = useState(myReservationsFallback);
	const [apiError, setApiError] = useState("");

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			try {
				let userGymId = "";
				try {
					const meResponse = await getCurrentUser(token);
					userGymId = getGymIdFromUser(meResponse);
				} catch {
					userGymId = "";
				}

				const response = await getMyReservations(token);
				const normalized = normalizeMyReservations(response);
				const scopedReservations = userGymId
					? normalized.filter((item) => normalizeGymId(item.gymId) === normalizeGymId(userGymId))
					: normalized;

				setMyReservations(scopedReservations.length ? scopedReservations : []);
			} catch (error) {
				setApiError(error.message);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="rise-in space-y-6">
			<header className="surface-card p-6">
				<p className="badge badge-primary mb-2">Mis reservas</p>
				<h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Tu actividad programada</h1>
				<p className="mt-2 text-sm text-[var(--muted)]">
					{apiError
						? `Si este endpoint requiere auth, inicia sesion primero. Error: ${apiError}`
						: "Reservas activas en tu gimnasio."}
				</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{myReservations.map((item) => (
					<article key={item.id} className="surface-card p-5">
						<h2 className="text-base font-semibold text-[var(--foreground)]">{item.machine}</h2>
						<p className="mt-1 text-sm text-[var(--muted)]">{item.date} a las {item.hour}</p>
						{item.gymName ? <p className="mt-2 text-xs text-[var(--muted)]">{item.gymName}</p> : null}
					</article>
				))}
				{myReservations.length === 0 ? (
					<article className="surface-card p-5 text-sm text-[var(--muted)]">No hay reservas en tu gimnasio actualmente.</article>
				) : null}
			</div>
		</section>
	);
}