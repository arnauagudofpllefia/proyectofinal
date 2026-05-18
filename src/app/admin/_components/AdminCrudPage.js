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
    const baseClassName =
        "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70";

    if (field.type === "select") {
        return (
            <select
                name={field.name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={baseClassName}
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
            disabled={disabled}
            placeholder={field.placeholder}
            className={baseClassName}
        />
    );
}

async function fetchResourceItems(resourceKey, token) {
    const response = await listAdminResource(resourceKey, token);
    return normalizeResourceList(resourceKey, response);
}

export default function AdminCrudPage({ resourceKey }) {
    const resource = getAdminResource(resourceKey);
    const capabilities = resource.capabilities ?? {};
    const canCreate = Boolean(capabilities.create);
    const canEdit = Boolean(capabilities.edit);
    const canDelete = Boolean(capabilities.delete);
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

    const mode = selectedId ? "edit" : "create";
    const canSubmit = selectedId ? canEdit : canCreate;
    const visibleFields = getVisibleFields(resourceKey, mode);
    const headingLabel = canCreate || canEdit ? `Gestion de ${resource.title.toLowerCase()}` : `Consulta de ${resource.title.toLowerCase()}`;

    const loadItems = async () => {
        const token = localStorage.getItem("auth_token") || "";
        setLoading(true);
        setErrorMessage("");

        try {
            const normalized = await fetchResourceItems(resourceKey, token);
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
        const timer = setTimeout(() => {
            (async () => {
                const token = localStorage.getItem("auth_token") || "";
                setLoading(true);
                setErrorMessage("");

                try {
                    const normalized = await fetchResourceItems(resourceKey, token);
                    setItems(normalized);
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
    }, [resource.title, resourceKey]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setSelectedId(null);
        setForm(createEmptyForm(resourceKey));
        setFieldErrors([]);
        setSuccessMessage("");
    };

    const handleEdit = (item) => {
        if (!canEdit) {
            return;
        }

        setSelectedId(item.id);
        setForm(mapItemToForm(resourceKey, item));
        setFieldErrors([]);
        setErrorMessage("");
        setSuccessMessage("");
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

            const normalized = normalizeResourceItem(resourceKey, response);
            const refreshedItems = await loadItems();

            if (selectedId) {
                const refreshedItem = refreshedItems.find((item) => item.id === selectedId) || normalized;
                if (refreshedItem) {
                    setSelectedId(refreshedItem.id);
                    setForm(mapItemToForm(resourceKey, refreshedItem));
                }
            } else {
                resetForm();
            }

            setSuccessMessage(
                selectedId
                    ? `${resource.singularTitle} actualizado correctamente.`
                    : `${resource.singularTitle} creado correctamente.`
            );
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
        if (!canDelete) {
            return;
        }

        const confirmed = window.confirm(`Se eliminara ${resource.singularTitle} ${resource.getItemTitle(item)}.`);

        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem("auth_token") || "";
        setDeletingId(item.id);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await deleteAdminResource(resourceKey, item.id, token);
            await loadItems();

            if (selectedId === item.id) {
                resetForm();
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

    return (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-4">
                <header className="glass-panel rounded-2xl p-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">{resource.title}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{headingLabel}</h2>
                    <p className="mt-2 text-sm text-slate-300">{resource.description}</p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {loading ? (
                        <article className="glass-panel rounded-2xl p-5 text-sm text-slate-300">
                            Cargando {resource.title.toLowerCase()}...
                        </article>
                    ) : null}

                    {!loading && items.length === 0 ? (
                        <article className="glass-panel rounded-2xl p-5 text-sm text-slate-300">
                            {resource.emptyState}
                        </article>
                    ) : null}

                    {items.map((item) => (
                        <article key={item.id} className="glass-panel rounded-2xl p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">ID {item.id}</p>
                                    <h3 className="mt-2 text-lg font-semibold text-white">{resource.getItemTitle(item)}</h3>
                                    <p className="mt-2 text-sm text-slate-300">{resource.getItemMeta(item) || "Sin detalle adicional"}</p>
                                </div>
                                <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                    {resource.singularTitle}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {canEdit ? (
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        disabled={saving || forbidden}
                                        className="rounded-lg border border-cyan-300/35 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Editar
                                    </button>
                                ) : null}
                                {canDelete ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item)}
                                        disabled={saving || forbidden || deletingId === item.id}
                                        className="rounded-lg border border-rose-400/35 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                                    </button>
                                ) : null}
                                {!canEdit && !canDelete ? (
                                    <span className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300">
                                        Solo lectura
                                    </span>
                                ) : null}
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {canCreate || canEdit ? (
                <form className="glass-panel rounded-2xl p-6 space-y-4 xl:sticky xl:top-24 xl:h-fit" onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Formulario</p>
                            <h2 className="mt-2 text-2xl font-semibold text-white">
                                {selectedId ? `Editar ${resource.singularTitle}` : `Nuevo ${resource.singularTitle}`}
                            </h2>
                        </div>
                        {canCreate ? (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                            >
                                Nuevo
                            </button>
                        ) : null}
                    </div>

                    {!canCreate && !selectedId ? (
                        <p className="text-sm text-slate-300">Selecciona un elemento de la lista para editarlo.</p>
                    ) : null}

                    {visibleFields.map((field) => (
                        <label key={field.name} className="block text-sm text-slate-300">
                            {field.label}
                            <FieldInput
                                field={field}
                                value={form[field.name] ?? ""}
                                disabled={loading || saving || forbidden || (!canCreate && !selectedId)}
                                onChange={handleChange}
                            />
                        </label>
                    ))}

                    {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
                    {successMessage ? <p className="text-sm text-emerald-300">{successMessage}</p> : null}
                    {fieldErrors.length > 0 ? (
                        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-200">Detalle</p>
                            <ul className="mt-2 space-y-1 text-sm text-rose-100">
                                {fieldErrors.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={loading || saving || forbidden || !canSubmit}
                        className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Guardando..." : selectedId ? "Guardar cambios" : `Crear ${resource.singularTitle}`}
                    </button>
                </form>
            ) : (
                <aside className="glass-panel rounded-2xl p-6 space-y-3 xl:sticky xl:top-24 xl:h-fit">
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Panel lateral</p>
                    <h2 className="text-2xl font-semibold text-white">Solo lectura</h2>
                    <p className="text-sm text-slate-300">
                        Las rutas actuales solo permiten consultar este recurso desde administracion.
                    </p>
                    {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
                </aside>
            )}
        </section>
    );
}