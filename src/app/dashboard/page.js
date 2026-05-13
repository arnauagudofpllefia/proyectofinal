import { getDashboardStats } from "@/lib/api";

const kpisFallback = [
	{ label: "Reservas activas", value: "--" },
	{ label: "Maquinas disponibles", value: "--" },
	{ label: "Usuarios online", value: "--" },
];

function normalizeKpis(payload) {
	const data = payload?.data ?? payload;

	if (Array.isArray(data)) {
		return data
			.slice(0, 3)
			.map((item, index) => ({
				label: item?.label || item?.name || `Indicador ${index + 1}`,
				value: item?.value ?? item?.total ?? "--",
			}));
	}

	if (data && typeof data === "object") {
		return Object.entries(data)
			.slice(0, 3)
			.map(([label, value]) => ({
				label: label.replaceAll("_", " "),
				value: value ?? "--",
			}));
	}

	return [];
}

export default async function DashboardPage() {
	let kpis = kpisFallback;
	let apiError = "";

	try {
		const stats = await getDashboardStats();
		const normalized = normalizeKpis(stats);
		if (normalized.length) {
			kpis = normalized;
		}
	} catch (error) {
		apiError = error.message;
	}

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Dashboard</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Vision operativa</h1>
				<p className="mt-2 text-slate-300">Monitorea el estado del sistema y responde rapido a la demanda.</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{kpis.map((item) => (
					<article key={item.label} className="glass-panel rounded-2xl p-5">
						<p className="text-sm text-slate-400">{item.label}</p>
						<p className="mt-3 text-4xl font-semibold text-cyan-200">{String(item.value)}</p>
					</article>
				))}
			</div>

			<article className="glass-panel rounded-2xl p-6">
				<h2 className="text-xl font-semibold text-white">Actividad reciente</h2>
				<p className="mt-2 text-sm text-slate-300">
					{apiError
						? `No se pudo leer el dashboard: ${apiError}`
						: "Datos cargados desde tu API de Laravel."}
				</p>
			</article>
		</section>
	);
}