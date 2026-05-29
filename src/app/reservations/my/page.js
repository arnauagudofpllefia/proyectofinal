// Resumen del archivo: src\app\reservations\my\page.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cancelReservation, getCurrentUser, getMyReservations } from "@/lib/api";
import { getGymIdFromUser, normalizeGymId } from "@/lib/gym";
import { addAppNotification } from "@/lib/notifications";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

/**
 * Funcion: extractText.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function extractText(value, fallback = "") {
	if (typeof value === "string") {
		return value;
	}

	if (value && typeof value === "object") {
		const objectText =
			value?.name ??
			value?.nombre ??
			value?.title ??
			value?.descripcion ??
			value?.description ??
			"";

		if (typeof objectText === "string") {
			return objectText;
		}
	}

	return fallback;
}

/**
 * Funcion: extractDate.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function extractDate(dateSource) {
	if (typeof dateSource !== "string" || !dateSource) {
		return "Sin fecha";
	}

	if (dateSource.includes("T")) {
		return dateSource.split("T")[0];
	}

	return dateSource;
}

/**
 * Funcion: extractHour.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function extractHour(timeSource) {
	if (typeof timeSource !== "string" || !timeSource) {
		return "--:--";
	}

	const match = timeSource.match(/(\d{2}:\d{2})/);
	return match ? match[1] : "--:--";
}

/**
 * Funcion: isValidDate.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function isValidDate(value) {
	return value instanceof Date && Number.isFinite(value.getTime());
}

/**
 * Funcion: parseDateTime.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function parseDateTime(value) {
	if (typeof value !== "string" || !value.trim()) {
		return null;
	}

	const parsed = new Date(value);
	if (isValidDate(parsed)) {
		return parsed;
	}

	return null;
}

/**
 * Funcion: parseDateHour.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function parseDateHour(dateValue, hourValue) {
	if (typeof dateValue !== "string" || typeof hourValue !== "string") {
		return null;
	}

	const cleanDate = dateValue.trim();
	const cleanHour = hourValue.trim();
	if (!cleanDate || !cleanHour) {
		return null;
	}

	const hourMatch = cleanHour.match(/(\d{2}:\d{2})/);
	if (!hourMatch) {
		return null;
	}

	const hour = hourMatch[1];
	const dateParts = cleanDate.split("-");
	if (dateParts.length === 3) {
		const parsed = new Date(`${cleanDate}T${hour}:00`);
		return isValidDate(parsed) ? parsed : null;
	}

	const slashParts = cleanDate.split("/");
	if (slashParts.length === 3) {
		const [day, month, year] = slashParts;
		const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
		const parsed = new Date(`${isoDate}T${hour}:00`);
		return isValidDate(parsed) ? parsed : null;
	}

	return null;
}

/**
 * Funcion: getReservationStartAt.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function getReservationStartAt(item) {
	const directCandidates = [
		item?.start_time,
		item?.hora_inicio,
		item?.fecha_hora_inicio,
		item?.datetime,
		item?.date_time,
	];

	for (const candidate of directCandidates) {
		const parsed = parseDateTime(candidate);
		if (parsed) {
			return parsed.toISOString();
		}
	}

	const dateCandidate = item?.date ?? item?.fecha;
	const hourCandidate = item?.hour ?? item?.hora;
	const combined = parseDateHour(dateCandidate, hourCandidate);
	return combined ? combined.toISOString() : "";
}

/**
 * Funcion: getReservationEndAt.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function getReservationEndAt(item) {
	const directCandidates = [
		item?.end_time,
		item?.hora_fin,
		item?.fecha_hora_fin,
	];

	for (const candidate of directCandidates) {
		const parsed = parseDateTime(candidate);
		if (parsed) {
			return parsed.toISOString();
		}
	}

	return "";
}

/**
 * Funcion: normalizeMyReservations.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function normalizeMyReservations(payload) {
	const data = payload?.data ?? payload;
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((item, index) => ({
		id: item?.id ?? item?.code ?? `R-${index + 1}`,
		machine:
			extractText(item?.machine_name) ||
			extractText(item?.maquina_nombre) ||
			extractText(item?.machine) ||
			extractText(item?.maquina) ||
			"Sin maquina",
		gymId: String(item?.gym_id ?? item?.gimnasio_id ?? item?.gym?.id ?? item?.gimnasio?.id ?? ""),
		gymName: extractText(item?.gym?.name) || extractText(item?.gym?.nombre) || extractText(item?.gimnasio) || "",
		date: extractDate(item?.date ?? item?.fecha ?? item?.hora_inicio ?? item?.start_time),
		hour: extractHour(item?.hour ?? item?.hora ?? item?.hora_inicio ?? item?.start_time),
		endHour: extractHour(item?.end_hour ?? item?.hora_fin ?? item?.end_time) || "--:--",
		status: extractText(item?.status ?? item?.estado, "activa").toLowerCase(),
		startAt: getReservationStartAt(item),
		endAt: getReservationEndAt(item),
	}));
}

/**
 * Funcion: MyReservationsPage.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function MyReservationsPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [myReservations, setMyReservations] = useState([]);
	const [apiError, setApiError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [cancelingId, setCancelingId] = useState("");
	const [reservationToCancel, setReservationToCancel] = useState(null);
	const [reminderReservation, setReminderReservation] = useState(null);
	const reminderTimeoutsRef = useRef([]);
	const remindedReservationsRef = useRef(new Set());
	const handledNotificationActionRef = useRef("");

	const cancelReservationById = useCallback(async (reservationId, successText = "") => {
		const token = localStorage.getItem("auth_token") || "";

		setCancelingId(String(reservationId));
		setApiError("");
		setSuccessMessage("");

		try {
			const response = await cancelReservation(reservationId, token);
			setMyReservations((currentReservations) =>
				currentReservations.filter((reservation) => String(reservation.id) !== String(reservationId))
			);
			setSuccessMessage(successText || response?.message || "Reserva cancelada correctamente.");
			addAppNotification({
				type: "reservation-cancelled",
				title: "Reserva cancelada",
				message: `Tu reserva ${reservationId} se ha cancelado correctamente.`,
				reservationId,
				dedupeKey: `cancelled-${reservationId}`,
			});
			return true;
		} catch (error) {
			setApiError(error.message || "No se pudo cancelar la reserva.");
			return false;
		} finally {
			setCancelingId("");
		}
	}, []);

	const showReminderNotification = useCallback(
		async (reservation) => {
			if (typeof window === "undefined") {
				return false;
			}

			if (!("Notification" in window) || !("serviceWorker" in navigator)) {
				return false;
			}

			if (Notification.permission !== "granted") {
				return false;
			}

			try {
				const registration = await navigator.serviceWorker.getRegistration();
				if (!registration) {
					return false;
				}

				const reservationId = String(reservation.id);
				const acceptParams = new URLSearchParams({
					reservationAction: "accept",
					reservationId,
				});
				const rejectParams = new URLSearchParams({
					reservationAction: "reject",
					reservationId,
				});

				const acceptUrl = `${window.location.origin}${pathname}?${acceptParams.toString()}`;
				const rejectUrl = `${window.location.origin}${pathname}?${rejectParams.toString()}`;

				await registration.showNotification("Quedan 5 minutos para tu reserva", {
					body: "Aun quieres seguir con la reserva?",
					tag: `reservation-reminder-${reservationId}`,
					renotify: true,
					requireInteraction: true,
					data: {
						acceptUrl,
						rejectUrl,
						reservationId,
					},
					actions: [
						{ action: "accept", title: "Aceptar" },
						{ action: "reject", title: "Rechazar" },
					],
				});

				return true;
			} catch {
				return false;
			}
		},
		[pathname]
	);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (!("serviceWorker" in navigator) || !("Notification" in window)) {
			return;
		}

		/**
 * Funcion auxiliar: setupWebNotifications.

		 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

		 * Contexto: se usa como callback o helper dentro del flujo del componente.

		 */
		const setupWebNotifications = async () => {
			try {
				await navigator.serviceWorker.register("/sw-notifications.js", {
					scope: "/",
					updateViaCache: "none",
				});
			} catch {
				return;
			}

			if (Notification.permission === "default") {
				try {
					await Notification.requestPermission();
				} catch {
					// noop
				}
			}
		};

		void setupWebNotifications();
	}, []);

	useEffect(() => {
		const timer = setTimeout(async () => {
			const token = localStorage.getItem("auth_token") || "";

			try {
				let userGymId = "";
				try {
					const meResponse = await getCurrentUser(token);
					userGymId = getGymIdFromUser(meResponse);
				} catch {
					userGymId = "";
				}

				const response = await getMyReservations(token);
				const normalized = normalizeMyReservations(response);
				const scopedReservations = userGymId
					? normalized.filter((item) => normalizeGymId(item.gymId) === normalizeGymId(userGymId))
					: normalized;

				setMyReservations(scopedReservations.length ? scopedReservations : []);
			} catch (error) {
				setApiError(error.message);
			}
		}, 0);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		for (const timeoutId of reminderTimeoutsRef.current) {
			clearTimeout(timeoutId);
		}
		reminderTimeoutsRef.current = [];

		const now = Date.now();

		for (const reservation of myReservations) {
			if (reservation.status === "cancelada") {
				continue;
			}

			const reservationId = String(reservation.id);
			if (remindedReservationsRef.current.has(reservationId)) {
				continue;
			}

			const startAtDate = parseDateTime(reservation.startAt);
			if (!startAtDate) {
				continue;
			}

			const reminderAt = startAtDate.getTime() - FIVE_MINUTES_IN_MS;
			if (startAtDate.getTime() <= now) {
				continue;
			}

			/**
 * Funcion auxiliar: triggerReminder.

			 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

			 * Contexto: se usa como callback o helper dentro del flujo del componente.

			 */
			const triggerReminder = () => {
				remindedReservationsRef.current.add(reservationId);
				addAppNotification({
					type: "reservation-reminder",
					title: "Quedan 5 minutos para tu reserva",
					message: `${reservation.machine} - ${reservation.date} a las ${reservation.hour}`,
					reservationId,
					dedupeKey: `reminder-5m-${reservationId}`,
				});
				void (async () => {
					const shownAsWebNotification = await showReminderNotification(reservation);
					if (!shownAsWebNotification) {
						setReminderReservation((currentReminder) => currentReminder ?? reservation);
					}
				})();
			};

			if (reminderAt <= now) {
				triggerReminder();
				continue;
			}

			const timeoutId = setTimeout(triggerReminder, reminderAt - now);
			reminderTimeoutsRef.current.push(timeoutId);
		}

		return () => {
			for (const timeoutId of reminderTimeoutsRef.current) {
				clearTimeout(timeoutId);
			}
			reminderTimeoutsRef.current = [];
		};
	}, [myReservations, showReminderNotification]);

	useEffect(() => {
		const action = searchParams.get("reservationAction");
		const reservationId = searchParams.get("reservationId");

		if (!action || !reservationId) {
			return;
		}

		const actionKey = `${action}:${reservationId}`;
		if (handledNotificationActionRef.current === actionKey) {
			return;
		}
		handledNotificationActionRef.current = actionKey;

		const nextParams = new URLSearchParams(searchParams.toString());
		nextParams.delete("reservationAction");
		nextParams.delete("reservationId");
		const nextQuery = nextParams.toString();
		router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });

		if (action === "reject") {
			setTimeout(() => {
				void cancelReservationById(reservationId, "Reserva cancelada desde la notificacion.");
			}, 0);
			return;
		}

		if (action === "accept") {
			setTimeout(() => {
				setSuccessMessage("Perfecto, mantenemos tu reserva.");
				setReminderReservation(null);
				addAppNotification({
					type: "reservation-accepted",
					title: "Reserva confirmada",
					message: `Has confirmado mantener tu reserva ${reservationId}.`,
					reservationId,
					dedupeKey: `accepted-${reservationId}`,
				});
			}, 0);
		}
	}, [searchParams, pathname, router, cancelReservationById]);

	/**
 * Funcion auxiliar: openCancelModal.

	 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

	 * Contexto: se usa como callback o helper dentro del flujo del componente.

	 */
	const openCancelModal = (reservation) => {
		setReservationToCancel(reservation);
		setApiError("");
		setSuccessMessage("");
	};

	/**
 * Funcion auxiliar: closeCancelModal.

	 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

	 * Contexto: se usa como callback o helper dentro del flujo del componente.

	 */
	const closeCancelModal = () => {
		if (cancelingId) {
			return;
		}

		setReservationToCancel(null);
	};

	/**
 * Funcion auxiliar: handleReminderAccept.

	 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

	 * Contexto: se usa como callback o helper dentro del flujo del componente.

	 */
	const handleReminderAccept = () => {
		if (reminderReservation) {
			addAppNotification({
				type: "reservation-accepted",
				title: "Reserva confirmada",
				message: `Has confirmado mantener tu reserva ${reminderReservation.id}.`,
				reservationId: reminderReservation.id,
				dedupeKey: `accepted-${reminderReservation.id}`,
			});
		}

		setReminderReservation(null);
	};

	/**
 * Funcion auxiliar: handleReminderReject.

	 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

	 * Contexto: se usa como callback o helper dentro del flujo del componente.

	 */
	const handleReminderReject = async () => {
		if (!reminderReservation) {
			return;
		}

		const wasCanceled = await cancelReservationById(reminderReservation.id);
		if (wasCanceled) {
			setReminderReservation(null);
		}
	};

	/**
 * Funcion auxiliar: handleCancelReservation.

	 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

	 * Contexto: se usa como callback o helper dentro del flujo del componente.

	 */
	const handleCancelReservation = async () => {
		if (!reservationToCancel) {
			return;
		}

		await cancelReservationById(reservationToCancel.id);
		setReservationToCancel(null);
	};

	return (
		<section className="rise-in space-y-6">
			<header>
				<p className="badge badge-primary mb-2">Mis reservas</p>
				<h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Tu actividad programada</h1>
				<p className="mt-2 text-sm text-(--muted)">
					{apiError
						? `Si este endpoint requiere auth, inicia sesion primero. Error: ${apiError}`
						: "Reservas activas en tu gimnasio."}
				</p>
				{successMessage ? <p className="mt-2 text-sm text-emerald-300">{successMessage}</p> : null}
			</header>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{myReservations
					.filter((item) => {
						const startAtDate = parseDateTime(item.startAt);
						if (!startAtDate) return true;
						return startAtDate.getTime() > Date.now();
					})
					.map((item) => {
						const isCanceled = item.status === "cancelada";
						const isLoading = cancelingId === String(item.id);

						return (
						<article key={item.id} className="surface-card p-5">
							<h2 className="text-base font-semibold text-foreground">{item.machine}</h2>
						<p className="mt-1 text-sm text-(--muted)">{item.date} {item.hour} - {item.endHour}</p>
							{item.gymName ? <p className="mt-2 text-xs text-(--muted)">{item.gymName}</p> : null}
							<p className="mt-2 text-xs uppercase tracking-[0.18em] text-(--muted)">Estado: {item.status}</p>
							<button
								type="button"
								onClick={() => openCancelModal(item)}
								disabled={isCanceled || isLoading}
								className="mt-4 w-full rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
							>
								{isCanceled ? "Cancelada" : isLoading ? "Cancelando..." : "Cancelar reserva"}
							</button>
						</article>
					);
					})}
				{myReservations.filter((item) => {
					const startAtDate = parseDateTime(item.startAt);
					if (!startAtDate) return true;
					return startAtDate.getTime() > Date.now();
				}).length === 0 ? (
				<p className="text-sm text-(--muted)">No hay reservas activas.</p>
				) : null}
			</div>

			{reservationToCancel ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true" onClick={closeCancelModal}>
					<div className="modal-card" onClick={(event) => event.stopPropagation()}>
						<div className="flex items-start justify-between gap-3 border-b border-(--line) px-6 py-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-(--primary)">Confirmacion</p>
								<h3 className="mt-1 text-lg font-semibold text-foreground">Cancelar reserva</h3>
							</div>
							<button
								type="button"
								onClick={closeCancelModal}
								className="btn-ghost"
								aria-label="Cerrar"
								disabled={Boolean(cancelingId)}
							>
								âœ•
							</button>
						</div>
						<div className="space-y-4 px-6 py-5">
							<p className="text-sm text-foreground">
								Vas a cancelar la reserva de <span className="font-semibold">{reservationToCancel.machine}</span> del{" "}
							<span className="font-semibold">{reservationToCancel.date}</span> de{" "}
							<span className="font-semibold">{reservationToCancel.hour}</span> a{" "}
							<span className="font-semibold">{reservationToCancel.endHour}</span>.
							</p>
							<p className="text-sm text-(--muted)">Esta accion no se puede deshacer desde esta pantalla.</p>
							<div className="flex flex-wrap justify-end gap-2 border-t border-(--line) pt-4">
								<button
									type="button"
									onClick={closeCancelModal}
									className="btn-ghost"
									disabled={Boolean(cancelingId)}
								>
									Volver
								</button>
								<button
									type="button"
									onClick={handleCancelReservation}
									disabled={Boolean(cancelingId)}
								className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-400"
								>
									{cancelingId ? "Cancelando..." : "Confirmar cancelacion"}
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}

			{reminderReservation ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true" onClick={handleReminderAccept}>
					<div className="modal-card" onClick={(event) => event.stopPropagation()}>
						<div className="flex items-start justify-between gap-3 border-b border-(--line) px-6 py-4">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-(--primary)">Notificacion</p>
								<h3 className="mt-1 text-lg font-semibold text-foreground">Quedan 5 minutos</h3>
							</div>
						</div>
						<div className="space-y-4 px-6 py-5">
							<p className="text-sm text-foreground">
								Quedan 5 minutos para tu reserva. Aun quieres seguir con la reserva?
							</p>
							<p className="text-sm text-(--muted)">
							{reminderReservation.machine} - {reminderReservation.date} {reminderReservation.hour} - {reminderReservation.endHour}
							</p>
							<div className="flex flex-wrap justify-end gap-2 border-t border-(--line) pt-4">
								<button
									type="button"
									onClick={handleReminderAccept}
									className="btn-ghost"
									disabled={Boolean(cancelingId)}
								>
									Aceptar
								</button>
								<button
									type="button"
									onClick={handleReminderReject}
									disabled={Boolean(cancelingId)}
								className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-400"
								>
									{cancelingId === String(reminderReservation.id) ? "Cancelando..." : "Rechazar"}
								</button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
}

