import { useState } from "react";
import { Link } from "react-router-dom";
import { COSAS_MOCHILA } from "../datos/mochila";

const CLAVE_MOCHILA = "piura-alerta-mochila";

function leerMarcados() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_MOCHILA));
    return Array.isArray(guardado) ? guardado.filter((id) => COSAS_MOCHILA.some((c) => c.id === id)) : [];
  } catch {
    return [];
  }
}

function guardarMarcados(ids) {
  try {
    localStorage.setItem(CLAVE_MOCHILA, JSON.stringify(ids));
  } catch {
    // sin almacenamiento: el avance vale solo para esta visita
  }
}

const RADIO = 35;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

// Lista de la mochila de emergencia: cada cosa se marca tocándola y el
// avance queda guardado en este navegador (no hace falta cuenta).
function Mochila() {
  const [marcados, setMarcados] = useState(leerMarcados);
  const total = COSAS_MOCHILA.length;
  const listos = marcados.length;
  const completa = listos === total;

  function alternar(id) {
    setMarcados((prev) => {
      const nuevos = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      guardarMarcados(nuevos);
      return nuevos;
    });
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="sr-entra flex items-center gap-5">
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>
            Paso 1 de 3 · Prepárate
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-none mt-1.5">
            Tu mochila de emergencia
          </h2>
        </div>
        <div className="relative w-24 h-24 shrink-0">
          <svg
            viewBox="0 0 84 84"
            className="w-24 h-24"
            style={{ transform: "rotate(-90deg)" }}
            role="img"
            aria-label={`${listos} de ${total} cosas listas`}
          >
            <circle cx="42" cy="42" r={RADIO} fill="none" stroke="var(--color-border)" strokeWidth="9" />
            <circle
              className="sr-anillo"
              cx="42"
              cy="42"
              r={RADIO}
              fill="none"
              stroke={completa ? "var(--color-normal)" : "var(--color-sol)"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={CIRCUNFERENCIA * (1 - listos / total)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
            <span className="font-display text-2xl font-extrabold leading-none">
              {listos}/{total}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "var(--color-text-muted)" }}>
              listos
            </span>
          </div>
        </div>
      </div>

      <p className="sr-entra mt-4 text-[15px]" style={{ color: "var(--color-text-muted)" }}>
        Toca cada cosa cuando ya la tengas en la mochila. Tu avance se guarda en este dispositivo.
      </p>

      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {COSAS_MOCHILA.map((cosa, i) => {
          const hecho = marcados.includes(cosa.id);
          return (
            <li key={cosa.id} className="sr-entra" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
              <button
                type="button"
                aria-pressed={hecho}
                onClick={() => alternar(cosa.id)}
                className="sr-presionable w-full flex items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2.5 min-h-[60px] text-left"
                style={{
                  borderColor: hecho ? "var(--color-sol)" : "var(--color-border)",
                  backgroundColor: hecho ? "var(--color-sol-soft)" : "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              >
                <span
                  className="w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center"
                  style={{
                    borderColor: hecho ? "var(--color-sol)" : "var(--color-border)",
                    backgroundColor: hecho ? "var(--color-sol)" : "var(--color-surface)",
                  }}
                >
                  {hecho && (
                    <svg
                      className="sr-pop"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0e2d47"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  )}
                </span>
                <span>
                  <strong className="block text-[15px]">{cosa.nombre}</strong>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {cosa.detalle}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {completa && (
        <div
          role="status"
          className="sr-entra mt-5 rounded-2xl px-4 py-3 font-extrabold text-white"
          style={{ backgroundColor: "var(--color-normal)" }}
        >
          ¡Mochila lista! Siguiente paso: conoce la ruta a tu albergue.
        </div>
      )}

      <Link
        to="/mapa"
        className="sr-presionable mt-6 flex items-center justify-center rounded-2xl min-h-[54px] font-extrabold"
        style={{ backgroundColor: "var(--color-sol)", color: "var(--color-sol-texto)" }}
      >
        Paso 2: ver mi albergue en el mapa →
      </Link>
    </main>
  );
}

export default Mochila;
