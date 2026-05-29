// Resumen del archivo: src\app\login\page.js
// Este modulo esta comentado en estilo docente: explica que hace cada parte, por que existe y como encaja en el flujo general.

"use client";

import { useState } from "react";
import { loginRequest } from "@/lib/api";

/**
 * Funcion: LoginPage.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function LoginPage() {
	const [form, setForm] = useState({ email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	/**
 * Funcion: handleChange.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	/**
 * Funcion: handleSubmit.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError("");
		setMessage("");

		try {
			const response = await loginRequest(form);
			const token = response?.token || response?.access_token || response?.data?.token;

			if (!token) {
				throw new Error("La API de login no devolvio token.");
			}

			localStorage.setItem("auth_token", token);
			document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax`;

			setMessage("Sesion iniciada correctamente.");
			window.location.href = "/";
		} catch (submitError) {
			setError(submitError.message || "No se pudo iniciar sesion.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="rise-in mx-auto w-full max-w-md space-y-6">
			<header className="text-center">
				<h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">Bienvenido de vuelta</h1>
			</header>

			<form className="surface-card p-6" onSubmit={handleSubmit}>
				<div className="space-y-4">
					<label className="block text-sm font-medium text-[var(--foreground)]">
						Email
						<input
							name="email"
							type="email"
							value={form.email}
							onChange={handleChange}
							required
							className="field-input mt-1"
							placeholder="tu@email.com"
						/>
					</label>

					<label className="block text-sm font-medium text-[var(--foreground)]">
						Contrasena
						<input
							name="password"
							type="password"
							value={form.password}
							onChange={handleChange}
							required
							className="field-input mt-1"
							placeholder="********"
						/>
					</label>

					{error ? <p className="text-sm text-rose-600">{error}</p> : null}
					{message ? <p className="text-sm text-emerald-700">{message}</p> : null}

					<button type="submit" disabled={loading} className="btn-primary w-full">
						{loading ? "Entrando..." : "Iniciar sesion"}
					</button>
				</div>
			</form>
		</section>
	);
}

