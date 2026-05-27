import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionGuard from "@/app/_components/AuthSessionGuard";
import LogoutButton from "@/app/_components/LogoutButton";
import { getServerSessionInfo } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GymFlow",
  description: "Gestion premium de maquinas y reservas",
};

export default async function RootLayout({ children }) {
  const { isAuthenticated, isAdmin } = await getServerSessionInfo();
  const navItems = isAuthenticated
    ? [
      { href: "/", label: "Inicio" },
      ...(isAdmin ? [] : [{ href: "/dashboard", label: "Mis reservas" }]),
      ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      { href: "/machines", label: "Maquinas" },
      { href: "/profile", label: "Perfil" },
    ]
    : [
      { href: "/login", label: "Login" },
      { href: "/register", label: "Registro" },
    ];

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-100">
        <AuthSessionGuard />
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />
        </div>

        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/65 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="energy-ring glass-panel rounded-xl px-4 py-2 text-sm font-semibold tracking-wide text-cyan-200">
              GymFlow
            </div>
            <nav className="flex flex-wrap items-center justify-end gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? <LogoutButton /> : null}
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
