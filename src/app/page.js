import Link from "next/link";
import { getGyms, getMachines, getMyReservations } from "@/lib/api";
import { getServerSessionInfo } from "@/lib/session";
import { filterItemsByGym, getGymIdFromUser, getGymNameFromUser, normalizeGymId } from "@/lib/gym";

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

function getMachineImage(machine) {
  return (
    machine?.image_url ||
    machine?.imagen_url ||
    machine?.imagen ||
    machine?.image ||
    machine?.foto ||
    ""
  );
}

function getMachineStatus(machine) {
  return String(machine?.status ?? machine?.estado ?? "Disponible");
}

export default async function Home() {
  const { token, isAdmin, isAuthenticated, user } = await getServerSessionInfo();

  if (!isAuthenticated) {
    return (
      <section className="rise-in surface-card mx-auto max-w-3xl p-10 text-center">
        <p className="badge badge-primary mb-4">GymFlow</p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
          Gestion minimalista de tu gimnasio
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--muted)] sm:text-base">
          Reserva maquinas, controla disponibilidad y administra tu gym con una interfaz limpia y rapida.
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
    <section className="rise-in space-y-8">
      <div className="surface-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          {isAdmin ? "Panel global" : "Tu gimnasio"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
          {isAdmin
            ? "Vista general de GymFlow"
            : resolvedGymName || "Aun no tienes gimnasio asignado"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
          {isAdmin
            ? "Consulta el estado del catalogo de maquinas y gestiona todo desde el panel admin."
            : resolvedGymName
              ? "Estas son las maquinas disponibles en tu gimnasio actualmente."
              : "Selecciona tu gimnasio desde tu perfil para ver el listado de maquinas."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Maquinas" value={gymMachines.length} />
          <Stat label="Disponibles" value={availableCount} accent="success" />
          <Stat label="Mis reservas" value={myReservationsCount} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
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
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Maquinas
            </p>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {isAdmin ? "Catalogo completo" : "En tu gimnasio"}
            </h2>
          </div>
          <Link href="/machines" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-strong)]">
            Ver todas
          </Link>
        </div>

        {gymMachines.length === 0 ? (
          <div className="surface-card p-6 text-sm text-[var(--muted)]">
            No hay maquinas disponibles{!isAdmin && resolvedGymName ? ` en ${resolvedGymName}` : ""}.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gymMachines.slice(0, 9).map((machine, index) => {
              const status = getMachineStatus(machine);
              const isAvailable = /disponible|available/i.test(status);
              const name = machine?.name ?? machine?.nombre ?? `Maquina ${index + 1}`;
              const zone = machine?.zone ?? machine?.zona ?? "";
              const image = getMachineImage(machine);
              const id = machine?.id ?? machine?.uuid ?? index;
              return (
                <Link
                  key={id}
                  href={`/machines/${id}`}
                  className="surface-card surface-card-hover overflow-hidden"
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={name}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-[#eef2ff] text-[var(--primary)]">
                      <span className="text-2xl font-semibold">{String(name).charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{name}</h3>
                      <span className={`badge ${isAvailable ? "badge-success" : "badge-muted"}`}>
                        {status}
                      </span>
                    </div>
                    {zone ? <p className="mt-1 text-xs text-[var(--muted)]">{zone}</p> : null}
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

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${accent === "success" ? "text-[var(--success)]" : "text-[var(--primary-strong)]"
          }`}
      >
        {value ?? "--"}
      </p>
    </div>
  );
}
