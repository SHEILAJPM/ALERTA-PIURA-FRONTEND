import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSimulacro, useSegundosRestantes, formatearCuentaRegresiva } from "../ganchos/useSimulacro";
import { avisarConSonido } from "../utilidades/sonido";
import Icon from "./Icon";

const PATRON_VIBRACION = [400, 200, 400, 200, 800];
const SIRENA_CADA_MS = 3000;

// Pantalla completa de alerta durante un simulacro (ver useSimulacro). Se
// monta una sola vez en App, así aparece en cualquier página, incluso en el
// panel admin desde donde se lanzó. "Entendido" la reduce a una franja con
// la cuenta regresiva, para que la persona pueda ir al mapa o a albergues
// sin perder de vista que el simulacro sigue.
function SimulacroAlerta() {
  const simulacro = useSimulacro();
  const segundos = useSegundosRestantes(simulacro.activo ? simulacro.termina_en : null);
  const [minimizadoId, setMinimizadoId] = useState(null);
  const minimizado = simulacro.activo && minimizadoId === simulacro.id;

  useEffect(() => {
    if (!simulacro.activo || minimizado) return undefined;
    try {
      navigator.vibrate?.(PATRON_VIBRACION);
    } catch {
      // sin vibración disponible
    }
    avisarConSonido({ veces: 3, frecuencia: 960 });
    const id = setInterval(() => avisarConSonido({ veces: 3, frecuencia: 960 }), SIRENA_CADA_MS);
    return () => clearInterval(id);
  }, [simulacro.activo, simulacro.id, minimizado]);

  if (!simulacro.activo) return null;

  if (minimizado) {
    return (
      <div
        role="status"
        className="fixed top-0 inset-x-0 z-[1100] flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: "var(--color-alerta)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
        SIMULACRO EN CURSO · termina en {formatearCuentaRegresiva(segundos)}
        <button
          type="button"
          onClick={() => setMinimizadoId(null)}
          className="underline underline-offset-2 font-bold"
        >
          Ver
        </button>
      </div>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="simulacro-titulo"
      aria-describedby="simulacro-mensaje"
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 text-white simulacro-fondo"
    >
      <div className="max-w-lg w-full text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[11px] sm:text-xs font-bold tracking-wider sm:tracking-[0.25em] whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
          SIMULACRO · NO ES UNA EMERGENCIA REAL
        </span>

        <div className="mt-8 mx-auto w-28 h-28 rounded-full bg-white/15 flex items-center justify-center text-6xl simulacro-latido">
          <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" />
        </div>

        <h2 id="simulacro-titulo" className="mt-6 text-4xl sm:text-5xl font-black tracking-tight">
          ALERTA ROJA
        </h2>
        <p id="simulacro-mensaje" className="mt-4 text-lg leading-relaxed text-white/90">
          {simulacro.mensaje}
        </p>

        <p className="mt-6 text-sm text-white/75">
          Termina en{" "}
          <span className="font-mono font-bold text-white">{formatearCuentaRegresiva(segundos)}</span>
          {simulacro.iniciado_por && <> · Lanzado por {simulacro.iniciado_por}</>}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/mapa"
            onClick={() => setMinimizadoId(simulacro.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold"
            style={{ color: "var(--color-alerta)" }}
          >
            <Icon name="bi-house-door-fill" aria-hidden="true" />
            Ver albergues cercanos
          </Link>
          <button
            type="button"
            onClick={() => setMinimizadoId(simulacro.id)}
            className="rounded-xl border-2 border-white/70 px-6 py-3 font-bold hover:bg-white/10"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimulacroAlerta;
