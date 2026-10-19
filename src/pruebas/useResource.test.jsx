import { renderHook, waitFor, act } from "@testing-library/react";
import { useResource } from "../ganchos/useResource";

function diferida() {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

describe("useResource", () => {
  it("empieza cargando y después muestra los datos", async () => {
    const { result } = renderHook(() => useResource(() => Promise.resolve([1, 2]), []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([1, 2]);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje de error si la carga falla", async () => {
    const { result } = renderHook(() => useResource(() => Promise.reject(new Error("sin red")), []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("sin red");
  });

  it("vuelve a cargar al cambiar las dependencias y descarta respuestas viejas", async () => {
    const pedidos = {};
    const cargar = (codigo) => {
      pedidos[codigo] = diferida();
      return pedidos[codigo].promesa;
    };
    const { result, rerender } = renderHook(({ codigo }) => useResource(() => cargar(codigo), [codigo]), {
      initialProps: { codigo: "A" },
    });

    rerender({ codigo: "B" });
    expect(result.current.loading).toBe(true);

    // Llega primero la respuesta de B y después la (vieja) de A: gana B.
    await act(async () => pedidos.B.resolver("datos B"));
    await act(async () => pedidos.A.resolver("datos A"));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe("datos B");
  });

  it("setData permite actualizar sin volver a pedir", async () => {
    const cargar = vi.fn(() => Promise.resolve([{ id: 1, n: 0 }]));
    const { result } = renderHook(() => useResource(cargar, []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setData((prev) => prev.map((x) => ({ ...x, n: 5 }))));
    expect(result.current.data).toEqual([{ id: 1, n: 5 }]);
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it("un refresco que falla conserva los últimos datos", async () => {
    let falla = false;
    const { result } = renderHook(() =>
      useResource(() => (falla ? Promise.reject(new Error("caído")) : Promise.resolve("ok")), [])
    );
    await waitFor(() => expect(result.current.data).toBe("ok"));

    falla = true;
    await act(() => result.current.refrescar());
    expect(result.current.data).toBe("ok");
    expect(result.current.error).toBe("caído");
  });
});
