import { apiRequest } from "@/lib/api";

function normalizeCollection(payload) {
    const data = payload?.data ?? payload;

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.rows)) {
        return data.rows;
    }

    if (data && typeof data === "object") {
        return [data];
    }

    return [];
}

function normalizeId(value, fallback) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    return String(value);
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
            delete: false,
        },
        listPath: "/admin/gym",
        createPath: "/admin/gym",
        updatePath: "/admin/gym",
        fields: [
            {
                name: "name",
                label: "Nombre",
                type: "text",
                required: true,
                placeholder: "GymFlow Central",
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
            return {
                id: normalizeId(item?.id ?? item?.uuid, `gym-${index + 1}`),
                name: item?.name ?? item?.nombre ?? "",
                address: item?.address ?? item?.direccion ?? "",
                phone: item?.phone ?? item?.telefono ?? "",
            };
        },
        buildPayload(values) {
            const name = values.name.trim();
            const address = values.address.trim();
            const phone = values.phone.trim();

            return {
                nombre: name,
                direccion: address,
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
        description: "Administra el catalogo de maquinas, su zona y su estado operativo.",
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
                name: "zone",
                label: "Zona",
                type: "text",
                required: true,
                placeholder: "Cardio",
            },
            {
                name: "status",
                label: "Estado",
                type: "select",
                required: true,
                options: [
                    { value: "Disponible", label: "Disponible" },
                    { value: "En uso", label: "En uso" },
                    { value: "Mantenimiento", label: "Mantenimiento" },
                ],
            },
        ],
        normalizeItem(item, index) {
            return {
                id: normalizeId(item?.id ?? item?.uuid, `machine-${index + 1}`),
                name: item?.name ?? item?.nombre ?? "",
                zone: item?.zone ?? item?.zona ?? "",
                status: item?.status ?? item?.estado ?? "Disponible",
            };
        },
        buildPayload(values) {
            const name = values.name.trim();
            const zone = values.zone.trim();
            const status = values.status.trim();

            return {
                nombre: name,
                zona: zone,
                estado: status,
            };
        },
        getItemTitle(item) {
            return item.name || "Maquina sin nombre";
        },
        getItemMeta(item) {
            return [item.zone, item.status].filter(Boolean).join(" · ");
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
                label: "ID usuario",
                type: "text",
                required: true,
                placeholder: "1",
            },
            {
                name: "machineId",
                label: "ID maquina",
                type: "text",
                required: true,
                placeholder: "2",
            },
            {
                name: "date",
                label: "Fecha",
                type: "date",
                required: true,
            },
            {
                name: "hour",
                label: "Hora",
                type: "time",
                required: true,
            },
            {
                name: "status",
                label: "Estado",
                type: "select",
                required: true,
                options: [
                    { value: "pendiente", label: "Pendiente" },
                    { value: "confirmada", label: "Confirmada" },
                    { value: "cancelada", label: "Cancelada" },
                ],
            },
        ],
        normalizeItem(item, index) {
            return {
                id: normalizeId(item?.id ?? item?.uuid ?? item?.code, `reservation-${index + 1}`),
                userId: normalizeId(item?.user_id ?? item?.usuario_id ?? item?.user?.id, ""),
                machineId: normalizeId(item?.machine_id ?? item?.maquina_id ?? item?.machine?.id, ""),
                userName:
                    item?.user_name ?? item?.usuario ?? item?.usuario_nombre ?? item?.user?.name ?? item?.user?.nombre ?? "",
                machineName:
                    item?.machine_name ?? item?.maquina ?? item?.maquina_nombre ?? item?.machine?.name ?? item?.machine?.nombre ?? "",
                date: item?.date ?? item?.fecha ?? "",
                hour: item?.hour ?? item?.hora ?? item?.time ?? "",
                status: item?.status ?? item?.estado ?? "pendiente",
            };
        },
        buildPayload(values) {
            const userId = values.userId.trim();
            const machineId = values.machineId.trim();
            const date = values.date.trim();
            const hour = values.hour.trim();
            const status = values.status.trim();

            return {
                user_id: userId,
                usuario_id: userId,
                machine_id: machineId,
                maquina_id: machineId,
                date,
                fecha: date,
                hour,
                hora: hour,
                status,
                estado: status,
            };
        },
        getItemTitle(item) {
            return item.machineName || `Reserva ${item.id}`;
        },
        getItemMeta(item) {
            return [
                item.userName || `Usuario ${item.userId}`,
                [item.date, item.hour].filter(Boolean).join(" "),
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
                name: "phone",
                label: "Telefono",
                type: "tel",
                required: false,
                placeholder: "600123123",
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
                password: "",
                passwordConfirmation: "",
            };
        },
        buildPayload(values) {
            const name = values.name.trim();
            const email = values.email.trim();
            const phone = values.phone.trim();
            const role = values.role.trim();
            const password = values.password.trim();
            const passwordConfirmation = values.passwordConfirmation.trim();

            const payload = {
                name,
                nombre: name,
                email,
                phone,
                telefono: phone,
                role,
                rol: role,
            };

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

function resolvePath(path, params = {}) {
    if (!path) {
        return "";
    }

    return path.replaceAll("{id}", encodeURIComponent(String(params.id ?? "")));
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

export async function listAdminResource(resourceKey, token) {
    const resource = getAdminResource(resourceKey);
    return apiRequest(resolvePath(resource.listPath), { token });
}

export async function createAdminResource(resourceKey, values, token) {
    const resource = getAdminResource(resourceKey);
    if (!resource.createPath) {
        throw new Error(`La ruta para crear ${resource.singularTitle} no esta disponible.`);
    }

    return apiRequest(resolvePath(resource.createPath), {
        method: "POST",
        body: resource.buildPayload(values),
        token,
    });
}

export async function updateAdminResource(resourceKey, id, values, token) {
    const resource = getAdminResource(resourceKey);
    if (!resource.updatePath) {
        throw new Error(`La ruta para actualizar ${resource.singularTitle} no esta disponible.`);
    }

    return apiRequest(resolvePath(resource.updatePath, { id }), {
        method: resource.updateMethod ?? "PUT",
        body: resource.buildPayload(values),
        token,
    });
}

export async function deleteAdminResource(resourceKey, id, token) {
    const resource = getAdminResource(resourceKey);
    if (!resource.deletePath) {
        throw new Error(`La ruta para eliminar ${resource.singularTitle} no esta disponible.`);
    }

    return apiRequest(resolvePath(resource.deletePath, { id }), {
        method: "DELETE",
        token,
    });
}