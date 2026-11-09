import { renderHook, act } from "@testing-library/react";
import { useDictado } from "../ganchos/useDictado";

// Reconocedor falso: guarda la última instancia para disparar eventos a mano.
let ultimo;
class ReconocedorFalso {
  constructor() {
    ultimo = this;
    this.start = vi.fn();
    this.stop = vi.fn(() => this.onend?.());
    this.abort = vi.fn();
  }
}

function resultado(texto, isFinal) {
  const r = [{ transcript: texto }];
  r.isFinal = isFinal;
  return r;
}

describe("useDictado", () => {
  afterEach(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    ultimo = undefined;
  });

  it("no está soportado si el navegador no tiene la Web Speech API", () => {
    const { result } = renderHook(() => useDictado(vi.fn()));
    expect(result.current.soportado).toBe(false);
  });

  it("escucha en español de Perú y entrega cada frase final", () => {
    window.webkitSpeechRecognition = ReconocedorFalso;
    const alTerminarFrase = vi.fn();
    const { result } = renderHook(() => useDictado(alTerminarFrase));

    act(() => result.current.iniciar());
    expect(result.current.escuchando).toBe(true);
    expect(ultimo.lang).toBe("es-PE");
    expect(ultimo.start).toHaveBeenCalled();

    act(() => ultimo.onresult({ resultIndex: 0, results: [resultado("el agua ya ", false)] }));
    expect(result.current.parcial).toBe("el agua ya");
    expect(alTerminarFrase).not.toHaveBeenCalled();

    act(() =>
      ultimo.onresult({ resultIndex: 0, results: [resultado(" el agua ya llegó a la pista ", true)] })
    );
    expect(alTerminarFrase).toHaveBeenCalledWith("el agua ya llegó a la pista");
    expect(result.current.parcial).toBe("");

    act(() => result.current.detener());
    expect(result.current.escuchando).toBe(false);
  });

  it("muestra un mensaje claro si se niega el micrófono", () => {
    window.SpeechRecognition = ReconocedorFalso;
    const { result } = renderHook(() => useDictado(vi.fn()));

    act(() => result.current.iniciar());
    act(() => {
      ultimo.onerror({ error: "not-allowed" });
      ultimo.onend();
    });
    expect(result.current.error).toBe("Permite el uso del micrófono para dictar.");
    expect(result.current.escuchando).toBe(false);
  });
});
