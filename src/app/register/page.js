"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGyms, registerRequest } from "@/lib/api";

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		password_confirmation: "",
		gymId: "",
	});
	const [gyms, setGyms] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState([]);

	useEffect(() => {
		const timer = setTimeout(async () => {
			try {
				const gymsData = await getGyms("");
				const list = Array.isArray(gymsData) ? gymsData : (gymsData?.data ?? []);
				setGyms(
					list.map((g) => ({
						id: String(g?.id ?? ""),
						name: g?.nombre ?? g?.name ?? `Gimnasio ${g?.id}`,
					}))
				);
			} catch {
				setGyms([]);
			}
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError("");
		setMessage("");
		setFieldErrors([]);

		if (form.password.length < 8) {
			setError("La contrasena debe tener al menos 8 caracteres.");
			setFieldErrors(["password: minimo 8 caracteres"]);
			setLoading(false);
			return;
		}

		if (form.password !== form.password_confirmation) {
			setError("Las contrasenas no coinciden.");
			setFieldErrors(["password_confirmation: no coincide con password"]);
			setLoading(false);
			return;
		}

		if (!form.gymId) {
			setError("Selecciona un gimnasio para continuar.");
			setLoading(false);
			return;
		}

		try {
			await registerRequest(form);
			setMessage("Cuenta creada correctamente.");
			router.push("/login");
		} catch (submitError) {
			setError(submitError.message || "No se pudo crear la cuenta.");

			const details = submitError?.details;
			if (details && typeof details === "object") {
				const list = Object.entries(details).flatMap(([field, messages]) => {
					if (!Array.isArray(messages)) {
						return [`${field}: ${String(messages)}`];
					}

					return messages.map((msg) => `${field}: ${msg}`);
				});
				setFieldErrors(list);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="rise-in mx-auto w-full max-w-md space-y-6">
			<header className="text-center">
				<h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Crea tu cuenta</h1>
			</header>

			<form className="surface-card p-6" onSubmit={handleSubmit}>
				<div className="space-y-4">
					<label className="block text-sm font-medium text-[var(--foreground)]">
						Nombre
						<input name="name" type="text" value={form.name} onChange={handleChange} required className="field-input mt-1" placeholder="Tu nombre" />
					</label>

					<label className="block text-sm font-medium text-[var(--foreground)]">
						Email
						<input name="email" type="email" value={form.email} onChange={handleChange} required className="field-input mt-1" placeholder="tu@email.com" />
					</label>

					<label className="block text-sm font-medium text-[var(--foreground)]">
						Gimnasio
						<select name="gymId" value={form.gymId} onChange={handleChange} required className="field-input mt-1">
							<option value="">Selecciona tu gimnasio</option>
							{gyms.map((gym) => (
								<option key={gym.id} value={gym.id}>{gym.name}</option>
							))}
						</select>
					</label>

					<label className="block text-sm font-medium text-[var(--foreground)]">
						Contrasena
						<input name="password" type="password" value={form.password} onChange={handleChange} minLength={8} required className="field-input mt-1" placeholder="••••••••" />
					</label>

					<label className="block text-sm font-medium text-[var(--foreground)]">
						Repite contrasena
						<input name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} minLength={8} required className="field-input mt-1" placeholder="••••••••" />
					</label>

					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					{fieldErrors.length > 0 ? (
						<div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
							<p className="text-xs font-semibold uppercase text-rose-700">Detalle</p>
							<ul className="mt-1 space-y-1 text-sm text-rose-700">
								{fieldErrors.map((item) => (<li key={item}>{item}</li>))}
							</ul>
						</div>
					) : null}
					{message ? <p className="text-sm text-emerald-700">{message}</p> : null}

					<button type="submit" disabled={loading} className="btn-primary w-full">
						{loading ? "Creando..." : "Crear cuenta"}
					</button>
				</div>
			</form>
		</section>
	);
}
