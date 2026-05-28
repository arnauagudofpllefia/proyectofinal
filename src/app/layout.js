import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSessionGuard from "@/app/_components/AuthSessionGuard";
import ReservationNotificationScheduler from "@/app/_components/ReservationNotificationScheduler";
import HeaderNav from "@/app/_components/HeaderNav";
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
  title: "GymNau",
  description: "Gestion minimalista de maquinas y reservas",
  icons: {
    icon: "/logoGymNau.png",
  },
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
        <ReservationNotificationScheduler />

        <header className="sticky top-0 z-20 border-b border-emerald-800 bg-emerald-700/95 backdrop-blur">
          <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-3 text-base font-semibold text-white">
              <img
                src="/logoGymNau.png"
                alt="GymNau"
                className="h-9 w-9 shrink-0 object-contain"
              />
              <span>GymNau</span>
            </Link>
            <HeaderNav navItems={navItems} isAuthenticated={isAuthenticated} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
