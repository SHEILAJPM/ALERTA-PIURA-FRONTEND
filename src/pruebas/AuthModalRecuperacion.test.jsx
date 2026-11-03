import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthModal from "../componentes/AuthModal";
import { olvidarPassword, restablecerPassword, ApiError } from "../utilidades/api";

vi.mock("../contexto/AuthContext", () => ({
  useAuth: () => ({
    modal: "olvide-password",
    cerrarModal: vi.fn(),
    abrirModal: vi.fn(),
    sesionExpirada: false,
  }),
}));

vi.mock("../utilidades/api", async (importOriginal) => ({
  ...(await importOriginal()),
  olvidarPassword: vi.fn(),
  restablecerPassword: vi.fn(),
}));

function renderizar() {
  render(
    <MemoryRouter>
      <AuthModal />
    </MemoryRouter>
  );
}

async function pedirCodigo(correo) {
  fireEvent.change(screen.getByPlaceholderText("Correo"), { target: { value: correo } });
  fireEvent.click(screen.getByRole("button", { name: "Mandar código" }));
  return screen.findByLabelText("Código de 6 dígitos");
}

describe("Recuperar contraseña con código", () => {
  beforeEach(() => {
    olvidarPassword.mockReset();
    restablecerPassword.mockReset();
    olvidarPassword.mockResolvedValue({ mensaje: "ok" });
  });

  it("pide el código por correo y cambia la contraseña con código y contraseña nueva", async () => {
    restablecerPassword.mockResolvedValue(null);
    renderizar();

    const codigo = await pedirCodigo("sheila@example.com");
    expect(olvidarPassword).toHaveBeenCalledWith("sheila@example.com");

    fireEvent.change(codigo, { target: { value: "12a3456" } });
    expect(codigo).toHaveValue("123456");
    fireEvent.change(screen.getByPlaceholderText("Nueva contraseña (mínimo 8 caracteres)"), {
      target: { value: "claveNueva123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await screen.findByText(/Tu contraseña se cambió/);
    expect(restablecerPassword).toHaveBeenCalledWith({
      correo: "sheila@example.com",
      codigo: "123456",
      passwordNueva: "claveNueva123",
    });
  });

  it("muestra el error del backend si el código es incorrecto", async () => {
    restablecerPassword.mockImplementation(async () => {
      throw new ApiError("Código inválido o expirado", 400);
    });
    renderizar();

    const codigo = await pedirCodigo("sheila@example.com");
    fireEvent.change(codigo, { target: { value: "000000" } });
    fireEvent.change(screen.getByPlaceholderText("Nueva contraseña (mínimo 8 caracteres)"), {
      target: { value: "claveNueva123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("Código inválido o expirado")).toBeInTheDocument();
  });

  it("permite reenviar el código", async () => {
    renderizar();
    await pedirCodigo("sheila@example.com");

    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/ }));
    await waitFor(() => expect(olvidarPassword).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Código reenviado/)).toBeInTheDocument();
  });
});
