"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getGyms, updateUserGym } from "@/lib/api";

const GYM_CHANGE_KEY = "gym_last_changed";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function daysUntilNextChange(lastChangedIso) {
	if (!lastChangedIso) {
		return 0;
	}
	const diff = TWO_WEEKS_MS - (Date.now() - Date.parse(lastChangedIso));
	return diff > 0 ? Math.ceil(diff / (24 * 60 * 60 * 1000)) : 0;
}

function extractUserInfo(payload) {
	const user = payload?.data ?? payload;
	return {
		name: user?.name ?? user?.nombre ?? "",
		email: user?.email ?? "",
		gymId: String(user?.gym_id ?? user?.gimnasio_id ?? user?.gym?.id ?? user?.gimnasio?.id ?? ""),
		gymName: user?.gym?.name ?? user?.gym?.nombre ?? user?.gimnasio?.name ?? user?.gimnasio?.nombre ?? "",
	};
}

export default function ProfilePage() {
	const [user, setUser] = useState(null);
	const [gyms, setGyms] = useState([]);
	const [selectedGymId, setSelectedGymId] = useState("");
	const [daysLeft, setDaysLeft] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			try {
				const meResponse = await getCurrentUser(token);
				const info = extractUserInfo(meResponse);
				setUser(info);
				setSelectedGymId(info.gymId);
			} catch {
				setUser(null);
			}

			try {
				const gymsData = await getGyms(token);
				const list = Array.isArray(gymsData) ? gymsData : (gymsData?.data ?? []);
				setGyms(
					list.map((g) => ({
						id: String(g?.id ?? ""),
						name: g?.nombre ?? g?.name ?? `Gimnasio ${g?.id}`,
					}))
				);
			} catch {
				setGyms([]);
			}

			const lastChanged = localStorage.getItem(GYM_CHANGE_KEY);
			setDaysLeft(daysUntilNextChange(lastChanged));
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	const handleChangeGym = async (event) => {
		event.preventDefault();
		setError("");
		setSuccess("");

		if (!selectedGymId) {
			setError("Selecciona un gimnasio.");
			return;
		}

		if (daysLeft > 0) {
			setError(`Solo puedes cambiar de gimnasio cada dos semanas. Puedes volver a cambiar en ${daysLeft} dia${daysLeft === 1 ? "" : "s"}.`);
			return;
		}

		if (selectedGymId === user?.gymId) {
			setError("Ya estas en ese gimnasio.");
			return;
		}

		setLoading(true);
		const token = localStorage.getItem("auth_token") || "";

		try {
			await updateUserGym(selectedGymId, token);
			localStorage.setItem(GYM_CHANGE_KEY, new Date().toISOString());
			setDaysLeft(14);
			const selectedGym = gyms.find((g) => g.id === selectedGymId);
			setUser((prev) => ({
				...prev,
				gymId: selectedGymId,
				gymName: selectedGym?.name ?? "",
			}));
			setSuccess("Gimnasio actualizado correctamente.");
		} catch (err) {
			setError(err.message || "No se pudo cambiar el gimnasio.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="rise-in mx-auto w-full max-w-xl space-y-6">
			<header>
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Cuenta</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Mi perfil</h1>
			</header>

			{user ? (
				<>
					<div className="glass-panel rounded-2xl p-6 space-y-3">
						<h2 className="text-lg font-semibold text-white">Informacion personal</h2>
						<p className="text-sm text-slate-300">Nombre: <span className="text-white">{user.name || "—"}</span></p>
						<p className="text-sm text-slate-300">Email: <span className="text-white">{user.email || "—"}</span></p>
						<p className="text-sm text-slate-300">
							Gimnasio actual:{" "}
							<span className="text-white">{user.gymName || user.gymId || "Sin asignar"}</span>
						</p>
					</div>

					<div className="glass-panel rounded-2xl p-6 space-y-4">
						<h2 className="text-lg font-semibold text-white">Cambiar gimnasio</h2>
						{daysLeft > 0 ? (
							<p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
								Podras cambiar de gimnasio en{" "}
								<strong>{daysLeft} dia{daysLeft === 1 ? "" : "s"}</strong>. Solo se permite un cambio cada dos semanas.
							</p>
						) : (
							<p className="text-sm text-slate-400">Puedes cambiar de gimnasio ahora. Tras el cambio deberas esperar dos semanas para volver a cambiarlo.</p>
						)}

						<form onSubmit={handleChangeGym} className="space-y-4">
							<label className="block text-sm text-slate-300">
								Nuevo gimnasio
								<select
									value={selectedGymId}
									onChange={(e) => setSelectedGymId(e.target.value)}
									disabled={daysLeft > 0}
									className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70 disabled:opacity-50"
								>
									<option value="">Selecciona un gimnasio</option>
									{gyms.map((gym) => (
										<option key={gym.id} value={gym.id}>
											{gym.name}
										</option>
									))}
								</select>
							</label>

							{error ? <p className="text-sm text-rose-300">{error}</p> : null}
							{success ? <p className="text-sm text-emerald-300">{success}</p> : null}

							<button
								type="submit"
								disabled={loading || daysLeft > 0}
								className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading ? "Guardando..." : "Confirmar cambio"}
							</button>
						</form>
					</div>
				</>
			) : (
				<p className="text-sm text-slate-400">Cargando perfil...</p>
			)}

			<Link
				href="/machines"
				className="inline-block text-xs text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
			>
				← Ver maquinas
			</Link>
		</section>
	);
}
