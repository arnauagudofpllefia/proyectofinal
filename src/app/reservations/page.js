"use client";

import { useEffect, useState } from "react";
import { getReservations } from "@/lib/api";

const slotsFallback = [
	{ id: "1", hour: "08:00", zone: "Cardio", spots: 6 },
	{ id: "2", hour: "10:00", zone: "Fuerza", spots: 2 },
	{ id: "3", hour: "18:00", zone: "Funcional", spots: 9 },
];

function normalizeSlots(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((slot, index) => ({
		id: String(slot?.id ?? slot?.uuid ?? index + 1),
		hour: slot?.hour ?? slot?.hora ?? slot?.time ?? "--:--",
		zone: slot?.zone ?? slot?.zona ?? "General",
		spots: slot?.spots ?? slot?.plazas ?? slot?.available ?? 0,
	}));
}

export default function ReservationsPage() {
	const [slots, setSlots] = useState(slotsFallback);
	const [apiError, setApiError] = useState("");

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			try {
				const response = await getReservations(token);
				const normalized = normalizeSlots(response);
				if (normalized.length) {
					setSlots(normalized);
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
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Reservas</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Agenda inteligente</h1>
				<p className="mt-2 text-sm text-slate-300">
					{apiError ? `Usando datos temporales: ${apiError}` : "Horarios cargados desde tu API."}
				</p>
			</header>

			<div className="grid gap-4 md:grid-cols-3">
				{slots.map((slot) => (
					<article key={slot.id} className="glass-panel rounded-2xl p-5">
						<p className="text-sm text-slate-400">{slot.zone}</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">{slot.hour}</h2>
						<p className="mt-1 text-sm text-slate-300">{slot.spots} plazas libres</p>
						<button
							type="button"
							className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
						>
							Reservar
						</button>
					</article>
				))}
			</div>
		</section>
	);
}