import { beforeEach, describe, expect, it } from "vitest";
import { guardarPlan, leerPlan, planEstaCompleto, planVacio, textoPlan } from "../utilidades/planFamiliar";

const plan = () => ({
  ...planVacio(),
  puntoEncuentro: "Parque Infantil de Castilla",
  albergue: "Colegio San José",
  contactos: [
    { nombre: "Tía Rosa", telefono: "987654321" },
    { nombre: "", telefono: "" },
  ],
  integrantes: [
    { nombre: "Mamá", tarea: "Lleva la mochila de emergencia" },
    { nombre: "  ", tarea: "Cuida a las mascotas" },
  ],
});

describe("plan familiar", () => {
  beforeEach(() => localStorage.clear());

  it("guarda solo en el dispositivo, sin filas vacías, y avisa si era el primero", () => {
    const primero = guardarPlan(plan());
    expect(primero.eraNuevo).toBe(true);
    expect(primero.plan.contactos).toHaveLength(1);
    expect(primero.plan.integrantes).toHaveLength(1);
    expect(leerPlan().puntoEncuentro).toBe("Parque Infantil de Castilla");
    expect(guardarPlan(plan()).eraNuevo).toBe(false);
  });

  it("sin plan guardado devuelve null", () => {
    expect(leerPlan()).toBeNull();
  });

  it("está completo con punto de encuentro y al menos un teléfono", () => {
    expect(planEstaCompleto(plan())).toBe(true);
    expect(planEstaCompleto(planVacio())).toBe(false);
  });

  it("arma el texto para compartir con lo esencial y los números de emergencia", () => {
    const texto = textoPlan(plan());
    expect(texto).toMatch(/Punto de encuentro: Parque Infantil de Castilla/);
    expect(texto).toMatch(/Tía Rosa: 987654321/);
    expect(texto).toMatch(/Mamá: Lleva la mochila/);
    expect(texto).toMatch(/SAMU 106/);
    expect(texto).not.toMatch(/Cuida a las mascotas/);
  });
});
