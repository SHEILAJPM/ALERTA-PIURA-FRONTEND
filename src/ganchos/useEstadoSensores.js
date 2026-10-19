import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getEstadoSensores } from "../utilidades/api";

const REFRESCO_MS = 30_000;

// Estado en vivo de cada nodo: última lectura y si está "en línea" (ver
// calcularEnLinea en el backend). El WebSocket actualiza la última lectura
// al instante; el refresco cada 30 s es el que detecta que un nodo dejó de
// reportar, porque un sensor caído justamente no manda ningún evento.
export function useEstadoSensores() {
  const recurso = useResource(getEstadoSensores, [], { intervaloMs: REFRESCO_MS });
  const { setData } = recurso;

  useWebSocketEvent("lectura", (lectura) => {
    setData((prev) =>
      prev?.map((s) =>
        s.codigo === lectura.sensor_codigo
          ? {
              ...s,
              en_linea: true,
              ultima_lectura: {
                nivel_cm: lectura.nivel_cm,
                estado: lectura.estado,
                medido_en: lectura.medido_en,
              },
            }
          : s
      )
    );
  });

  return recurso;
}
