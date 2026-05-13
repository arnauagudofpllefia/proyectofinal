import { getMyReservations } from "@/lib/api";

const myReservationsFallback = [
	{ id: "R-1042", machine: "Cinta X9", date: "15/05/2026", hour: "08:00" },
	{ id: "R-1043", machine: "Remo Pro", date: "16/05/2026", hour: "10:00" },
];

function normalizeMyReservations(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((item, index) => ({
		id: item?.id ?? item?.code ?? `R-${index + 1}`,
		machine: item?.machine ?? item?.machine_name ?? item?.maquina ?? "Sin maquina",
		date: item?.date ?? item?.fecha ?? "Sin fecha",
		hour: item?.hour ?? item?.hora ?? "--:--",
	}));
}

export default async function MyReservationsPage() {
	let myReservations = myReservationsFallback;
	let apiError = "";

	try {
		const response = await getMyReservations();
		const normalized = normalizeMyReservations(response);
		if (normalized.length) {
			myReservations = normalized;
		}
	} catch (error) {
		apiError = error.message;
	}

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
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<h2 className="text-lg font-semibold text-white">{item.machine}</h2>
								<p className="mt-1 text-sm text-slate-300">
									{item.date} a las {item.hour}
								</p>
							</div>
							<span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
								{item.id}
							</span>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}