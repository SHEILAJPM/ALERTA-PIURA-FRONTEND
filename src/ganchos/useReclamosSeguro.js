import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getMisReclamosSeguro, getReclamosSeguro } from "../utilidades/api";

// Reclamos del propio usuario (página "Mi póliza").
export function useMisReclamosSeguro() {
  return useResource(getMisReclamosSeguro, []);
}

// Todos los reclamos, para el panel de administrador. Uno nuevo llega por
// WebSocket (reclamo_seguro_creado, solo a administradores); se vuelve a
// pedir la lista en vez de insertar el evento tal cual, porque el evento no
// trae los datos que el panel necesita (nombre del usuario, tope del plan).
export function useReclamosSeguroAdmin() {
  const recurso = useResource(getReclamosSeguro, []);
  const { refrescar } = recurso;

  useWebSocketEvent("reclamo_seguro_creado", () => refrescar());

  return recurso;
}
