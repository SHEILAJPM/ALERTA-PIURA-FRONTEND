import { avisoVigente } from "../utilidades/avisoLluvia";

describe("avisoVigente", () => {
  const ahora = Date.parse("2026-11-15T21:00:00Z");

  it("un aviso de hace 2 horas sigue vigente", () => {
    expect(avisoVigente({ enviado_en: "2026-11-15T19:00:00Z" }, ahora)).toBe(true);
  });

  it("un aviso de hace 7 horas ya no", () => {
    expect(avisoVigente({ enviado_en: "2026-11-15T14:00:00Z" }, ahora)).toBe(false);
  });

  it("sin aviso o con fecha inválida no es vigente", () => {
    expect(avisoVigente(undefined, ahora)).toBe(false);
    expect(avisoVigente({ enviado_en: "no-es-fecha" }, ahora)).toBe(false);
  });
});
