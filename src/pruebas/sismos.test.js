import { nivelMagnitud, normalizarSismos, traducirLugar } from "../utilidades/sismos";

describe("utilidades/sismos", () => {
  it("traduce el lugar del USGS al español", () => {
    expect(traducirLugar("37 km ESE of Cañaveral, Peru")).toBe("a 37 km al ESE de Cañaveral, Perú");
    expect(traducirLugar("5 km SW of Azogues, Ecuador")).toBe("a 5 km al SO de Azogues, Ecuador");
    expect(traducirLugar("12 km W of Sullana, Peru")).toBe("a 12 km al O de Sullana, Perú");
  });

  it("deja tal cual los lugares con otro formato", () => {
    expect(traducirLugar("near the coast of northern Peru")).toBe("near the coast of northern Peru");
    expect(traducirLugar(null)).toBe("Ubicación desconocida");
  });

  it("clasifica la magnitud por color", () => {
    expect(nivelMagnitud(3.2)).toBe("normal");
    expect(nivelMagnitud(4)).toBe("prealerta");
    expect(nivelMagnitud(5.5)).toBe("alerta");
  });

  it("normaliza el GeoJSON, calcula la distancia a Piura y ordena del más reciente", () => {
    const sismos = normalizarSismos({
      features: [
        {
          id: "viejo",
          properties: { mag: 4.1, place: "37 km ESE of Cañaveral, Peru", time: 1000, tsunami: 0, url: "u1" },
          geometry: { coordinates: [-80.4, -4.3, 30.6] },
        },
        {
          id: "nuevo",
          properties: { mag: 3.4, place: "10 km N of Piura, Peru", time: 5000, tsunami: 1, url: "u2" },
          geometry: { coordinates: [-80.6328, -5.1045, 12] },
        },
        { id: "sin-magnitud", properties: { mag: null, time: 9000 }, geometry: { coordinates: [0, 0] } },
      ],
    });

    expect(sismos.map((s) => s.id)).toEqual(["nuevo", "viejo"]);
    expect(sismos[0]).toMatchObject({
      magnitud: 3.4,
      profundidadKm: 12,
      tsunami: true,
      distanciaPiuraKm: 10,
    });
    expect(sismos[1].profundidadKm).toBe(31);
    expect(sismos[1].distanciaPiuraKm).toBeGreaterThan(90);
  });

  it("devuelve lista vacía si la respuesta no trae sismos", () => {
    expect(normalizarSismos({})).toEqual([]);
    expect(normalizarSismos(null)).toEqual([]);
  });
});
