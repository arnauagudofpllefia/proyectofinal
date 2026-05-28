"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProfileGlyph from "@/app/_components/ProfileGlyph";
import { getCurrentUser, getGyms, updateUserGym } from "@/lib/api";
import {
	DEFAULT_PROFILE_ICON_ID,
	extractProfileIdentity,
	PROFILE_ICON_PRESETS,
	readStoredProfileIcon,
	saveStoredProfileIcon,
} from "@/lib/profileIcon";

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
	const identity = extractProfileIdentity(user);

	return {
		id: String(user?.id ?? user?.user_id ?? user?.usuario_id ?? user?.uuid ?? ""),
		identity,
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
	const [selectedProfileIconId, setSelectedProfileIconId] = useState(DEFAULT_PROFILE_ICON_ID);
	const [nextAllowedChangeAt, setNextAllowedChangeAt] = useState("");
	const [showGymForm, setShowGymForm] = useState(false);
	const [showIconPicker, setShowIconPicker] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [iconSuccess, setIconSuccess] = useState("");
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
				const storedIcon = readStoredProfileIcon(info.identity);

				setUser(info);
				setSelectedProfileIconId(storedIcon);
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

	const handleProfileIconChange = (iconId) => {
		if (!user?.identity) {
			return;
		}

		setSelectedProfileIconId(iconId);
		saveStoredProfileIcon(user.identity, iconId);
		setIconSuccess("Icono de perfil actualizado.");
		setShowIconPicker(false);

		setTimeout(() => {
			setIconSuccess("");
		}, 1800);
	};

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
			setShowGymForm(false);
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

	const toggleGymForm = () => {
		setShowGymForm((prev) => !prev);
		setError("");
		setSuccess("");
	};

	const toggleIconPicker = () => {
		setShowIconPicker((prev) => !prev);
	};

	return (
		<section className="rise-in mx-auto w-full max-w-4xl space-y-6">
			{user ? (
				<>
					<div className="surface-card p-6 space-y-6">
						<div className="flex items-center gap-5">
							<div className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-(--line) bg-white text-(--foreground) sm:h-28 sm:w-28">
								<ProfileGlyph iconId={selectedProfileIconId} className="h-12 w-12 sm:h-14 sm:w-14" />
								<button
									type="button"
									onClick={toggleIconPicker}
									className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--line) bg-white text-[var(--foreground)] shadow-sm transition hover:bg-(--background-subtle)"
									aria-label="Cambiar icono de perfil"
									title="Cambiar icono"
								>
									<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<path d="M12 20h9" />
										<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
									</svg>
								</button>
							</div>
							<div>
								<h2 className="text-2xl font-semibold text-[var(--foreground)]">{user.name || "Sin nombre"}</h2>
								<p className="mt-1 text-sm text-[var(--muted)]">{user.email || "Sin email"}</p>
							</div>
						</div>

						{showIconPicker ? (
							<div className="space-y-4 rounded-xl border border-(--line) bg-(--background-subtle) p-4">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-[var(--foreground)]">Elige tu icono</p>
									{iconSuccess ? <span className="text-xs text-emerald-700">{iconSuccess}</span> : null}
								</div>

								<div className="grid grid-cols-3 gap-3">
									{PROFILE_ICON_PRESETS.map((icon) => {
										const isActive = icon.id === selectedProfileIconId;
										return (
											<button
												type="button"
												key={icon.id}
												onClick={() => handleProfileIconChange(icon.id)}
												className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs transition ${
													isActive
														? "border-(--foreground) bg-(--primary-soft) text-(--foreground)"
														: "border-(--line) text-(--muted-strong) hover:border-(--line-strong) hover:bg-white"
												}`}
											>
												<ProfileGlyph iconId={icon.id} className="h-5 w-5" />
												<span>{icon.label}</span>
											</button>
										);
									})}
								</div>
							</div>
						) : null}

						<div className="rounded-xl border border-(--line) bg-(--background-subtle) p-4">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="text-sm text-[var(--muted)]">Gimnasio actual</p>
									<p className="text-base font-medium text-[var(--foreground)]">{user.gymName || user.gymId || "Sin asignar"}</p>
								</div>
								<button type="button" onClick={toggleGymForm} className="btn-primary w-full sm:w-auto">
									{showGymForm ? "Cerrar" : "Cambiar"}
								</button>
							</div>

							{showGymForm ? (
								<div className="mt-4 space-y-4 border-t border-(--line) pt-4">
									{daysLeft > 0 ? (
										<p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
											Podras cambiar de gimnasio en <strong>{daysLeft} dia{daysLeft === 1 ? "" : "s"}</strong>. Solo se permite un cambio cada dos semanas.
										</p>
									) : (
										<p className="text-sm text-[var(--muted)]">Selecciona el gimnasio al que quieres cambiarte.</p>
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

										<button type="submit" disabled={loading || daysLeft > 0} className="btn-primary w-full sm:w-auto">
											{loading ? "Guardando..." : "Confirmar cambio"}
										</button>
									</form>
								</div>
							) : null}
						</div>
					</div>
				</>
			) : (
				<p className="text-sm text-[var(--muted)]">Cargando perfil...</p>
			)}

			<Link href="/machines" className="inline-block text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-strong)]">
				{"<- Ver maquinas"}
			</Link>
		</section>
	);
}
