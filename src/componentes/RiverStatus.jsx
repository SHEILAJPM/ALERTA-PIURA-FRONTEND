import StatusBadge from "./StatusBadge";
import Skeleton from "./Skeleton";
import ErrorBanner from "./ErrorBanner";
import { useUltimaLectura } from "../ganchos/useUltimaLectura";
import { useEstadoSensores } from "../ganchos/useEstadoSensores";
import Icon from "./Icon";
import { formatearHora } from "../utilidades/fecha";

const SENSOR_POR_DEFECTO = "RIO-PIURA-01";

function RiverStatus({ sensorCodigo = SENSOR_POR_DEFECTO, nombreSensor }) {
  const { lectura, loading, error, sinLecturas, recargar } = useUltimaLectura(sensorCodigo);
  const { data: estadoSensores } = useEstadoSensores();
  const estadoSensor = estadoSensores?.find((s) => s.codigo === sensorCodigo);
  const sensorSinSenal = estadoSensor && !estadoSensor.en_linea;

  if (loading) {
    return (
      <section
        className="rounded-3xl border p-6"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <Skeleton className="h-4 w-56 mb-4" />
        <Skeleton className="h-10 w-40 mb-3" />
        <Skeleton className="h-4 w-32" />
      </section>
    );
  }

  // Un sensor recién agregado desde el panel admin todavía no tiene
  // lecturas: es un estado normal, no una falla de conexión, así que no
  // debe mostrar el mismo aviso rojo de "no se pudo conectar".
  if (sinLecturas) {
    return (
      <section
        className="rounded-3xl border p-6 text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <Icon
          name="bi-broadcast-pin"
          className="text-3xl"
          style={{ color: "var(--color-text-muted)" }}
          aria-hidden="true"
        />
        <p className="mt-3 font-semibold">Este sensor todavía no reporta lecturas</p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          En cuanto reciba su primera medición, aparecerá aquí.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <ErrorBanner
        message={`No se pudo conectar con el backend (${error}). Verifica que el servidor esté corriendo en ${
          import.meta.env.VITE_API_URL
        }.`}
        onRetry={recargar}
      />
    );
  }

  return (
    <section
      className="rounded-3xl border p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {sensorSinSenal && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-medium"
          style={{ backgroundColor: "var(--color-alerta-soft)", color: "var(--color-alerta)" }}
        >
          <Icon name="bi-tools" aria-hidden="true" />
          <span>
            Sensor sin señal desde las {formatearHora(estadoSensor.ultima_lectura?.medido_en)} — estos datos
            pueden no reflejar el nivel actual del río.
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            {nombreSensor ? `ESTADO ACTUAL — ${nombreSensor.toUpperCase()}` : "ESTADO ACTUAL DEL RÍO PIURA"}
          </p>
          <h2 className="font-mono-data text-4xl font-bold mt-2">{lectura.nivel_cm} cm</h2>
          <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>
            {lectura.porcentaje}% del umbral de alerta roja
          </p>
        </div>

        <StatusBadge status={lectura.estado} />
      </div>

      <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
          <span style={{ color: "var(--color-text-muted)" }}>Última lectura</span>
          <span className="font-semibold font-mono-data">{formatearHora(lectura.medido_en)}</span>
        </div>
      </div>
    </section>
  );
}

export default RiverStatus;
