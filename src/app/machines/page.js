"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, getMachines } from "@/lib/api";

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

function extractUserGymId(userPayload) {
	const user = userPayload?.data ?? userPayload;
	const candidate = user?.gym_id ?? user?.gimnasio_id ?? user?.gym?.id ?? user?.gimnasio?.id;
	return candidate != null ? String(candidate) : "";
}

export default function MachinesPage() {
	const [machines, setMachines] = useState([]);
	const [userGymId, setUserGymId] = useState("");
	const [gymName, setGymName] = useState("");
	const [apiError, setApiError] = useState("");

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			let gymId = "";
			let gymLabel = "";
			try {
				const meResponse = await getCurrentUser(token);
				gymId = extractUserGymId(meResponse);
				const user = meResponse?.data ?? meResponse;
				gymLabel = user?.gym?.name ?? user?.gym?.nombre ?? user?.gimnasio?.name ?? user?.gimnasio?.nombre ?? "";
			} catch {
				gymId = "";
			}

			setUserGymId(gymId);
			setGymName(gymLabel);

			try {
				const response = await getMachines(token);
				const normalized = normalizeMachines(response);
				const filtered = gymId
					? normalized.filter((m) => !m.gymId || m.gymId === gymId)
					: normalized;
				setMachines(filtered.length ? filtered : machinesFallback);
				setApiError("");
			} catch (error) {
				setApiError(error.message);
				setMachines(machinesFallback);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Maquinas</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Catalogo de equipos</h1>
				<p className="mt-2 text-sm text-slate-300">
					{apiError
						? `Usando datos temporales: ${apiError}`
						: gymName
							? `Equipos disponibles en ${gymName}.`
							: "Equipos disponibles en tu gimnasio."}
				</p>
				{userGymId ? (
					<Link
						href="/profile"
						className="mt-2 inline-block text-xs text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
					>
						Cambiar gimnasio
					</Link>
				) : null}
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{machines.map((machine) => (
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
				))}
			</div>
		</section>
	);
}


