import { useCallback, useEffect, useRef, useState } from "react";

const CONSULTA_REDUCIR = "(prefers-reduced-motion: reduce)";

export function prefiereMenosMovimiento() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(CONSULTA_REDUCIR).matches);
}

// true si la persona pidió "reducir movimiento" en su sistema. Se actualiza
// en vivo si cambia el ajuste con la app abierta.
export function useReducirMovimiento() {
  const [reducir, setReducir] = useState(prefiereMenosMovimiento);

  useEffect(() => {
    const consulta = window.matchMedia?.(CONSULTA_REDUCIR);
    if (!consulta?.addEventListener) return undefined;
    const alCambiar = (e) => setReducir(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return reducir;
}

const suavizar = (t) => 1 - Math.pow(1 - t, 3);

// Cuenta desde el valor anterior hasta `objetivo` (900 ms, con freno al
// final). Si el valor no es numérico, o se pidió reducir movimiento, devuelve
// el objetivo tal cual sin animar.
export function useContador(objetivo, { duracion = 900, decimales = 0 } = {}) {
  const reducir = useReducirMovimiento();
  const numero = Number(objetivo);
  const esNumero = objetivo !== null && objetivo !== undefined && objetivo !== "" && Number.isFinite(numero);
  const [mostrado, setMostrado] = useState(0);
  const desdeRef = useRef(0);

  useEffect(() => {
    if (!esNumero || reducir) return undefined;
    const desde = desdeRef.current;
    const inicio = performance.now();
    let cuadro;
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const valor = desde + (numero - desde) * suavizar(t);
      desdeRef.current = valor;
      setMostrado(valor);
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [numero, esNumero, reducir, duracion]);

  if (!esNumero) return objetivo;
  if (reducir) return numero.toFixed(decimales);
  return mostrado.toFixed(decimales);
}

// Repite una animación CSS (clase `clase`) sobre el elemento cada vez que
// `valor` cambia después del primer render: sirve para que se note cuando
// llega un dato nuevo en vivo por WebSocket.
export function useDestello(valor, clase = "pa-destello") {
  const ref = useRef(null);
  const primeraVez = useRef(true);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    el.classList.remove(clase);
    void el.offsetWidth; // fuerza reflow para reiniciar la animación
    el.classList.add(clase);
  }, [valor, clase]);

  return ref;
}

// Marca el elemento con data-visible cuando entra en pantalla (una sola vez).
// Sin IntersectionObserver (navegadores viejos, tests) queda visible de una.
export function useRevelar() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined" || prefiereMenosMovimiento()) {
      el.dataset.visible = "";
      return undefined;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.dataset.visible = "";
            observador.unobserve(entrada.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return ref;
}

// Brillo que sigue al puntero sobre una tarjeta (clase .pa-foco). Solo en
// dispositivos con mouse; en pantallas táctiles no hace nada.
export function useFoco() {
  return useCallback((e) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const caja = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - caja.left}px`);
    el.style.setProperty("--my", `${e.clientY - caja.top}px`);
  }, []);
}
