// Resumen del archivo: src\app\admin\_components\AdminCrudPage.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import { useEffect, useState } from "react";
import ProfileGlyph from "@/app/_components/ProfileGlyph";
import {
    createAdminResource,
    createEmptyForm,
    deleteAdminResource,
    getAdminResource,
    getVisibleFields,
    listAdminResource,
    mapItemToForm,
    normalizeResourceItem,
    normalizeResourceList,
    updateAdminResource,
    validateResourceForm,
} from "@/lib/admin";
import {
    ADMIN_GYM_SCOPE_EVENT,
    filterItemsByGym,
    normalizeGymId,
    readStoredAdminGymId,
} from "@/lib/gym";
import { resolvePublicImageUrl } from "@/lib/image";
import { extractProfileIdentity, readStoredProfileIcon } from "@/lib/profileIcon";

const ITEMS_PER_PAGE = 10;

/**
 * Funcion: flattenValidationErrors.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function flattenValidationErrors(details) {
    if (!details || typeof details !== "object") {
        return [];
    }

    return Object.entries(details).flatMap(([field, messages]) => {
        if (!Array.isArray(messages)) {
            return [`${field}: ${String(messages)}`];
        }

        return messages.map((message) => `${field}: ${message}`);
    });
}

/**
 * Funcion: FieldInput.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function FieldInput({ field, value, disabled, onChange }) {
    if (field.type === "select") {
        return (
            <select
                name={field.name}
                value={value}
                onChange={onChange}
                disabled={disabled || field.disabled}
                className="field-input mt-1"
            >
                <option value="">Selecciona una opcion</option>
                {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (field.type === "file") {
        const fileName = value instanceof File ? value.name : "";
        return (
            <div className="mt-1 space-y-1">
                <input
                    name={field.name}
                    type="file"
                    accept={field.accept || "image/*"}
                    onChange={onChange}
                    disabled={disabled || field.disabled}
                    className="field-input"
                />
                {fileName ? (
                    <p className="text-xs text-(--muted)">Archivo: {fileName}</p>
                ) : null}
            </div>
        );
    }

    return (
        <input
            name={field.name}
            type={field.type}
            value={value}
            onChange={onChange}
            required={field.required}
            disabled={disabled || field.disabled}
            placeholder={field.placeholder}
            className="field-input mt-1"
        />
    );
}

/**
 * Funcion: isGymScopedResource.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function isGymScopedResource(resourceKey) {
    return resourceKey === "machines" || resourceKey === "reservations" || resourceKey === "users";
}

/**
 * Funcion: fetchResourceItems.
 * Proposito: encapsular comportamiento concreto para que el flujo principal sea mas facil de leer.
 * Uso: se ejecuta dentro de este modulo como parte de la logica de UI, datos o validaciones.
 */
async function fetchResourceItems(resourceKey, token, gymScopeId) {
    const response = await listAdminResource(resourceKey, token, { gymId: gymScopeId });
    const normalized = normalizeResourceList(resourceKey, response);

    if (!isGymScopedResource(resourceKey) || !gymScopeId) {
        return normalized;
    }

    return filterItemsByGym(normalized, gymScopeId);
}

/**
 * Funcion: AdminCrudPage.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function AdminCrudPage({ resourceKey }) {
    const resource = getAdminResource(resourceKey);
    const capabilities = resource.capabilities ?? {};
    const canCreate = Boolean(capabilities.create);
    const canEdit = Boolean(capabilities.edit);
    const canDelete = Boolean(capabilities.delete);
    const [selectedGymScopeId, setSelectedGymScopeId] = useState("");
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(() => createEmptyForm(resourceKey));
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");
    const [forbidden, setForbidden] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState([]);
    const [gymOptions, setGymOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [machineOptions, setMachineOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const needsGymSelection = isGymScopedResource(resourceKey) && !selectedGymScopeId;
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const supportsSearch = resourceKey === "users" || resourceKey === "machines" || resourceKey === "reservations";

    const mode = selectedId ? "edit" : "create";
    const canSubmit = selectedId ? canEdit : canCreate;
    const baseVisibleFields = getVisibleFields(resourceKey, mode);
    const visibleFields = baseVisibleFields.map((field) => {
        if (isGymScopedResource(resourceKey) && field.name === "gymId") {
            return {
                ...field,
                options: gymOptions,
                disabled: resourceKey !== "users" && Boolean(selectedGymScopeId),
            };
        }
        if (resourceKey === "reservations" && field.name === "userId") {
            return { ...field, options: userOptions };
        }
        if (resourceKey === "reservations" && field.name === "machineId") {
            return { ...field, options: machineOptions };
        }
        return field;
    });
    const visibleItems =
        supportsSearch && normalizedSearchTerm
            ? items.filter((item) => {
                const searchableFieldsByResource = {
                    users: [item.name, item.email, item.role],
                    machines: [item.name, item.status, item.description, item.gymId],
                    reservations: [
                        item.userName,
                        item.machineName,
                        item.gymName,
                        item.status,
                        item.date,
                        item.startTime,
                        item.endTime,
                        item.userId,
                        item.machineId,
                    ],
                };

                /**
 * Funcion auxiliar: haystack.

                 * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

                 * Contexto: se usa como callback o helper dentro del flujo del componente.

                 */
                const haystack = (searchableFieldsByResource[resourceKey] || [])
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return haystack.includes(normalizedSearchTerm);
            })
            : items;
    const totalItems = visibleItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const paginatedItems = visibleItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [resourceKey, selectedGymScopeId, normalizedSearchTerm]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    /**
 * Funcion auxiliar: loadItems.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const loadItems = async () => {
        if (needsGymSelection) {
            setItems([]);
            setLoading(false);
            setErrorMessage("");
            return [];
        }

        const token = localStorage.getItem("auth_token") || "";
        setLoading(true);
        setErrorMessage("");

        try {
            const normalized = await fetchResourceItems(resourceKey, token, selectedGymScopeId);
            setItems(normalized);
            setForbidden(false);
            return normalized;
        } catch (error) {
            if (error?.status === 401 || error?.status === 403) {
                setForbidden(true);
                setItems([]);
                setErrorMessage("Solo administradores pueden acceder a esta seccion.");
                return [];
            }
            setErrorMessage(error.message || `No se pudo cargar ${resource.title.toLowerCase()}.`);
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initTimer = setTimeout(() => {
            const initialGymId = readStoredAdminGymId();
            setSelectedGymScopeId(initialGymId);

            if (!selectedId && isGymScopedResource(resourceKey)) {
                setForm((prev) => ({ ...prev, gymId: initialGymId }));
            }
        }, 0);

        /**
 * Funcion auxiliar: handleGymScopeChange.

         * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

         * Contexto: se usa como callback o helper dentro del flujo del componente.

         */
        const handleGymScopeChange = (event) => {
            const nextGymId = normalizeGymId(event?.detail?.gymId ?? readStoredAdminGymId());
            setSelectedGymScopeId(nextGymId);

            if (selectedId) return;
            if (isGymScopedResource(resourceKey)) {
                setForm((prev) => ({ ...prev, gymId: nextGymId }));
            }
        };

        window.addEventListener(ADMIN_GYM_SCOPE_EVENT, handleGymScopeChange);

        return () => {
            clearTimeout(initTimer);
            window.removeEventListener(ADMIN_GYM_SCOPE_EVENT, handleGymScopeChange);
        };
    }, [resourceKey, selectedId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            (async () => {
                if (needsGymSelection) {
                    setItems([]);
                    setGymOptions([]);
                    setUserOptions([]);
                    setMachineOptions([]);
                    setLoading(false);
                    return;
                }

                const token = localStorage.getItem("auth_token") || "";
                setLoading(true);
                setErrorMessage("");

                try {
                    if (isGymScopedResource(resourceKey)) {
                        try {
                            const gymsResponse = await listAdminResource("gyms", token);
                            const normalizedGyms = normalizeResourceList("gyms", gymsResponse);
                            setGymOptions(
                                normalizedGyms
                                    .map((gym) => {
                                        const gymId = normalizeGymId(gym.id);
                                        if (!gymId) return null;
                                        return { value: gymId, label: gym.name || `Gimnasio ${gymId}` };
                                    })
                                    .filter(Boolean)
                            );
                        } catch {
                            setGymOptions([]);
                        }
                    } else {
                        setGymOptions([]);
                    }

                    if (resourceKey === "reservations") {
                        try {
                            const usersResponse = await listAdminResource("users", token, { gymId: selectedGymScopeId });
                            const normalizedUsers = normalizeResourceList("users", usersResponse);
                            const scopedUsers = selectedGymScopeId
                                ? normalizedUsers.filter((u) => normalizeGymId(u.gymId) === selectedGymScopeId)
                                : normalizedUsers;
                            setUserOptions(
                                scopedUsers
                                    .map((u) => ({ value: String(u.id), label: u.name || u.email || `Usuario ${u.id}` }))
                                    .filter((o) => o.value)
                            );
                        } catch {
                            setUserOptions([]);
                        }

                        try {
                            const machinesResponse = await listAdminResource("machines", token, { gymId: selectedGymScopeId });
                            const normalizedMachines = normalizeResourceList("machines", machinesResponse);
                            const scopedMachines = selectedGymScopeId
                                ? normalizedMachines.filter((m) => normalizeGymId(m.gymId) === selectedGymScopeId)
                                : normalizedMachines;
                            setMachineOptions(
                                scopedMachines
                                    .map((m) => ({ value: String(m.id), label: m.name || `Maquina ${m.id}` }))
                                    .filter((o) => o.value)
                            );
                        } catch {
                            setMachineOptions([]);
                        }
                    }

                    const normalized = await fetchResourceItems(resourceKey, token, selectedGymScopeId);
                    setItems(normalized);

                    if (selectedId && !normalized.some((item) => item.id === selectedId)) {
                        const nextForm = createEmptyForm(resourceKey);
                        if (isGymScopedResource(resourceKey) && selectedGymScopeId) {
                            nextForm.gymId = selectedGymScopeId;
                        }
                        setSelectedId(null);
                        setForm(nextForm);
                    }

                    setForbidden(false);
                } catch (error) {
                    if (error?.status === 401 || error?.status === 403) {
                        setForbidden(true);
                        setItems([]);
                        setErrorMessage("Solo administradores pueden acceder a esta seccion.");
                        return;
                    }
                    setErrorMessage(error.message || `No se pudo cargar ${resource.title.toLowerCase()}.`);
                } finally {
                    setLoading(false);
                }
            })();
        }, 0);

        return () => clearTimeout(timer);
    }, [resource.title, resourceKey, selectedGymScopeId, selectedId, needsGymSelection]);

    /**
 * Funcion auxiliar: handleChange.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const handleChange = (event) => {
        const { name, value, type, files } = event.target;
        if (type === "file") {
            const file = files && files[0] ? files[0] : null;
            setForm((prev) => ({ ...prev, [name]: file }));
            return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    /**
 * Funcion auxiliar: closeModal.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const closeModal = () => {
        setIsModalOpen(false);
        setFieldErrors([]);
        setErrorMessage("");
    };

    /**
 * Funcion auxiliar: openCreateModal.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const openCreateModal = () => {
        const nextForm = createEmptyForm(resourceKey);
        if (isGymScopedResource(resourceKey) && selectedGymScopeId) {
            nextForm.gymId = selectedGymScopeId;
        }
        setSelectedId(null);
        setForm(nextForm);
        setFieldErrors([]);
        setErrorMessage("");
        setSuccessMessage("");
        setIsModalOpen(true);
    };

    /**
 * Funcion auxiliar: handleEdit.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const handleEdit = (item) => {
        if (!canEdit) return;
        setSelectedId(item.id);
        setForm(mapItemToForm(resourceKey, item));
        setFieldErrors([]);
        setErrorMessage("");
        setSuccessMessage("");
        setIsModalOpen(true);
    };

    /**
 * Funcion auxiliar: handleSubmit.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canSubmit) {
            setErrorMessage("Este recurso no admite guardado desde el frontend con las rutas actuales.");
            return;
        }

        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");
        setFieldErrors([]);

        const validationErrors = validateResourceForm(resourceKey, form, mode);

        if (validationErrors.length) {
            setFieldErrors(validationErrors);
            setErrorMessage("Revisa los campos obligatorios antes de guardar.");
            setSaving(false);
            return;
        }

        const token = localStorage.getItem("auth_token") || "";

        try {
            const response = selectedId
                ? await updateAdminResource(resourceKey, selectedId, form, token)
                : await createAdminResource(resourceKey, form, token);

            normalizeResourceItem(resourceKey, response);
            await loadItems();

            setSuccessMessage(
                selectedId
                    ? `${resource.singularTitle} actualizado correctamente.`
                    : `${resource.singularTitle} creado correctamente.`
            );
            setIsModalOpen(false);
            setSelectedId(null);
        } catch (error) {
            if (error?.status === 401 || error?.status === 403) {
                setForbidden(true);
                setErrorMessage("No tienes permisos para guardar cambios en esta seccion.");
            } else {
                setErrorMessage(error.message || `No se pudo guardar ${resource.singularTitle}.`);
            }
            setFieldErrors(flattenValidationErrors(error?.details));
        } finally {
            setSaving(false);
        }
    };

    /**
 * Funcion auxiliar: handleDelete.

     * Proposito: aislar comportamiento puntual para evitar duplicidad de codigo.

     * Contexto: se usa como callback o helper dentro del flujo del componente.

     */
    const handleDelete = async (item) => {
        if (!canDelete) return;
        const confirmed = window.confirm(`Se eliminara ${resource.singularTitle} ${resource.getItemTitle(item)}.`);
        if (!confirmed) return;

        const token = localStorage.getItem("auth_token") || "";
        setDeletingId(item.id);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await deleteAdminResource(resourceKey, item.id, token);
            await loadItems();
            if (selectedId === item.id) {
                setSelectedId(null);
                setForm(createEmptyForm(resourceKey));
            }
            setSuccessMessage(`${resource.singularTitle} eliminado correctamente.`);
        } catch (error) {
            if (error?.status === 401 || error?.status === 403) {
                setForbidden(true);
                setErrorMessage("No tienes permisos para eliminar en esta seccion.");
            } else {
                setErrorMessage(error.message || `No se pudo eliminar ${resource.singularTitle}.`);
            }
        } finally {
            setDeletingId("");
        }
    };

    if (needsGymSelection) {
        return (
            <section className="surface-card p-6">
                <p className="badge badge-primary mb-2">{resource.title}</p>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Selecciona un gimnasio primero</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                    Para administrar {resource.title.toLowerCase()} debes elegir antes un gimnasio en el selector superior.
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-6">
            <header
                className={
                    resourceKey === "users" ||
                    resourceKey === "reservations" ||
                    resourceKey === "machines" ||
                    resourceKey === "gyms"
                        ? "flex flex-wrap items-start justify-between gap-4 p-6"
                        : "surface-card flex flex-wrap items-start justify-between gap-4 p-6"
                }
            >
                <div>
                    {resourceKey !== "users" &&
                    resourceKey !== "reservations" &&
                    resourceKey !== "machines" &&
                    resourceKey !== "gyms" ? (
                        <p className="badge badge-primary mb-2">{resource.title}</p>
                    ) : null}
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                        Gestion de {resource.title.toLowerCase()}
                    </h2>
                    {resourceKey !== "users" &&
                    resourceKey !== "reservations" &&
                    resourceKey !== "machines" &&
                    resourceKey !== "gyms" ? (
                        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">{resource.description}</p>
                    ) : null}
                </div>
                {canCreate ? (
                    <button type="button" onClick={openCreateModal} className="btn-primary" disabled={forbidden}>
                        + Nuevo {resource.singularTitle}
                    </button>
                ) : null}
            </header>

            {supportsSearch ? (
                <div
                    className={
                        resourceKey === "users" || resourceKey === "reservations" || resourceKey === "machines"
                            ? "p-4"
                            : "surface-card p-4"
                    }
                >
                    <label className="block text-sm font-medium text-[var(--foreground)]">
                        {resourceKey === "users"
                            ? "Buscar usuario"
                            : resourceKey === "machines"
                                ? "Buscar maquina"
                                : "Buscar reserva"}
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder={
                                resourceKey === "users"
                                    ? "Busca por nombre, email o rol"
                                    : resourceKey === "machines"
                                        ? "Busca por nombre, estado o descripcion"
                                        : "Busca por usuario, maquina, gimnasio o fecha"
                            }
                            className="field-input mt-1"
                        />
                    </label>
                </div>
            ) : null}

            {errorMessage && !isModalOpen ? (
                <div className="surface-card border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
            ) : null}
            {successMessage ? (
                <div className="surface-card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {successMessage}
                </div>
            ) : null}

            {resourceKey === "reservations" || resourceKey === "users" ? (
                <div className="surface-card overflow-hidden">
                    {loading ? (
                        <div className="p-5 text-sm text-[var(--muted)]">
                            Cargando {resource.title.toLowerCase()}...
                        </div>
                    ) : null}

                    {!loading && visibleItems.length === 0 ? (
                        <div className="p-5 text-sm text-[var(--muted)]">{resource.emptyState}</div>
                    ) : null}

                    {!loading && visibleItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm">
                                <thead className="bg-(--background-subtle)">
                                    <tr className="text-left text-[var(--muted-strong)]">
                                        {resourceKey === "reservations" ? (
                                            <>
                                                <th className="px-4 py-3 font-semibold">Usuario</th>
                                                <th className="px-4 py-3 font-semibold">Maquina</th>
                                                <th className="px-4 py-3 font-semibold">Gimnasio</th>
                                                <th className="px-4 py-3 font-semibold">Fecha</th>
                                                <th className="px-4 py-3 font-semibold">Horario</th>
                                                <th className="px-4 py-3 font-semibold">Estado</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3 font-semibold">Usuario</th>
                                                <th className="px-4 py-3 font-semibold">Email</th>
                                                <th className="px-4 py-3 font-semibold">Rol</th>
                                                <th className="px-4 py-3 font-semibold">Gimnasio</th>
                                            </>
                                        )}
                                        <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => {
                                        const userIconId =
                                            resourceKey === "users"
                                                ? readStoredProfileIcon(extractProfileIdentity(item))
                                                : "";
                                        const gymName =
                                            resourceKey === "users"
                                                ? gymOptions.find((option) => option.value === String(item.gymId))?.label ||
                                                (item.gymId ? `Gimnasio ${item.gymId}` : "-")
                                                : "-";

                                        return (
                                            <tr key={item.id} className="border-t border-(--line) align-top">
                                                {resourceKey === "reservations" ? (
                                                    <>
                                                        <td className="px-4 py-3 text-(--foreground)">{item.userName || `Usuario ${item.userId}`}</td>
                                                        <td className="px-4 py-3 text-(--foreground)">{item.machineName || `Maquina ${item.machineId}`}</td>
                                                        <td className="px-4 py-3 text-(--foreground)">{item.gymName || (item.gymId ? `Gimnasio ${item.gymId}` : "-")}</td>
                                                        <td className="px-4 py-3 text-(--foreground)">{item.date || "-"}</td>
                                                        <td className="px-4 py-3 text-(--foreground)">
                                                            {[item.startTime, item.endTime].filter(Boolean).join(" - ") || "-"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="badge badge-primary">{item.status || "Sin estado"}</span>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 text-(--foreground)">
                                                            <div className="flex items-center gap-3">
                                                                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-(--line) bg-(--background-subtle) text-(--foreground)">
                                                                    <ProfileGlyph iconId={userIconId} className="h-4 w-4" />
                                                                </span>
                                                                <span>{item.name || `Usuario ${item.id}`}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-(--foreground)">{item.email || "-"}</td>
                                                        <td className="px-4 py-3 text-(--foreground)">{item.role || "user"}</td>
                                                        <td className="px-4 py-3 text-(--foreground)">{gymName}</td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        {canEdit ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(item)}
                                                                disabled={saving || forbidden}
                                                                className="btn-primary"
                                                            >
                                                                Editar
                                                            </button>
                                                        ) : null}
                                                        {canDelete ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(item)}
                                                                disabled={saving || forbidden || deletingId === item.id}
                                                                className="btn-danger"
                                                            >
                                                                {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <article className="surface-card p-5 text-sm text-[var(--muted)]">
                            Cargando {resource.title.toLowerCase()}...
                        </article>
                    ) : null}

                    {!loading && visibleItems.length === 0 ? (
                        <article className="surface-card p-5 text-sm text-[var(--muted)]">{resource.emptyState}</article>
                    ) : null}

                    {paginatedItems.map((item) => {
                        const isMachine = resourceKey === "machines";
                        const isUser = resourceKey === "users";
                        const isGym = resourceKey === "gyms";
                        const isAvailable = isMachine && /activa|active|disponible|available/i.test(String(item.status || ""));
                        const title = resource.getItemTitle(item);
                        const meta = isMachine
                            ? [
                                gymOptions.find((option) => option.value === String(item.gymId))?.label ||
                                (item.gymId ? `Gimnasio ${item.gymId}` : ""),
                                item.status,
                            ]
                                .filter(Boolean)
                                .join(" Â· ")
                            : resource.getItemMeta(item);
                        const initials = String(title || "?").trim().charAt(0).toUpperCase();
                        const profileIconId = isUser
                            ? readStoredProfileIcon(extractProfileIdentity(item))
                            : "";
                        return (
                            <article key={item.id} className="surface-card surface-card-hover flex h-full flex-col overflow-hidden">
                                {isMachine ? (
                                    <div className="card-image relative aspect-[4/3] w-full">
                                        {item.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={resolvePublicImageUrl(item.imageUrl)}
                                                alt={title}
                                            />
                                        ) : (
                                            <div className="image-placeholder absolute inset-0">{initials}</div>
                                        )}
                                        <span
                                            className={`badge badge-floating absolute right-3 top-3 z-10 ${isAvailable ? "badge-success" : "badge-muted"
                                                }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-(--accent-strong)" : "bg-(--muted)"
                                                    }`}
                                            />
                                            {item.status || "Sin estado"}
                                        </span>
                                    </div>
                                ) : null}
                                <div className="flex flex-1 flex-col gap-3 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                {isUser ? (
                                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-(--line) bg-(--background-subtle) text-(--foreground)">
                                                        <ProfileGlyph iconId={profileIconId} className="h-5 w-5" />
                                                    </span>
                                                ) : null}
                                                <h3 className="truncate text-base font-semibold tracking-tight text-(--foreground)">
                                                    {title}
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-sm text-(--muted)">
                                                {meta || "Sin detalle adicional"}
                                            </p>
                                        </div>
                                        {!isMachine && !isUser && !isGym ? (
                                            <span className="badge badge-primary shrink-0">{resource.singularTitle}</span>
                                        ) : null}
                                    </div>
                                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                                        {canEdit ? (
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                disabled={saving || forbidden}
                                                className="btn-primary flex-1"
                                            >
                                                Editar
                                            </button>
                                        ) : null}
                                        {canDelete ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item)}
                                                disabled={saving || forbidden || deletingId === item.id}
                                                className="btn-danger"
                                            >
                                                {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {!loading && visibleItems.length > ITEMS_PER_PAGE ? (
                <nav className="surface-card flex flex-wrap items-center justify-between gap-3 p-4" aria-label="Paginacion">
                    <p className="text-sm text-[var(--muted)]">
                        Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                className={page === currentPage ? "btn-primary" : "btn-secondary"}
                                onClick={() => setCurrentPage(page)}
                                aria-current={page === currentPage ? "page" : undefined}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </nav>
            ) : null}

            {isModalOpen ? (
                <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={closeModal}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-6 py-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                                    Formulario
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                                    {selectedId ? `Editar ${resource.singularTitle}` : `Nuevo ${resource.singularTitle}`}
                                </h3>
                            </div>
                            <button type="button" onClick={closeModal} className="btn-ghost" aria-label="Cerrar">
                                âœ•
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                            {visibleFields.map((field) => (
                                <label key={field.name} className="block text-sm font-medium text-[var(--foreground)]">
                                    {field.label}
                                    <FieldInput
                                        field={field}
                                        value={form[field.name] ?? ""}
                                        disabled={loading || saving || forbidden || (!canCreate && !selectedId)}
                                        onChange={handleChange}
                                    />
                                </label>
                            ))}

                            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
                            {fieldErrors.length > 0 ? (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                                    <p className="text-xs font-semibold uppercase text-rose-700">Detalle</p>
                                    <ul className="mt-1 space-y-1 text-sm text-rose-700">
                                        {fieldErrors.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-4">
                                <button type="button" onClick={closeModal} className="btn-ghost">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || saving || forbidden || !canSubmit}
                                    className="btn-primary"
                                >
                                    {saving ? "Guardando..." : selectedId ? "Guardar cambios" : `Crear ${resource.singularTitle}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    );
}


