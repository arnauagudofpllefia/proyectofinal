// Resumen del archivo: src\app\page.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

import Link from "next/link";
import { getGyms, getMachines, getMyReservations } from "@/lib/api";
import { getServerSessionInfo } from "@/lib/session";
import { filterItemsByGym, getGymIdFromUser, getGymNameFromUser, normalizeGymId } from "@/lib/gym";
import { resolvePublicImageUrl } from "@/lib/image";

/**
 * Funcion: extractList.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function extractList(result) {
  if (!result || result.status !== "fulfilled") return [];
  const data = result.value?.data ?? result.value;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const firstArray = Object.values(data).find((value) => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
  }
  return [];
}

/**
 * Funcion: getMachineImage.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function getMachineImage(machine) {
  return resolvePublicImageUrl(
    machine?.image_url ||
    machine?.imagen_url ||
    machine?.imagen ||
    machine?.image ||
    machine?.foto ||
    ""
  );
}

/**
 * Funcion: getMachineStatus.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function getMachineStatus(machine) {
  return String(machine?.status ?? machine?.estado ?? "Disponible");
}

/**
 * Funcion: Home.
 * Proposito: encapsular comportamiento concreto para que el flujo principal sea mas facil de leer.
 * Uso: se ejecuta dentro de este modulo como parte de la logica de UI, datos o validaciones.
 */
export default async function Home() {
  const { token, isAdmin, isAuthenticated, user } = await getServerSessionInfo();

  if (!isAuthenticated) {
    return (
      <section className="rise-in hero-gradient mx-auto max-w-3xl p-10 text-center sm:p-14">
        <p className="eyebrow">GymNau</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-(--foreground) sm:text-5xl">
          Gestiona tu gimnasio con estilo
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-(--muted) sm:text-base">
          Reserva maquinas, controla la disponibilidad y administra todo desde una interfaz limpia, rapida y elegante.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="btn-primary">Iniciar sesion</Link>
          <Link href="/register" className="btn-secondary">Crear cuenta</Link>
        </div>
      </section>
    );
  }

  const userGymId = getGymIdFromUser(user);
  const userGymName = getGymNameFromUser(user);

  const [machinesResult, myReservationsResult, gymsResult] = await Promise.allSettled([
    getMachines(token),
    getMyReservations(token),
    !userGymName && userGymId ? getGyms(token) : Promise.resolve(null),
  ]);

  const allMachines = extractList(machinesResult);
  const gyms = extractList(gymsResult);

  let resolvedGymName = userGymName;
  if (!resolvedGymName && userGymId) {
    const match = gyms.find((g) => normalizeGymId(g?.id) === userGymId);
    resolvedGymName = match?.name ?? match?.nombre ?? "";
  }

  const gymMachines = isAdmin ? allMachines : filterItemsByGym(allMachines, userGymId);
  const availableCount = gymMachines.filter((m) => /disponible|available/i.test(getMachineStatus(m))).length;
  const myReservations = extractList(myReservationsResult);
  const myReservationsCount = filterItemsByGym(myReservations, isAdmin ? "" : userGymId).length;

  return (
    <section className="rise-in space-y-10">
      <div className="hero-gradient p-6 sm:p-10">
        <p className="eyebrow">
          {isAdmin ? "Panel global" : "Tu gimnasio"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--foreground) sm:text-4xl">
          {isAdmin
            ? "Vista general de GymNau"
            : resolvedGymName || "Aun no tienes gimnasio asignado"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-(--muted) sm:text-base">
          {isAdmin
            ? "Consulta el estado del catalogo y gestiona todo desde el panel admin."
            : resolvedGymName
              ? "Estas son las maquinas disponibles en tu gimnasio actualmente."
              : "Selecciona tu gimnasio desde tu perfil para ver el listado de maquinas."}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Stat label="Maquinas" value={gymMachines.length} />
          <Stat label="Disponibles" value={availableCount} accent="success" />
          <Stat label="Mis reservas" value={myReservationsCount} />
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          {isAdmin ? (
            <Link href="/admin" className="btn-primary">Panel admin</Link>
          ) : (
            <Link href="/reservations/my" className="btn-primary">Mis reservas</Link>
          )}
          <Link href="/machines" className="btn-secondary">Ver maquinas</Link>
          <Link href="/profile" className="btn-ghost">Perfil</Link>
        </div>
      </div>

      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Maquinas</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-(--foreground) sm:text-2xl">
              {isAdmin ? "Catalogo completo" : "En tu gimnasio"}
            </h2>
          </div>
          <Link href="/machines" className="text-sm font-medium text-(--foreground) underline-offset-4 hover:underline">
            Ver todas â†’
          </Link>
        </div>

        {gymMachines.length === 0 ? (
          <div className="surface-card p-6 text-sm text-(--muted)">
            No hay maquinas disponibles{!isAdmin && resolvedGymName ? ` en ${resolvedGymName}` : ""}.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gymMachines.slice(0, 9).map((machine, index) => {
              const status = getMachineStatus(machine);
              const isAvailable = /disponible|available/i.test(status);
              const name = machine?.name ?? machine?.nombre ?? `Maquina ${index + 1}`;
              const zone = machine?.zone ?? machine?.zona ?? "";
              const image = getMachineImage(machine);
              const id = machine?.id ?? machine?.uuid ?? index;
              const initials = String(name || "?").trim().charAt(0).toUpperCase();
              return (
                <Link
                  key={id}
                  href={`/machines/${id}`}
                  className="surface-card surface-card-hover flex h-full flex-col overflow-hidden"
                >
                  <div className="card-image relative aspect-[4/3] w-full">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={name} />
                    ) : (
                      <div className="image-placeholder absolute inset-0">{initials}</div>
                    )}
                    <span
                      className={`badge badge-floating absolute right-3 top-3 z-10 ${isAvailable ? "badge-success" : "badge-muted"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-(--accent-strong)" : "bg-(--muted)"
                          }`}
                      />
                      {status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {zone ? <p className="eyebrow">{zone}</p> : null}
                    <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-(--foreground)">{name}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

/**
 * Funcion: Stat.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
function Stat({ label, value, accent }) {
  return (
    <div className="stat-tile">
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${accent === "success" ? "text-(--accent-strong)" : "text-(--foreground)"
          }`}
      >
        {value ?? "--"}
      </p>
    </div>
  );
}


