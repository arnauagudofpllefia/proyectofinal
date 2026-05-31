
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoutButton from "@/app/_components/LogoutButton";
import NotificationBellButton from "@/app/_components/NotificationBellButton";
import ProfileGlyph from "@/app/_components/ProfileGlyph";
import { getCurrentUser } from "@/lib/api";
import {
    DEFAULT_PROFILE_ICON_ID,
    extractProfileIdentity,
    PROFILE_ICON_UPDATED_EVENT,
    readStoredProfileIcon,
} from "@/lib/profileIcon";

/**
 * Funcion: HeaderNav.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
export default function HeaderNav({ navItems, isAuthenticated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [profileIconId, setProfileIconId] = useState(DEFAULT_PROFILE_ICON_ID);

    useEffect(() => {
        /**
 * Funcion: closeOnDesktop.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
        const closeOnDesktop = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };

        window.addEventListener("resize", closeOnDesktop);

        return () => {
            window.removeEventListener("resize", closeOnDesktop);
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let cancelled = false;

        /**
 * Funcion: syncProfileIcon.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
        const syncProfileIcon = async () => {
            const token = localStorage.getItem("auth_token") || "";
            if (!token) {
                return;
            }

            try {
                const meResponse = await getCurrentUser(token);
                const identity = extractProfileIdentity(meResponse);
                const iconId = readStoredProfileIcon(identity);
                if (!cancelled) {
                    setProfileIconId(iconId);
                }
            } catch {
                if (!cancelled) {
                    setProfileIconId(DEFAULT_PROFILE_ICON_ID);
                }
            }
        };

        /**
 * Funcion: handleProfileIconUpdate.
 * Que hace: encapsula una tarea concreta dentro de este modulo para que el flujo principal sea facil de seguir.
 * Por que existe: evita duplicar logica y permite mantener o ampliar el comportamiento sin romper otras partes.
 */
        const handleProfileIconUpdate = (event) => {
            const nextIconId = event?.detail?.iconId || DEFAULT_PROFILE_ICON_ID;
            setProfileIconId(nextIconId);
        };

        syncProfileIcon();
        window.addEventListener(PROFILE_ICON_UPDATED_EVENT, handleProfileIconUpdate);

        return () => {
            cancelled = true;
            window.removeEventListener(PROFILE_ICON_UPDATED_EVENT, handleProfileIconUpdate);
        };
    }, [isAuthenticated]);

    return (
        <>
            <nav className="hidden md:flex md:flex-wrap md:items-center md:justify-end md:gap-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={
                            item.href === "/profile"
                                ? "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 text-white transition hover:bg-white/15"
                                : "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                        }
                        aria-label={item.href === "/profile" ? "Perfil" : undefined}
                        title={item.href === "/profile" ? "Perfil" : undefined}
                        onClick={() => setIsOpen(false)}
                    >
                        {item.href === "/profile" ? (
                            <ProfileGlyph iconId={profileIconId} className="h-5 w-5" />
                        ) : (
                            item.label
                        )}
                    </Link>
                ))}
                {isAuthenticated ? <NotificationBellButton /> : null}
                {isAuthenticated ? <LogoutButton /> : null}
            </nav>

            <div className="flex items-center gap-2 md:hidden">
                {isAuthenticated ? <NotificationBellButton /> : null}

                <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black bg-black text-white"
                    aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
                    aria-expanded={isOpen}
                    aria-controls="mobile-main-menu"
                    onClick={() => setIsOpen((current) => !current)}
                >
                    {isOpen ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                    )}
                </button>
            </div>

            <div
                id="mobile-main-menu"
                aria-hidden={!isOpen}
                className={`absolute inset-x-4 top-full z-30 rounded-b-2xl border border-emerald-800 border-t-0 bg-emerald-700 p-3 shadow-[var(--shadow-lg)] transition-all duration-200 ease-out md:hidden ${
                    isOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0 pointer-events-none"
                }`}
            >
                <nav className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.href === "/profile" ? (
                                <span className="inline-flex items-center gap-2">
                                    <ProfileGlyph iconId={profileIconId} className="h-4.5 w-4.5" />
                                    Perfil
                                </span>
                            ) : (
                                item.label
                            )}
                        </Link>
                    ))}
                </nav>

                {isAuthenticated ? (
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/25 pt-3">
                        <LogoutButton />
                    </div>
                ) : null}
            </div>
        </>
    );
}

