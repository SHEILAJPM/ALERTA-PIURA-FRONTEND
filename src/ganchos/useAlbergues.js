import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getAlbergues } from "../utilidades/api";

// Albergues activos. El backend avisa por WebSocket cada alta, baja o cambio
// de aforo (ver albergues.routes.js), así el mapa público y el panel admin
// muestran el aforo real sin recargar -- dato crítico durante una evacuación.
export function useAlbergues() {
  const recurso = useResource(getAlbergues, []);
  const { setData } = recurso;

  useWebSocketEvent("albergue_creado", (albergue) => {
    setData((prev) => (prev?.some((a) => a.id === albergue.id) ? prev : [...(prev ?? []), albergue]));
  });

  useWebSocketEvent("albergue_actualizado", (cambio) => {
    setData((prev) => prev?.map((a) => (a.id === cambio.id ? { ...a, ...cambio } : a)));
  });

  useWebSocketEvent("albergue_eliminado", ({ id }) => {
    setData((prev) => prev?.filter((a) => a.id !== id));
  });

  return recurso;
}
