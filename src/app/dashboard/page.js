import { redirect } from "next/navigation";
import { getServerSessionInfo } from "@/lib/session";

export default async function DashboardPage() {
	const { isAdmin } = await getServerSessionInfo();

	redirect(isAdmin ? "/admin" : "/reservations/my");
}