import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getAlertasSOS } from "../utilidades/api";
import { avisarConSonido } from "../utilidades/sonido";

// SOS pendientes para la consola de despacho. Llegan en vivo por WebSocket
// (solo a sockets autenticados como administrador/defensa civil, ver
// transmitirRestringido en el backend) y desaparecen apenas alguien las
// marca atendidas, desde esta u otra consola.
export function useAlertasSOS() {
  const recurso = useResource(() => getAlertasSOS(), []);
  const { setData } = recurso;

  useWebSocketEvent("alerta_sos", (alerta) => {
    setData((prev) => (prev?.some((a) => a.id === alerta.id) ? prev : [alerta, ...(prev ?? [])]));
    // Un SOS no puede depender de que el despachador esté mirando la pantalla.
    avisarConSonido({ veces: 2 });
  });

  useWebSocketEvent("alerta_sos_actualizada", (alerta) => {
    setData((prev) =>
      alerta.estado === "pendiente"
        ? prev?.map((a) => (a.id === alerta.id ? { ...a, ...alerta } : a))
        : prev?.filter((a) => a.id !== alerta.id)
    );
  });

  return recurso;
}
