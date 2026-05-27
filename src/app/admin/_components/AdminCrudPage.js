"use client";

import { useEffect, useState } from "react";
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

function isGymScopedResource(resourceKey) {
    return resourceKey === "machines" || resourceKey === "reservations" || resourceKey === "users";
}

async function fetchResourceItems(resourceKey, token, gymScopeId) {
    const response = await listAdminResource(resourceKey, token, { gymId: gymScopeId });
    const normalized = normalizeResourceList(resourceKey, response);

    if (!isGymScopedResource(resourceKey) || !gymScopeId) {
        return normalized;
    }

    return filterItemsByGym(normalized, gymScopeId);
}

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

    const needsGymSelection = isGymScopedResource(resourceKey) && !selectedGymScopeId;

    const mode = selectedId ? "edit" : "create";
    const canSubmit = selectedId ? canEdit : canCreate;
    const baseVisibleFields = getVisibleFields(resourceKey, mode);
    const visibleFields = baseVisibleFields.map((field) => {
        if (isGymScopedResource(resourceKey) && field.name === "gymId") {
            return { ...field, options: gymOptions, disabled: Boolean(selectedGymScopeId) };
        }
        if (resourceKey === "reservations" && field.name === "userId") {
            return { ...field, options: userOptions };
        }
        if (resourceKey === "reservations" && field.name === "machineId") {
            return { ...field, options: machineOptions };
        }
        return field;
    });

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

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFieldErrors([]);
        setErrorMessage("");
    };

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

    const handleEdit = (item) => {
        if (!canEdit) return;
        setSelectedId(item.id);
        setForm(mapItemToForm(resourceKey, item));
        setFieldErrors([]);
        setErrorMessage("");
        setSuccessMessage("");
        setIsModalOpen(true);
    };

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
            <header className="surface-card flex flex-wrap items-start justify-between gap-4 p-6">
                <div>
                    <p className="badge badge-primary mb-2">{resource.title}</p>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                        Gestion de {resource.title.toLowerCase()}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">{resource.description}</p>
                </div>
                {canCreate ? (
                    <button type="button" onClick={openCreateModal} className="btn-primary" disabled={forbidden}>
                        + Nuevo {resource.singularTitle}
                    </button>
                ) : null}
            </header>

            {errorMessage && !isModalOpen ? (
                <div className="surface-card border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
            ) : null}
            {successMessage ? (
                <div className="surface-card border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {successMessage}
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <article className="surface-card p-5 text-sm text-[var(--muted)]">
                        Cargando {resource.title.toLowerCase()}...
                    </article>
                ) : null}

                {!loading && items.length === 0 ? (
                    <article className="surface-card p-5 text-sm text-[var(--muted)]">{resource.emptyState}</article>
                ) : null}

                {items.map((item) => {
                    const isAvailable = resourceKey === "machines"
                        && /disponible|available/i.test(String(item.status || ""));
                    return (
                        <article key={item.id} className="surface-card overflow-hidden">
                            {resourceKey === "machines" && item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.imageUrl}
                                    alt={resource.getItemTitle(item)}
                                    className="h-36 w-full object-cover"
                                />
                            ) : null}
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">ID {item.id}</p>
                                        <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
                                            {resource.getItemTitle(item)}
                                        </h3>
                                        <p className="mt-1 text-sm text-[var(--muted)]">
                                            {resource.getItemMeta(item) || "Sin detalle adicional"}
                                        </p>
                                    </div>
                                    {resourceKey === "machines" ? (
                                        <span className={`badge ${isAvailable ? "badge-success" : "badge-muted"}`}>
                                            {item.status || "—"}
                                        </span>
                                    ) : (
                                        <span className="badge badge-primary">{resource.singularTitle}</span>
                                    )}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {canEdit ? (
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(item)}
                                            disabled={saving || forbidden}
                                            className="btn-secondary"
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
                                ✕
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
