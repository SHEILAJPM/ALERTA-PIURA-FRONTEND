import {
  idNotificacion,
  notificacionDeEvento,
  notificacionDeSimulacro,
} from "../utilidades/notificacionesNativas";

describe("notificaciones de la app Android", () => {
  it("arma el aviso de alerta roja con nivel y sensor", () => {
    const n = notificacionDeEvento({
      id: 7,
      estado_nuevo: "alerta_roja",
      nivel_cm: "16.5",
      sensor_codigo: "RIO-PIURA-01",
    });
    expect(n.title).toBe("ALERTA ROJA · río Piura");
    expect(n.body).toContain("Nivel actual: 16.5 cm.");
    expect(n.body).toContain("RIO-PIURA-01");
    expect(n.alarma).toBe(true);
  });

  it("no hace sonar la sirena cuando el río vuelve a la normalidad", () => {
    expect(notificacionDeEvento({ estado_nuevo: "normal", nivel_cm: 2 }).alarma).toBe(false);
  });

  it("ignora estados desconocidos", () => {
    expect(notificacionDeEvento({ estado_nuevo: "otro" })).toBeNull();
    expect(notificacionDeEvento(null)).toBeNull();
  });

  it("solo avisa el simulacro cuando empieza", () => {
    expect(notificacionDeSimulacro({ activo: false })).toBeNull();
    const n = notificacionDeSimulacro({ activo: true, id: "mhq2x", mensaje: "Evacúa al patio" });
    expect(n.title).toContain("SIMULACRO");
    expect(n.body).toBe("Evacúa al patio");
    expect(n.alarma).toBe(true);
  });

  it("da el mismo id al mismo evento y uno válido para Android", () => {
    const a = idNotificacion("evento", 42);
    expect(idNotificacion("evento", 42)).toBe(a);
    expect(idNotificacion("simulacro", 42)).not.toBe(a);
    expect(Number.isInteger(a) && a > 0 && a <= 2_147_483_647).toBe(true);
  });
});
