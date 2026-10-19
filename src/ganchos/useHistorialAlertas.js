import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getHistorialAlertas } from "../utilidades/api";

// Historial público de cambios de estado del río. Un cambio nuevo llega por
// WebSocket (evento_alerta) y se agrega arriba sin volver a pedir la lista.
export function useHistorialAlertas(limite = 30) {
  const recurso = useResource(() => getHistorialAlertas(limite), [limite]);
  const { setData } = recurso;

  useWebSocketEvent("evento_alerta", (evento) => {
    setData((prev) => {
      if (prev?.some((e) => e.id === evento.id)) return prev;
      // El evento en vivo no trae el nombre del sensor (solo su código):
      // se toma de un evento previo del mismo sensor si lo hay.
      const nombre = prev?.find((e) => e.sensor_codigo === evento.sensor_codigo)?.sensor_nombre;
      return [{ ...evento, sensor_nombre: nombre ?? evento.sensor_codigo }, ...(prev ?? [])].slice(0, limite);
    });
  });

  return recurso;
}
