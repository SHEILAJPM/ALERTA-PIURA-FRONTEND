import { useEstadoSensores } from "../../ganchos/useEstadoSensores";
import StatusBadge from "../../componentes/StatusBadge";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";

function formatearHace(iso) {
  if (!iso) return "sin lecturas";
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "hace segundos";
  if (minutos < 60) return `hace ${minutos} min`;
  return `hace ${Math.round(minutos / 60)} h`;
}

function Telemetria() {
  const { data: sensores, loading, error } = useEstadoSensores();

  return (
    <>
      <AdminPageHeader titulo="TELEMETRÍA IoT" subtitulo="EN VIVO · SE ACTUALIZA CADA 30S" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar la telemetría: ${error}`} />
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : !sensores || sensores.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay nodos registrados todavía.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sensores.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{s.nombre}</p>
                    <p className="text-xs font-mono-data" style={{ color: "var(--color-text-muted)" }}>
                      {s.codigo}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={
                      s.en_linea
                        ? { color: "var(--color-normal)", backgroundColor: "var(--color-normal-soft)" }
                        : { color: "var(--color-alerta)", backgroundColor: "var(--color-alerta-soft)" }
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
                    {s.en_linea ? "En línea" : "Sin señal"}
                  </span>
                </div>

                {s.ultima_lectura ? (
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold font-mono-data">{s.ultima_lectura.nivel_cm} cm</p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                        {formatearHace(s.ultima_lectura.medido_en)}
                      </p>
                    </div>
                    <StatusBadge status={s.ultima_lectura.estado} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Todavía no hay lecturas.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Telemetria;
