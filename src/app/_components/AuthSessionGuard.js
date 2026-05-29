// Resumen del archivo: src\app\_components\AuthSessionGuard.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

/**
 * Funcion: clearClientSession.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function clearClientSession() {
  localStorage.removeItem("auth_token");
  document.cookie = "auth_token=; path=/; max-age=0; samesite=lax";
}

/**
 * Funcion: AuthSessionGuard.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function AuthSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.has(pathname);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      const token = localStorage.getItem("auth_token") || "";

      if (!token) {
        clearClientSession();

        if (!isPublicRoute) {
          router.replace("/login");
          router.refresh();
        }

        return;
      }

      try {
        await getCurrentUser(token);

        if (isPublicRoute) {
          router.replace("/");
          router.refresh();
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (error?.status === 401 || error?.status === 403) {
          clearClientSession();

          if (!isPublicRoute) {
            router.replace("/login");
            router.refresh();
          }
        }
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [pathname, router]);

  return null;
}


