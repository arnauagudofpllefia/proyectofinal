"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAppNotifications, getNotificationsUpdateEventName } from "@/lib/notifications";

export default function NotificationBellButton() {
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
