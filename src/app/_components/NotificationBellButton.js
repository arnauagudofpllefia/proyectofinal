// Resumen del archivo: src\app\_components\NotificationBellButton.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAppNotifications, getNotificationsUpdateEventName } from "@/lib/notifications";
import { getUnreadNotificationsCount } from "@/lib/api";

/**
 * Funcion: NotificationBellButton.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function NotificationBellButton() {
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("auth_token") || "";

		/**
 * Funcion auxiliar: loadUnreadCount.

		 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

		 * Contexto: se usa como callback o helper dentro del flujo del componente.

		 */
		const loadUnreadCount = async () => {
			if (!token) {
				setLoading(false);
				return;
			}

			try {
				const response = await getUnreadNotificationsCount(token);
				const count = response?.unread_count ?? response?.count ?? 0;
				setUnreadCount(count);
			} catch {
				setUnreadCount(0);
			} finally {
				setLoading(false);
			}
		};

		const timer = setTimeout(loadUnreadCount, 0);

		/**
 * Funcion auxiliar: handleUpdate.

		 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

		 * Contexto: se usa como callback o helper dentro del flujo del componente.

		 */
		const handleUpdate = () => loadUnreadCount();
		window.addEventListener("storage", handleUpdate);
		window.addEventListener(getNotificationsUpdateEventName(), handleUpdate);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("storage", handleUpdate);
			window.removeEventListener(getNotificationsUpdateEventName(), handleUpdate);
		};
	}, []);

	return (
		<Link
			href="/notifications"
			className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 text-white transition hover:bg-white/15"
			aria-label="Notificaciones"
			title="Notificaciones"
		>
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
				<path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
				<path d="M10 17a2 2 0 0 0 4 0" />
			</svg>
			{unreadCount > 0 ? (
				<span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-5 text-white">
					{unreadCount > 9 ? "9+" : unreadCount}
				</span>
			) : null}
		</Link>
	);
}


