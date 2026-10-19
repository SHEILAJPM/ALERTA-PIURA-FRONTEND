import { useState } from "react";
import Icon from "./Icon";

// Medidas de un saco de polipropileno estándar (50 x 80 cm) llenado a 2/3
// con arena, ya aplastado en su lugar: ~40 cm de largo útil y ~12 cm de alto.
// Se colocan traslapados (cada fila tapa las juntas de la de abajo), por eso
// el largo útil es menor que el largo del saco.
const LARGO_UTIL_M = 0.4;
const ALTO_FILA_M = 0.12;
const KG_ARENA_POR_SACO = 18;
// Por encima de ~50 cm una sola columna de sacos se vuelca: la barrera se
// arma en pirámide, con una base de varios sacos de ancho.
const ALTO_MAX_UNA_COLUMNA_M = 0.5;

function calcular(anchoM, altoM) {
  const filas = Math.ceil(altoM / ALTO_FILA_M);
  const sacosPorFila = Math.ceil(anchoM / LARGO_UTIL_M) + 1;
  if (altoM <= ALTO_MAX_UNA_COLUMNA_M) {
    return { sacos: filas * sacosPorFila, filas, piramide: false };
  }
  // Pirámide: la base tiene tantas columnas como haga falta para que cada
  // nivel retroceda una columna (ancho de la base ≈ 3 veces la altura).
  let sacos = 0;
  for (let fila = 0; fila < filas; fila++) {
    const columnas = Math.max(1, Math.ceil((filas - fila) / 2));
    sacos += columnas * sacosPorFila;
  }
  return { sacos, filas, piramide: true };
}

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

// Cuántos sacos de arena hacen falta para tapar una puerta o un tramo de
// muro: pregunta frecuente justo cuando el río empieza a subir.
function CalculadoraSacos() {
  const [ancho, setAncho] = useState("1");
  const [alto, setAlto] = useState("40");

  const anchoM = Number(ancho);
  const altoM = Number(alto) / 100;
  const valido = anchoM > 0 && anchoM <= 50 && altoM > 0 && altoM <= 1.5;
  const resultado = valido ? calcular(anchoM, altoM) : null;

  return (
    <section
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h3 className="font-bold flex items-center gap-2">
        <Icon name="bi-calculator" aria-hidden="true" style={{ color: "var(--color-primary)" }} />
        ¿Cuántos sacos de arena necesito?
      </h3>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <label className="text-sm">
          <span className="block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Ancho a cubrir (m)
          </span>
          <input
            type="number"
            min="0.1"
            max="50"
            step="0.1"
            value={ancho}
            onChange={(e) => setAncho(e.target.value)}
            className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
            style={inputStyle}
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Altura de la barrera (cm)
          </span>
          <input
            type="number"
            min="10"
            max="150"
            step="5"
            value={alto}
            onChange={(e) => setAlto(e.target.value)}
            className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
            style={inputStyle}
          />
        </label>
      </div>

      {resultado ? (
        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: "var(--color-primary-soft)" }}>
          <p className="text-3xl font-bold font-mono-data" style={{ color: "var(--color-primary)" }}>
            ~{resultado.sacos} sacos
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text)" }}>
            {resultado.filas} {resultado.filas === 1 ? "fila" : "filas"}
            {resultado.piramide ? " en forma de pirámide" : ""} · unos{" "}
            {Math.round((resultado.sacos * KG_ARENA_POR_SACO) / 10) * 10} kg de arena
          </p>
        </div>
      ) : (
        <p className="text-sm mt-4" style={{ color: "var(--color-alerta)" }}>
          Ingresa un ancho de hasta 50 m y una altura de hasta 150 cm.
        </p>
      )}

      <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
        Llena los sacos solo hasta 2/3, colócalos traslapados como ladrillos y pisa cada uno para que no
        queden huecos. Es una estimación: compra un 10% más.
      </p>
    </section>
  );
}

export default CalculadoraSacos;
