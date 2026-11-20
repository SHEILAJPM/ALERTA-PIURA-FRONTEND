import { useState } from "react";
import { useResource } from "../../ganchos/useResource";
import { getResumenSalud, getResumenAgua } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { NOMBRE_ENFERMEDAD } from "../../datos/salud";
import { ROLES_DEFENSA_CIVIL } from "../../constantes/roles";

const PERIODOS = [7, 14, 30];

// Avisos ANÓNIMOS de vecinos sobre casos de enfermedad tras el fenómeno:
// sirven para ver dónde aumentan los casos y priorizar fumigación, brigadas
// o charlas. No son diagnósticos confirmados.
const TIPO_AGUA = {
  sin_agua: "Sin agua",
  agua_turbia: "Agua turbia o sucia",
  agua_olor: "Olor o sabor raro",
};

// Avisos anónimos de problemas con el agua (ODS 6.1), del mismo periodo.
function ResumenAgua({ dias }) {
  const { data, loading, error } = useResource(() => getResumenAgua(dias), [dias]);
  if (loading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (error) return null;
  return (
    <section
      className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h2 className="font-bold">Avisos de agua ({data.avisos})</h2>
      {data.avisos === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No hay avisos de agua en los últimos {data.dias} días.
        </p>
      ) : (
        <>
          <p className="text-sm">
            {Object.entries(data.por_tipo)
              .map(([id, n]) => `${TIPO_AGUA[id] ?? id}: ${n}`)
              .join(" · ")}
          </p>
          <ol className="flex flex-col gap-2">
            {data.zonas.slice(0, 10).map((z, i) => (
              <li
                key={`${z.lat},${z.lon}`}
                className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2 text-sm"
                style={{ backgroundColor: "var(--color-surface-alt)" }}
              >
                <span className="font-mono-data font-bold w-6">{i + 1}</span>
                <span className="flex-1 min-w-[160px]">
                  <strong>{z.avisos}</strong> hogares ·{" "}
                  {Object.entries(z.tipos)
                    .map(([id, n]) => `${TIPO_AGUA[id] ?? id}: ${n}`)
                    .join(" · ")}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${z.lat},${z.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  Ver zona
                </a>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function VigilanciaSalud() {
  const [dias, setDias] = useState(14);
  const { data, loading, error, recargar } = useResource(() => getResumenSalud(dias), [dias]);
  const maximo = Math.max(1, ...Object.values(data?.por_enfermedad ?? {}));

  return (
    <RequiereRol roles={ROLES_DEFENSA_CIVIL}>
      <AdminPageHeader
        titulo="VIGILANCIA DE SALUD"
        subtitulo="AVISOS ANÓNIMOS DE ENFERMEDAD TRAS EL FENÓMENO"
      />

      <div className="p-4 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
            Avisos de vecinos, sin nombres y con ubicación aproximada (unos 500 m). No son diagnósticos:
            sirven para ver dónde aumentan los casos y priorizar fumigación, brigadas o atención.
          </p>
          <div className="flex gap-1" role="group" aria-label="Periodo">
            {PERIODOS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={dias === d}
                onClick={() => setDias(d)}
                className="min-h-[40px] px-4 rounded-full text-sm font-bold"
                style={
                  dias === d
                    ? { backgroundColor: "var(--color-primary)", color: "#ffffff" }
                    : { backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }
                }
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBanner message={`No se pudo cargar el resumen: ${error}`} onRetry={recargar} />}

        {loading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          data && (
            <>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                {[
                  [data.avisos, "Avisos recibidos"],
                  [data.personas, "Personas con síntomas"],
                ].map(([valor, etiqueta]) => (
                  <div
                    key={etiqueta}
                    className="rounded-2xl border p-5"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <p className="font-mono-data text-3xl font-bold" style={{ color: "var(--color-title)" }}>
                      {valor}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                      {etiqueta}
                    </p>
                  </div>
                ))}
              </div>

              {data.avisos === 0 ? (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No hay avisos en los últimos {data.dias} días.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <section
                    className="rounded-2xl border p-5"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <h2 className="font-bold mb-3">Personas por enfermedad</h2>
                    <ul className="flex flex-col gap-3">
                      {Object.entries(data.por_enfermedad)
                        .sort((a, b) => b[1] - a[1])
                        .map(([id, n]) => (
                          <li key={id} className="text-sm">
                            <div className="flex justify-between gap-3 mb-1">
                              <span>{NOMBRE_ENFERMEDAD[id] ?? id}</span>
                              <span className="font-mono-data font-bold">{n}</span>
                            </div>
                            <div
                              className="h-2 rounded-full"
                              style={{ backgroundColor: "var(--color-surface-alt)" }}
                            >
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${(n / maximo) * 100}%`,
                                  backgroundColor: "var(--color-primary)",
                                }}
                              />
                            </div>
                          </li>
                        ))}
                    </ul>
                  </section>

                  <section
                    className="rounded-2xl border p-5"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <h2 className="font-bold mb-3">Zonas con más casos</h2>
                    <ol className="flex flex-col gap-2">
                      {data.zonas.slice(0, 15).map((z, i) => (
                        <li
                          key={`${z.lat},${z.lon}`}
                          className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2 text-sm"
                          style={{ backgroundColor: "var(--color-surface-alt)" }}
                        >
                          <span className="font-mono-data font-bold w-6">{i + 1}</span>
                          <span className="flex-1 min-w-[160px]">
                            <strong>{z.personas}</strong> personas · {z.avisos} avisos
                            <span className="block text-xs" style={{ color: "var(--color-text-muted)" }}>
                              {Object.entries(z.enfermedades)
                                .map(([id, n]) => `${NOMBRE_ENFERMEDAD[id] ?? id}: ${n}`)
                                .join(" · ")}
                            </span>
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${z.lat},${z.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold"
                            style={{ color: "var(--color-primary)" }}
                          >
                            Ver zona
                          </a>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              )}
            </>
          )
        )}
        <ResumenAgua dias={dias} />
      </div>
    </RequiereRol>
  );
}

export default VigilanciaSalud;
