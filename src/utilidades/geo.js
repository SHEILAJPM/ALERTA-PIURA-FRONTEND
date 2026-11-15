const RADIO_TIERRA_KM = 6371;

function aRadianes(grados) {
  return (grados * Math.PI) / 180;
}

// Distancia en línea recta (haversine) entre dos puntos {lat, lon}. Para
// ordenar reportes por cercanía alcanza de sobra: no es una ruta a pie.
export function distanciaKm(a, b) {
  const dLat = aRadianes(b.lat - a.lat);
  const dLon = aRadianes(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

// GeoJSON Point de PostGIS ({ type, coordinates: [lon, lat] }) -> {lat, lon}.
export function puntoDesdeGeoJSON(geojson) {
  const [lon, lat] = geojson?.coordinates ?? [];
  return typeof lon === "number" && typeof lat === "number" ? { lat, lon } : null;
}

export function formatearDistancia(km) {
  if (km == null || !Number.isFinite(km)) return "";
  // Redondeado a decenas, 0.996 km daría "a 1000 m": desde ahí se muestra en km.
  const metros = Math.max(10, Math.round((km * 1000) / 10) * 10);
  if (metros < 1000) return `a ${metros} m`;
  if (km < 10) return `a ${km.toFixed(1)} km`;
  return `a ${Math.round(km)} km`;
}

// Paso de una persona a pie con apuro y sin cargar mucho (~4.5 km/h). Es
// sobre la distancia en línea recta, así que el tiempo real por calles es
// algo mayor: la app lo muestra como aproximado.
const KM_POR_HORA_A_PIE = 4.5;

export function minutosAPie(km) {
  if (km == null || !Number.isFinite(km)) return null;
  return Math.max(1, Math.round((km / KM_POR_HORA_A_PIE) * 60));
}

// El albergue activo más cercano a `punto` que todavía tiene espacio. Si
// todos están llenos, devuelve el más cercano igual (marcado como lleno):
// mejor saber dónde está que no mostrar nada.
export function albergueMasCercano(albergues, punto) {
  if (!punto || !Array.isArray(albergues)) return null;
  const candidatos = albergues
    .filter((a) => a.activo !== false)
    .map((a) => {
      const ubicacion = puntoDesdeGeoJSON(a.ubicacion);
      return ubicacion ? { albergue: a, ubicacion, km: distanciaKm(punto, ubicacion) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.km - b.km);
  if (candidatos.length === 0) return null;

  const conEspacio = candidatos.find((c) => c.albergue.ocupacion_actual < c.albergue.capacidad);
  const elegido = conEspacio ?? candidatos[0];
  return {
    ...elegido,
    libres: Math.max(0, elegido.albergue.capacidad - elegido.albergue.ocupacion_actual),
    lleno: !conEspacio,
  };
}

// Ruta a pie en Google Maps: no hay motor de ruteo propio, así que se
// delega a un servicio real en vez de dibujar una ruta inventada.
export function urlRutaAPie(destino, origen = null) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destino.lat},${destino.lon}`,
    travelmode: "walking",
  });
  if (origen) params.set("origin", `${origen.lat},${origen.lon}`);
  return `https://www.google.com/maps/dir/?${params}`;
}
