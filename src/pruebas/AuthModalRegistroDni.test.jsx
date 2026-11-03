import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthModal from "../componentes/AuthModal";
import { consultarNombrePorDni, ApiError } from "../utilidades/api";

vi.mock("../contexto/AuthContext", () => ({
  useAuth: () => ({
    modal: "registro",
    cerrarModal: vi.fn(),
    abrirModal: vi.fn(),
    sesionExpirada: false,
    registro: vi.fn(),
  }),
}));

vi.mock("../utilidades/api", async (importOriginal) => ({
  ...(await importOriginal()),
  consultarNombrePorDni: vi.fn(),
}));

function renderizar() {
  render(
    <MemoryRouter>
      <AuthModal />
    </MemoryRouter>
  );
  return {
    dni: screen.getByPlaceholderText("DNI (8 dígitos)"),
    nombre: screen.getByPlaceholderText("Nombre completo"),
  };
}

describe("Registro: autocompletar nombre por DNI", () => {
  beforeEach(() => {
    consultarNombrePorDni.mockReset();
  });

  it("al completar 8 dígitos consulta RENIEC y llena el nombre", async () => {
    consultarNombrePorDni.mockResolvedValue({ nombre: "Roxana Karina Delgado Huamani" });
    const { dni, nombre } = renderizar();

    fireEvent.change(dni, { target: { value: "4602789" } });
    expect(consultarNombrePorDni).not.toHaveBeenCalled();

    fireEvent.change(dni, { target: { value: "46027897" } });
    await waitFor(() => expect(nombre).toHaveValue("Roxana Karina Delgado Huamani"));
    expect(consultarNombrePorDni).toHaveBeenCalledWith("46027897");
    expect(screen.getByRole("status")).toHaveTextContent("DNI verificado");
  });

  it("avisa si el DNI no existe y no toca el nombre", async () => {
    consultarNombrePorDni.mockImplementation(async () => {
      throw new ApiError("DNI no encontrado en RENIEC", 404);
    });
    const { dni, nombre } = renderizar();

    fireEvent.change(nombre, { target: { value: "Escrito a mano" } });
    fireEvent.change(dni, { target: { value: "00000000" } });

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("no encontrado"));
    expect(nombre).toHaveValue("Escrito a mano");
  });

  it("si la consulta no está disponible no muestra nada y deja escribir el nombre", async () => {
    consultarNombrePorDni.mockImplementation(async () => {
      throw new ApiError("Consulta de DNI no disponible", 503);
    });
    const { dni } = renderizar();

    fireEvent.change(dni, { target: { value: "46027897" } });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("descarta letras del DNI", () => {
    const { dni } = renderizar();
    fireEvent.change(dni, { target: { value: "12ab34" } });
    expect(dni).toHaveValue("1234");
  });
});
