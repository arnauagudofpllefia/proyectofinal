self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const action = event.action || "accept";
	const data = event.notification.data || {};
	const targetUrl = action === "reject" ? data.rejectUrl : data.acceptUrl;

	if (!targetUrl) {
		return;
	}

	event.waitUntil(
		(async () => {
			const windowClients = await self.clients.matchAll({
				type: "window",
				includeUncontrolled: true,
			});

			for (const client of windowClients) {
				try {
					await client.navigate(targetUrl);
					await client.focus();
					return;
				} catch {
					// Try next client or open a new one
				}
			}

			await self.clients.openWindow(targetUrl);
		})()
	);
});
