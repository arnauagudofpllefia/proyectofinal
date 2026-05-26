const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const SANCTUM_CSRF_URL = process.env.NEXT_PUBLIC_SANCTUM_CSRF_URL || "";

function getApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

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

  const requestHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(getApiUrl(path), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
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
