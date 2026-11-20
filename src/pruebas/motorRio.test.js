import { describe, expect, it } from "vitest";
import {
  simularRio,
  aContrato,
  nivelDesdeCaudal,
  estadoModelo,
  ESCENARIOS,
  PASOS,
  CAUCE,
} from "../utilidades/motorRio";
import { leerSimulacion } from "../utilidades/simulacion";

const base = { lluvia: 0, duracion: 120, caudal: 50, obstruccion: 0, transito: 240, acoplado: true };
const indicePico = (serie) => serie.reduce((im, v, i) => (v > serie[im] ? i : im), 0);

describe("nivelDesdeCaudal (Manning)", () => {
  it("es 0 sin caudal y crece con el caudal", () => {
    expect(nivelDesdeCaudal(0)).toBe(0);
    expect(nivelDesdeCaudal(200)).toBeGreaterThan(nivelDesdeCaudal(50));
  });

  it("un cauce más angosto sube más con el mismo caudal", () => {
    expect(nivelDesdeCaudal(100, CAUCE.ancho / 2)).toBeGreaterThan(nivelDesdeCaudal(100));
  });
});

describe("simularRio", () => {
  it("sin lluvia y sin obstrucción, el caudal se mantiene estable en los tres tramos", () => {
    const r = simularRio(base);
    for (let k = 0; k < 3; k++) {
      expect(r.q[k][PASOS]).toBeCloseTo(50, 1);
      expect(r.h[k][PASOS]).toBeCloseTo(r.h[0][PASOS], 3);
    }
  });

  it("más lluvia produce un pico más alto en el tramo bajo", () => {
    const poca = simularRio({ ...base, lluvia: 10 });
    const mucha = simularRio({ ...base, lluvia: 80 });
    expect(Math.max(...mucha.h[2])).toBeGreaterThan(Math.max(...poca.h[2]));
  });

  it("la crecida llega después al tramo bajo que al alto (tránsito)", () => {
    const r = simularRio({ ...base, lluvia: 60, transito: 600 });
    expect(indicePico(r.q[2])).toBeGreaterThan(indicePico(r.q[0]));
  });

  it("la obstrucción sube el nivel del tramo bajo", () => {
    const libre = simularRio({ ...base, obstruccion: 0 });
    const tapado = simularRio({ ...base, obstruccion: 60 });
    expect(tapado.h[2][PASOS]).toBeGreaterThan(libre.h[2][PASOS]);
  });

  it("una lluvia fuerte no desborda el cauce; una extrema sí", () => {
    expect(Math.max(...simularRio({ ...ESCENARIOS.fuerte, acoplado: true }).volumen[2])).toBe(0);
    expect(Math.max(...simularRio({ ...ESCENARIOS.extrema, acoplado: true }).h[2])).toBeGreaterThan(
      CAUCE.ribera
    );
  });

  it("en una lluvia extrema el agua pasa a la planicie y luego vuelve al cauce", () => {
    const r = simularRio({ ...ESCENARIOS.extrema, acoplado: true });
    const maxVol = Math.max(...r.volumen[2]);
    expect(maxVol).toBeGreaterThan(0);
    expect(r.volumen[2][PASOS]).toBeLessThan(maxVol);
  });

  it("nunca produce caudales ni volúmenes negativos ni NaN", () => {
    const r = simularRio({ ...ESCENARIOS.extrema, transito: 0 });
    for (const serie of [...r.q, ...r.h, ...r.volumen]) {
      expect(serie.every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
    }
  });
});

describe("aContrato", () => {
  it("genera un piura.simulation.v1 que el lector del Laboratorio acepta", () => {
    const params = { ...ESCENARIOS.fuerte, acoplado: true };
    const contrato = aContrato(simularRio(params), params, "Lluvia fuerte");
    const lectura = leerSimulacion(JSON.stringify(contrato));
    expect(lectura.ok).toBe(true);
    expect(lectura.avisos).toEqual([]);
    expect(lectura.simulacion.tramos).toEqual(["ALTO", "MEDIO", "BAJO"]);
    expect(contrato.metadata.apto_para_alerta_publica).toBe(false);
  });

  it("registra un evento por cada cambio de estado del modelo", () => {
    expect(estadoModelo(1)).toBe("NORMAL");
    expect(estadoModelo(3)).toBe("PREALERTA");
    expect(estadoModelo(4.2)).toBe("ALERTA");
    const params = { ...ESCENARIOS.extrema, acoplado: true };
    const contrato = aContrato(simularRio(params), params);
    expect(contrato.eventos.length).toBeGreaterThan(0);
    expect(contrato.eventos.every((e) => e.estado_anterior !== e.estado_nuevo)).toBe(true);
  });
});
