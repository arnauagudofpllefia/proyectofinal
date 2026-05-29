// Resumen del archivo: src\app\admin\reservations\page.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

import AdminCrudPage from "@/app/admin/_components/AdminCrudPage";

/**
 * Funcion: AdminReservationsPage.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function AdminReservationsPage() {
    return <AdminCrudPage resourceKey="reservations" />;
}

