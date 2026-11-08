import { cuadrosDesdeRespuesta, urlTeselaRadar } from "../ganchos/useRadarLluvia";

describe("useRadarLluvia", () => {
  it("arma la URL de tesela con el esquema de color que sirve la API gratuita", () => {
    expect(urlTeselaRadar("https://tilecache.rainviewer.com", "/v2/radar/abc")).toBe(
      "https://tilecache.rainviewer.com/v2/radar/abc/256/{z}/{x}/{y}/2/1_1.png"
    );
  });

  it("convierte la respuesta en cuadros con fecha, del más viejo al más nuevo", () => {
    const cuadros = cuadrosDesdeRespuesta({
      host: "https://h",
      radar: {
        past: [
          { time: 1794162600, path: "/v2/radar/a" },
          { time: 1794163200, path: "/v2/radar/b" },
          { time: null, path: "/roto" },
        ],
      },
    });
    expect(cuadros).toHaveLength(2);
    expect(cuadros[0].fecha.getTime()).toBe(1794162600 * 1000);
    expect(cuadros[1].url).toBe("https://h/v2/radar/b/256/{z}/{x}/{y}/2/1_1.png");
  });

  it("falla con un mensaje claro si el radar no trae cuadros", () => {
    expect(() => cuadrosDesdeRespuesta({ host: "https://h", radar: { past: [] } })).toThrow(
      "El radar no devolvió cuadros"
    );
    expect(() => cuadrosDesdeRespuesta(null)).toThrow();
  });
});
