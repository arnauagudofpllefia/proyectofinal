import Link from "next/link";

export default function Home() {
  return (
    <section className="rise-in space-y-8">
      <div className="energy-ring glass-panel rounded-3xl p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/90">
          Sistema inteligente de reservas
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Control moderno de maquinas, aforo y disponibilidad en tiempo real.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
          Una interfaz limpia, rapida y tecnologica para gestionar operaciones del gym con una experiencia premium.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/machines"
            className="rounded-xl border border-cyan-300/35 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
          >
            Ver maquinas
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tecnologia</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Estado en vivo</h2>
          <p className="mt-2 text-sm text-slate-300">
            Visualiza ocupacion, horarios y disponibilidad de recursos desde un solo panel.
          </p>
        </article>
        <article className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Eficiencia</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Reservas rapidas</h2>
          <p className="mt-2 text-sm text-slate-300">
            Flujos optimizados para crear y gestionar reservas en segundos.
          </p>
        </article>
        <article className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Experiencia</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Look premium</h2>
          <p className="mt-2 text-sm text-slate-300">
            Estetica minimal y energetica pensada para apps modernas de alto rendimiento.
          </p>
        </article>
      </div>
    </section>
  );
}
