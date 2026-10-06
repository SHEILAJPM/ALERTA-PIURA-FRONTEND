import { useResource } from "../ganchos/useResource";
import { getHistorialAlertas } from "../utilidades/api";
import StatusBadge from "../componentes/StatusBadge";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import Icon from "../componentes/Icon";
import { formatearFechaHoraCompleta as formatearFecha } from "../utilidades/fecha";

const ESTADO_TEXTO = {
  normal: "normal",
  prealerta: "prealerta",
  alerta_roja: "alerta roja",
};

function Historial() {
  const { data: eventos, loading, error, recargar } = useResource(() => getHistorialAlertas(50), []);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <p
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          Transparencia
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Historial de alertas</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Registro público de cada cambio de estado del río: cuándo pasó, en qué sensor y a qué nivel.
        </p>
      </section>

      {error && <ErrorBanner message={`No se pudo cargar el historial: ${error}`} onRetry={recargar} />}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : eventos && eventos.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Todavía no se registró ningún cambio de estado.
        </p>
      ) : (
        <ol className="space-y-3">
          {eventos?.map((evento) => (
            <li
              key={evento.id}
              className="rounded-2xl border p-4 sm:p-5 flex items-center gap-4"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
              >
                <Icon name="bi-clock-history" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={evento.estado_nuevo} />
                  {evento.estado_anterior && (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      (venía de {ESTADO_TEXTO[evento.estado_anterior] ?? evento.estado_anterior})
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1.5 truncate">
                  <span className="font-semibold font-mono-data">{evento.nivel_cm} cm</span>
                  <span style={{ color: "var(--color-text-muted)" }}> · {evento.sensor_nombre}</span>
                </p>
              </div>

              <span className="text-xs shrink-0 text-right" style={{ color: "var(--color-text-muted)" }}>
                {formatearFecha(evento.iniciado_en)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

export default Historial;
