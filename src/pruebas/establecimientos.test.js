import { describe, expect, it } from "vitest";
import { establecimientosCercanos } from "../utilidades/geo";

const origen = { lat: -5.1971, lon: -80.6266 };
const lugar = (nombre, lat, extra = {}) => ({
  nombre,
  lat,
  lon: -80.6266,
  salud: true,
  etiqueta: "Posta / centro de salud",
  ...extra,
});

describe("establecimientosCercanos", () => {
  it("ordena por cercanía y calcula distancia y minutos a pie", () => {
    const r = establecimientosCercanos(
      [lugar("Centro de Salud Lejos", -5.23), lugar("Puesto de Salud Cerca", -5.2)],
      origen
    );
    expect(r.map((p) => p.nombre)).toEqual(["Puesto de Salud Cerca", "Centro de Salud Lejos"]);
    expect(r[0].km).toBeGreaterThan(0);
    expect(r[0].minutos).toBeGreaterThan(0);
  });

  it("no deriva a laboratorios ni servicios especializados", () => {
    const r = establecimientosCercanos(
      [
        lugar("Laboratorio Referencial", -5.1972),
        lugar("Resocentro Resonancia", -5.1973),
        lugar("Posta Médica Municipal", -5.21),
      ],
      origen
    );
    expect(r.map((p) => p.nombre)).toEqual(["Posta Médica Municipal"]);
  });

  it("prioriza la atención general sobre clínicas privadas más cercanas", () => {
    const r = establecimientosCercanos(
      [lugar("Clínica San Miguel", -5.1975), lugar("Hospital Regional", -5.22, { etiqueta: "Hospital" })],
      origen
    );
    expect(r[0].nombre).toBe("Hospital Regional");
    expect(r).toHaveLength(1);
  });

  it("si no hay atención general cerca, muestra las demás clínicas", () => {
    const r = establecimientosCercanos([lugar("Clínica San Miguel", -5.1975)], origen);
    expect(r[0].nombre).toBe("Clínica San Miguel");
  });

  it("ignora comisarías y bomberos, y no hace nada sin ubicación", () => {
    expect(
      establecimientosCercanos([{ nombre: "Comisaría", lat: -5.2, lon: -80.6, salud: false }], origen)
    ).toEqual([]);
    expect(establecimientosCercanos([lugar("Posta", -5.2)], null)).toEqual([]);
  });
});
