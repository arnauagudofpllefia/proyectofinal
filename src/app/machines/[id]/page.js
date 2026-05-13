import { getMachineById } from "@/lib/api";

export default async function MachineDetailPage({ params }) {
	const { id } = await params;
	let machine = null;
	let apiError = "";

	try {
		const response = await getMachineById(id);
		machine = response?.data ?? response;
	} catch (error) {
		apiError = error.message;
	}

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Detalle de maquina</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Maquina #{id}</h1>
			</header>

			<article className="glass-panel rounded-2xl p-6">
				{machine ? (
					<div className="space-y-3 text-slate-300">
						<p>
							<span className="text-slate-400">Nombre:</span> {machine.name ?? machine.nombre ?? "-"}
						</p>
						<p>
							<span className="text-slate-400">Estado:</span> {machine.status ?? machine.estado ?? "-"}
						</p>
						<p>
							<span className="text-slate-400">Zona:</span> {machine.zone ?? machine.zona ?? "-"}
						</p>
					</div>
				) : (
					<p className="text-slate-300">No se pudo cargar la maquina: {apiError || "sin datos"}</p>
				)}
			</article>
		</section>
	);
}
