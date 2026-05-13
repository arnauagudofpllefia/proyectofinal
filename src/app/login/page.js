export default function LoginPage() {
	return (
		<section className="rise-in mx-auto w-full max-w-xl space-y-6">
			<header className="text-center">
				<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Acceso</p>
				<h1 className="mt-2 text-3xl font-semibold text-white">Bienvenido de vuelta</h1>
			</header>

			<form className="energy-ring glass-panel rounded-2xl p-6">
				<div className="space-y-4">
					<label className="block text-sm text-slate-300">
						Email
						<input
							type="email"
							className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70"
							placeholder="tu@email.com"
						/>
					</label>

					<label className="block text-sm text-slate-300">
						Contrasena
						<input
							type="password"
							className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/70"
							placeholder="********"
						/>
					</label>

					<button
						type="submit"
						className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
					>
						Iniciar sesion
					</button>
				</div>
			</form>
		</section>
	);
}