"use client";

import { useEffect, useState } from "react";
import { getMyReservations } from "@/lib/api";

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
				const response = await getMyReservations(token);
				const normalized = normalizeMyReservations(response);
				if (normalized.length) {
					setMyReservations(normalized);
				}
			} catch (error) {
				setApiError(error.message);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Mis reservas</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Tu actividad programada</h1>
				<p className="mt-2 text-sm text-slate-300">
					{apiError
						? `Si este endpoint requiere auth, inicia sesion primero. Error: ${apiError}`
						: "Datos cargados desde tu API."}
				</p>
			</header>

			<div className="space-y-4">
				{myReservations.map((item) => (
					<article key={item.id} className="glass-panel rounded-2xl p-5">
						<div>
							<h2 className="text-lg font-semibold text-white">{item.machine}</h2>
							<p className="mt-1 text-sm text-slate-300">
								{item.date} a las {item.hour}
							</p>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}