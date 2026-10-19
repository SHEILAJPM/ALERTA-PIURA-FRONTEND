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
    Math.sin(dLat / 2) ** 2 + Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

// GeoJSON Point de PostGIS ({ type, coordinates: [lon, lat] }) -> {lat, lon}.
export function puntoDesdeGeoJSON(geojson) {
  const [lon, lat] = geojson?.coordinates ?? [];
  return typeof lon === "number" && typeof lat === "number" ? { lat, lon } : null;
}

export function formatearDistancia(km) {
  if (km == null || !Number.isFinite(km)) return "";
  if (km < 1) return `a ${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `a ${km.toFixed(1)} km`;
  return `a ${Math.round(km)} km`;
}
