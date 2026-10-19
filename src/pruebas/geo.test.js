import { distanciaKm, formatearDistancia, puntoDesdeGeoJSON } from "../utilidades/geo";

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
    expect(formatearDistancia(3.456)).toBe("a 3.5 km");
    expect(formatearDistancia(25.4)).toBe("a 25 km");
    expect(formatearDistancia(null)).toBe("");
  });
});
