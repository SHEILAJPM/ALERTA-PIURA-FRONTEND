import {
  distanciaKm,
  formatearDistancia,
  puntoDesdeGeoJSON,
  albergueMasCercano,
  minutosAPie,
  urlRutaAPie,
} from "../utilidades/geo";

describe("utilidades/geo", () => {
  it("calcula la distancia en línea recta entre dos puntos", () => {
    // Plaza de Armas de Piura -> Castilla (~1.5 km)
    const km = distanciaKm({ lat: -5.1945, lon: -80.6328 }, { lat: -5.1972, lon: -80.6198 });
    expect(km).toBeGreaterThan(1.2);
    expect(km).toBeLessThan(1.8);
    expect(distanciaKm({ lat: 0, lon: 0 }, { lat: 0, lon: 0 })).toBe(0);
  });

  it("lee puntos GeoJSON de PostGIS ([lon, lat])", () => {
    expect(puntoDesdeGeoJSON({ type: "Point", coordinates: [-80.6, -5.2] })).toEqual({
      lat: -5.2,
      lon: -80.6,
    });
    expect(puntoDesdeGeoJSON(null)).toBeNull();
  });

  it("formatea la distancia en metros o kilómetros", () => {
    expect(formatearDistancia(0.234)).toBe("a 230 m");
    expect(formatearDistancia(0.997)).toBe("a 1.0 km");
    expect(formatearDistancia(3.456)).toBe("a 3.5 km");
    expect(formatearDistancia(25.4)).toBe("a 25 km");
    expect(formatearDistancia(null)).toBe("");
  });
});

describe("albergueMasCercano", () => {
  const casa = { lat: -5.1945, lon: -80.6328 };
  const albergue = (id, lat, lon, ocupacion, capacidad, activo = true) => ({
    id,
    nombre: `Albergue ${id}`,
    ubicacion: { type: "Point", coordinates: [lon, lat] },
    ocupacion_actual: ocupacion,
    capacidad,
    activo,
  });

  it("elige el más cercano con espacio, saltando uno lleno más cerca", () => {
    const lista = [albergue("lleno", -5.195, -80.633, 50, 50), albergue("libre", -5.2, -80.64, 10, 50)];
    const r = albergueMasCercano(lista, casa);
    expect(r.albergue.id).toBe("libre");
    expect(r.libres).toBe(40);
    expect(r.lleno).toBe(false);
  });

  it("si todos están llenos devuelve el más cercano marcado como lleno", () => {
    const r = albergueMasCercano([albergue("a", -5.195, -80.633, 50, 50)], casa);
    expect(r.lleno).toBe(true);
    expect(r.libres).toBe(0);
  });

  it("ignora albergues inactivos y sin punto; sin ubicación devuelve null", () => {
    const lista = [albergue("cerrado", -5.195, -80.633, 0, 50, false)];
    expect(albergueMasCercano(lista, casa)).toBeNull();
    expect(albergueMasCercano(lista, null)).toBeNull();
  });
});

describe("minutosAPie y urlRutaAPie", () => {
  it("1.2 km son unos 16 minutos a pie", () => {
    expect(minutosAPie(1.2)).toBe(16);
    expect(minutosAPie(null)).toBeNull();
  });

  it("arma la ruta a pie de Google Maps con origen opcional", () => {
    const url = new URL(urlRutaAPie({ lat: -5.2, lon: -80.64 }, { lat: -5.19, lon: -80.63 }));
    expect(url.searchParams.get("destination")).toBe("-5.2,-80.64");
    expect(url.searchParams.get("origin")).toBe("-5.19,-80.63");
    expect(url.searchParams.get("travelmode")).toBe("walking");
    expect(new URL(urlRutaAPie({ lat: 1, lon: 2 })).searchParams.has("origin")).toBe(false);
  });
});
