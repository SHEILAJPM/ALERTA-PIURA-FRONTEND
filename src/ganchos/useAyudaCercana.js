import { useResource } from "./useResource";

// Hospitales/postas, comisarías y bomberos de Piura desde OpenStreetMap (API
// Overpass, gratis y sin clave). Es una capa opcional del mapa: si Overpass
// tarda o falla, RiesgoMap simplemente no la muestra.
//
// Se cachea 24 h en el navegador: estos lugares casi no cambian y Overpass es
// un servicio comunitario con límites de uso, no hay por qué pedirle lo mismo
// en cada visita al mapa.
const CENTRO = { lat: -5.1945, lon: -80.6328 };
const RADIO_M = 7000;
const CLAVE_CACHE = "piura-alerta-ayuda-cercana";
const VIGENCIA_CACHE_MS = 24 * 60 * 60_000;

const TIPOS = {
  hospital: { letra: "H", color: "#c1272d", etiqueta: "Hospital" },
  clinic: { letra: "H", color: "#c1272d", etiqueta: "Posta / clínica" },
  police: { letra: "P", color: "#0a2f52", etiqueta: "Comisaría" },
  fire_station: { letra: "B", color: "#e8580c", etiqueta: "Bomberos" },
};

function leerCache() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CACHE));
    if (guardado && Date.now() - guardado.guardadoEn < VIGENCIA_CACHE_MS) return guardado.puntos;
  } catch {
    // cache corrupta o inaccesible: se vuelve a pedir
  }
  return null;
}

function guardarCache(puntos) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify({ guardadoEn: Date.now(), puntos }));
  } catch {
    // sin espacio: la próxima visita simplemente vuelve a pedir
  }
}

async function obtenerPuntosAyuda() {
  const enCache = leerCache();
  if (enCache) return enCache;

  const alrededor = `(around:${RADIO_M},${CENTRO.lat},${CENTRO.lon})`;
  const consulta = `[out:json][timeout:25];
(
  nwr["amenity"~"^(hospital|clinic)$"]${alrededor};
  nwr["amenity"="police"]${alrededor};
  nwr["amenity"="fire_station"]${alrededor};
);
out center 300;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(consulta)}`,
  });
  if (!res.ok) throw new Error(`Overpass respondió ${res.status}`);
  const { elements = [] } = await res.json();

  const puntos = elements
    .map((el) => {
      const tipo = TIPOS[el.tags?.amenity];
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!tipo || typeof lat !== "number" || typeof lon !== "number") return null;
      return {
        id: `${el.type}/${el.id}`,
        lat,
        lon,
        nombre: el.tags.name ?? tipo.etiqueta,
        etiqueta: tipo.etiqueta,
        letra: tipo.letra,
        color: tipo.color,
      };
    })
    .filter(Boolean);

  guardarCache(puntos);
  return puntos;
}

export function useAyudaCercana() {
  return useResource(obtenerPuntosAyuda, []);
}
