import { elegirAccion } from "../utilidades/accionRecomendada";

describe("elegirAccion", () => {
  it("con el río en alerta roja siempre manda a evacuar, esté donde esté", () => {
    for (const situacion of ["casa", "calle"]) {
      for (const nivel of ["bajo", "medio", "alto", null]) {
        const accion = elegirAccion({ situacion, nivel, estadoRio: "alerta_roja" });
        expect(accion.urgente).toBe(true);
        expect(accion.enlace).toBe("/mapa");
      }
    }
  });

  it("riesgo alto en casa: preparar la mochila", () => {
    const accion = elegirAccion({ situacion: "casa", nivel: "alto", estadoRio: "prealerta" });
    expect(accion.enlace).toBe("/mochila");
    expect(accion.titulo).toMatch(/mochila/i);
  });

  it("riesgo alto en la calle: alejarse del río", () => {
    const accion = elegirAccion({ situacion: "calle", nivel: "alto", estadoRio: "prealerta" });
    expect(accion.titulo).toMatch(/aléjate del río/i);
  });

  it("riesgo medio cambia según la situación", () => {
    expect(elegirAccion({ situacion: "casa", nivel: "medio" }).enlace).toBe("/mochila");
    expect(elegirAccion({ situacion: "calle", nivel: "medio" }).enlace).toBe("/mapa");
  });

  it("sin puntaje todavía o riesgo bajo: invitar a prepararse", () => {
    expect(elegirAccion({ nivel: null }).titulo).toMatch(/tranquilo/i);
    expect(elegirAccion({ nivel: "bajo" }).urgente).toBe(false);
  });
});
