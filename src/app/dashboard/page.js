// Resumen del archivo: src\app\dashboard\page.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

import { redirect } from "next/navigation";
import { getServerSessionInfo } from "@/lib/session";

/**
 * Funcion: DashboardPage.
 * Proposito: encapsular comportamiento concreto para que el flujo principal sea mas facil de leer.
 * Uso: se ejecuta dentro de este modulo como parte de la logica de UI, datos o validaciones.
 */
export default async function DashboardPage() {
	const { isAdmin } = await getServerSessionInfo();

	redirect(isAdmin ? "/admin" : "/reservations/my");
}

