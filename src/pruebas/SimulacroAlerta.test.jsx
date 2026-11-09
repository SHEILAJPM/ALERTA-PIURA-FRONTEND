import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SimulacroAlerta from "../componentes/SimulacroAlerta";
import { formatearCuentaRegresiva } from "../ganchos/useSimulacro";
import { getSimulacro } from "../utilidades/api";

// WebSocket falso: guarda el handler de "simulacro" para dispararlo a mano.
let emitirSimulacro;
vi.mock("../contexto/WebSocketContext", () => ({
  useWebSocketEvent: (tipo, handler) => {
    if (tipo === "simulacro") emitirSimulacro = handler;
  },
}));

vi.mock("../utilidades/api", async (importOriginal) => ({
  ...(await importOriginal()),
  getSimulacro: vi.fn(),
}));

vi.mock("../utilidades/sonido", () => ({ avisarConSonido: vi.fn() }));

function simulacroActivo(minutos = 2) {
  const ahora = Date.now();
  return {
    activo: true,
    id: "s1",
    mensaje: "Simulacro escolar: evacúa al patio",
    iniciado_por: "Defensa Civil",
    iniciado_en: new Date(ahora).toISOString(),
    termina_en: new Date(ahora + minutos * 60_000).toISOString(),
  };
}

function renderizar() {
  return render(
    <MemoryRouter>
      <SimulacroAlerta />
    </MemoryRouter>
  );
}

describe("SimulacroAlerta", () => {
  beforeEach(() => {
    getSimulacro.mockResolvedValue({ activo: false });
  });

  it("no muestra nada si no hay simulacro", async () => {
    renderizar();
    await act(async () => {});
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("aparece en pantalla completa apenas llega el aviso por WebSocket", async () => {
    renderizar();
    await act(async () => {});
    act(() => emitirSimulacro(simulacroActivo()));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("ALERTA ROJA")).toBeInTheDocument();
    expect(screen.getByText(/NO ES UNA EMERGENCIA REAL/)).toBeInTheDocument();
    expect(screen.getByText("Simulacro escolar: evacúa al patio")).toBeInTheDocument();
  });

  it("muestra el simulacro si ya estaba activo al abrir la app", async () => {
    getSimulacro.mockResolvedValue(simulacroActivo());
    renderizar();
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });

  it("'Entendido' la reduce a una franja y se apaga al terminar", async () => {
    renderizar();
    await act(async () => {});
    act(() => emitirSimulacro(simulacroActivo()));

    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("SIMULACRO EN CURSO");

    act(() => emitirSimulacro({ activo: false }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("formatea la cuenta regresiva", () => {
    expect(formatearCuentaRegresiva(125)).toBe("2:05");
    expect(formatearCuentaRegresiva(0)).toBe("0:00");
  });
});
