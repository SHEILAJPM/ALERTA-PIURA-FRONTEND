import { useState } from "react";
import AnilloPuntaje from "./AnilloPuntaje";
import HojaRiesgo from "./HojaRiesgo";
import Skeleton from "./Skeleton";
import { useResource } from "../ganchos/useResource";
import { getRiesgo } from "../utilidades/api";
import { ESTILO_NIVEL } from "../utilidades/accionRecomendada";
import { SENSOR_POR_DEFECTO } from "../constantes/sensores";

// "Analizar mi zona": puntaje de riesgo del punto que la persona tocó en el
// mapa (o su ubicación), con la misma explicación factor por factor de Inicio.
function AnalisisPunto({ punto, onUsarMiUbicacion, buscandoUbicacion, errorUbicacion }) {
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const {
    data: riesgo,
    loading,
    error,
  } = useResource(
    () => (punto ? getRiesgo(SENSOR_POR_DEFECTO, punto) : Promise.resolve(null)),
    [punto?.lat ?? null, punto?.lon ?? null]
  );
  const estilo = riesgo ? ESTILO_NIVEL[riesgo.nivel] : null;
  const zona = riesgo?.factores.find((f) => f.clave === "zona");

  return (
    <section
      aria-labelledby="analisis-titulo"
      className="sr-entra rounded-3xl border p-5 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div>
        <span
          className="text-[11px] font-extrabold tracking-[0.12em]"
          style={{ color: "var(--color-text-muted)" }}
        >
          ANALIZAR MI ZONA
        </span>
        <h3 id="analisis-titulo" className="font-display text-2xl font-extrabold leading-tight mt-1">
          {punto ? "Riesgo en el punto elegido" : "Toca el mapa donde vives"}
        </h3>
      </div>

      {!punto ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Te mostramos el riesgo de inundación de ese lugar y el albergue más cercano.
        </p>
      ) : loading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : error || !riesgo ? (
        <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
          No se pudo calcular el riesgo de ese punto. No asumas que no hay peligro.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <AnilloPuntaje puntaje={riesgo.puntaje} nivel={riesgo.nivel} tamano={96} grosor={10} />
            <div className="min-w-0">
              <p className="font-display text-xl font-extrabold" style={{ color: estilo.color }}>
                {estilo.texto}
              </p>
              {zona && (
                <p className="text-[13px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {zona.texto}
                </p>
              )}
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

      <button
        type="button"
        onClick={onUsarMiUbicacion}
        disabled={buscandoUbicacion}
        className="sr-presionable rounded-2xl min-h-[48px] px-3 text-sm font-extrabold"
        style={{ backgroundColor: "var(--color-sol)", color: "var(--color-sol-texto)" }}
      >
        {buscandoUbicacion ? "Buscando tu ubicación…" : "Usar mi ubicación"}
      </button>
      {errorUbicacion && (
        <p className="text-xs" role="status" style={{ color: "var(--color-alerta)" }}>
          {errorUbicacion}
        </p>
      )}

      {hojaAbierta && riesgo && (
        <HojaRiesgo riesgo={riesgo} conUbicacion onCerrar={() => setHojaAbierta(false)} />
      )}
    </section>
  );
}

export default AnalisisPunto;
