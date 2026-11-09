import { useResource } from "./useResource";
import { normalizarSismos, PIURA } from "../utilidades/sismos";

// Sismos reales de los últimos 30 días cerca de Piura, desde el catálogo
// público del USGS (gratis, sin clave, con CORS). Piura está en zona sísmica
// y un sismo fuerte en temporada de lluvias puede dañar diques y defensas
// ribereñas, por eso se muestra junto al monitoreo del río.
const RADIO_KM = 400;
const DIAS = 30;
const MAXIMO = 6;
const REFRESCO_MS = 10 * 60_000;

async function obtenerSismos() {
  const desde = new Date(Date.now() - DIAS * 86_400_000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    format: "geojson",
    latitude: PIURA.lat,
    longitude: PIURA.lon,
    maxradiuskm: RADIO_KM,
    minmagnitude: 3,
    starttime: desde,
    orderby: "time",
    limit: MAXIMO,
  });
  const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`);
  if (!res.ok) throw new Error(`USGS respondió ${res.status}`);
  return normalizarSismos(await res.json());
}

export function useSismos() {
  return useResource(obtenerSismos, [], { intervaloMs: REFRESCO_MS });
}

export const SISMOS_RADIO_KM = RADIO_KM;
export const SISMOS_DIAS = DIAS;
