import { Link } from "react-router-dom";
import AnilloPuntaje from "./AnilloPuntaje";
import { useModalA11y } from "../ganchos/useModalA11y";
import { ESTILO_NIVEL } from "../utilidades/accionRecomendada";

// Hoja que sube desde abajo y explica el puntaje de riesgo factor por
// factor, con la fuente de cada dato (ver backend servicios/puntajeRiesgo.js).
function HojaRiesgo({ riesgo, conUbicacion, onUsarUbicacion, buscandoUbicacion, onCerrar }) {
  const contenedorRef = useModalA11y(onCerrar);
  const estilo = ESTILO_NIVEL[riesgo.nivel] ?? ESTILO_NIVEL.bajo;
  const maximo = Math.max(...riesgo.factores.map((f) => Math.abs(f.puntos)), 1);

  return (
    <div className="fixed inset-0 z-[1050] flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="sr-velo absolute inset-0 cursor-default"
        style={{ backgroundColor: "rgba(14,45,71,0.45)" }}
      />
      <section
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-riesgo-titulo"
        tabIndex={-1}
        className="sr-hoja relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[30px] sm:rounded-[30px] px-5 pt-3 pb-6 flex flex-col gap-4"
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
      >
        <div className="flex justify-center sm:hidden">
          <span className="w-11 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-extrabold tracking-[0.12em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            ¿POR QUÉ ESTE PUNTAJE?
          </span>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar explicación"
            className="sr-presionable w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-4">
          <AnilloPuntaje puntaje={riesgo.puntaje} nivel={riesgo.nivel} />
          <div>
            <h2 id="hoja-riesgo-titulo" className="text-2xl font-extrabold leading-tight">
              Riesgo de inundación {conUbicacion ? "en tu zona" : "del río"}
            </h2>
            <span
              className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-extrabold px-2.5 py-1.5 rounded-full"
              style={{ color: estilo.color, backgroundColor: estilo.fondo }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: estilo.color }} />
              {estilo.texto}
            </span>
          </div>
        </div>

        <p
          className="text-[13px] leading-relaxed rounded-2xl px-4 py-3"
          style={{ backgroundColor: "var(--color-surface-alt)" }}
        >
          <strong>Cómo se calcula:</strong> sumamos lo que mide el sensor, lo que dice el pronóstico
          {conUbicacion ? " y dónde estás tú" : ""}. Cada punto viene de un dato real:
        </p>

        {!riesgo.datos_completos && (
          <p
            role="alert"
            className="text-[13px] font-bold rounded-2xl px-4 py-3"
            style={{ color: "var(--color-alerta)", backgroundColor: "var(--color-alerta-soft)" }}
          >
            Faltan datos de algunas fuentes: el riesgo real podría ser mayor. No asumas que no hay peligro.
          </p>
        )}

        <ol className="flex flex-col gap-2.5">
          {riesgo.factores.map((factor, i) => {
            const suma = factor.puntos > 0;
            return (
              <li
                key={factor.clave}
                className="sr-entra flex gap-3 items-start rounded-2xl border p-3"
                style={{ borderColor: "var(--color-border)", animationDelay: `${0.15 + i * 0.1}s` }}
              >
                <span
                  className="w-12 shrink-0 text-center font-display text-xl font-extrabold"
                  style={{
                    color: factor.sin_datos
                      ? "var(--color-text-muted)"
                      : suma
                        ? "var(--color-alerta)"
                        : "var(--color-normal)",
                  }}
                >
                  {suma ? "+" : factor.puntos < 0 ? "−" : ""}
                  {Math.abs(factor.puntos)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-snug">{factor.texto}</p>
                  <div
                    className="h-1.5 rounded-full mt-2 overflow-hidden"
                    style={{ backgroundColor: "var(--color-surface-alt)" }}
                  >
                    <div
                      className="sr-barra h-1.5 rounded-full"
                      style={{
                        width: `${Math.round((Math.abs(factor.puntos) / maximo) * 100)}%`,
                        backgroundColor: suma ? "var(--color-alerta)" : "var(--color-normal)",
                        animationDelay: `${0.3 + i * 0.1}s`,
                      }}
                    />
                  </div>
                  <span
                    className="inline-block mt-2 font-mono-data text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-soft)" }}
                  >
                    Dato: {factor.fuente}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {!conUbicacion && (
          <button
            type="button"
            onClick={onUsarUbicacion}
            disabled={buscandoUbicacion}
            className="sr-presionable rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-bold text-left"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
          >
            {buscandoUbicacion
              ? "Buscando tu ubicación…"
              : "Usar mi ubicación para sumar tu zona de riesgo y el albergue más cercano"}
          </button>
        )}

        <div className="flex gap-2">
          <Link
            to="/mapa"
            onClick={onCerrar}
            className="sr-presionable flex-1 rounded-2xl min-h-[52px] flex items-center justify-center font-extrabold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Ir al albergue
          </Link>
          <Link
            to="/mochila"
            onClick={onCerrar}
            className="sr-presionable flex-1 rounded-2xl min-h-[52px] flex items-center justify-center font-extrabold"
            style={{ backgroundColor: "var(--color-sol)", color: "var(--color-sol-texto)" }}
          >
            Preparar mochila
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HojaRiesgo;
