import AdminGymScopePicker from "@/app/admin/_components/AdminGymScopePicker";
import AdminScopedNav from "@/app/admin/_components/AdminScopedNav";

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