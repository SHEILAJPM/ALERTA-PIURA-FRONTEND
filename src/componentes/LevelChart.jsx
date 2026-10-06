import { useMemo } from "react";

const ANCHO = 600;
const ALTO = 200;
const PADDING = 24;

// Convierte la polilínea en una curva suave (Catmull-Rom -> Bézier) para que
// el ruido natural del sensor se lea como tendencia y no como sierra dentada.
function suavizarLinea(coords) {
  if (coords.length < 3) {
    return coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  }

  let d = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function LevelChart({ puntos, umbrales }) {
  const { pathLinea, pathArea, minY, maxY, ultimo } = useMemo(() => {
    if (!puntos || puntos.length < 2) return {};

    const niveles = puntos.map((p) => Number(p.nivel_cm));
    const techoUmbral = umbrales?.alertaRoja ? Number(umbrales.alertaRoja) : Math.max(...niveles);
    const maxY = Math.max(...niveles, techoUmbral) * 1.05;
    const minY = Math.min(...niveles, 0) * 0.95;

    const escalarX = (i) => PADDING + (i / (puntos.length - 1)) * (ANCHO - PADDING * 2);
    const escalarY = (v) => ALTO - PADDING - ((v - minY) / (maxY - minY || 1)) * (ALTO - PADDING * 2);

    const coords = niveles.map((v, i) => [escalarX(i), escalarY(v)]);
    const pathLinea = suavizarLinea(coords);
    const ultimaX = coords[coords.length - 1][0];
    const primeraX = coords[0][0];
    const pathArea = `${pathLinea} L${ultimaX},${ALTO - PADDING} L${primeraX},${ALTO - PADDING} Z`;

    return { pathLinea, pathArea, minY, maxY, ultimo: coords[coords.length - 1] };
  }, [puntos, umbrales]);

  if (!puntos || puntos.length < 2) {
    return (
      <div
        className="h-48 flex items-center justify-center text-sm text-center px-4"
        style={{ color: "var(--color-text-muted)" }}
      >
        Aún no hay suficientes lecturas recientes para graficar la tendencia.
      </div>
    );
  }

  const escalarYUmbral = (v) => ALTO - PADDING - ((v - minY) / (maxY - minY || 1)) * (ALTO - PADDING * 2);

  return (
    <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full h-48">
      <defs>
        <linearGradient id="areaNivel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-dorado)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-dorado)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {umbrales?.prealerta && (
        <line
          x1={PADDING}
          x2={ANCHO - PADDING}
          y1={escalarYUmbral(umbrales.prealerta)}
          y2={escalarYUmbral(umbrales.prealerta)}
          stroke="var(--color-prealerta)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      )}

      {umbrales?.alertaRoja && (
        <line
          x1={PADDING}
          x2={ANCHO - PADDING}
          y1={escalarYUmbral(umbrales.alertaRoja)}
          y2={escalarYUmbral(umbrales.alertaRoja)}
          stroke="var(--color-alerta)"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      )}

      <path d={pathArea} fill="url(#areaNivel)" />
      <path
        d={pathLinea}
        fill="none"
        stroke="var(--color-dorado)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {ultimo && <circle cx={ultimo[0]} cy={ultimo[1]} r="4" fill="var(--color-dorado)" />}
    </svg>
  );
}

export default LevelChart;
