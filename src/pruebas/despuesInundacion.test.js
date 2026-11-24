import { describe, expect, it } from "vitest";
import { rioRecienNormalizado } from "../utilidades/postInundacion";

const AHORA = new Date("2026-03-20T12:00:00Z").getTime();
const haceDias = (d) => new Date(AHORA - d * 86_400_000).toISOString();

describe("rioRecienNormalizado", () => {
  it("es true si el último cambio fue de alerta a normal hace poco", () => {
    const eventos = [{ estado_anterior: "alerta_roja", estado_nuevo: "normal", iniciado_en: haceDias(3) }];
    expect(rioRecienNormalizado(eventos, AHORA)).toBe(true);
  });

  it("también cuenta la vuelta a normal desde prealerta", () => {
    const eventos = [{ estado_anterior: "prealerta", estado_nuevo: "normal", iniciado_en: haceDias(10) }];
    expect(rioRecienNormalizado(eventos, AHORA)).toBe(true);
  });

  it("es false pasados 21 días", () => {
    const eventos = [{ estado_anterior: "alerta_roja", estado_nuevo: "normal", iniciado_en: haceDias(22) }];
    expect(rioRecienNormalizado(eventos, AHORA)).toBe(false);
  });

  it("es false si el río sigue en alerta o no hay historial", () => {
    const eventos = [{ estado_anterior: "normal", estado_nuevo: "prealerta", iniciado_en: haceDias(1) }];
    expect(rioRecienNormalizado(eventos, AHORA)).toBe(false);
    expect(rioRecienNormalizado([], AHORA)).toBe(false);
    expect(rioRecienNormalizado(undefined, AHORA)).toBe(false);
  });
});
