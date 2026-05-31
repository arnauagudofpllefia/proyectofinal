
import { apiRequest, apiRequestWithFallback } from "@/lib/api";
import { resolvePublicImageUrl } from "@/lib/image";

/**
 * Funcion: normalizeCollection.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function normalizeCollection(payload) {
    const data = payload?.data ?? payload;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(payload?.gyms)) {
        return payload.gyms;
    }

    if (Array.isArray(payload?.gimnasios)) {
        return payload.gimnasios;
    }

    if (Array.isArray(payload?.gimnasio)) {
        return payload.gimnasio;
    }

    if (Array.isArray(data?.gyms)) {
        return data.gyms;
    }

    if (Array.isArray(data?.gimnasios)) {
        return data.gimnasios;
    }

    if (Array.isArray(data?.gimnasio)) {
        return data.gimnasio;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.rows)) {
        return data.rows;
    }

    if (data && typeof data === "object") {
        const objectKeys = Object.keys(data);
        const hasOnlyInformationalKeys = objectKeys.length > 0 && objectKeys.every((key) =>
            ["message", "status", "success", "detail"].includes(String(key).toLowerCase())
        );

        if (hasOnlyInformationalKeys) {
            return [];
        }

        const firstArrayValue = Object.values(data).find((value) => Array.isArray(value));
        if (Array.isArray(firstArrayValue)) {
            return firstArrayValue;
        }
    }

    if (data?.gimnasio && typeof data.gimnasio === "object") {
        return [data.gimnasio];
    }

    if (data?.gym && typeof data.gym === "object") {
        return [data.gym];
    }

    if (data && typeof data === "object") {
        return [data];
    }

    return [];
}

/**
 * Funcion: normalizeId.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function normalizeId(value, fallback) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    return String(value);
}

/**
 * Funcion: extractDate.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function extractDate(value) {
    if (!value) {
        return "";
    }

    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
}

/**
 * Funcion: extractTime.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function extractTime(value) {
    if (!value) {
        return "";
    }

    const match = String(value).match(/(\d{2}:\d{2})(?::\d{2})?/);
    return match ? match[1] : "";
}

/**
 * Funcion: extractEntityName.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function extractEntityName(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (typeof value === "object") {
        return String(value.nombre ?? value.name ?? value.titulo ?? value.title ?? "");
    }

    return "";
}

const adminResources = {
    gyms: {
        key: "gyms",
        slug: "gyms",
        title: "Gimnasio",
        singularTitle: "gimnasio",
        description: "Administra la ficha unica del gimnasio desde las rutas exactas de Laravel.",
        emptyState: "Todavia no existe ningun gimnasio creado.",
        autoEditFirstItem: true,
        capabilities: {
            create: true,
            edit: true,
            delete: true,
        },
        listPath: ["/admin/gyms", "/admin/gimnasios", "/admin/gym", "/gyms", "/gimnasios", "/gym"],
        createPath: ["/admin/gyms", "/admin/gimnasios", "/admin/gym"],
        updatePath: ["/admin/gym/{id}", "/gym/{id}"],
        updateMethod: "PUT",
        deletePath: ["/admin/gym/{id}", "/admin/gyms/{id}", "/admin/gimnasios/{id}"],
        fields: [
            {
                name: "name",
                label: "Nombre",
                type: "text",
                required: true,
                placeholder: "GymNau Central",
            },
            {
                name: "address",
                label: "Direccion",
                type: "text",
                required: true,
                placeholder: "Calle Principal 123",
            },
            {
                name: "phone",
                label: "Telefono",
                type: "tel",
                required: true,
                placeholder: "600123123",
            },
        ],
        normalizeItem(item, index) {
            const source = item?.gimnasio ?? item?.gym ?? item;

            return {
                id: normalizeId(source?.id ?? source?.uuid, `gym-${index + 1}`),
                name: source?.name ?? source?.nombre ?? "",
                address: source?.address ?? source?.direccion ?? "",
                phone: source?.phone ?? source?.telefono ?? "",
            };
        },
        buildPayload(values) {
            const name = values.name.trim();
            const address = values.address.trim();
            const phone = values.phone.trim();

            return {
                name,
                nombre: name,
                address,
                direccion: address,
                phone,
                telefono: phone,
            };
        },
        getItemTitle(item) {
            return item.name || "Gimnasio sin nombre";
        },
        getItemMeta(item) {
            return [item.address, item.phone].filter(Boolean).join(" · ");
        },
    },
    machines: {
        key: "machines",
        slug: "machines",
        title: "Maquinas",
        singularTitle: "maquina",
        description: "Administra el catalogo de maquinas y su estado operativo.",
        emptyState: "No hay maquinas registradas.",
        capabilities: {
            create: true,
            edit: true,
            delete: true,
        },
        listPath: "/admin/machines",
        createPath: "/admin/machines",
        updatePath: "/admin/machines/{id}",
        deletePath: "/admin/machines/{id}",
        fields: [
            {
                name: "name",
                label: "Nombre",
                type: "text",
                required: true,
                placeholder: "Cinta X9",
            },
            {
                name: "gymId",
                label: "Gimnasio",
                type: "select",
                required: true,
                options: [],
            },
            {
                name: "status",
                label: "Estado",
                type: "select",
                required: true,
                options: [
                    { value: "Activa", label: "Activa" },
                    { value: "Inactiva", label: "Inactiva" },
                ],
            },
            {
                name: "description",
                label: "Descripcion",
                type: "text",
                required: false,
                placeholder: "Descripcion de la maquina",
            },
            {
                name: "imageUrl",
                label: "URL publica imagen (opcional)",
                type: "url",
                required: false,
                placeholder: "https://...",
            },
        ],
        normalizeItem(item, index) {
            return {
                id: normalizeId(item?.id ?? item?.uuid, `machine-${index + 1}`),
                name: item?.name ?? item?.nombre ?? "",
                gymId: normalizeId(item?.gimnasio_id ?? item?.gym_id ?? item?.gym?.id, ""),
                zone: item?.zone ?? item?.zona ?? "",
                status: item?.status ?? item?.estado ?? "Activa",
                description: item?.description ?? item?.descripcion ?? "",
                imageUrl: resolvePublicImageUrl(
                    item?.image_url ?? item?.imagen_url ?? item?.imagen ?? item?.image ?? item?.foto ?? ""
                ),
            };
        },
        buildPayload(values) {
            const name = values.name.trim();
            const gymIdRaw = values.gymId.trim();
            const gymId = Number.parseInt(gymIdRaw, 10);
            const status = values.status.trim();
            /**
 * Funcion: description.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
            const description = (values.description ?? "").trim();
            /**
 * Funcion: imageUrl.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
            const imageUrl = (values.imageUrl ?? "").trim();

            return {
                gimnasio_id: Number.isInteger(gymId) ? gymId : gymIdRaw,
                gym_id: Number.isInteger(gymId) ? gymId : gymIdRaw,
                nombre: name,
                estado: status,
                description,
                descripcion: description,
                image_url: imageUrl,
                imagen_url: imageUrl,
            };
        },
        validate(values) {
            const errors = [];
            const gymId = String(values.gymId ?? "").trim();

            if (gymId && !/^\d+$/.test(gymId)) {
                errors.push("gymId: debe ser un entero");
            }

            const imageUrl = String(values.imageUrl ?? "").trim();
            if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
                errors.push("imageUrl: usa una URL publica que empiece por http:// o https://");
            }

            return errors;
        },
        getItemTitle(item) {
            return item.name || "Maquina sin nombre";
        },
        getItemMeta(item) {
            return [item.gymId ? `Gym ${item.gymId}` : "", item.status].filter(Boolean).join(" · ");
        },
    },
    reservations: {
        key: "reservations",
        slug: "reservations",
        title: "Reservas",
        singularTitle: "reserva",
        description: "Gestiona las reservas del sistema con alta, edicion y eliminacion desde admin.",
        emptyState: "No hay reservas registradas.",
        capabilities: {
            create: true,
            edit: true,
            delete: true,
        },
        listPath: "/admin/reservations",
        createPath: "/admin/reservations",
        updatePath: "/admin/reservations/{id}",
        deletePath: "/admin/reservations/{id}",
        fields: [
            {
                name: "userId",
                label: "Usuario",
                type: "select",
                required: true,
                options: [],
            },
            {
                name: "gymId",
                label: "Gimnasio",
                type: "select",
                required: true,
                options: [],
            },
            {
                name: "machineId",
                label: "Maquina",
                type: "select",
                required: true,
                options: [],
            },
            {
                name: "date",
                label: "Fecha",
                type: "date",
                required: true,
            },
            {
                name: "startTime",
                label: "Hora inicio",
                type: "time",
                required: true,
            },
            {
                name: "endTime",
                label: "Hora fin",
                type: "time",
                required: true,
            },
            {
                name: "status",
                label: "Estado",
                type: "select",
                required: false,
                defaultValue: "activa",
                options: [
                    { value: "activa", label: "Activa" },
                    { value: "cancelada", label: "Cancelada" },
                    { value: "completada", label: "Completada" },
                ],
            },
        ],
        normalizeItem(item, index) {
            return {
                id: normalizeId(item?.id ?? item?.uuid ?? item?.code, `reservation-${index + 1}`),
                userId: normalizeId(item?.user_id ?? item?.usuario_id ?? item?.user?.id, ""),
                gymId: normalizeId(item?.gimnasio_id ?? item?.gym_id ?? item?.gym?.id, ""),
                machineId: normalizeId(item?.machine_id ?? item?.maquina_id ?? item?.machine?.id, ""),
                userName:
                    extractEntityName(item?.user_name) ||
                    extractEntityName(item?.usuario) ||
                    extractEntityName(item?.usuario_nombre) ||
                    extractEntityName(item?.user?.name) ||
                    extractEntityName(item?.user?.nombre),
                gymName:
                    extractEntityName(item?.gym_name) ||
                    extractEntityName(item?.gimnasio) ||
                    extractEntityName(item?.gym?.name) ||
                    extractEntityName(item?.gym?.nombre),
                machineName:
                    extractEntityName(item?.machine_name) ||
                    extractEntityName(item?.maquina) ||
                    extractEntityName(item?.maquina_nombre) ||
                    extractEntityName(item?.machine?.name) ||
                    extractEntityName(item?.machine?.nombre),
                date:
                    item?.date ??
                    item?.fecha ??
                    extractDate(item?.hora_inicio ?? item?.start_time) ??
                    "",
                startTime: extractTime(item?.hora_inicio ?? item?.start_time ?? item?.hour ?? item?.hora ?? item?.time),
                endTime: extractTime(item?.hora_fin ?? item?.end_time),
                status: item?.status ?? item?.estado ?? "activa",
            };
        },
        buildPayload(values) {
            const userId = values.userId.trim();
            const gymId = values.gymId.trim();
            const machineId = values.machineId.trim();
            const date = values.date.trim();
            const startTime = values.startTime.trim();
            const endTime = values.endTime.trim();
            const status = values.status.trim();
            const startDateTime = date && startTime ? `${date}T${startTime}:00` : startTime;
            const endDateTime = date && endTime ? `${date}T${endTime}:00` : endTime;

            const payload = {
                usuario_id: userId,
                maquina_id: machineId,
                gimnasio_id: gymId,
                hora_inicio: startDateTime,
                hora_fin: endDateTime,
            };

            if (status) {
                payload.estado = status;
            }

            return payload;
        },
        validate(values) {
            const errors = [];
            const allowedStatuses = ["activa", "cancelada", "completada"];
            const status = String(values.status ?? "").trim().toLowerCase();

            if (status && !allowedStatuses.includes(status)) {
                errors.push("status: valor no permitido (activa, cancelada, completada)");
            }

            const startTime = String(values.startTime ?? "").trim();
            const endTime = String(values.endTime ?? "").trim();

            if (startTime && endTime && endTime <= startTime) {
                errors.push("endTime: debe ser posterior a Hora inicio");
            }

            return errors;
        },
        getItemTitle(item) {
            return item.machineName || item.gymName || `Reserva ${item.id}`;
        },
        getItemMeta(item) {
            return [
                item.userName || `Usuario ${item.userId}`,
                item.gymName || (item.gymId ? `Gimnasio ${item.gymId}` : ""),
                [item.date, item.startTime, item.endTime].filter(Boolean).join(" "),
                item.status,
            ]
                .filter(Boolean)
                .join(" · ");
        },
    },
    users: {
        key: "users",
        slug: "users",
        title: "Usuarios",
        singularTitle: "usuario",
        description: "Gestiona altas, ediciones y bajas de usuarios, manteniendo tambien el cambio de rol admin.",
        emptyState: "No hay usuarios registrados.",
        capabilities: {
            create: true,
            edit: true,
            delete: true,
        },
        listPath: "/admin/users",
        createPath: "/admin/users",
        updatePath: "/admin/users/{id}",
        deletePath: "/admin/users/{id}",
        fields: [
            {
                name: "name",
                label: "Nombre",
                type: "text",
                required: true,
                placeholder: "Ana Garcia",
            },
            {
                name: "email",
                label: "Email",
                type: "email",
                required: true,
                placeholder: "ana@email.com",
            },
            {
                name: "role",
                label: "Rol",
                type: "select",
                required: true,
                options: [
                    { value: "user", label: "Usuario" },
                    { value: "admin", label: "Administrador" },
                ],
            },
            {
                name: "gymId",
                label: "Gimnasio",
                type: "select",
                required: false,
                options: [],
            },
            {
                name: "password",
                label: "Contrasena temporal",
                type: "password",
                required: true,
                createOnly: true,
                placeholder: "Minimo 8 caracteres",
            },
            {
                name: "passwordConfirmation",
                label: "Confirmar contrasena",
                type: "password",
                required: true,
                createOnly: true,
                placeholder: "Repite la contrasena",
            },
        ],
        normalizeItem(item, index) {
            return {
                id: normalizeId(item?.id ?? item?.uuid, `user-${index + 1}`),
                name: item?.name ?? item?.nombre ?? "",
                email: item?.email ?? "",
                phone: item?.phone ?? item?.telefono ?? "",
                role: item?.role ?? item?.rol ?? item?.tipo ?? "user",
                gymId: normalizeId(item?.gimnasio_id ?? item?.gym_id ?? item?.gimnasio?.id ?? item?.gym?.id, ""),
                password: "",
                passwordConfirmation: "",
            };
        },
        buildPayload(values) {
            const name = values.name.trim();
            const email = values.email.trim();
            const role = values.role.trim();
            const password = values.password.trim();
            const passwordConfirmation = values.passwordConfirmation.trim();
            const gymId = String(values.gymId ?? "").trim();
            const parsedGymId = Number.parseInt(gymId, 10);
            const normalizedGymId = Number.isInteger(parsedGymId) ? parsedGymId : gymId;

            const payload = {
                name,
                nombre: name,
                email,
                role,
                rol: role,
            };

            if (gymId) {
                payload.gimnasio_id = normalizedGymId;
                payload.gym_id = normalizedGymId;
            }

            if (password) {
                payload.password = password;
                payload.contrasena = password;
                payload.password_confirmation = passwordConfirmation;
                payload.contrasena_confirmation = passwordConfirmation;
            }

            return payload;
        },
        getItemTitle(item) {
            return item.name || "Usuario sin nombre";
        },
        getItemMeta(item) {
            return [item.email, item.phone, item.role].filter(Boolean).join(" · ");
        },
        validate(values, mode) {
            const errors = [];

            if (mode === "create") {
                if (values.password.trim().length < 8) {
                    errors.push("password: minimo 8 caracteres");
                }

                if (values.password !== values.passwordConfirmation) {
                    errors.push("password_confirmation: no coincide con password");
                }
            }

            return errors;
        },
    },
};

/**
 * Funcion: resolvePath.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function resolvePath(path, params = {}) {
    if (!path) {
        return "";
    }

    if (Array.isArray(path)) {
        return path.map((currentPath) => resolvePath(currentPath, params));
    }

    return path.replaceAll("{id}", encodeURIComponent(String(params.id ?? "")));
}

/**
 * Funcion: appendGymScopeToPath.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function appendGymScopeToPath(path, gymId) {
    if (!gymId || !path) {
        return path;
    }

    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}gimnasio_id=${encodeURIComponent(gymId)}&gym_id=${encodeURIComponent(gymId)}`;
}

/**
 * Funcion: applyGymScopeToPath.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function applyGymScopeToPath(pathOrPaths, gymId) {
    if (!gymId) {
        return pathOrPaths;
    }

    if (Array.isArray(pathOrPaths)) {
        return pathOrPaths.map((path) => appendGymScopeToPath(path, gymId));
    }

    return appendGymScopeToPath(pathOrPaths, gymId);
}
/**
 * Funcion: requestPath.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
async function requestPath(pathOrPaths, options) {
    if (Array.isArray(pathOrPaths)) {
        return apiRequestWithFallback(pathOrPaths, options);
    }

    return apiRequest(pathOrPaths, options);
}

export function getAdminResource(resourceKey) {
    return adminResources[resourceKey];
}

export function getAdminResources() {
    return Object.values(adminResources);
}

export function createEmptyForm(resourceKey) {
    const resource = getAdminResource(resourceKey);

    return resource.fields.reduce((accumulator, field) => {
        accumulator[field.name] = field.defaultValue ?? "";
        return accumulator;
    }, {});
}

export function getVisibleFields(resourceKey, mode) {
    const resource = getAdminResource(resourceKey);
    const capabilities = resource.capabilities ?? {};

    if (mode === "create" && !capabilities.create) {
        return [];
    }

    if (mode === "edit" && !capabilities.edit) {
        return [];
    }

    return resource.fields.filter((field) => {
        if (field.createOnly && mode !== "create") {
            return false;
        }

        if (field.editOnly && mode !== "edit") {
            return false;
        }

        return true;
    });
}

export function normalizeResourceList(resourceKey, payload) {
    const resource = getAdminResource(resourceKey);

    return normalizeCollection(payload).map((item, index) => resource.normalizeItem(item, index));
}

export function normalizeResourceItem(resourceKey, payload) {
    const items = normalizeResourceList(resourceKey, payload);
    return items[0] ?? null;
}

export function mapItemToForm(resourceKey, item) {
    const emptyForm = createEmptyForm(resourceKey);

    return Object.keys(emptyForm).reduce((accumulator, key) => {
        accumulator[key] = item?.[key] ?? emptyForm[key];
        return accumulator;
    }, {});
}

export function validateResourceForm(resourceKey, values, mode) {
    const errors = [];

    for (const field of getVisibleFields(resourceKey, mode)) {
        if (field.required && !String(values[field.name] ?? "").trim()) {
            errors.push(`${field.name}: obligatorio`);
        }
    }

    const resource = getAdminResource(resourceKey);

    if (typeof resource.validate === "function") {
        errors.push(...resource.validate(values, mode));
    }

    return errors;
}

/**
 * Funcion: hasInvalidEstadoError.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function hasInvalidEstadoError(error) {
    const details = error?.details;
    const estadoErrors = details?.estado;

    if (!Array.isArray(estadoErrors)) {
        return false;
    }

    return estadoErrors.some((message) =>
        String(message).toLowerCase().includes("invalid")
    );
}

/**
 * Funcion: getReservationStatusCandidates.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
function getReservationStatusCandidates(status) {
    const normalized = String(status || "").trim().toLowerCase();
    const byIntent = {
        activa: ["activa", "active"],
        cancelada: ["cancelada", "cancelled", "canceled", "anulada"],
        completada: ["completada", "completed", "finalizada"],
    };

    const specific = byIntent[normalized] ?? [];
    const defaults = ["activa", "cancelada", "completada"];

    return [...new Set([normalized, ...specific, ...defaults].filter(Boolean))];
}

/**
 * Funcion: requestReservationWithStatusFallback.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
async function requestReservationWithStatusFallback(path, method, payload, token) {
    try {
        return await requestPath(path, {
            method,
            body: payload,
            token,
        });
    } catch (error) {
        if (error?.status !== 422 || !hasInvalidEstadoError(error)) {
            throw error;
        }

        const attempted = new Set([String(payload?.estado ?? "").toLowerCase()]);
        const candidates = getReservationStatusCandidates(payload?.estado);

        for (const candidate of candidates) {
            if (attempted.has(candidate)) {
                continue;
            }

            attempted.add(candidate);

            try {
                return await requestPath(path, {
                    method,
                    body: {
                        ...payload,
                        estado: candidate,
                        status: candidate,
                    },
                    token,
                });
            } catch (retryError) {
                if (retryError?.status !== 422 || !hasInvalidEstadoError(retryError)) {
                    throw retryError;
                }
            }
        }

        throw error;
    }
}

export async function listAdminResource(resourceKey, token, options = {}) {
    const resource = getAdminResource(resourceKey);
    const gymId = String(options?.gymId ?? "").trim();
    const resolvedPath = resolvePath(resource.listPath);
    const scopedPath = applyGymScopeToPath(resolvedPath, gymId);

    if (resourceKey !== "gyms" || !Array.isArray(resolvedPath)) {
        return requestPath(scopedPath, { token });
    }

    let lastError = null;
    let bestPayload = null;
    let bestScore = -1;

    for (const path of resolvedPath) {
        try {
            const payload = await apiRequest(path, { token });
            const normalized = normalizeResourceList(resourceKey, payload);
            const namedCount = normalized.filter((item) => String(item?.name || "").trim()).length;
            const score = normalized.length * 100 + namedCount;

            if (score > bestScore) {
                bestScore = score;
                bestPayload = payload;
            }

            if (normalized.length > 1 && namedCount > 0) {
                return payload;
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (bestPayload) {
        return bestPayload;
    }

    if (lastError) {
        throw lastError;
    }

    return requestPath(resolvedPath, { token });
}

export async function createAdminResource(resourceKey, values, token) {
    const resource = getAdminResource(resourceKey);
    if (!resource.createPath) {
        throw new Error(`La ruta para crear ${resource.singularTitle} no esta disponible.`);
    }

    const payload = resource.buildPayload(values);
    const path = resolvePath(resource.createPath);

    if (resourceKey === "reservations") {
        return requestReservationWithStatusFallback(path, "POST", payload, token);
    }

    return requestPath(path, {
        method: "POST",
        body: payload,
        token,
    });
}

export async function updateAdminResource(resourceKey, id, values, token) {
    const resource = getAdminResource(resourceKey);
    if (!resource.updatePath) {
        throw new Error(`La ruta para actualizar ${resource.singularTitle} no esta disponible.`);
    }

    const payload = resource.buildPayload(values);
    const path = resolvePath(resource.updatePath, { id });
    const method = resource.updateMethod ?? "PUT";

    if (resourceKey === "reservations") {
        return requestReservationWithStatusFallback(path, method, payload, token);
    }

    const isFormDataPayload = typeof FormData !== "undefined" && payload instanceof FormData;
    if (isFormDataPayload && method !== "POST") {
        payload.append("_method", method);
    }
    const effectiveMethod = isFormDataPayload ? "POST" : method;

    if (resourceKey === "users") {
        const { gimnasio_id, gym_id, ...userPayload } = payload;
        const encodedId = encodeURIComponent(String(id));
        const hasGymInPayload =
            (gimnasio_id !== undefined && String(gimnasio_id).trim() !== "") ||
            (gym_id !== undefined && String(gym_id).trim() !== "");

        const userResponse = await requestPath(path, {
            method,
            body: userPayload,
            token,
        });

        if (hasGymInPayload) {
            await apiRequest(`/admin/users/${encodedId}/gym`, {
                method: "PATCH",
                body: {
                    gimnasio_id,
                },
                token,
            });
        }

        return userResponse;
    }

    return requestPath(path, {
        method: effectiveMethod,
        body: payload,
        token,
    });
}

export async function deleteAdminResource(resourceKey, id, token) {
    const resource = getAdminResource(resourceKey);
    if (!resource.deletePath) {
        throw new Error(`La ruta para eliminar ${resource.singularTitle} no esta disponible.`);
    }

    return requestPath(resolvePath(resource.deletePath, { id }), {
        method: "DELETE",
        token,
    });
}

