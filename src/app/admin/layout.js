// Resumen del archivo: src\app\admin\layout.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

import AdminGymScopePicker from "@/app/admin/_components/AdminGymScopePicker";
import AdminScopedNav from "@/app/admin/_components/AdminScopedNav";

/**
 * Funcion: AdminLayout.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

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

