"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest } from "@/lib/api";

export default function RegisterPage() {
	const router = useRouter();
	const [form, setForm] = useState({ name: "", email: "", password: "" });
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
			await registerRequest(form);
			setMessage("Cuenta creada correctamente.");
			router.push("/login");
		} catch (submitError) {
			setError(submitError.message || "No se pudo crear la cuenta.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="rise-in mx-auto w-full max-w-xl space-y-6">
			<header className="text-center">
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Registro</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Crea tu cuenta</h1>
			</header>

			<form className="energy-ring glass-panel rounded-2xl p-6" onSubmit={handleSubmit}>
				<div className="space-y-4">
					<label className="block text-sm text-slate-300">
						Nombre
						<input
							name="name"
							type="text"
							value={form.name}
							onChange={handleChange}
							required
							className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70"
							placeholder="Tu nombre"
						/>
					</label>

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
						className="w-full rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
					>
						{loading ? "Creando..." : "Crear cuenta"}
					</button>
				</div>
			</form>
		</section>
	);
}
