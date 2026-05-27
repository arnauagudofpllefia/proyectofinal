const STORAGE_KEY = "gymnau_notifications";
const MAX_ITEMS = 80;
const UPDATE_EVENT = "gymnau:notifications-updated";

function isBrowser() {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse(rawValue) {
	if (!rawValue) {
		return [];
	}

	try {
		const parsed = JSON.parse(rawValue);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function emitUpdate() {
	if (!isBrowser()) {
		return;
	}

	window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function getNotificationsUpdateEventName() {
	return UPDATE_EVENT;
}

export function getAppNotifications() {
	if (!isBrowser()) {
		return [];
	}

	const rawValue = localStorage.getItem(STORAGE_KEY);
	return safeParse(rawValue)
		.filter((item) => item && typeof item === "object")
		.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export function addAppNotification(payload) {
	if (!isBrowser()) {
		return null;
	}

	const nowIso = new Date().toISOString();
	const dedupeKey = payload?.dedupeKey ? String(payload.dedupeKey) : "";
	const baseItem = {
		id: payload?.id ? String(payload.id) : `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		type: payload?.type ? String(payload.type) : "info",
		title: payload?.title ? String(payload.title) : "Notificacion",
		message: payload?.message ? String(payload.message) : "",
		reservationId: payload?.reservationId ? String(payload.reservationId) : "",
		createdAt: nowIso,
		read: false,
		dedupeKey,
	};

	const current = getAppNotifications();
	const dedupeIndex = dedupeKey ? current.findIndex((item) => item.dedupeKey === dedupeKey) : -1;
	if (dedupeIndex >= 0) {
		current[dedupeIndex] = { ...current[dedupeIndex], ...baseItem };
	} else {
		current.unshift(baseItem);
	}

	const limited = current.slice(0, MAX_ITEMS);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
	emitUpdate();
	return baseItem;
}

export function markAppNotificationAsRead(notificationId) {
	if (!isBrowser()) {
		return;
	}

	const targetId = String(notificationId);
	const next = getAppNotifications().map((item) =>
		item.id === targetId
			? {
					...item,
					read: true,
			  }
			: item
	);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	emitUpdate();
}

export function markAllAppNotificationsAsRead() {
	if (!isBrowser()) {
		return;
	}

	const next = getAppNotifications().map((item) => ({ ...item, read: true }));
	localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	emitUpdate();
}

export function clearAppNotifications() {
	if (!isBrowser()) {
		return;
	}

	localStorage.removeItem(STORAGE_KEY);
	emitUpdate();
}
