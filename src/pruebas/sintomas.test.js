import { describe, expect, it } from "vitest";
import { evaluarSintomas, SINTOMAS } from "../utilidades/sintomas";

describe("evaluarSintomas", () => {
  it("sin síntomas marcados no da ninguna indicación", () => {
    expect(evaluarSintomas([])).toEqual({ nivel: null, relacionadas: [], posibles: [] });
  });

  it("cualquier señal de alarma manda a emergencias, aunque sea la única", () => {
    for (const s of SINTOMAS.filter((x) => x.alarma)) {
      expect(evaluarSintomas([s.id]).nivel).toBe("emergencia");
    }
  });

  it("cualquier fiebre manda a la posta", () => {
    expect(evaluarSintomas(["fiebre"]).nivel).toBe("posta");
    expect(evaluarSintomas(["fiebre", "tos"]).nivel).toBe("posta");
  });

  it("fiebre con dolor detrás de los ojos se relaciona con dengue", () => {
    const r = evaluarSintomas(["fiebre", "dolor_ojos"]);
    expect(r.relacionadas).toContain("dengue");
    expect(r.nivel).toBe("posta");
  });

  it("dolor de músculos tras el agua de la inundación: posible leptospirosis, a la posta", () => {
    const r = evaluarSintomas(["dolor_musculos"], { contactoAgua: true });
    expect(r.relacionadas).toContain("leptospirosis");
    expect(r.nivel).toBe("posta");
    expect(evaluarSintomas(["dolor_musculos"]).relacionadas).not.toContain("leptospirosis");
  });

  it("diarrea sin fiebre: vigilar en casa, salvo bebés, gestantes o adultos mayores", () => {
    expect(evaluarSintomas(["diarrea"]).nivel).toBe("vigilar");
    expect(evaluarSintomas(["diarrea"], { grupoRiesgo: true }).nivel).toBe("posta");
  });

  it("una herida infectada va a la posta; la picazón sola se vigila", () => {
    expect(evaluarSintomas(["herida"]).nivel).toBe("posta");
    expect(evaluarSintomas(["picazon"]).nivel).toBe("vigilar");
    expect(evaluarSintomas(["picazon"]).relacionadas).toEqual(["piel"]);
  });
});

describe("posibles enfermedades", () => {
  it("muestra qué síntomas típicos coinciden y cuántos son en total", () => {
    const { posibles } = evaluarSintomas(["fiebre", "dolor_ojos", "dolor_cabeza"]);
    const dengue = posibles.find((p) => p.id === "dengue");
    expect([...dengue.coinciden].sort()).toEqual(["dolor_cabeza", "dolor_ojos", "fiebre"]);
    expect(dengue.total).toBe(6);
    expect(dengue.grado).toBe("muchos");
  });

  it("ordena de mayor a menor coincidencia", () => {
    const { posibles } = evaluarSintomas(["fiebre", "dolor_ojos", "dolor_musculos", "dolor_cabeza", "tos"]);
    expect(posibles[0].id).toBe("dengue");
    expect(posibles.map((p) => p.id)).toContain("respiratorias");
  });

  it("no sugiere dengue sin fiebre ni leptospirosis sin contacto con agua de la inundación", () => {
    expect(evaluarSintomas(["dolor_ojos", "dolor_cabeza"]).relacionadas).not.toContain("dengue");
    expect(evaluarSintomas(["fiebre", "dolor_musculos"]).relacionadas).not.toContain("leptospirosis");
    expect(evaluarSintomas(["fiebre", "dolor_musculos"], { contactoAgua: true }).relacionadas).toContain(
      "leptospirosis"
    );
  });

  it("con un solo síntoma en común, el grado es 'algunos'", () => {
    const { posibles } = evaluarSintomas(["tos"]);
    expect(posibles).toHaveLength(1);
    expect(posibles[0]).toMatchObject({ id: "respiratorias", grado: "algunos" });
  });
});
