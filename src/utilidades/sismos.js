import { distanciaKm } from "./geo";

// Centro de referencia para medir qué tan lejos fue cada sismo.
export const PIURA = { lat: -5.1945, lon: -80.6328 };

const RUMBOS = { N: "N", S: "S", E: "E", W: "O" };
const PAISES = { Peru: "Perú", Ecuador: "Ecuador", Colombia: "Colombia", Brazil: "Brasil" };

// El USGS describe el lugar en inglés ("37 km ESE of Cañaveral, Peru"); lo
// pasamos a "a 37 km al ESE de Cañaveral, Perú". Si llega en otro formato
// (ej. "off the coast of northern Peru") se devuelve tal cual.
export function traducirLugar(lugar) {
  if (!lugar) return "Ubicación desconocida";
  const conPais = lugar.replace(/, ([A-Za-z ]+)$/, (_, pais) => `, ${PAISES[pais] ?? pais}`);
  const m = conPais.match(/^(\d+) km ([NSEW]{1,3}) of (.+)$/);
  if (!m) return conPais;
  const rumbo = m[2]
    .split("")
    .map((letra) => RUMBOS[letra])
    .join("");
  return `a ${m[1]} km al ${rumbo} de ${m[3]}`;
}

// Escala simple para el color: < 4 casi no se siente, 4–5.4 se siente
// claramente, ≥ 5.5 puede causar daños.
export function nivelMagnitud(magnitud) {
  if (magnitud >= 5.5) return "alerta";
  if (magnitud >= 4) return "prealerta";
  return "normal";
}

// GeoJSON del USGS -> lista lista para mostrar, del más reciente al más antiguo.
export function normalizarSismos(geojson) {
  return (geojson?.features ?? [])
    .filter((f) => typeof f?.properties?.mag === "number" && Array.isArray(f?.geometry?.coordinates))
    .map((f) => {
      const [lon, lat, profundidadKm] = f.geometry.coordinates;
      return {
        id: f.id,
        magnitud: f.properties.mag,
        lugar: traducirLugar(f.properties.place),
        fecha: new Date(f.properties.time),
        profundidadKm: typeof profundidadKm === "number" ? Math.round(profundidadKm) : null,
        distanciaPiuraKm: Math.round(distanciaKm(PIURA, { lat, lon })),
        tsunami: f.properties.tsunami === 1,
        url: f.properties.url,
      };
    })
    .sort((a, b) => b.fecha - a.fecha);
}
