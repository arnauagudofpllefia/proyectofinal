import AdminGymScopePicker from "@/app/admin/_components/AdminGymScopePicker";
import AdminScopedNav from "@/app/admin/_components/AdminScopedNav";

export default function AdminLayout({ children }) {
    return (
        <section className="space-y-6">
            <header className="surface-card p-6 sm:p-8">
                <p className="badge badge-primary mb-2">Backoffice</p>
                <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">Centro de administracion</h1>
                <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
                    Gestiona gimnasios, maquinas, reservas y usuarios.
                </p>
            </header>

            <AdminGymScopePicker />
            <AdminScopedNav />

            {children}
        </section>
    );
}