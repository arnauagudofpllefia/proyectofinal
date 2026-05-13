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

export async function loginRequest({ email, password }) {
  return apiRequestWithFallback(["/login", "/auth/login"], {
    method: "POST",
    body: { email, password },
    withCsrf: true,
    credentials: "include",
  });
}

export async function registerRequest({ name, email, password }) {
  return apiRequestWithFallback(["/register", "/auth/register"], {
    method: "POST",
    body: {
      name,
      email,
      password,
      password_confirmation: password,
    },
    withCsrf: true,
    credentials: "include",
  });
}

export async function getMachines() {
  return apiRequestWithFallback(["/machines", "/maquinas"]);
}

export async function getMachineById(id) {
  return apiRequestWithFallback([`/machines/${id}`, `/maquinas/${id}`]);
}

export async function getReservations() {
  return apiRequestWithFallback(["/reservations", "/reservas"]);
}

export async function getMyReservations(token) {
  return apiRequestWithFallback(["/reservations/my", "/my-reservations"], {
    token,
    credentials: token ? "omit" : "include",
  });
}

export async function createReservation(payload, token) {
  return apiRequestWithFallback(["/reservations", "/reservas"], {
    method: "POST",
    body: payload,
    token,
    withCsrf: !token,
    credentials: token ? "omit" : "include",
  });
}

export async function getDashboardStats() {
  return apiRequestWithFallback([
    "/dashboard/stats",
    "/dashboard/summary",
    "/stats",
  ]);
}
