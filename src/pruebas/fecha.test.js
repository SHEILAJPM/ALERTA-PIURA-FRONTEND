import { formatearHora, formatearFecha, formatearFechaLarga } from "../utilidades/fecha";

describe("utilidades/fecha", () => {
  it("devuelve un guion para valores vacíos o inválidos", () => {
    for (const valor of [null, undefined, "", "no-es-fecha"]) {
      expect(formatearHora(valor)).toBe("—");
      expect(formatearFecha(valor)).toBe("—");
    }
  });

  it("formatea en español de Perú", () => {
    const fecha = new Date(2026, 9, 19, 14, 5);
    expect(formatearFechaLarga(fecha)).toMatch(/19 de octubre de 2026/);
    expect(formatearHora(fecha)).toMatch(/0?2:05|14:05/);
  });
});
