const slots = [
	{ hour: "08:00", zone: "Cardio", spots: 6 },
	{ hour: "10:00", zone: "Fuerza", spots: 2 },
	{ hour: "18:00", zone: "Funcional", spots: 9 },
];

export default function ReservationsPage() {
	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Reservas</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Agenda inteligente</h1>
			</header>

			<div className="grid gap-4 md:grid-cols-3">
				{slots.map((slot) => (
					<article key={slot.hour} className="glass-panel rounded-2xl p-5">
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