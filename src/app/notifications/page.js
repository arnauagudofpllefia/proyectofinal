// Resumen del archivo: src\app\notifications\page.js
// Este modulo esta comentado en estilo docente: explica que hace cada parte, por que existe y como encaja en el flujo general.

"use client";

import { useEffect, useMemo, useState } from "react";
import {
	getNotifications,
	markNotificationAsRead,
	markAllNotificationsAsRead,
} from "@/lib/api";
import { getNotificationsUpdateEventName } from "@/lib/notifications";

/**
 * Funcion: formatDateTime.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function formatDateTime(value) {
	if (!value) {
		return "Sin fecha";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Sin fecha";
	}

	return date.toLocaleString("es-ES", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Funcion: NotificationsPage.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function NotificationsPage() {
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("auth_token") || "";

		/**
 * Funcion: loadNotifications.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
		const loadNotifications = async () => {
			if (!token) {
				setLoading(false);
				return;
			}

			try {
				const response = await getNotifications(token);
				const items = Array.isArray(response) ? response : response?.data ?? [];
				setNotifications(items);
			} catch {
				setNotifications([]);
			} finally {
				setLoading(false);
			}
		};

		loadNotifications();

		/**
 * Funcion: handleUpdate.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
		const handleUpdate = () => loadNotifications();
		window.addEventListener("storage", handleUpdate);
		window.addEventListener(getNotificationsUpdateEventName(), handleUpdate);

		return () => {
			window.removeEventListener("storage", handleUpdate);
			window.removeEventListener(getNotificationsUpdateEventName(), handleUpdate);
		};
	}, []);

	const unreadCount = useMemo(
		() => notifications.filter((item) => !item.read_at).length,
		[notifications]
	);

	/**
 * Funcion: handleMarkAllAsRead.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
	const handleMarkAllAsRead = async () => {
		const token = localStorage.getItem("auth_token") || "";
		if (!token) return;

		try {
			await markAllNotificationsAsRead(token);
			setNotifications((prev) =>
				prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
			);
			window.dispatchEvent(new Event(getNotificationsUpdateEventName()));
		} catch {
			console.error("Error al marcar como leÃ­das");
		}
	};

	/**
 * Funcion: handleMarkAsRead.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
	const handleMarkAsRead = async (notificationId) => {
		const token = localStorage.getItem("auth_token") || "";
		if (!token) return;

		try {
			await markNotificationAsRead(notificationId, token);
			setNotifications((prev) =>
				prev.map((n) =>
					n.id === notificationId
						? { ...n, read_at: new Date().toISOString() }
						: n
				)
			);
			window.dispatchEvent(new Event(getNotificationsUpdateEventName()));
		} catch {
			console.error("Error al marcar como leÃ­da");
		}
	};

	return (
		<section className="rise-in space-y-6">
			<header className="surface-card p-6">
				<p className="badge badge-primary mb-2">Notificaciones</p>
				<h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Centro de notificaciones</h1>
				<p className="mt-2 text-sm text-(--muted)">
					{unreadCount > 0
						? `Tienes ${unreadCount} notificacion${unreadCount === 1 ? "" : "es"} sin leer.`
						: "No tienes notificaciones pendientes."}
				</p>
				<div className="mt-4 flex flex-wrap gap-2">
					<button type="button" onClick={handleMarkAllAsRead} className="btn-ghost" disabled={!notifications.length || unreadCount === 0}>
						Marcar todas como leidas
					</button>
				</div>
			</header>

			{loading ? (
				<article className="surface-card p-5 text-sm text-(--muted)">
					Cargando notificaciones...
				</article>
			) : (
				<div className="space-y-3">
					{notifications.map((item) => (
						<article key={item.id} className="surface-card p-5">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className={`badge ${item.read_at ? "badge-muted" : "badge-primary"}`}>
										{item.read_at ? "Leida" : "Nueva"}
									</p>
									<h2 className="mt-2 text-base font-semibold text-foreground">{item.title}</h2>
									{item.message ? <p className="mt-1 text-sm text-(--muted)">{item.message}</p> : null}
									<p className="mt-2 text-xs text-(--muted)">{formatDateTime(item.created_at)}</p>
								</div>
								<button
									type="button"
									onClick={() => handleMarkAsRead(item.id)}
									className="btn-ghost"
									disabled={!!item.read_at}
								>
									Marcar leida
								</button>
							</div>
						</article>
					))}
					{notifications.length === 0 ? (
						<article className="surface-card p-5 text-sm text-(--muted)">
							Las notificaciones de reservas apareceran aqui.
						</article>
					) : null}
				</div>
			)}
		</section>
	);
}


