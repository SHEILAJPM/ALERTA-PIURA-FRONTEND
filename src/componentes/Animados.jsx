import { useContador, useDestello, useRevelar } from "../ganchos/useAnimaciones";

// Número que cuenta hasta su valor y destella cuando cambia (dato en vivo).
// Sin `decimales`, usa los mismos que trae el valor ("123.5" → 1), así la
// animación termina mostrando exactamente el dato real.
export function NumeroAnimado({ valor, decimales, className = "", style }) {
  const dec = decimales ?? Math.min(2, String(valor ?? "").split(".")[1]?.length ?? 0);
  const mostrado = useContador(valor, { decimales: dec });
  const ref = useDestello(valor);
  return (
    <span ref={ref} className={`inline-block tabular-nums ${className}`} style={style}>
      {mostrado ?? "—"}
    </span>
  );
}

// Envuelve una sección para que entre con fade + slide al aparecer en
// pantalla al hacer scroll.
export function Revelar({ children, className = "", as: Etiqueta = "div", ...props }) {
  const ref = useRevelar();
  return (
    <Etiqueta ref={ref} className={`pa-revelar ${className}`} {...props}>
      {children}
    </Etiqueta>
  );
}

// Check que se dibuja solo: confirmación de que algo salió bien.
export function CheckAnimado({ tamano = 56 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 52 52" className="pa-check shrink-0" aria-hidden="true">
      <circle cx="26" cy="26" r="24" fill="none" stroke="var(--color-normal)" strokeWidth="3" />
      <path
        d="M15 27l7 7 15-16"
        fill="none"
        stroke="var(--color-normal)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
