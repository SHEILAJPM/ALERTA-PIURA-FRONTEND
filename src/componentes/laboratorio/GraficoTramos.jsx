import { useMemo } from "react";
import { COLOR_TRAMO } from "../../utilidades/simulacion";

const ANCHO = 600;
const ALTO = 200;
const M = { arriba: 14, derecha: 14, abajo: 26, izquierda: 52 };

function formatoEje(valor) {
  const abs = Math.abs(valor);
  if (abs >= 1000) return `${(valor / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })} k`;
  return valor.toLocaleString("es-PE", { maximumFractionDigits: abs < 10 ? 2 : 0 });
}

// Curvas de una magnitud (nivel, caudal, área) para cada tramo contra el
// tiempo simulado, con una línea vertical en el instante que se reproduce.
function GraficoTramos({ titulo, unidad, series, tramos, campo, t, duracion }) {
  const datos = useMemo(() => {
    const valores = series.map((p) => p[campo]).filter((v) => v !== null);
    if (valores.length < 2 || !duracion) return null;
    let min = Math.min(...valores);
    let max = Math.max(...valores);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const x = (tiempo) => M.izquierda + (tiempo / duracion) * (ANCHO - M.izquierda - M.derecha);
    const y = (v) => M.arriba + (1 - (v - min) / (max - min)) * (ALTO - M.arriba - M.abajo);
    const lineas = tramos.map((tramo) => {
      // Se unen los puntos que tienen valor: el contrato permite null donde una
      // magnitud no se calculó en ese paso (p. ej. el área se calcula cada
      // cierto intervalo y se interpola), y cortar en cada null dejaría la
      // curva hecha puntos sueltos invisibles.
      const puntos = series.filter((p) => p.tramo === tramo && p[campo] !== null);
      const d = puntos
        .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p[campo]).toFixed(1)}`)
        .join(" ");
      return { tramo, d, hayDatos: puntos.length > 0 };
    });
    return { min, max, x, y, lineas };
  }, [series, tramos, campo, duracion]);

  if (!datos) return null;
  const cursorX = datos.x(Math.min(t, duracion));

  return (
    <figure className="flex flex-col gap-2 min-w-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-base" style={{ color: "var(--color-title)" }}>
          {titulo}{" "}
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            ({unidad})
          </span>
        </span>
        <span
          className="flex flex-wrap gap-3 text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          {datos.lineas
            .filter((l) => l.hayDatos)
            .map((l) => (
              <span key={l.tramo} className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-1 rounded-full"
                  style={{ backgroundColor: COLOR_TRAMO[tramos.indexOf(l.tramo) % COLOR_TRAMO.length] }}
                />
                {l.tramo}
              </span>
            ))}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${titulo} simulado por tramo, de 0 a ${Math.round(duracion)} segundos`}
      >
        {[datos.min, (datos.min + datos.max) / 2, datos.max].map((v) => (
          <g key={v}>
            <line
              x1={M.izquierda}
              x2={ANCHO - M.derecha}
              y1={datos.y(v)}
              y2={datos.y(v)}
              stroke="var(--color-border)"
              strokeDasharray="3 4"
            />
            <text
              x={M.izquierda - 8}
              y={datos.y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-text-muted)"
            >
              {formatoEje(v)}
            </text>
          </g>
        ))}
        <text x={M.izquierda} y={ALTO - 6} fontSize="11" fill="var(--color-text-muted)">
          0 s
        </text>
        <text
          x={ANCHO - M.derecha}
          y={ALTO - 6}
          fontSize="11"
          textAnchor="end"
          fill="var(--color-text-muted)"
        >
          {Math.round(duracion)} s
        </text>
        {datos.lineas.map((l) => (
          <path
            key={l.tramo}
            d={l.d}
            fill="none"
            stroke={COLOR_TRAMO[tramos.indexOf(l.tramo) % COLOR_TRAMO.length]}
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        <line
          x1={cursorX}
          x2={cursorX}
          y1={M.arriba}
          y2={ALTO - M.abajo}
          stroke="var(--color-demo)"
          strokeWidth="1.5"
        />
      </svg>
    </figure>
  );
}

export default GraficoTramos;
