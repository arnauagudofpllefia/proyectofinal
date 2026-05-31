
import AdminCrudPage from "@/app/admin/_components/AdminCrudPage";

/**
 * Funcion: AdminUsersPage.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function AdminUsersPage() {
    return <AdminCrudPage resourceKey="users" />;
}

