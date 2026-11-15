import { useEffect, useState } from "react";
import { ESTILO_NIVEL } from "../utilidades/accionRecomendada";

function prefiereMenosMovimiento() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Anillo con el puntaje de riesgo (0–100). El número cuenta hasta el valor
// real y el arco se llena a la vez; con "reducir movimiento" aparece directo.
function AnilloPuntaje({ puntaje, nivel, tamano = 112, grosor = 11 }) {
  const [mostrado, setMostrado] = useState(() => (prefiereMenosMovimiento() ? puntaje : 0));

  useEffect(() => {
    if (prefiereMenosMovimiento()) {
      const id = requestAnimationFrame(() => setMostrado(puntaje));
      return () => cancelAnimationFrame(id);
    }
    let raf;
    const inicio = performance.now();
    const paso = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / 1200);
      setMostrado(Math.round(puntaje * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [puntaje]);

  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const color = ESTILO_NIVEL[nivel]?.color ?? "var(--color-primary)";

  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg
        viewBox={`0 0 ${tamano} ${tamano}`}
        width={tamano}
        height={tamano}
        style={{ transform: "rotate(-90deg)" }}
        role="img"
        aria-label={`Puntaje de riesgo ${puntaje} de 100`}
      >
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={grosor}
        />
        <circle
          className="sr-anillo"
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - mostrado / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="font-display font-extrabold leading-none" style={{ fontSize: tamano * 0.32 }}>
          {mostrado}
        </span>
        <span className="text-[11px] font-bold" style={{ color: "var(--color-text-muted)" }}>
          de 100
        </span>
      </div>
    </div>
  );
}

export default AnilloPuntaje;
