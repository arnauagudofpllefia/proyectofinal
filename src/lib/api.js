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
    const message =
      (isJson && (payload.message || payload.error)) ||
      `Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
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
    body: { email, password },
  });
}

export async function registerRequest({ name, email, password }) {
  return apiRequest("/register", {
    method: "POST",
    body: {
      name,
      email,
      password,
      password_confirmation: password,
    },
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
