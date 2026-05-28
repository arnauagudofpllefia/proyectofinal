"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, getMachines } from "@/lib/api";
import { getGymIdFromUser, getGymNameFromUser, getUserRole, isAdminRole, normalizeGymId } from "@/lib/gym";
import { resolvePublicImageUrl } from "@/lib/image";

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
		imageUrl: resolvePublicImageUrl(
			machine?.image_url ?? machine?.imagen_url ?? machine?.imagen ?? machine?.image ?? machine?.foto ?? ""
		),
	}));
}

export default function MachinesPage() {
	const [machines, setMachines] = useState([]);
	const [userGymId, setUserGymId] = useState("");
	const [gymName, setGymName] = useState("");
	const [isAdminUser, setIsAdminUser] = useState(false);
	const [apiError, setApiError] = useState("");

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			let gymId = "";
			let gymLabel = "";
			let isAdminUserRole = false;
			try {
				const meResponse = await getCurrentUser(token);
				gymId = getGymIdFromUser(meResponse);
				gymLabel = getGymNameFromUser(meResponse);
				isAdminUserRole = isAdminRole(getUserRole(meResponse));
			} catch {
				gymId = "";
			}

			setUserGymId(gymId);
			setGymName(gymLabel);
			setIsAdminUser(isAdminUserRole);

			try {
				const response = await getMachines(token);
				const normalized = normalizeMachines(response);
				const filtered = isAdminUserRole
					? normalized
					: gymId
						? normalized.filter((machine) => normalizeGymId(machine.gymId) === normalizeGymId(gymId))
						: [];
				setMachines(filtered);
				setApiError("");
			} catch (error) {
				setApiError(error.message);
				setMachines(
					isAdminUserRole
						? machinesFallback
						: gymId
							? machinesFallback.filter((machine) => normalizeGymId(machine.gymId) === normalizeGymId(gymId))
							: []
				);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="rise-in space-y-6">
			<header className="surface-card p-6">
				<p className="badge badge-primary mb-2">Maquinas</p>
				<h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Catalogo de equipos</h1>
				<p className="mt-2 text-sm text-[var(--muted)]">
					{apiError
						? `Usando datos temporales: ${apiError}`
						: gymName
							? `Equipos disponibles en ${gymName}.`
							: isAdminUser
								? "Equipos disponibles en todos los gimnasios."
								: "Equipos disponibles en tu gimnasio."}
				</p>
				{userGymId ? (
					<Link
						href="/profile"
						className="mt-2 inline-block text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-strong)]"
					>
						Cambiar gimnasio
					</Link>
				) : null}
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{machines.map((machine) => {
					const isAvailable = /disponible|available/i.test(String(machine.status || ""));
					return (
						<article key={machine.id} className="surface-card surface-card-hover overflow-hidden">
							{machine.imageUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={machine.imageUrl} alt={machine.name} className="h-40 w-full object-cover" />
							) : (
								<div className="flex h-40 w-full items-center justify-center bg-[#eef2ff] text-[var(--primary)]">
									<span className="text-2xl font-semibold">{machine.name.charAt(0).toUpperCase()}</span>
								</div>
							)}
							<div className="p-5">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<div>
										<h2 className="text-lg font-semibold text-[var(--foreground)]">{machine.name}</h2>
										<p className="mt-1 text-xs text-[var(--muted)]">Zona: {machine.zone}</p>
									</div>
									<span className={`badge ${isAvailable ? "badge-success" : "badge-muted"}`}>
										{machine.status}
									</span>
								</div>
								{machine.description ? (
									<p className="mt-2 text-sm text-[var(--muted)]">{machine.description}</p>
								) : null}
								<Link href={`/machines/${machine.id}`} className="btn-secondary mt-4 inline-block">
									Reservar
								</Link>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}


