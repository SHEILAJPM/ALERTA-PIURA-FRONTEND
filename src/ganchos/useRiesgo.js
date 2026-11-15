import { useState } from "react";
import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getRiesgo } from "../utilidades/api";

const CLAVE_UBICACION = "piura-alerta-ubicacion";
const REFRESCO_MS = 60_000;

// La ubicación se guarda solo en este navegador para no volver a pedir
// permiso en cada visita; el backend la usa para calcular y no la guarda.
function leerUbicacionGuardada() {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE_UBICACION));
    return Number.isFinite(guardada?.lat) && Number.isFinite(guardada?.lon) ? guardada : null;
  } catch {
    return null;
  }
}

function guardarUbicacion(ubicacion) {
  try {
    localStorage.setItem(CLAVE_UBICACION, JSON.stringify(ubicacion));
  } catch {
    // sin almacenamiento (modo privado): igual se usa en esta visita
  }
}

export function useRiesgo(sensorCodigo) {
  const [ubicacion, setUbicacion] = useState(leerUbicacionGuardada);
  const [buscando, setBuscando] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);

  const { data, loading, error, refrescar } = useResource(
    () => getRiesgo(sensorCodigo, ubicacion),
    [sensorCodigo, ubicacion?.lat ?? null, ubicacion?.lon ?? null],
    { intervaloMs: REFRESCO_MS }
  );

  // Un cambio de estado del río o un aviso de lluvia cambian el puntaje:
  // se recalcula de inmediato en vez de esperar al próximo minuto.
  useWebSocketEvent("evento_alerta", (evento) => {
    if (evento.sensor_codigo === sensorCodigo) refrescar();
  });
  useWebSocketEvent("aviso_lluvia", () => refrescar());

  function usarMiUbicacion() {
    setErrorUbicacion(null);
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite obtener tu ubicación.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nueva = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lon: Number(pos.coords.longitude.toFixed(5)),
        };
        guardarUbicacion(nueva);
        setUbicacion(nueva);
        setBuscando(false);
      },
      () => {
        setErrorUbicacion("No se pudo obtener tu ubicación. Revisa el permiso del navegador.");
        setBuscando(false);
      },
      { timeout: 10000, maximumAge: 5 * 60_000 }
    );
  }

  return {
    riesgo: data,
    loading,
    error,
    conUbicacion: Boolean(ubicacion),
    usarMiUbicacion,
    buscandoUbicacion: buscando,
    errorUbicacion,
  };
}
