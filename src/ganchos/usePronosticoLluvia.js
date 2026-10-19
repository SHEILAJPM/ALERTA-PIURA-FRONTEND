import { useResource } from "./useResource";

// Pronóstico de lluvia para Piura desde Open-Meteo (gratis, sin clave ni
// cuenta). Complementa al sensor: el río sube horas DESPUÉS de que llueve
// en la cuenca, así que la probabilidad de lluvia anticipa lo que el sensor
// todavía no puede ver.
const PIURA = { lat: -5.1945, lon: -80.6328 };
const HORAS = 24;
const REFRESCO_MS = 30 * 60_000;

async function obtenerPronostico() {
  const params = new URLSearchParams({
    latitude: PIURA.lat,
    longitude: PIURA.lon,
    hourly: "precipitation_probability,precipitation",
    forecast_hours: HORAS,
    timezone: "America/Lima",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
  const { hourly } = await res.json();

  const probabilidades = (hourly?.precipitation_probability ?? []).filter((v) => typeof v === "number");
  const milimetros = (hourly?.precipitation ?? []).filter((v) => typeof v === "number");
  if (probabilidades.length === 0) throw new Error("Pronóstico sin datos");

  return {
    horas: HORAS,
    probabilidadMax: Math.max(...probabilidades),
    mmEsperados: milimetros.reduce((total, mm) => total + mm, 0),
  };
}

export function usePronosticoLluvia() {
  return useResource(obtenerPronostico, [], { intervaloMs: REFRESCO_MS });
}
