import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Hook base para "traer algo del backend y mostrarlo": maneja carga, error,
// recarga manual y (opcional) refresco periódico. Casi todos los demás hooks
// de ganchos/ son una línea encima de este.
//
// - deps: igual que useEffect -- cuando cambian, se vuelve a pedir (ej. otro sensor).
//   Tienen que ser serializables (strings, números, ids): se comparan por valor.
// - setData: para actualizaciones optimistas o por WebSocket sin volver a pedir todo.
// - intervaloMs: refresco silencioso (sin volver a mostrar el skeleton) mientras
//   la pestaña está visible; si un refresco falla se conserva el último dato.
export function useResource(cargar, deps = [], { intervaloMs } = {}) {
  const clave = JSON.stringify(deps);
  // "loading" no es un estado aparte que haya que prender al cambiar deps:
  // se deduce de si el último resultado corresponde a la clave actual. Así
  // un cambio de sensor muestra el skeleton en el mismo render, sin un
  // setState dentro del efecto.
  const [resultado, setResultado] = useState({ clave: null, data: null, error: null });
  const [recargando, setRecargando] = useState(false);

  const cargarRef = useRef(cargar);
  const claveRef = useRef(clave);
  useLayoutEffect(() => {
    cargarRef.current = cargar;
    claveRef.current = clave;
  });

  // Cada pedido lleva un número: si llega la respuesta de uno viejo (ej. el
  // usuario cambió de sensor antes de que terminara), se descarta en vez de
  // pisar los datos del pedido más nuevo.
  const ultimoPedido = useRef(0);

  const ejecutar = useCallback(async (claveDelPedido) => {
    const pedido = ++ultimoPedido.current;
    try {
      const data = await cargarRef.current();
      if (pedido !== ultimoPedido.current) return;
      setResultado({ clave: claveDelPedido, data, error: null });
    } catch (err) {
      if (pedido !== ultimoPedido.current) return;
      setResultado((prev) => ({
        clave: claveDelPedido,
        // Un refresco que falla conserva lo último que se mostró de esta misma clave.
        data: prev.clave === claveDelPedido ? prev.data : null,
        error: err.message ?? String(err),
      }));
    } finally {
      if (pedido === ultimoPedido.current) setRecargando(false);
    }
  }, []);

  useEffect(() => {
    ejecutar(clave);
  }, [clave, ejecutar]);

  useEffect(() => {
    if (!intervaloMs) return undefined;
    const id = setInterval(() => {
      if (!document.hidden) ejecutar(claveRef.current);
    }, intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs, ejecutar]);

  const setData = useCallback((valor) => {
    setResultado((prev) => ({ ...prev, data: typeof valor === "function" ? valor(prev.data) : valor }));
  }, []);

  // Recarga visible (vuelve a mostrar el skeleton), para el botón "Reintentar".
  const recargar = useCallback(() => {
    setRecargando(true);
    return ejecutar(claveRef.current);
  }, [ejecutar]);

  // Recarga silenciosa, para cuando llega un aviso por WebSocket.
  const refrescar = useCallback(() => ejecutar(claveRef.current), [ejecutar]);

  return {
    data: resultado.data,
    loading: resultado.clave !== clave || recargando,
    error: resultado.clave === clave ? resultado.error : null,
    setData,
    recargar,
    refrescar,
  };
}
