import React, { Suspense, useState } from "react";
import { ChevronDown } from "lucide-react";
import RiverStatus from "../componentes/RiverStatus";
import KpiCard, { KpiCardSkeleton } from "../componentes/KpiCard";
import AlertCard from "../componentes/AlertCard";
import LevelChart from "../componentes/LevelChart";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import ChequeoSeguridad from "../componentes/ChequeoSeguridad";
import SismosRecientes from "../componentes/SismosRecientes";
import Icon from "../componentes/Icon";
import QueHagoAhora from "../componentes/QueHagoAhora";
import HeroInicio from "../componentes/HeroInicio";
import AlertasRecientes from "../componentes/AlertasRecientes";
import DespuesDeLaInundacion from "../componentes/DespuesDeLaInundacion";
import { Revelar } from "../componentes/Animados";
import { useFoco } from "../ganchos/useAnimaciones";
import { useUltimaLectura } from "../ganchos/useUltimaLectura";
import { useSensores } from "../ganchos/useSensores";
import { useEstadoSensores } from "../ganchos/useEstadoSensores";
import { useHistorico } from "../ganchos/useHistorico";
import { recommendations } from "../datos/content";
import { formatearHora } from "../utilidades/fecha";
import { SENSOR_POR_DEFECTO } from "../constantes/sensores";

// Lazy: el radar usa Leaflet (pesado) y el resto de Inicio no lo necesita.
const RadarLluvia = React.lazy(() => import("../componentes/RadarLluvia"));

const CLAVE_SENSOR_GUARDADO = "piura-alerta-sensor";

const ICONOS_RECOMENDACION = ["bi-broadcast", "bi-water", "bi-map", "bi-megaphone"];

function calcularTendencia(prediccion) {
  if (!prediccion) return "—";
  if (prediccion.disponible) return "↑ Subiendo";
  if (typeof prediccion.pendienteCmPorMin === "number" && prediccion.pendienteCmPorMin < -0.05) {
    return "↓ Bajando";
  }
  return "↔ Estable";
}

function Encabezado({ eyebrow, titulo, children }) {
  return (
    <div className="mb-5">
      <p
        className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-primary)" }}
      >
        {eyebrow}
      </p>
      <h2 className="text-[28px] sm:text-[32px] leading-tight mt-1">{titulo}</h2>
      {children}
    </div>
  );
}

function Home() {
  const { data: sensores, loading: cargandoSensores } = useSensores();
  const { data: estadoSensores, loading: cargandoEstado } = useEstadoSensores();
  const [sensorElegido, setSensorCodigo] = useState(
    () => localStorage.getItem(CLAVE_SENSOR_GUARDADO) || SENSOR_POR_DEFECTO
  );

  // Si el sensor guardado ya no existe (borrado desde el panel admin), cae al
  // primero disponible en vez de dejar el dashboard pegado a un código muerto.
  const sensorCodigo =
    sensores?.length && !sensores.some((s) => s.codigo === sensorElegido)
      ? sensores[0].codigo
      : sensorElegido;

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

  const sensorActivo = sensores?.find((s) => s.codigo === sensorCodigo) ?? sensores?.[0];
  const cargandoKpis = cargandoLectura || cargandoSensores;
  const alMoverPuntero = useFoco();

  const selectorSensor =
    sensores && sensores.length > 1 ? (
      <label className="vidrio relative inline-flex items-center rounded-full pl-4 pr-2 min-h-[44px]">
        <span className="sr-only">Elegir sensor a monitorear</span>
        <span className="text-xs font-bold mr-2" style={{ color: "var(--color-text-muted)" }}>
          Sensor
        </span>
        <select
          value={sensorCodigo}
          onChange={(e) => elegirSensor(e.target.value)}
          aria-label="Elegir sensor a monitorear"
          className="appearance-none bg-transparent pr-7 py-2 text-sm font-bold max-w-[200px] truncate cursor-pointer focus:outline-none"
          style={{ color: "var(--color-title)" }}
        >
          {sensores.map((s) => (
            <option key={s.codigo} value={s.codigo}>
              {s.nombre} ({s.codigo})
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3"
          style={{ color: "var(--color-text-muted)" }}
        />
      </label>
    ) : null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8">
      {/* Saludo + hero azul + alertas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-8">
          <HeroInicio
            estadoSensores={estadoSensores}
            cargandoEstado={cargandoEstado}
            lectura={sinLecturas ? null : lectura}
            sensorActivo={sensorActivo}
            selectorSensor={selectorSensor}
          />
        </div>
        <div className="lg:col-span-6 xl:col-span-7">
          <AlertasRecientes />
        </div>
      </div>

      <div className="mt-10 empty:hidden">
        <DespuesDeLaInundacion />
      </div>

      <Revelar className="mt-14">
        <QueHagoAhora
          sensorCodigo={sensorCodigo}
          nombreSensor={sensorActivo?.nombre}
          estadoRio={sinLecturas ? null : lectura?.estado}
        />
      </Revelar>

      <Revelar className="mt-14">
        <Encabezado eyebrow="Datos en vivo" titulo="Así está el río ahora" />

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
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
            <h3 className="font-display text-lg">
              Tendencia del nivel{sensorActivo ? ` · ${sensorActivo.nombre}` : ""}
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Últimas 3 horas. Línea punteada: umbrales de prealerta y alerta roja del sensor.
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

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          {cargandoKpis ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                indice={0}
                title="Nivel del río"
                value={`${lectura?.nivel_cm ?? "—"} cm`}
                description="Registro actual"
                icon={<Icon name="bi-water" aria-hidden="true" />}
              />
              <KpiCard
                indice={1}
                title="Tendencia"
                value={calcularTendencia(lectura?.prediccion)}
                description="Últimas mediciones"
                icon={<Icon name="bi-graph-up-arrow" aria-hidden="true" />}
              />
              <KpiCard
                indice={2}
                title="Puntos activos"
                value={sensores?.filter((s) => s.activo).length ?? "—"}
                description="Sensores monitoreados"
                icon={<Icon name="bi-geo-alt-fill" aria-hidden="true" />}
              />
              <KpiCard
                indice={3}
                title="Actualización"
                value={formatearHora(lectura?.medido_en)}
                description="Último registro"
                icon={<Icon name="bi-clock-history" aria-hidden="true" />}
              />
            </>
          )}
        </section>
      </Revelar>

      <Revelar as="section" className="mt-12">
        <Encabezado eyebrow="Para la población" titulo="Estado de alertas" />
        {cargandoLectura ? (
          <Skeleton className="h-28 rounded-3xl" />
        ) : errorLectura && !sinLecturas ? (
          <ErrorBanner
            message={`No se pudo verificar el estado de alertas (${errorLectura}). No asumas que no hay riesgo.`}
          />
        ) : sinLecturas ? (
          <p
            className="text-sm rounded-3xl border p-5"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Todavía no hay lecturas de este sensor para determinar el estado de alertas.
          </p>
        ) : (
          <AlertCard estado={lectura?.estado} />
        )}
      </Revelar>

      <Revelar>
        <ChequeoSeguridad />
      </Revelar>

      <Revelar>
        <Suspense fallback={<Skeleton className="mt-8 h-120 rounded-3xl" />}>
          <RadarLluvia />
        </Suspense>
      </Revelar>

      <Revelar>
        <SismosRecientes />
      </Revelar>

      <Revelar as="section" className="mt-12 mb-4">
        <Encabezado eyebrow="Prevención" titulo="Recomendaciones para estar preparado">
          {lectura?.prediccion?.disponible ? (
            <p className="mt-2 text-[15px] max-w-2xl" style={{ color: "var(--color-text)" }}>
              Si la tendencia actual continúa, el sensor alcanzaría el umbral de{" "}
              <strong>alerta roja en ~{lectura.prediccion.minutosParaAlerta} min</strong>. Ten en cuenta estas
              recomendaciones:
            </p>
          ) : (
            <p className="mt-2 text-[15px] max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
              Por ahora no hay una proyección de crecida activa. Aun así, ten en cuenta estas recomendaciones:
            </p>
          )}
        </Encabezado>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((recomendacion, i) => (
            <li
              key={recomendacion}
              onPointerMove={alMoverPuntero}
              className="vidrio pa-entra pa-tocable pa-foco flex items-start gap-3.5 rounded-3xl p-4"
              style={{ "--i": i }}
            >
              <span
                className="btn-dorado w-11 h-11 rounded-2xl flex items-center justify-center text-[20px] shrink-0"
                style={{ boxShadow: "none" }}
              >
                <Icon name={ICONOS_RECOMENDACION[i % ICONOS_RECOMENDACION.length]} aria-hidden="true" />
              </span>
              <span className="text-[14.5px] pt-2.5" style={{ color: "var(--color-text)" }}>
                {recomendacion}
              </span>
            </li>
          ))}
        </ul>
      </Revelar>
    </main>
  );
}

export default Home;
