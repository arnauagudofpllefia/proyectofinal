export default async function MachineDetailPage({ params }) {
	const { id } = await params;

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Detalle de maquina</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Maquina #{id}</h1>
			</header>

			<article className="glass-panel rounded-2xl p-6">
				<p className="text-slate-300">
					Esta vista esta lista para mostrar informacion completa cuando conectes el endpoint de Laravel.
				</p>
			</article>
		</section>
	);
}
