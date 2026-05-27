"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getGyms, updateUserGym } from "@/lib/api";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const GYM_NEXT_ALLOWED_KEY = "gym_next_allowed_change_at";

function daysUntilDate(isoDate) {
	if (!isoDate) {
		return 0;
	}

	const parsed = Date.parse(isoDate);
	if (Number.isNaN(parsed)) {
		return 0;
	}

	const diff = parsed - Date.now();
	return diff > 0 ? Math.ceil(diff / (24 * 60 * 60 * 1000)) : 0;
}

function plusTwoWeeks(isoDate) {
	if (!isoDate) {
		return "";
	}

	const parsed = Date.parse(isoDate);
	if (Number.isNaN(parsed)) {
		return "";
	}

	return new Date(parsed + TWO_WEEKS_MS).toISOString();
}

function formatLocalDateTime(isoDate) {
	if (!isoDate) {
		return "";
	}

	const parsed = new Date(isoDate);
	if (Number.isNaN(parsed.getTime())) {
		return "";
	}

	return parsed.toLocaleString("es-ES", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function parseIsoDate(isoDate) {
	if (!isoDate) {
		return null;
	}

	const parsed = Date.parse(isoDate);
	return Number.isNaN(parsed) ? null : parsed;
}

function pickMostRestrictiveDate(...dates) {
	const parsedDates = dates
		.map((date) => ({ date, parsed: parseIsoDate(date) }))
		.filter((item) => item.parsed !== null);

	if (!parsedDates.length) {
		return "";
	}

	parsedDates.sort((a, b) => b.parsed - a.parsed);
	return parsedDates[0].date;
}

function extractUserInfo(payload) {
	const user = payload?.data ?? payload;
	const lastGymChangeAt =
		user?.gimnasio_cambiado_en ??
		user?.gym_changed_at ??
		user?.gym?.changed_at ??
		"";
	const nextAllowedChangeAt = user?.next_allowed_change_at ?? plusTwoWeeks(lastGymChangeAt);

	return {
		name: user?.name ?? user?.nombre ?? "",
		email: user?.email ?? "",
		gymId: String(user?.gym_id ?? user?.gimnasio_id ?? user?.gym?.id ?? user?.gimnasio?.id ?? ""),
		gymName: user?.gym?.name ?? user?.gym?.nombre ?? user?.gimnasio?.name ?? user?.gimnasio?.nombre ?? "",
		nextAllowedChangeAt,
	};
}

export default function ProfilePage() {
	const [user, setUser] = useState(null);
	const [gyms, setGyms] = useState([]);
	const [selectedGymId, setSelectedGymId] = useState("");
	const [nextAllowedChangeAt, setNextAllowedChangeAt] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const daysLeft = daysUntilDate(nextAllowedChangeAt);

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";
			const localNextAllowed = localStorage.getItem(GYM_NEXT_ALLOWED_KEY) || "";
			if (localNextAllowed) {
				setNextAllowedChangeAt(localNextAllowed);
			}

			try {
				const meResponse = await getCurrentUser(token);
				const info = extractUserInfo(meResponse);
				const mergedNextAllowed = pickMostRestrictiveDate(
					info.nextAllowedChangeAt,
					localNextAllowed
				);
				setUser(info);
				setSelectedGymId(info.gymId);
				setNextAllowedChangeAt(mergedNextAllowed);

				if (mergedNextAllowed) {
					localStorage.setItem(GYM_NEXT_ALLOWED_KEY, mergedNextAllowed);
				} else {
					localStorage.removeItem(GYM_NEXT_ALLOWED_KEY);
				}
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

		if (selectedGymId === user?.gymId) {
			setError("Ya estas en ese gimnasio.");
			return;
		}

		if (daysLeft > 0) {
			const formattedDate = formatLocalDateTime(nextAllowedChangeAt);
			setError(
				`Solo puedes cambiar de gimnasio cada dos semanas. Podras cambiar en ${daysLeft} dia${daysLeft === 1 ? "" : "s"}${formattedDate ? ` (${formattedDate})` : ""}.`
			);
			return;
		}

		setLoading(true);
		const token = localStorage.getItem("auth_token") || "";

		try {
			const response = await updateUserGym(selectedGymId, token);
			const nextAllowedFromSuccess =
				response?.next_allowed_change_at ??
				response?.data?.next_allowed_change_at ??
				new Date(Date.now() + TWO_WEEKS_MS).toISOString();

			setNextAllowedChangeAt(nextAllowedFromSuccess);
			localStorage.setItem(GYM_NEXT_ALLOWED_KEY, nextAllowedFromSuccess);
			const selectedGym = gyms.find((g) => g.id === selectedGymId);
			setUser((prev) => ({
				...prev,
				gymId: selectedGymId,
				gymName: selectedGym?.name ?? "",
				nextAllowedChangeAt: nextAllowedFromSuccess,
			}));
			setSuccess("Gimnasio actualizado correctamente.");
		} catch (err) {
			const nextAllowedFromApi =
				err?.payload?.next_allowed_change_at ??
				err?.payload?.data?.next_allowed_change_at ??
				"";

			if (nextAllowedFromApi) {
				setNextAllowedChangeAt(nextAllowedFromApi);
				localStorage.setItem(GYM_NEXT_ALLOWED_KEY, nextAllowedFromApi);
				const remainingDays = daysUntilDate(nextAllowedFromApi);
				const formattedDate = formatLocalDateTime(nextAllowedFromApi);
				setError(
					remainingDays > 0
						? `Solo puedes cambiar de gimnasio cada dos semanas. Podras cambiar en ${remainingDays} dia${remainingDays === 1 ? "" : "s"}${formattedDate ? ` (${formattedDate})` : ""}.`
						: err.message || "No se pudo cambiar el gimnasio."
				);
				return;
			}

			setError(err.message || "No se pudo cambiar el gimnasio.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="rise-in mx-auto w-full max-w-2xl space-y-6">
			<header>
				<p className="badge badge-primary mb-2">Cuenta</p>
				<h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Mi perfil</h1>
			</header>

			{user ? (
				<>
					<div className="surface-card p-6 space-y-2">
						<h2 className="text-lg font-semibold text-[var(--foreground)]">Informacion personal</h2>
						<p className="text-sm text-[var(--muted)]">Nombre: <span className="text-[var(--foreground)] font-medium">{user.name || "—"}</span></p>
						<p className="text-sm text-[var(--muted)]">Email: <span className="text-[var(--foreground)] font-medium">{user.email || "—"}</span></p>
						<p className="text-sm text-[var(--muted)]">
							Gimnasio actual: <span className="text-[var(--foreground)] font-medium">{user.gymName || user.gymId || "Sin asignar"}</span>
						</p>
					</div>

					<div className="surface-card p-6 space-y-4">
						<h2 className="text-lg font-semibold text-[var(--foreground)]">Cambiar gimnasio</h2>
						{daysLeft > 0 ? (
							<p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
								Podras cambiar de gimnasio en <strong>{daysLeft} dia{daysLeft === 1 ? "" : "s"}</strong>. Solo se permite un cambio cada dos semanas.
							</p>
						) : (
							<p className="text-sm text-[var(--muted)]">Puedes cambiar de gimnasio ahora.</p>
						)}

						<form onSubmit={handleChangeGym} className="space-y-4">
							<label className="block text-sm font-medium text-[var(--foreground)]">
								Nuevo gimnasio
								<select
									value={selectedGymId}
									onChange={(e) => setSelectedGymId(e.target.value)}
									disabled={loading || daysLeft > 0}
									className="field-input mt-1"
								>
									<option value="">Selecciona un gimnasio</option>
									{gyms.map((gym) => (
										<option key={gym.id} value={gym.id}>{gym.name}</option>
									))}
								</select>
							</label>

							{error ? <p className="text-sm text-rose-600">{error}</p> : null}
							{success ? <p className="text-sm text-emerald-700">{success}</p> : null}

							<button type="submit" disabled={loading || daysLeft > 0} className="btn-primary w-full">
								{loading ? "Guardando..." : "Confirmar cambio"}
							</button>
						</form>
					</div>
				</>
			) : (
				<p className="text-sm text-[var(--muted)]">Cargando perfil...</p>
			)}

			<Link href="/machines" className="inline-block text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-strong)]">
				← Ver maquinas
			</Link>
		</section>
	);
}
