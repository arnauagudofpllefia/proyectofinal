import Link from "next/link";
import { getMachines, getMyReservations, getReservations } from "@/lib/api";
import { getServerSessionInfo } from "@/lib/session";
import { filterItemsByGym, getGymIdFromUser } from "@/lib/gym";

export default async function Home() {
  const { token, isAdmin, user } = await getServerSessionInfo();
  const userGymId = getGymIdFromUser(user);

  const [machinesResult, reservationsResult, myReservationsResult] = await Promise.allSettled([
    getMachines(token),
    isAdmin ? getReservations(token) : Promise.resolve(null),
    getMyReservations(token),
  ]);

  const machinesCount = countItemsByGym(machinesResult, isAdmin ? "" : userGymId);
  const reservationsCount = isAdmin ? countItems(reservationsResult) : null;
  const myReservationsCount = countItemsByGym(myReservationsResult, isAdmin ? "" : userGymId);

  const summaryCards = [
    {
      label: "Maquinas",
      value: machinesCount,
      detail: "Equipos disponibles en el sistema.",
      href: "/machines",
    },
    {
      label: "Mis reservas",
      value: myReservationsCount,
      detail: "Tus reservas activas y programadas.",
      href: "/reservations/my",
    },
  ];

  return (
    <section className="rise-in space-y-8">
      <div className="energy-ring glass-panel rounded-3xl p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/90">
          Sistema inteligente de reservas
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Control moderno de maquinas, aforo y disponibilidad en tiempo real.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
          Una interfaz limpia, rapida y tecnologica para gestionar operaciones del gym con una experiencia premium.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Ir al panel admin
            </Link>
          ) : null}
          <Link
            href="/machines"
            className="rounded-xl border border-cyan-300/35 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
          >
            Ver maquinas
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Resumen</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Estado rapido de tu cuenta</h2>
          </div>
          <p className="text-sm text-slate-300">Los valores se actualizan segun tu sesion activa.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => {
            const content = (
              <article className="glass-panel rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/35">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                <p className="mt-3 text-4xl font-semibold text-cyan-200">
                  {card.value ?? "--"}
                </p>
                <p className="mt-3 text-sm text-slate-300">{card.detail}</p>
              </article>
            );

            return card.href ? (
              <Link key={card.label} href={card.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={card.label}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function countItems(result) {
  if (!result || result.status !== "fulfilled") {
    return null;
  }

  const data = result.value?.data ?? result.value;
  return Array.isArray(data) ? data.length : null;
}

function countItemsByGym(result, gymId) {
  if (!result || result.status !== "fulfilled") {
    return null;
  }

  const data = result.value?.data ?? result.value;
  if (!Array.isArray(data)) {
    return null;
  }

  return filterItemsByGym(data, gymId).length;
}
