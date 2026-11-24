import { describe, expect, it } from "vitest";
import { PREGUNTAS_QUIZ, mensajeResultado, ordenAleatorio } from "../datos/quiz";

describe("quiz ¿Estás preparado?", () => {
  it("tiene 10 preguntas bien formadas, cada una con su explicación", () => {
    expect(PREGUNTAS_QUIZ).toHaveLength(10);
    for (const p of PREGUNTAS_QUIZ) {
      expect(p.opciones.length).toBeGreaterThanOrEqual(3);
      expect(p.correcta).toBeGreaterThanOrEqual(0);
      expect(p.correcta).toBeLessThan(p.opciones.length);
      expect(p.explicacion.length).toBeGreaterThan(20);
      expect(new Set(p.opciones).size).toBe(p.opciones.length);
    }
  });

  it("los números de emergencia coinciden con los del botón SOS", async () => {
    const { emergencyContacts } = await import("../datos/content");
    const samu = emergencyContacts.find((c) => /SAMU/.test(c.nombre)).numero;
    const pregunta = PREGUNTAS_QUIZ.find((p) => /ambulancia/.test(p.pregunta));
    expect(pregunta.opciones[pregunta.correcta]).toBe(samu);
  });

  it("el mensaje final cambia según el puntaje", () => {
    expect(mensajeResultado(10, 10)).toMatch(/Excelente/);
    expect(mensajeResultado(7, 10)).toMatch(/Bien/);
    expect(mensajeResultado(5, 10)).toMatch(/buen camino/);
    expect(mensajeResultado(1, 10)).toMatch(/prepararte más/);
  });
});

describe("orden aleatorio de las opciones", () => {
  it("devuelve todas las posiciones, cada una una sola vez", () => {
    for (let n = 0; n < 20; n++) expect([...ordenAleatorio(4)].sort()).toEqual([0, 1, 2, 3]);
  });

  it("no siempre deja la misma opción primero", () => {
    const primeras = new Set(Array.from({ length: 40 }, () => ordenAleatorio(3)[0]));
    expect(primeras.size).toBeGreaterThan(1);
  });
});
