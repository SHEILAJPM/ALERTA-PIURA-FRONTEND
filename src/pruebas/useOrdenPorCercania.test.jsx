import { renderHook, act } from "@testing-library/react";
import { useOrdenPorCercania } from "../ganchos/useOrdenPorCercania";

const reportes = [
  { id: "lejos", ubicacion: { type: "Point", coordinates: [-80.5, -5.3] } },
  { id: "sin-ubicacion", ubicacion: null },
  { id: "cerca", ubicacion: { type: "Point", coordinates: [-80.633, -5.195] } },
];

describe("useOrdenPorCercania", () => {
  beforeEach(() => {
    navigator.geolocation = {
      getCurrentPosition: (ok) => ok({ coords: { latitude: -5.1945, longitude: -80.6328 } }),
    };
  });

  it("sin activar, respeta el orden original y no calcula distancias", () => {
    const { result } = renderHook(() => useOrdenPorCercania(reportes));
    expect(result.current.reportesOrdenados.map((r) => r.reporte.id)).toEqual([
      "lejos",
      "sin-ubicacion",
      "cerca",
    ]);
    expect(result.current.reportesOrdenados.every((r) => r.distanciaKm === null)).toBe(true);
  });

  it("al activar, ordena del más cercano al más lejano y deja al final los sin ubicación", () => {
    const { result } = renderHook(() => useOrdenPorCercania(reportes));
    act(() => result.current.activar());
    expect(result.current.activo).toBe(true);
    expect(result.current.reportesOrdenados.map((r) => r.reporte.id)).toEqual([
      "cerca",
      "lejos",
      "sin-ubicacion",
    ]);
    expect(result.current.reportesOrdenados[0].distanciaKm).toBeLessThan(0.1);
  });

  it("si el usuario niega la ubicación, muestra un error y no se activa", () => {
    navigator.geolocation = { getCurrentPosition: (_ok, fallo) => fallo(new Error("denegado")) };
    const { result } = renderHook(() => useOrdenPorCercania(reportes));
    act(() => result.current.activar());
    expect(result.current.activo).toBe(false);
    expect(result.current.error).toMatch(/ubicación/);
  });
});
