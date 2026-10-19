import { sensorMasCritico, esMasGrave } from "../utilidades/alertas";

function sensor(codigo, estado, nivel, enLinea = true) {
  return {
    codigo,
    nombre: codigo,
    en_linea: enLinea,
    ultima_lectura: estado ? { estado, nivel_cm: nivel, medido_en: "2026-10-19T10:00:00Z" } : null,
  };
}

describe("sensorMasCritico", () => {
  it("devuelve null si todo está normal, sin lecturas o sin datos", () => {
    expect(sensorMasCritico(null)).toBeNull();
    expect(sensorMasCritico([])).toBeNull();
    expect(sensorMasCritico([sensor("A", "normal", 5), sensor("B", null)])).toBeNull();
  });

  it("elige alerta roja por encima de prealerta, aunque el nivel sea menor", () => {
    const critico = sensorMasCritico([sensor("A", "prealerta", 30), sensor("B", "alerta_roja", 20)]);
    expect(critico.codigo).toBe("B");
  });

  it("a igual estado, elige el de nivel más alto", () => {
    const critico = sensorMasCritico([sensor("A", "prealerta", "11.5"), sensor("B", "prealerta", "12.1")]);
    expect(critico.codigo).toBe("B");
  });

  it("sigue considerando un sensor sin señal con su último dato", () => {
    expect(sensorMasCritico([sensor("A", "alerta_roja", 18, false)]).codigo).toBe("A");
  });
});

describe("esMasGrave", () => {
  it("compara la gravedad de dos estados", () => {
    expect(esMasGrave("alerta_roja", "prealerta")).toBe(true);
    expect(esMasGrave("prealerta", "normal")).toBe(true);
    expect(esMasGrave("normal", "prealerta")).toBe(false);
    expect(esMasGrave("prealerta", "prealerta")).toBe(false);
  });
});
