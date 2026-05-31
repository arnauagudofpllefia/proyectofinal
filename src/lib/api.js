
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const SANCTUM_CSRF_URL = process.env.NEXT_PUBLIC_SANCTUM_CSRF_URL || "";

/**
 * Funcion: getApiUrl.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function getApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Funcion: parseResponse.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const validationErrors = isJson && payload?.errors ? payload.errors : null;
    const firstValidationError = validationErrors
      ? Object.values(validationErrors).flat().find(Boolean)
      : "";

    const genericByStatus =
      response.status === 422
        ? "Datos no validos. Revisa los campos del formulario."
        : `Error ${response.status}: ${response.statusText || "respuesta no valida"}`;

    const payloadText =
      !isJson && typeof payload === "string" && payload.trim()
        ? payload.trim().slice(0, 180)
        : "";

    const message =
      firstValidationError ||
      (isJson && (payload?.message || payload?.error || payload?.detail)) ||
      payloadText ||
      genericByStatus;

    const error = new Error(message);
    error.status = response.status;
    error.details = validationErrors;
    error.payload = isJson ? payload : null;
    throw error;
  }

  return payload;
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("Falta NEXT_PUBLIC_API_URL en tu .env.local");
  }

  const {
    method = "GET",
    body,
    headers,
    credentials = "omit",
    cache = "no-store",
    withCsrf = false,
    token,
  } = options;

  if (withCsrf && SANCTUM_CSRF_URL) {
    await fetch(SANCTUM_CSRF_URL, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const requestHeaders = {
    Accept: "application/json",
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const requestBody = body
    ? isFormData
      ? body
      : JSON.stringify(body)
    : undefined;

  const response = await fetch(getApiUrl(path), {
    method,
    headers: requestHeaders,
    body: requestBody,
    credentials,
    cache,
  });

  return parseResponse(response);
}

export async function apiRequestWithFallback(paths, options = {}) {
  let lastError = null;

  for (const path of paths) {
    try {
      return await apiRequest(path, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No se pudo completar la peticion.");
}

export async function getHealth() {
  return apiRequest("/health");
}

export async function loginRequest({ email, password }) {
  return apiRequest("/login", {
    method: "POST",
    body: { email, contrasena: password },
  });
}

export async function registerRequest({ name, email, password, password_confirmation, gymId }) {
  return apiRequest("/register", {
    method: "POST",
    body: {
      nombre: name,
      email,
      contrasena: password,
      contrasena_confirmation: password_confirmation,
      ...(gymId ? { gimnasio_id: gymId, gym_id: gymId } : {}),
    },
  });
}

export async function getGyms(token) {
  return apiRequest("/gyms", { token: token || undefined });
}

export async function updateUserGym(gymId, token) {
  const normalizedGymId = Number.parseInt(String(gymId), 10);
  const payloadGymId = Number.isFinite(normalizedGymId) ? normalizedGymId : gymId;

  return apiRequest("/user", {
    method: "PATCH",
    body: {
      gimnasio_id: payloadGymId,
    },
    token,
  });
}

export async function updateAdminUserGym(userId, gymId, token) {
  const normalizedGymId = Number.parseInt(String(gymId), 10);
  const payloadGymId = Number.isFinite(normalizedGymId) ? normalizedGymId : gymId;
  const encodedUserId = encodeURIComponent(String(userId));

  return apiRequest(`/admin/users/${encodedUserId}/gym`, {
    method: "PATCH",
    body: {
      gimnasio_id: payloadGymId,
    },
    token,
  });
}

export async function getCurrentUser(token) {
  return apiRequest("/user", { token });
}

export async function getAvatarImages(token) {
  return apiRequest("/avatar-images", { token: token || undefined });
}

export async function logoutRequest(token) {
  return apiRequest("/logout", {
    method: "POST",
    token,
  });
}

export async function getMachines(token) {
  return apiRequest("/machines", { token });
}

export async function getMachineById(id, token) {
  return apiRequest(`/machines/${id}`, { token });
}

export async function getMachineSlots(id, token) {
  return apiRequest(`/machines/${id}/slots`, { token });
}

export async function getMachineReservations(id, token) {
  const encodedId = encodeURIComponent(String(id));
  return apiRequest(`/machines/${encodedId}/reservations`, { token });
}

export async function getReservations(token) {
  return apiRequest("/admin/reservations", { token });
}

export async function getMyReservations(token) {
  return apiRequest("/reservations/my", {
    token,
  });
}

export async function createReservation(payload, token) {
  return apiRequest("/reservations", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function cancelReservation(id, token) {
  return apiRequest(`/reservations/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getDashboardStats(token) {
  return apiRequest("/admin/dashboard", { token });
}

export async function getGymInfo(token) {
  return apiRequestWithFallback(
    ["/admin/gym", "/admin/gym-info", "/admin/gimnasio", "/gym"],
    { token }
  );
}

export async function updateGymInfo(payload, token) {
  return apiRequestWithFallback(
    ["/admin/gym", "/admin/gym-info", "/admin/gimnasio", "/gym"],
    {
      method: "PUT",
      body: payload,
      token,
    }
  );
}

export async function getNotifications(token) {
  return apiRequest("/notifications", { token });
}

export async function getUnreadNotificationsCount(token) {
  return apiRequest("/notifications/unread-count", { token });
}

export async function markNotificationAsRead(notificationId, token) {
  const encodedId = encodeURIComponent(String(notificationId));
  return apiRequest(`/notifications/${encodedId}/read`, {
    method: "PATCH",
    token,
  });
}

export async function markAllNotificationsAsRead(token) {
  return apiRequest("/notifications/read-all", {
    method: "PATCH",
    token,
  });
}


