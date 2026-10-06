import { useEffect, useState } from "react";
import RiverStatus from "../componentes/RiverStatus";
import KpiCard, { KpiCardSkeleton } from "../componentes/KpiCard";
import AlertCard from "../componentes/AlertCard";
import LevelChart from "../componentes/LevelChart";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import ChequeoSeguridad from "../componentes/ChequeoSeguridad";
import Icon from "../componentes/Icon";
import { useUltimaLectura } from "../ganchos/useUltimaLectura";
import { useSensores } from "../ganchos/useSensores";
import { useHistorico } from "../ganchos/useHistorico";
import { usePronosticoLluvia } from "../ganchos/usePronosticoLluvia";
import { recommendations } from "../datos/content";
import { formatearHora } from "../utilidades/fecha";

const SENSOR_POR_DEFECTO = "RIO-PIURA-01";
const CLAVE_SENSOR_GUARDADO = "piura-alerta-sensor";

const selectStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

const ICONOS_RECOMENDACION = ["bi-broadcast", "bi-water", "bi-map", "bi-megaphone"];

function calcularTendencia(prediccion) {
  if (!prediccion) return "—";
  if (prediccion.disponible) return "↑ Subiendo";
  if (typeof prediccion.pendienteCmPorMin === "number" && prediccion.pendienteCmPorMin < -0.05) {
    return "↓ Bajando";
  }
  return "↔ Estable";
}

function Home() {
  const { data: sensores, loading: cargandoSensores } = useSensores();
  const [sensorCodigo, setSensorCodigo] = useState(
    () => localStorage.getItem(CLAVE_SENSOR_GUARDADO) || SENSOR_POR_DEFECTO
  );

  // Si el sensor guardado ya no existe (borrado desde el panel admin), cae al
  // primero disponible en vez de dejar el dashboard pegado a un código muerto.
  useEffect(() => {
    if (sensores && sensores.length > 0 && !sensores.some((s) => s.codigo === sensorCodigo)) {
      setSensorCodigo(sensores[0].codigo);
    }
  }, [sensores, sensorCodigo]);

  function elegirSensor(codigo) {
    setSensorCodigo(codigo);
    localStorage.setItem(CLAVE_SENSOR_GUARDADO, codigo);
  }

  const {
    lectura,
    loading: cargandoLectura,
    error: errorLectura,
    sinLecturas,
  } = useUltimaLectura(sensorCodigo);
  const { puntos, loading: cargandoHistorico, error: errorHistorico } = useHistorico(sensorCodigo, 180);
  const { data: pronostico, error: errorPronostico } = usePronosticoLluvia();

  const sensorActivo = sensores?.find((s) => s.codigo === sensorCodigo) ?? sensores?.[0];
  const cargandoKpis = cargandoLectura || cargandoSensores;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="font-semibold text-sm uppercase tracking-wide"
              style={{ color: "var(--color-primary)" }}
            >
              Sistema de prevención
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Monitoreo del río Piura</h2>
          </div>

          {sensores && sensores.length > 1 && (
            <label className="text-sm">
              <span className="block font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
                Sensor
              </span>
              <select
                value={sensorCodigo}
                onChange={(e) => elegirSensor(e.target.value)}
                aria-label="Elegir sensor a monitorear"
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={selectStyle}
              >
                {sensores.map((s) => (
                  <option key={s.codigo} value={s.codigo}>
                    {s.nombre} ({s.codigo})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Consulta en tiempo real el estado del río, los niveles registrados por el sensor y las alertas
          activas durante periodos de lluvia.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <RiverStatus
            sensorCodigo={sensorCodigo}
            nombreSensor={sensores && sensores.length > 1 ? sensorActivo?.nombre : undefined}
          />
        </div>

        <div
          className="lg:col-span-3 rounded-3xl border p-6"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-xl font-bold">
            Tendencia del nivel{sensorActivo ? ` — ${sensorActivo.nombre}` : ""} (últimas 3 horas)
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Línea punteada: umbrales de prealerta y alerta roja del sensor.
          </p>
          <div className="mt-4">
            {cargandoHistorico ? (
              <Skeleton className="h-48 w-full" />
            ) : errorHistorico ? (
              <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
                No se pudo cargar el histórico de lecturas.
              </p>
            ) : (
              <LevelChart
                puntos={puntos}
                umbrales={
                  sensorActivo && {
                    prealerta: sensorActivo.nivel_prealerta_cm,
                    alertaRoja: sensorActivo.nivel_alerta_roja_cm,
                  }
                }
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {cargandoKpis ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Nivel del río"
              value={`${lectura?.nivel_cm ?? "—"} cm`}
              description="Registro actual"
              icon={<Icon name="bi-water" aria-hidden="true" />}
            />
            <KpiCard
              title="Tendencia"
              value={calcularTendencia(lectura?.prediccion)}
              description="Últimas mediciones"
              icon={<Icon name="bi-graph-up-arrow" aria-hidden="true" />}
            />
            <KpiCard
              title="Puntos activos"
              value={sensores?.filter((s) => s.activo).length ?? "—"}
              description="Sensores monitoreados"
              icon={<Icon name="bi-geo-alt-fill" aria-hidden="true" />}
            />
            <KpiCard
              title="Actualización"
              value={formatearHora(lectura?.medido_en)}
              description="Último registro"
              icon={<Icon name="bi-clock-history" aria-hidden="true" />}
            />
          </>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Estado de alertas</h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Información importante para la población
          </p>
        </div>
        {cargandoLectura ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : errorLectura && !sinLecturas ? (
          <ErrorBanner
            message={`No se pudo verificar el estado de alertas (${errorLectura}). No asumas que no hay riesgo.`}
          />
        ) : sinLecturas ? (
          <p
            className="text-sm rounded-2xl border p-5"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
          >
            Todavía no hay lecturas de este sensor para determinar el estado de alertas.
          </p>
        ) : (
          <AlertCard estado={lectura?.estado} />
        )}
      </section>

      <ChequeoSeguridad />

      <section
        className="mt-8 mb-10 rounded-3xl p-6 border"
        style={{ backgroundColor: "var(--color-dorado-soft)", borderColor: "var(--color-dorado)" }}
      >
        <h2 className="text-xl font-bold">Predicción y recomendaciones</h2>

        {lectura?.prediccion?.disponible ? (
          <p className="mt-2 text-sm" style={{ color: "var(--color-text)" }}>
            Si la tendencia actual continúa, el sensor alcanzaría el umbral de{" "}
            <strong>alerta roja en ~{lectura.prediccion.minutosParaAlerta} min</strong>. Ten en cuenta estas
            recomendaciones:
          </p>
        ) : (
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Por ahora no hay una proyección de crecida activa. Aun así, ten en cuenta estas recomendaciones:
          </p>
        )}

        {!errorPronostico && pronostico && (
          <p
            className="mt-3 text-sm rounded-xl px-3 py-2"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <Icon
              name="bi-water"
              aria-hidden="true"
              className="mr-1.5 align-[-2px]"
              style={{ color: "var(--color-dorado)" }}
            />
            Pronóstico: <strong>{Math.round(pronostico.probabilidadMax)}%</strong> de probabilidad de lluvia
            en las próximas {pronostico.horas} horas
            {pronostico.mmEsperados > 0 && ` (hasta ${pronostico.mmEsperados.toFixed(1)} mm)`}
          </p>
        )}

        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((recomendacion, i) => (
            <li
              key={recomendacion}
              className="flex items-start gap-3 rounded-2xl p-3"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: "var(--color-dorado-soft)", color: "var(--color-dorado)" }}
              >
                <Icon name={ICONOS_RECOMENDACION[i % ICONOS_RECOMENDACION.length]} aria-hidden="true" />
              </span>
              <span className="text-sm pt-1.5" style={{ color: "var(--color-text)" }}>
                {recomendacion}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Home;
