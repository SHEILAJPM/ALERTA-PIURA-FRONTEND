import { useSismos, SISMOS_DIAS, SISMOS_RADIO_KM } from "../ganchos/useSismos";
import { nivelMagnitud } from "../utilidades/sismos";
import { formatearFechaHora, formatearTiempoRelativo } from "../utilidades/fecha";
import Skeleton from "./Skeleton";
import Icon from "./Icon";

function haceCuanto(fecha) {
  const relativo = formatearTiempoRelativo(fecha);
  if (relativo === "ahora") return "hace un momento";
  // Pasado un mes formatearTiempoRelativo devuelve la fecha ("19 oct.").
  return /\d (min|h|d|sem)$/.test(relativo) ? `hace ${relativo}` : `el ${relativo}`;
}

function SismosRecientes() {
  const { data: sismos, loading, error } = useSismos();

  return (
    <section
      className="mt-8 rounded-3xl border p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="bi-activity" aria-hidden="true" style={{ color: "var(--color-primary)" }} />
            Sismos recientes cerca de Piura
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            En vivo: magnitud 3 o más, a menos de {SISMOS_RADIO_KM} km, últimos {SISMOS_DIAS} días.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1"
          style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "currentColor" }} />
          Datos del USGS
        </span>
      </div>

      <div className="mt-4">
        {loading && !sismos ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : error ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No se pudo consultar el catálogo de sismos en este momento.
          </p>
        ) : sismos?.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hubo sismos de magnitud 3 o más cerca de Piura en los últimos {SISMOS_DIAS} días.
          </p>
        ) : (
          <ul>
            {sismos.map((s) => {
              const nivel = nivelMagnitud(s.magnitud);
              return (
                <li
                  key={s.id}
                  className="py-3 flex items-center gap-4 border-t first:border-t-0"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold"
                    style={{
                      backgroundColor: `var(--color-${nivel}-soft)`,
                      color: `var(--color-${nivel})`,
                    }}
                    aria-label={`Magnitud ${s.magnitud.toFixed(1)}`}
                  >
                    <span className="text-lg leading-none">{s.magnitud.toFixed(1)}</span>
                    <span className="text-[10px] font-semibold uppercase">Mag</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm hover:underline block truncate"
                    >
                      {s.lugar}
                    </a>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      <span title={formatearFechaHora(s.fecha)}>{haceCuanto(s.fecha)}</span>
                      {" · "}a {s.distanciaPiuraKm} km de Piura
                      {s.profundidadKm != null && ` · ${s.profundidadKm} km de profundidad`}
                    </p>
                    {s.tsunami && (
                      <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-alerta)" }}>
                        Con aviso de tsunami: aléjate de la playa.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default SismosRecientes;
