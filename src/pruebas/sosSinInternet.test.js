import { contactosParaSOS, enlaceSMS, limpiarTelefono, mensajeSOS } from "../utilidades/sosSinInternet";

describe("SOS sin internet", () => {
  it("incluye un enlace de mapa con la ubicación", () => {
    const texto = mensajeSOS({ lat: -5.197141, lon: -80.626642 });
    expect(texto).toContain("https://maps.google.com/?q=-5.19714,-80.62664");
    expect(texto).toContain("115");
  });

  it("sin ubicación pide que lo llamen", () => {
    expect(mensajeSOS(null)).toContain("llámame");
  });

  it("limpia teléfonos y descarta los inválidos", () => {
    expect(limpiarTelefono("999 123 456")).toBe("999123456");
    expect(limpiarTelefono("+51 999-123-456")).toBe("+51999123456");
    expect(limpiarTelefono("12")).toBeNull();
    expect(limpiarTelefono("")).toBeNull();
  });

  it("arma el enlace sms con el texto codificado", () => {
    expect(enlaceSMS("999123456", "hola mundo")).toBe("sms:999123456?body=hola%20mundo");
  });

  it("toma hasta 3 contactos válidos sin repetir", () => {
    const plan = {
      contactos: [
        { nombre: "Mamá", telefono: "999 111 111" },
        { nombre: "", telefono: "999111111" },
        { nombre: "Sin número", telefono: "" },
        { nombre: "Tío", telefono: "999 222 222" },
        { nombre: "Prima", telefono: "999 333 333" },
        { nombre: "Abuela", telefono: "999 444 444" },
      ],
    };
    expect(contactosParaSOS(plan)).toEqual([
      { nombre: "Mamá", telefono: "999111111" },
      { nombre: "Tío", telefono: "999222222" },
      { nombre: "Prima", telefono: "999333333" },
    ]);
    expect(contactosParaSOS(null)).toEqual([]);
  });
});
