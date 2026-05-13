const kpis = [
	{ label: "Reservas activas", value: "128" },
	{ label: "Maquinas disponibles", value: "42" },
	{ label: "Usuarios online", value: "87" },
];

export default function DashboardPage() {
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
						<p className="mt-3 text-4xl font-semibold text-cyan-200">{item.value}</p>
					</article>
				))}
			</div>

			<article className="glass-panel rounded-2xl p-6">
				<h2 className="text-xl font-semibold text-white">Actividad reciente</h2>
				<p className="mt-2 text-sm text-slate-300">
					Aqui veras eventos del sistema cuando conectes esta vista a tu API de Laravel.
				</p>
			</article>
		</section>
	);
}