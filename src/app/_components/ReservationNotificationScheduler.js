
"use client";

import { useEffect, useRef } from "react";
import { getMyReservations } from "@/lib/api";
import { addAppNotification } from "@/lib/notifications";

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
const POLL_INTERVAL_IN_MS = 60 * 1000;
const REMINDER_STORAGE_KEY = "gymnau_reservation_reminders_sent";

/**
 * Funcion: isValidDate.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function isValidDate(value) {
	return value instanceof Date && Number.isFinite(value.getTime());
}

/**
 * Funcion: parseDateTime.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function parseDateTime(value) {
	if (typeof value !== "string" || !value.trim()) {
		return null;
	}

	const parsed = new Date(value);
	return isValidDate(parsed) ? parsed : null;
}

/**
 * Funcion: parseDateHour.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function parseDateHour(dateValue, hourValue) {
	if (typeof dateValue !== "string" || typeof hourValue !== "string") {
		return null;
	}

	const hourMatch = hourValue.match(/(\d{2}:\d{2})/);
	if (!hourMatch) {
		return null;
	}

	const cleanDate = dateValue.trim();
	const hour = hourMatch[1];
	if (!cleanDate) {
		return null;
	}

	if (cleanDate.includes("-")) {
		const parsed = new Date(`${cleanDate}T${hour}:00`);
		return isValidDate(parsed) ? parsed : null;
	}

	const slashParts = cleanDate.split("/");
	if (slashParts.length !== 3) {
		return null;
	}

	const [day, month, year] = slashParts;
	const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
	const parsed = new Date(`${isoDate}T${hour}:00`);
	return isValidDate(parsed) ? parsed : null;
}

/**
 * Funcion: getReservationStartDate.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function getReservationStartDate(item) {
	const candidates = [
		item?.start_time,
		item?.hora_inicio,
		item?.fecha_hora_inicio,
		item?.datetime,
		item?.date_time,
	];

	for (const candidate of candidates) {
		const parsed = parseDateTime(candidate);
		if (parsed) {
			return parsed;
		}
	}

	return parseDateHour(item?.date ?? item?.fecha, item?.hour ?? item?.hora);
}

/**
 * Funcion: getSentReminderIds.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function getSentReminderIds() {
	if (typeof window === "undefined") {
		return new Set();
	}

	try {
		const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return new Set(Array.isArray(parsed) ? parsed.map((item) => String(item)) : []);
	} catch {
		return new Set();
	}
}

/**
 * Funcion: setSentReminderIds.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function setSentReminderIds(idsSet) {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(Array.from(idsSet)));
}

/**
 * Funcion: normalizeReservation.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function normalizeReservation(item, index) {
	return {
		id: String(item?.id ?? item?.code ?? `reservation-${index + 1}`),
		machine: item?.machine_name ?? item?.maquina_nombre ?? item?.machine ?? item?.maquina ?? "Maquina",
		date: item?.date ?? item?.fecha ?? "",
		hour: item?.hour ?? item?.hora ?? "",
		status: String(item?.status ?? item?.estado ?? "activa").toLowerCase(),
		startDate: getReservationStartDate(item),
	};
}

/**
 * Funcion: extractReservationsArray.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function extractReservationsArray(payload) {
	const directCandidates = [
		payload?.data,
		payload?.reservas,
		payload?.items,
		payload,
	];

	for (const candidate of directCandidates) {
		if (Array.isArray(candidate)) {
			return candidate;
		}
	}

	return [];
}

/**
 * Funcion: showSystemNotification.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
async function showSystemNotification(reservation) {
	if (!("Notification" in window) || !("serviceWorker" in navigator)) {
		return false;
	}

	if (Notification.permission !== "granted") {
		return false;
	}

	const registration = await navigator.serviceWorker.getRegistration();
	if (!registration) {
		return false;
	}

	const reservationId = String(reservation.id);
	const acceptParams = new URLSearchParams({ reservationAction: "accept", reservationId });
	const rejectParams = new URLSearchParams({ reservationAction: "reject", reservationId });
	const acceptUrl = `${window.location.origin}/reservations/my?${acceptParams.toString()}`;
	const rejectUrl = `${window.location.origin}/reservations/my?${rejectParams.toString()}`;

	await registration.showNotification("Quedan 5 minutos para tu reserva", {
		body: "Aun quieres seguir con la reserva?",
		tag: `reservation-reminder-${reservationId}`,
		renotify: true,
		requireInteraction: true,
		data: { reservationId, acceptUrl, rejectUrl },
		actions: [
			{ action: "accept", title: "Aceptar" },
			{ action: "reject", title: "Rechazar" },
		],
	});

	return true;
}

/**
 * Funcion: ReservationNotificationScheduler.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function ReservationNotificationScheduler() {
	const timeoutIdsRef = useRef([]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (!("serviceWorker" in navigator) || !("Notification" in window)) {
			return;
		}

		void navigator.serviceWorker.register("/sw-notifications.js", {
			scope: "/",
			updateViaCache: "none",
		});

		if (Notification.permission === "default") {
			void Notification.requestPermission();
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		let cancelled = false;

		/**
 * Funcion: clearTimeouts.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
		const clearTimeouts = () => {
			for (const timeoutId of timeoutIdsRef.current) {
				clearTimeout(timeoutId);
			}
			timeoutIdsRef.current = [];
		};

		/**
 * Funcion: scheduleReminders.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
		const scheduleReminders = async () => {
			clearTimeouts();

			const token = localStorage.getItem("auth_token") || "";
			if (!token) {
				return;
			}

			let sentIds = getSentReminderIds();
			const now = Date.now();

			try {
				const response = await getMyReservations(token);
				const reservationArray = extractReservationsArray(response);
				const normalized = reservationArray.map(normalizeReservation);

				for (const reservation of normalized) {
					if (cancelled || reservation.status === "cancelada" || !reservation.startDate) {
						continue;
					}

					const reservationId = String(reservation.id);
					if (sentIds.has(reservationId)) {
						continue;
					}

					const reminderAt = reservation.startDate.getTime() - FIVE_MINUTES_IN_MS;
					if (reservation.startDate.getTime() <= now) {
						continue;
					}

					/**
 * Funcion: triggerReminder.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
					const triggerReminder = () => {
						if (cancelled) {
							return;
						}

						addAppNotification({
							type: "reservation-reminder",
							title: "Quedan 5 minutos para tu reserva",
							message: `${reservation.machine} - ${reservation.date} a las ${reservation.hour}`,
							reservationId,
							dedupeKey: `reminder-5m-${reservationId}`,
						});

						sentIds = new Set([...sentIds, reservationId]);
						setSentReminderIds(sentIds);
						void showSystemNotification(reservation);
					};

					if (reminderAt <= now) {
						triggerReminder();
						continue;
					}

					const timeoutId = setTimeout(triggerReminder, reminderAt - now);
					timeoutIdsRef.current.push(timeoutId);
				}
			} catch {
				// noop
			}
		};

		void scheduleReminders();
		/**
 * Funcion: handleVisibility.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
		const handleVisibility = () => {
			if (document.visibilityState === "visible") {
				void scheduleReminders();
			}
		};
		window.addEventListener("focus", handleVisibility);
		document.addEventListener("visibilitychange", handleVisibility);
		const intervalId = setInterval(() => {
			void scheduleReminders();
		}, POLL_INTERVAL_IN_MS);

		return () => {
			cancelled = true;
			clearTimeouts();
			clearInterval(intervalId);
			window.removeEventListener("focus", handleVisibility);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	return null;
}


