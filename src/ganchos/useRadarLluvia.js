import { useResource } from "./useResource";

// Cuadros del radar de lluvia de RainViewer (gratis, sin clave): unas 2 horas
// hacia atrás, uno cada 10 minutos. Solo trae la lista de cuadros; las
// imágenes las pide Leaflet como teselas (ver RadarLluvia.jsx).
const API = "https://api.rainviewer.com/public/weather-maps.json";
const REFRESCO_MS = 10 * 60_000;

// Esquema de color 2 ("Universal Blue"), suavizado y nieve activados: los
// únicos que la API gratuita sigue sirviendo.
export function urlTeselaRadar(host, path) {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}

export function cuadrosDesdeRespuesta(respuesta) {
  const host = respuesta?.host;
  const pasados = respuesta?.radar?.past ?? [];
  if (!host || pasados.length === 0) throw new Error("El radar no devolvió cuadros");
  return pasados
    .filter((c) => typeof c?.time === "number" && typeof c?.path === "string")
    .map((c) => ({ fecha: new Date(c.time * 1000), url: urlTeselaRadar(host, c.path) }));
}

async function obtenerCuadros() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`RainViewer respondió ${res.status}`);
  return cuadrosDesdeRespuesta(await res.json());
}

export function useRadarLluvia() {
  return useResource(obtenerCuadros, [], { intervaloMs: REFRESCO_MS });
}
