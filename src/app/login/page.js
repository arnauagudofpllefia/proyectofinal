"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";

export default function LoginPage() {
	const router = useRouter();
	const [form, setForm] = useState({ email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

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
			window.location.href = "/dashboard";
		} catch (submitError) {
			setError(submitError.message || "No se pudo iniciar sesion.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="rise-in mx-auto w-full max-w-xl space-y-6">
			<header className="text-center">
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Acceso</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Bienvenido de vuelta</h1>
			</header>

			<form className="energy-ring glass-panel rounded-2xl p-6" onSubmit={handleSubmit}>
				<div className="space-y-4">
					<label className="block text-sm text-slate-300">
						Email
						<input
							name="email"
							type="email"
							value={form.email}
							onChange={handleChange}
							required
							className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70"
							placeholder="tu@email.com"
						/>
					</label>

					<label className="block text-sm text-slate-300">
						Contrasena
						<input
							name="password"
							type="password"
							value={form.password}
							onChange={handleChange}
							required
							className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70"
							placeholder="********"
						/>
					</label>

					{error ? <p className="text-sm text-rose-300">{error}</p> : null}
					{message ? <p className="text-sm text-emerald-300">{message}</p> : null}

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
					>
						{loading ? "Entrando..." : "Iniciar sesion"}
					</button>
				</div>
			</form>
		</section>
	);
}