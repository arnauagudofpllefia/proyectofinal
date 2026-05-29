// Resumen del archivo: src\app\admin\machines\page.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

import AdminCrudPage from "@/app/admin/_components/AdminCrudPage";

/**
 * Funcion: AdminMachinesPage.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function AdminMachinesPage() {
    return <AdminCrudPage resourceKey="machines" />;
}

