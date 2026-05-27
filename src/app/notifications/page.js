"use client";

import { useEffect, useMemo, useState } from "react";
import {
	clearAppNotifications,
	getAppNotifications,
	getNotificationsUpdateEventName,
	markAllAppNotificationsAsRead,
	markAppNotificationAsRead,
} from "@/lib/notifications";

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

export default function NotificationsPage() {
	const [notifications, setNotifications] = useState([]);

	useEffect(() => {
		const update = () => setNotifications(getAppNotifications());

		update();
		window.addEventListener("storage", update);
		window.addEventListener(getNotificationsUpdateEventName(), update);

		return () => {
			window.removeEventListener("storage", update);
			window.removeEventListener(getNotificationsUpdateEventName(), update);
		};
	}, []);

	const unreadCount = useMemo(
		() => notifications.filter((item) => !item.read).length,
		[notifications]
	);

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
					<button type="button" onClick={markAllAppNotificationsAsRead} className="btn-ghost" disabled={!notifications.length}>
						Marcar todas como leidas
					</button>
					<button type="button" onClick={clearAppNotifications} className="btn-ghost" disabled={!notifications.length}>
						Vaciar
					</button>
				</div>
			</header>

			<div className="space-y-3">
				{notifications.map((item) => (
					<article key={item.id} className="surface-card p-5">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className={`badge ${item.read ? "badge-muted" : "badge-primary"}`}>{item.read ? "Leida" : "Nueva"}</p>
								<h2 className="mt-2 text-base font-semibold text-foreground">{item.title}</h2>
								{item.message ? <p className="mt-1 text-sm text-(--muted)">{item.message}</p> : null}
								<p className="mt-2 text-xs text-(--muted)">{formatDateTime(item.createdAt)}</p>
							</div>
							<button
								type="button"
								onClick={() => markAppNotificationAsRead(item.id)}
								className="btn-ghost"
								disabled={item.read}
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
		</section>
	);
}
