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
  description: "Gestion minimalista de maquinas y reservas",
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
      <body className="min-h-full flex flex-col">
        <AuthSessionGuard />

        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-base font-semibold text-[var(--primary-strong)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                G
              </span>
              GymFlow
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? <LogoutButton /> : null}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
