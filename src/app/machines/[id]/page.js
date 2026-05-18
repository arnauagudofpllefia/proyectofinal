"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMachineById } from "@/lib/api";

export default function MachineDetailPage() {
	const params = useParams();
	const id = params?.id;
	const [machine, setMachine] = useState(null);
	const [apiError, setApiError] = useState("");

	useEffect(() => {
		if (!id) {
			return;
		}

		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			try {
				const response = await getMachineById(id, token);
				setMachine(response?.data ?? response);
			} catch (error) {
				setApiError(error.message);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, [id]);

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
