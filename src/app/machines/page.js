// Resumen del archivo: src\app\machines\page.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

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

/**
 * Funcion: normalizeMachines.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function normalizeMachines(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((machine, index) => ({
		id: String(machine?.id ?? machine?.uuid ?? index + 1),
		name: machine?.name ?? machine?.nombre ?? `Maquina ${index + 1}`,
		status: machine?.status ?? machine?.estado ?? "",
		zone: machine?.zone ?? machine?.zona ?? "",
		gymId: String(machine?.gym_id ?? machine?.gimnasio_id ?? machine?.gym?.id ?? ""),
		description: machine?.description ?? machine?.descripcion ?? "",
		imageUrl: resolvePublicImageUrl(
			machine?.image_url ?? machine?.imagen_url ?? machine?.imagen ?? machine?.image ?? machine?.foto ?? ""
		),
	}));
}

/**
 * Funcion: MachinesPage.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
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
		<section className="rise-in space-y-8">
			<header className="hero-gradient p-6 sm:p-8">
				<p className="eyebrow">Catalogo</p>
				<h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--foreground) sm:text-4xl">
					Equipos disponibles
				</h1>
				<p className="mt-3 max-w-2xl text-sm text-(--muted) sm:text-base">
					{apiError
						? `Usando datos temporales: ${apiError}`
						: gymName
							? `Estos son los equipos que puedes reservar ahora mismo en ${gymName}.`
							: isAdminUser
								? "Equipos disponibles en todos los gimnasios."
								: "Equipos disponibles en tu gimnasio."}
				</p>
				{userGymId ? (
					<Link href="/profile" className="btn-ghost mt-4 inline-flex">
						Cambiar gimnasio →
					</Link>
				) : null}
			</header>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{machines.map((machine) => {
					const isAvailable = /disponible|available/i.test(String(machine.status || ""));
					const initials = String(machine.name || "?").trim().charAt(0).toUpperCase();
					return (
						<article
							key={machine.id}
							className="surface-card surface-card-hover flex h-full flex-col overflow-hidden"
						>
							<div className="card-image relative aspect-[4/3] w-full">
								{machine.imageUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={machine.imageUrl} alt={machine.name} />
								) : (
									<div className="image-placeholder absolute inset-0">{initials}</div>
								)}
								{machine.status ? (
									<span
										className={`badge badge-floating absolute right-3 top-3 z-10 ${isAvailable ? "badge-success" : "badge-muted"
											}`}
									>
										<span
											className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-(--accent-strong)" : "bg-(--muted)"
												}`}
										/>
										{machine.status}
									</span>
								) : null}
							</div>
							<div className="flex flex-1 flex-col gap-3 p-5">
								<div>
									{machine.zone ? <p className="eyebrow">{machine.zone}</p> : null}
									<h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-(--foreground)">
										{machine.name}
									</h2>
								</div>
								{machine.description ? (
									<p className="line-clamp-2 text-sm text-(--muted)">{machine.description}</p>
								) : null}
								<div className="mt-auto pt-2">
									<Link
										href={`/machines/${machine.id}`}
										className="btn-primary w-full"
									>
										Reservar
									</Link>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}




