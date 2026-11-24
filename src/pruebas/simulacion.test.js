import { describe, expect, it } from "vitest";
import { leerSimulacion, valorEn, tonoEstado, TAMANO_MAXIMO_BYTES } from "../utilidades/simulacion";

// JSON mínimo con la forma del contrato piura.simulation.v1, solo para probar
// el lector (no se usa en la app).
function contrato(cambios = {}) {
  return {
    metadata: {
      schema: "piura.simulation.v1",
      version_prototipo: "1.0.0",
      origen: "simulacion",
      fidelidad: "L0_conceptual_no_pronostico",
      uso_permitido: "laboratorio_demo_aislado",
      apto_para_alerta_publica: false,
      georreferenciado: false,
      ...cambios.metadata,
    },
    tramos: [{ tramo_id: "ALTO" }, { tramo_id: "MEDIO" }, { tramo_id: "BAJO" }],
    series: cambios.series ?? [
      { tiempo_s: 60, tramo_id: "ALTO", nivel_m: 1.2, caudal_m3s: 40, area_m2: null },
      { tiempo_s: 0, tramo_id: "ALTO", nivel_m: 1.0, caudal_m3s: 30, area_m2: 0 },
      { tiempo_s: 0, tramo_id: "BAJO", nivel_m: 0.8, caudal_m3s: 25, area_m2: 0 },
    ],
    estados: [{ tiempo_s: 60, tramo_id: "ALTO", estado: "PREALERTA" }],
    eventos: [{ tiempo_s: 60, tramo_id: "ALTO", estado_anterior: "NORMAL", estado_nuevo: "PREALERTA" }],
    sensores: [
      {
        sensor_id: "SIM-ALTO-01",
        secuencia: 1,
        timestamp_utc: "2000-01-01T00:01:00Z",
        tiempo_s: 60,
        tramo_id: "ALTO",
        medicion: { nivel_m: 1.2 },
      },
    ],
  };
}

const texto = (obj) => JSON.stringify(obj);

describe("leerSimulacion", () => {
  it("acepta un archivo válido, ordena por tiempo y normaliza los campos", () => {
    const r = leerSimulacion(texto(contrato()));
    expect(r.ok).toBe(true);
    expect(r.simulacion.tramos).toEqual(["ALTO", "MEDIO", "BAJO"]);
    expect(r.simulacion.series.map((p) => p.t)).toEqual([0, 0, 60]);
    expect(r.simulacion.duracion).toBe(60);
    expect(r.simulacion.series[2]).toEqual({
      t: 60,
      tramo: "ALTO",
      nivel: 1.2,
      caudal: 40,
      area: null,
      lluvia: null,
    });
    expect(r.simulacion.eventos[0]).toMatchObject({ estado: "PREALERTA", estadoAnterior: "NORMAL" });
    expect(r.simulacion.sensores[0]).toMatchObject({ sensor: "SIM-ALTO-01", medicion: 1.2 });
    expect(r.avisos).toEqual([]);
  });

  it("rechaza un archivo que se declare apto para alerta pública", () => {
    const r = leerSimulacion(texto(contrato({ metadata: { apto_para_alerta_publica: true } })));
    expect(r.ok).toBe(false);
    expect(r.errores.join(" ")).toMatch(/no puede alertar/);
  });

  it("rechaza datos que no se declaren simulación, o georreferenciados, o de otro esquema", () => {
    expect(leerSimulacion(texto(contrato({ metadata: { origen: "sensor" } }))).ok).toBe(false);
    expect(leerSimulacion(texto(contrato({ metadata: { georreferenciado: true } }))).ok).toBe(false);
    expect(leerSimulacion(texto(contrato({ metadata: { schema: "otro.v2" } }))).ok).toBe(false);
  });

  it("rechaza JSON inválido, sin series o con tiempos inválidos", () => {
    expect(leerSimulacion("{no es json").ok).toBe(false);
    expect(leerSimulacion(texto(contrato({ series: [] }))).ok).toBe(false);
    const r = leerSimulacion(texto(contrato({ series: [{ tiempo_s: -5, tramo_id: "ALTO", nivel_m: 1 }] })));
    expect(r.ok).toBe(false);
    expect(r.errores[0]).toMatch(/series\[0\]/);
  });

  it("rechaza archivos más pesados que el límite", () => {
    const r = leerSimulacion(texto(contrato()), TAMANO_MAXIMO_BYTES + 1);
    expect(r.ok).toBe(false);
  });

  it("avisa cuando no reconoce el nivel ni el caudal en series", () => {
    const r = leerSimulacion(texto(contrato({ series: [{ tiempo_s: 0, tramo_id: "ALTO", altura: 2 }] })));
    expect(r.ok).toBe(true);
    expect(r.avisos.join(" ")).toMatch(/nivel/);
  });
});

describe("valorEn y tonoEstado", () => {
  const serie = [
    { t: 0, tramo: "ALTO", nivel: 1 },
    { t: 30, tramo: "BAJO", nivel: 5 },
    { t: 60, tramo: "ALTO", nivel: 2 },
  ];

  it("devuelve el último valor del tramo hasta el instante pedido", () => {
    expect(valorEn(serie, "ALTO", 59).nivel).toBe(1);
    expect(valorEn(serie, "ALTO", 60).nivel).toBe(2);
    expect(valorEn(serie, "MEDIO", 60)).toBe(null);
  });

  it("distingue prealerta de alerta aunque una palabra contenga a la otra", () => {
    expect(tonoEstado("PREALERTA")).toBe("advertencia");
    expect(tonoEstado("ALERTA_ROJA")).toBe("critico");
    expect(tonoEstado("normal")).toBe("normal");
    expect(tonoEstado("desconocido")).toBe("neutro");
  });
});
