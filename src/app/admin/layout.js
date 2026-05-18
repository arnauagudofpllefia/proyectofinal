import Link from "next/link";

const adminNavItems = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/gyms", label: "Gimnasios" },
    { href: "/admin/machines", label: "Maquinas" },
    { href: "/admin/reservations", label: "Reservas" },
    { href: "/admin/users", label: "Usuarios" },
];

export default function AdminLayout({ children }) {
    return (
        <section className="space-y-6">
            <header className="glass-panel rounded-3xl p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/90">
                    Backoffice
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                    Centro de administracion
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
                    Gestiona gimnasios, maquinas, reservas y usuarios desde un panel separado con operaciones CRUD.
                </p>
            </header>

            <nav className="flex flex-wrap gap-2">
                {adminNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-xl border border-cyan-300/20 bg-slate-950/40 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-400/10"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            {children}
        </section>
    );
}