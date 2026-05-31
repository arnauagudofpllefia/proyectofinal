
import AdminGymScopePicker from "@/app/admin/_components/AdminGymScopePicker";
import AdminScopedNav from "@/app/admin/_components/AdminScopedNav";

/**
 * Funcion: AdminLayout.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function AdminLayout({ children }) {
    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">Centro de administracion</h1>
            </header>

            <AdminGymScopePicker />
            <AdminScopedNav />

            {children}
        </section>
    );
}

