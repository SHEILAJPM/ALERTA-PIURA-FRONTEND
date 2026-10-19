import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getUltimaLectura } from "../utilidades/api";

// La predicción (minutos para alerta roja) se calcula en el backend con la
// tendencia reciente: el WebSocket trae el nivel nuevo al instante, pero la
// predicción se refresca aparte cada minuto en vez de pedirla en cada lectura.
const REFRESCO_PREDICCION_MS = 60_000;

export function useUltimaLectura(sensorCodigo) {
  const { data, loading, error, setData, recargar, refrescar } = useResource(
    // 404 = el sensor existe pero todavía no reportó nada: es un estado
    // normal (sensor recién registrado), no un error de conexión.
    () =>
      getUltimaLectura(sensorCodigo).catch((err) => {
        if (err.status === 404) return null;
        throw err;
      }),
    [sensorCodigo],
    { intervaloMs: REFRESCO_PREDICCION_MS }
  );

  useWebSocketEvent("lectura", (lectura) => {
    if (lectura.sensor_codigo !== sensorCodigo) return;
    setData((prev) => ({
      ...prev,
      id: lectura.id,
      nivel_cm: lectura.nivel_cm,
      porcentaje: lectura.porcentaje,
      estado: lectura.estado,
      medido_en: lectura.medido_en,
    }));
  });

  // Un cambio de estado (ej. entra en prealerta) sí amerita la predicción
  // nueva de inmediato, sin esperar al próximo refresco.
  useWebSocketEvent("evento_alerta", (evento) => {
    if (evento.sensor_codigo === sensorCodigo) refrescar();
  });

  return {
    lectura: data,
    loading,
    error,
    sinLecturas: !loading && !error && data === null,
    recargar,
  };
}
