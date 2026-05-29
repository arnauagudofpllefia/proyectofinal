// Resumen del archivo: src\app\admin\reservations\page.js
// Este modulo esta comentado en estilo docente: explica que hace cada parte, por que existe y como encaja en el flujo general.

import AdminCrudPage from "@/app/admin/_components/AdminCrudPage";

/**
 * Funcion: AdminReservationsPage.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function AdminReservationsPage() {
    return <AdminCrudPage resourceKey="reservations" />;
}

