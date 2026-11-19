import { useState } from "react";
import { Link } from "react-router-dom";
import AnilloPuntaje from "./AnilloPuntaje";
import HojaRiesgo from "./HojaRiesgo";
import Skeleton from "./Skeleton";
import { useRiesgo } from "../ganchos/useRiesgo";
import { elegirAccion, estadoRioVigente, ESTILO_NIVEL } from "../utilidades/accionRecomendada";

const CLAVE_SITUACION = "piura-alerta-situacion";

const SITUACIONES = [
  { id: "casa", titulo: "Estoy en mi casa", detalle: "Quiero prepararme" },
  { id: "calle", titulo: "Estoy en la calle", detalle: "Necesito ir a un lugar seguro" },
];

const ALERTAS_RIO = {
  prealerta: "Prealerta: el nivel del río está subiendo",
  alerta_roja: "Alerta roja: el río superó el nivel de peligro",
};

function leerSituacion() {
  try {
    return localStorage.getItem(CLAVE_SITUACION) === "calle" ? "calle" : "casa";
  } catch {
    return "casa";
  }
}

function fechaDeHoy() {
  return new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date()
  );
}

// "¿Qué hago ahora?": la pregunta principal de Inicio. Una sola acción
// recomendada en grande, según la situación de la persona y el puntaje de
// riesgo, más el puntaje explicado (HojaRiesgo) a un toque.
function QueHagoAhora({ sensorCodigo, nombreSensor, estadoRio }) {
  const [situacion, setSituacion] = useState(leerSituacion);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const { riesgo, loading, error, conUbicacion, usarMiUbicacion, buscandoUbicacion, errorUbicacion } =
    useRiesgo(sensorCodigo);

  function elegirSituacion(id) {
    setSituacion(id);
    try {
      localStorage.setItem(CLAVE_SITUACION, id);
    } catch {
      // sin almacenamiento: vale solo para esta visita
    }
  }

  const rioActual = estadoRioVigente(estadoRio, riesgo);
  const accion = elegirAccion({
    situacion,
    nivel: riesgo?.nivel,
    estadoRio: rioActual,
    datosCompletos: riesgo?.datos_completos ?? true,
  });
  const estiloNivel = riesgo ? ESTILO_NIVEL[riesgo.nivel] : null;
  const alertaRio = ALERTAS_RIO[rioActual];

  return (
    <section aria-labelledby="que-hago-titulo" className="flex flex-col gap-4">
      <div className="sr-entra">
        <p className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>
          {nombreSensor ? `${nombreSensor} · ` : ""}
          {fechaDeHoy()}
        </p>
        <h2 id="que-hago-titulo" className="text-[30px] sm:text-[36px] leading-tight mt-1">
          ¿Qué hago ahora?
        </h2>
        <p className="mt-2 text-[15px] max-w-xl" style={{ color: "var(--color-text-muted)" }}>
          Te decimos qué hacer según el río, la lluvia{conUbicacion ? " y tu zona" : ""}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <fieldset
            className="sr-entra rounded-3xl border p-3.5"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              animationDelay: "0.05s",
            }}
          >
            <legend
              className="px-1 text-[11px] font-extrabold tracking-[0.12em]"
              style={{ color: "var(--color-text-muted)" }}
            >
              ¿EN QUÉ TE AYUDAMOS?
            </legend>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SITUACIONES.map((s) => {
                const activa = s.id === situacion;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => elegirSituacion(s.id)}
                    className="sr-presionable text-left rounded-2xl border-[1.5px] p-3 min-h-[76px]"
                    style={{
                      borderColor: activa ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: activa ? "var(--color-primary)" : "var(--color-surface-alt)",
                      color: activa ? "#ffffff" : "var(--color-text)",
                      boxShadow: activa ? "0 8px 18px rgba(14,45,71,0.22)" : "none",
                    }}
                  >
                    <strong className="block text-sm leading-tight">{s.titulo}</strong>
                    <span className="block text-xs mt-1 opacity-85">{s.detalle}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {alertaRio && (
            <div
              role="alert"
              className="sr-entra flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold text-white"
              style={{
                backgroundColor:
                  rioActual === "alerta_roja" ? "var(--color-alerta)" : "var(--color-prealerta)",
                animationDelay: "0.1s",
              }}
            >
              <span
                className="sr-latido w-2.5 h-2.5 rounded-full bg-white shrink-0"
                style={{ color: "#ffffff" }}
              />
              {alertaRio}
            </div>
          )}

          <section
            aria-labelledby="accion-titulo"
            className={`sr-entra relative overflow-hidden rounded-[28px] p-5 sm:p-6 ${
              accion.urgente ? "text-white" : "vidrio"
            }`}
            style={{
              ...(accion.urgente
                ? {
                    background: "linear-gradient(145deg, #d84040, var(--color-alerta))",
                    boxShadow: "0 18px 40px rgba(198,40,40,0.3)",
                  }
                : {}),
              animationDelay: "0.15s",
            }}
          >
            <svg
              viewBox="0 0 480 60"
              preserveAspectRatio="none"
              className="absolute left-0 bottom-0 w-[160%] h-14 pointer-events-none"
              aria-hidden="true"
            >
              <path
                className="sr-ola"
                d="M0 30 Q 30 18 60 30 T 120 30 T 180 30 T 240 30 T 300 30 T 360 30 T 420 30 T 480 30 V 60 H 0 Z"
                fill={accion.urgente ? "rgba(255,255,255,0.1)" : "var(--color-primary-soft)"}
              />
            </svg>
            <div className="relative">
              <div className="flex flex-wrap gap-1.5">
                <span
                  className="btn-dorado text-[11px] font-extrabold tracking-[0.1em] px-2.5 py-1 rounded-full"
                  style={{ boxShadow: "none" }}
                >
                  ACCIÓN RECOMENDADA
                </span>
                {riesgo && (
                  <span
                    className="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
                    style={
                      accion.urgente
                        ? { backgroundColor: "rgba(255,255,255,0.18)" }
                        : { backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }
                    }
                  >
                    {estiloNivel.texto} · {riesgo.puntaje}/100
                  </span>
                )}
              </div>
              <h3
                id="accion-titulo"
                className="font-display text-3xl font-extrabold leading-[1.08] mt-3"
                style={{ color: accion.urgente ? "#ffffff" : "var(--color-title)" }}
              >
                {accion.titulo}
              </h3>
              <p
                className="mt-2 text-[15px] leading-relaxed max-w-lg"
                style={{ color: accion.urgente ? "rgba(255,255,255,0.88)" : "var(--color-text-muted)" }}
              >
                {accion.texto}
              </p>
              <Link
                to={accion.enlace}
                className="btn-dorado pa-tocable mt-5 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-7 min-h-[52px] font-extrabold"
              >
                {accion.boton} →
              </Link>
            </div>
          </section>
        </div>

        <div
          className="sr-entra lg:col-span-2 rounded-3xl border p-5 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            animationDelay: "0.2s",
          }}
        >
          <span
            className="text-[11px] font-extrabold tracking-[0.12em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            TU PUNTAJE DE RIESGO
          </span>
          {loading ? (
            <Skeleton className="h-28 w-full rounded-2xl" />
          ) : error || !riesgo ? (
            <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
              No se pudo calcular el riesgo ahora. No asumas que no hay peligro: sigue los avisos de Defensa
              Civil.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <AnilloPuntaje puntaje={riesgo.puntaje} nivel={riesgo.nivel} />
                <div>
                  <p className="font-display text-2xl font-extrabold" style={{ color: estiloNivel.color }}>
                    {estiloNivel.texto}
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Sale de {riesgo.factores.length} datos reales.
                  </p>
                </div>
              </div>
              {!riesgo.datos_completos && (
                <p className="text-[13px] font-bold" style={{ color: "var(--color-alerta)" }}>
                  Faltan datos de algunas fuentes: no asumas que no hay peligro.
                </p>
              )}
              <button
                type="button"
                onClick={() => setHojaAbierta(true)}
                className="sr-presionable rounded-2xl min-h-[48px] font-extrabold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                ¿Por qué este puntaje?
              </button>
            </>
          )}
          {!conUbicacion && (
            <button
              type="button"
              onClick={usarMiUbicacion}
              disabled={buscandoUbicacion}
              className="sr-presionable rounded-2xl border-2 border-dashed min-h-[48px] px-3 text-sm font-bold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
            >
              {buscandoUbicacion ? "Buscando tu ubicación…" : "Usar mi ubicación (suma tu zona)"}
            </button>
          )}
          {errorUbicacion && (
            <p className="text-xs" role="status" style={{ color: "var(--color-alerta)" }}>
              {errorUbicacion}
            </p>
          )}
        </div>
      </div>

      {hojaAbierta && riesgo && (
        <HojaRiesgo
          riesgo={riesgo}
          conUbicacion={conUbicacion}
          onUsarUbicacion={usarMiUbicacion}
          buscandoUbicacion={buscandoUbicacion}
          onCerrar={() => setHojaAbierta(false)}
        />
      )}
    </section>
  );
}

export default QueHagoAhora;
