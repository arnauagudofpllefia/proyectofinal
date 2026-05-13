const myReservations = [
	{ id: "R-1042", machine: "Cinta X9", date: "15/05/2026", hour: "08:00" },
	{ id: "R-1043", machine: "Remo Pro", date: "16/05/2026", hour: "10:00" },
];

export default function MyReservationsPage() {
	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Mis reservas</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Tu actividad programada</h1>
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