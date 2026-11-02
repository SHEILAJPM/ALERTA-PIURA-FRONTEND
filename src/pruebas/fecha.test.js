import {
  formatearHora,
  formatearFecha,
  formatearFechaLarga,
  formatearTiempoRelativo,
} from "../utilidades/fecha";

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

  it("formatea tiempo relativo y tolera fechas inválidas", () => {
    const haceMinutos = (m) => new Date(Date.now() - m * 60000);
    expect(formatearTiempoRelativo(haceMinutos(0))).toBe("ahora");
    expect(formatearTiempoRelativo(haceMinutos(5))).toBe("5 min");
    expect(formatearTiempoRelativo(haceMinutos(180))).toBe("3 h");
    expect(formatearTiempoRelativo(haceMinutos(60 * 24 * 2))).toBe("2 d");
    expect(formatearTiempoRelativo("no-es-fecha")).toBe("—");
  });
});
