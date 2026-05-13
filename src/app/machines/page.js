import Link from "next/link";
import { getMachines } from "@/lib/api";

const machinesFallback = [
	{ id: "1", name: "Cinta X9", status: "Disponible", zone: "Cardio" },
	{ id: "2", name: "Remo Pro", status: "En uso", zone: "Cardio" },
	{ id: "3", name: "Leg Press V2", status: "Mantenimiento", zone: "Fuerza" },
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
	}));
}

export default async function MachinesPage() {
	let machines = machinesFallback;
	let apiError = "";

	try {
		const response = await getMachines();
		const normalized = normalizeMachines(response);
		if (normalized.length) {
			machines = normalized;
		}
	} catch (error) {
		apiError = error.message;
	}

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
					<article
						key={machine.id}
						className="energy-ring glass-panel rounded-2xl p-5 transition hover:-translate-y-0.5"
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-xl font-semibold text-white">{machine.name}</h2>
								<p className="mt-1 text-sm text-slate-300">Zona: {machine.zone}</p>
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