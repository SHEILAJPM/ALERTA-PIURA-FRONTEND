import { elegirAccion, estadoRioVigente } from "../utilidades/accionRecomendada";

describe("elegirAccion", () => {
  it("con el río en alerta roja siempre manda a evacuar, esté donde esté", () => {
    for (const situacion of ["casa", "calle", "campo", "negocio", "ayuda"]) {
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

describe("cuando faltan datos", () => {
  it("con riesgo bajo pero datos incompletos no dice que todo está tranquilo", () => {
    const accion = elegirAccion({ nivel: "bajo", datosCompletos: false });
    expect(accion.titulo).toMatch(/no tenemos datos/i);
    expect(accion.titulo).not.toMatch(/tranquilo/i);
  });

  it("estadoRioVigente descarta el estado si el sensor no reporta", () => {
    const riesgoSinSensor = { factores: [{ clave: "rio", sin_datos: true }] };
    expect(estadoRioVigente("prealerta", riesgoSinSensor)).toBeNull();
  });

  it("estadoRioVigente conserva el estado si el sensor reporta o si aún no hay puntaje", () => {
    expect(estadoRioVigente("prealerta", { factores: [{ clave: "rio", sin_datos: false }] })).toBe(
      "prealerta"
    );
    expect(estadoRioVigente("alerta_roja", null)).toBe("alerta_roja");
  });
});

describe("situaciones de crisis: chacra, negocio y ayuda", () => {
  it("con riesgo medio o alto, protege la chacra o el negocio", () => {
    expect(elegirAccion({ situacion: "campo", nivel: "alto" }).titulo).toMatch(/animales/i);
    expect(elegirAccion({ situacion: "negocio", nivel: "medio" }).titulo).toMatch(/negocio/i);
  });

  it("con riesgo bajo, invita a prepararse y lleva a la página de ayuda", () => {
    expect(elegirAccion({ situacion: "campo", nivel: "bajo" }).enlace).toBe("/agricultura");
    expect(elegirAccion({ situacion: "negocio", nivel: "bajo" }).enlace).toBe("/ayuda#negocio");
  });

  it("quien necesita ayuda: al albergue con riesgo alto; si no, cómo pedir ayuda", () => {
    expect(elegirAccion({ situacion: "ayuda", nivel: "alto" }).enlace).toBe("/mapa");
    expect(elegirAccion({ situacion: "ayuda", nivel: "medio" }).enlace).toBe("/ayuda#necesito-ayuda");
  });

  it("nunca dicen que todo está tranquilo, aunque falten datos", () => {
    for (const situacion of ["campo", "negocio", "ayuda"]) {
      const accion = elegirAccion({ situacion, nivel: "bajo", datosCompletos: false });
      expect(accion.titulo).not.toMatch(/tranquilo/i);
    }
  });
});
