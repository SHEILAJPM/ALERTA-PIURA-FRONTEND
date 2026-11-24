import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Mochila from "../paginas/Mochila";
import { COSAS_MOCHILA } from "../datos/mochila";

function renderMochila() {
  return render(
    <MemoryRouter>
      <Mochila />
    </MemoryRouter>
  );
}

describe("Mochila", () => {
  beforeEach(() => localStorage.clear());

  it("empieza en 0 y marca una cosa al tocarla", () => {
    renderMochila();
    expect(
      screen.getByRole("img", { name: `0 de ${COSAS_MOCHILA.length} cosas listas` })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Agua para 3 días/ }));

    expect(screen.getByRole("button", { name: /Agua para 3 días/ })).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("img", { name: `1 de ${COSAS_MOCHILA.length} cosas listas` })
    ).toBeInTheDocument();
  });

  it("guarda el avance y lo recupera al volver", () => {
    const { unmount } = renderMochila();
    fireEvent.click(screen.getByRole("button", { name: /Linterna/ }));
    unmount();

    renderMochila();
    expect(screen.getByRole("button", { name: /Linterna/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("al completar todo muestra el mensaje de mochila lista", () => {
    renderMochila();
    for (const cosa of COSAS_MOCHILA) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(cosa.nombre) }));
    }
    expect(screen.getByRole("status")).toHaveTextContent("¡Mochila lista!");
  });

  it("ignora datos guardados que no son válidos", () => {
    localStorage.setItem("piura-alerta-mochila", "no es json");
    renderMochila();
    expect(
      screen.getByRole("img", { name: `0 de ${COSAS_MOCHILA.length} cosas listas` })
    ).toBeInTheDocument();
  });
});
