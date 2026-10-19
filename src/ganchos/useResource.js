import { useCallback, useEffect, useRef, useState } from "react";

// Hook base para "traer algo del backend y mostrarlo": maneja carga, error,
// recarga manual y (opcional) refresco periódico. Casi todos los demás hooks
// de ganchos/ son una línea encima de este.
//
// - deps: igual que useEffect -- cuando cambian, se vuelve a pedir (ej. otro sensor).
// - setData: para actualizaciones optimistas o por WebSocket sin volver a pedir todo.
// - intervaloMs: refresco silencioso (sin volver a mostrar el skeleton) mientras
//   la pestaña está visible; si un refresco falla se conserva el último dato.
export function useResource(cargar, deps = [], { intervaloMs } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;
  // Cada pedido lleva un número: si llega la respuesta de uno viejo (ej. el
  // usuario cambió de sensor antes de que terminara), se descarta en vez de
  // pisar los datos del pedido más nuevo.
  const ultimoPedido = useRef(0);

  const ejecutar = useCallback(async ({ silencioso = false } = {}) => {
    const pedido = ++ultimoPedido.current;
    if (!silencioso) setLoading(true);
    try {
      const resultado = await cargarRef.current();
      if (pedido !== ultimoPedido.current) return;
      setData(resultado);
      setError(null);
    } catch (err) {
      if (pedido !== ultimoPedido.current) return;
      setError(err.message ?? String(err));
    } finally {
      if (pedido === ultimoPedido.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    ejecutar();
    // deps las define quien llama, igual que en useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!intervaloMs) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) ejecutar({ silencioso: true });
    }, intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs, ejecutar]);

  const recargar = useCallback(() => ejecutar(), [ejecutar]);
  const refrescar = useCallback(() => ejecutar({ silencioso: true }), [ejecutar]);

  return { data, loading, error, setData, recargar, refrescar };
}
