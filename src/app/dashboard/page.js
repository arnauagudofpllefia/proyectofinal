
import { redirect } from "next/navigation";
import { getServerSessionInfo } from "@/lib/session";

/**
 * Funcion: DashboardPage.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default async function DashboardPage() {
	const { isAdmin } = await getServerSessionInfo();

	redirect(isAdmin ? "/admin" : "/reservations/my");
}

