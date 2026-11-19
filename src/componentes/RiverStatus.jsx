import StatusBadge from "./StatusBadge";
import Skeleton from "./Skeleton";
import ErrorBanner from "./ErrorBanner";
import { useUltimaLectura } from "../ganchos/useUltimaLectura";
import { useEstadoSensores } from "../ganchos/useEstadoSensores";
import Icon from "./Icon";
import { NumeroAnimado } from "./Animados";
import { formatearHora } from "../utilidades/fecha";
import { SENSOR_POR_DEFECTO } from "../constantes/sensores";

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

  // Sin ningún dato que mostrar: el error ocupa el lugar de la tarjeta. El
  // detalle técnico va al título (hover) para quien esté depurando, no al texto.
  if (error && !lectura) {
    return (
      <div title={error}>
        <ErrorBanner
          message="No pudimos obtener el nivel del río en este momento. Revisa tu conexión a internet e intenta de nuevo. Si hay riesgo, sigue las indicaciones de Defensa Civil."
          onRetry={recargar}
        />
      </div>
    );
  }

  return (
    <section
      className="rounded-3xl border p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Falló una actualización pero hay un dato anterior: mejor mostrarlo
          avisando que puede estar desactualizado que dejar la tarjeta vacía. */}
      {error && (
        <div
          title={error}
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-sm font-medium"
          style={{ backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-prealerta)" }}
        >
          <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>
            No pudimos actualizar el nivel: mostramos el último dato, de las{" "}
            {formatearHora(lectura.medido_en)}.
          </span>
        </div>
      )}

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

      <div className="flex items-start justify-between gap-3">
        <p
          className="text-[11px] font-extrabold tracking-[0.12em] uppercase"
          style={{ color: "var(--color-text-muted)" }}
        >
          {nombreSensor ? `Estado actual · ${nombreSensor}` : "Estado actual del río Piura"}
        </p>
        <StatusBadge status={lectura.estado} />
      </div>

      <h2 className="font-mono-data mt-4 flex items-baseline gap-2">
        <NumeroAnimado
          valor={lectura.nivel_cm}
          className="text-[64px] leading-none font-extrabold tracking-[-0.04em]"
        />
        <span className="text-xl font-bold" style={{ color: "var(--color-text-muted)" }}>
          cm
        </span>
      </h2>

      {/* Avance hacia el umbral de alerta roja. */}
      <div className="mt-5">
        <div className="flex justify-between text-[13px] font-semibold mb-2">
          <span style={{ color: "var(--color-text-muted)" }}>Hacia alerta roja</span>
          <span className="font-mono-data" style={{ color: "var(--color-title)" }}>
            {lectura.porcentaje}%
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-surface-alt)" }}
          role="progressbar"
          aria-valuenow={Math.min(100, Number(lectura.porcentaje) || 0)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje del umbral de alerta roja"
        >
          <div
            className="sr-barra h-full rounded-full"
            style={{
              width: `${Math.min(100, Number(lectura.porcentaje) || 0)}%`,
              background:
                lectura.estado === "alerta_roja"
                  ? "var(--color-alerta)"
                  : lectura.estado === "prealerta"
                    ? "linear-gradient(90deg, var(--color-sol), var(--color-prealerta-punto))"
                    : "linear-gradient(90deg, var(--color-primary), var(--color-info))",
            }}
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex justify-between gap-2 text-sm">
          <span style={{ color: "var(--color-text-muted)" }}>Última lectura</span>
          <span className="font-bold font-mono-data" style={{ color: "var(--color-title)" }}>
            {formatearHora(lectura.medido_en)}
          </span>
        </div>
      </div>
    </section>
  );
}

export default RiverStatus;
