import { useState } from "react";
import { useResource } from "../../ganchos/useResource";
import { getChequeosSeguridad } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { ROLES_DEFENSA_CIVIL } from "../../constantes/roles";
import { formatearFechaHora } from "../../utilidades/fecha";

const REFRESCO_MS = 60_000;
const VENTANA_RECIENTE_MS = 24 * 60 * 60_000;

function StatCard({ valor, etiqueta, color }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <p className="font-mono-data text-3xl font-bold" style={{ color }}>
        {valor}
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
        {etiqueta}
      </p>
    </div>
  );
}

function esReciente(fecha) {
  return fecha && Date.now() - new Date(fecha).getTime() < VENTANA_RECIENTE_MS;
}

const FILTROS = [
  { id: "sin-aviso", etiqueta: "Sin aviso reciente" },
  { id: "a-salvo", etiqueta: "A salvo (24 h)" },
  { id: "todos", etiqueta: "Todos" },
];

// Quién avisó "Estoy a salvo" y cuándo. Durante una emergencia lo útil es
// la lista inversa: quién NO avisó en las últimas 24 h (con su teléfono),
// para priorizar a quién llamar o ir a buscar -- por eso es el filtro inicial.
function ChequeosSeguridad() {
  const {
    data: ciudadanos,
    loading,
    error,
    recargar,
  } = useResource(getChequeosSeguridad, [], {
    intervaloMs: REFRESCO_MS,
  });
  const [filtro, setFiltro] = useState("sin-aviso");
  const [busqueda, setBusqueda] = useState("");

  const lista = ciudadanos ?? [];
  const aSalvo = lista.filter((c) => esReciente(c.ultimo_chequeo)).length;
  const termino = busqueda.trim().toLowerCase();
  const visibles = lista
    .filter((c) => {
      if (filtro === "a-salvo") return esReciente(c.ultimo_chequeo);
      if (filtro === "sin-aviso") return !esReciente(c.ultimo_chequeo);
      return true;
    })
    .filter((c) => !termino || c.nombre?.toLowerCase().includes(termino) || c.telefono?.includes(termino));

  return (
    <RequiereRol roles={ROLES_DEFENSA_CIVIL}>
      <AdminPageHeader
        titulo="CHEQUEOS DE SEGURIDAD"
        subtitulo="«ESTOY A SALVO» · SE ACTUALIZA CADA MINUTO"
      />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los chequeos: ${error}`} onRetry={recargar} />
          </div>
        )}

        {!loading && lista.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard valor={lista.length} etiqueta="Ciudadanos con cuenta" color="var(--color-primary)" />
            <StatCard valor={aSalvo} etiqueta="A salvo (últimas 24 h)" color="var(--color-normal)" />
            <StatCard
              valor={lista.length - aSalvo}
              etiqueta="Sin aviso reciente"
              color="var(--color-prealerta)"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className="text-sm font-semibold px-3 py-1.5 rounded-full border transition"
              style={
                filtro === f.id
                  ? {
                      backgroundColor: "var(--color-primary)",
                      color: "#fff",
                      borderColor: "var(--color-primary)",
                    }
                  : { borderColor: "var(--color-border)", color: "var(--color-text)" }
              }
            >
              {f.etiqueta}
            </button>
          ))}
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            aria-label="Buscar ciudadano"
            className="flex-1 min-w-48 rounded-lg border px-3 py-1.5 text-sm"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            {lista.length === 0
              ? "Todavía no hay ciudadanos registrados."
              : "Nadie coincide con este filtro."}
          </p>
        ) : (
          <div
            className="rounded-2xl border overflow-x-auto"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <th className="pl-5 pr-4 py-3 font-semibold">Ciudadano</th>
                  <th className="pr-4 py-3 font-semibold">Teléfono</th>
                  <th className="pr-5 py-3 font-semibold">Último aviso</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c) => {
                  const reciente = esReciente(c.ultimo_chequeo);
                  return (
                    <tr
                      key={c.usuario_id}
                      className="border-t"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <td className="pl-5 pr-4 py-3 font-semibold">{c.nombre}</td>
                      <td className="pr-4 py-3 font-mono-data">
                        {c.telefono ? (
                          <a href={`tel:${c.telefono}`} style={{ color: "var(--color-primary)" }}>
                            {c.telefono}
                          </a>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="pr-5 py-3">
                        <span
                          className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={
                            reciente
                              ? { color: "var(--color-normal)", backgroundColor: "var(--color-normal-soft)" }
                              : {
                                  color: "var(--color-text-muted)",
                                  backgroundColor: "var(--color-surface-alt)",
                                }
                          }
                        >
                          {c.ultimo_chequeo ? formatearFechaHora(c.ultimo_chequeo) : "Nunca"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequiereRol>
  );
}

export default ChequeosSeguridad;
