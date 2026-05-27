import AdminGymScopePicker from "@/app/admin/_components/AdminGymScopePicker";
import AdminScopedNav from "@/app/admin/_components/AdminScopedNav";

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

            <AdminGymScopePicker />
            <AdminScopedNav />

            {children}
        </section>
    );
}