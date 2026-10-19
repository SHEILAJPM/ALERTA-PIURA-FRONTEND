import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getHistorico } from "../utilidades/api";

// Serie de lecturas de la ventana pedida (por defecto 3 h) para el gráfico de
// tendencia. Las lecturas nuevas llegan por WebSocket y se agregan al final,
// descartando las que ya salieron de la ventana.
export function useHistorico(sensorCodigo, minutos = 180) {
  const { data, loading, error, setData, recargar } = useResource(
    () => getHistorico(sensorCodigo, minutos),
    [sensorCodigo, minutos]
  );

  useWebSocketEvent("lectura", (lectura) => {
    if (lectura.sensor_codigo !== sensorCodigo) return;
    const limite = Date.now() - minutos * 60_000;
    setData((prev) => [
      ...(prev ?? []).filter((p) => new Date(p.medido_en).getTime() >= limite),
      {
        nivel_cm: lectura.nivel_cm,
        porcentaje: lectura.porcentaje,
        estado: lectura.estado,
        medido_en: lectura.medido_en,
      },
    ]);
  });

  return { puntos: data ?? [], loading, error, recargar };
}
