import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const auth = { usuario: null, sesionExpirada: false };
vi.mock("../contexto/AuthContext", () => ({
  useAuth: () => ({ ...auth, login: vi.fn(), registro: vi.fn(), confirmar2FA: vi.fn() }),
}));
vi.mock("../utilidades/plataforma", () => ({ exigirSesion: true, esAppNativa: true }));

const { default: PuertaSesion } = await import("../componentes/PuertaSesion");

function renderizar() {
  return render(
    <MemoryRouter>
      <PuertaSesion>
        <p>Contenido de la app</p>
      </PuertaSesion>
    </MemoryRouter>
  );
}

describe("PuertaSesion (app Android)", () => {
  afterEach(() => {
    auth.usuario = null;
  });

  it("sin sesión muestra el login y no la app", () => {
    renderizar();
    expect(screen.queryByText("Contenido de la app")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Correo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("deja cambiar a registrarse", () => {
    renderizar();
    fireEvent.click(screen.getByRole("tab", { name: "Registrarse" }));
    expect(screen.getByPlaceholderText("DNI (8 dígitos)")).toBeInTheDocument();
  });

  it("con sesión abre la app", () => {
    auth.usuario = { nombre: "Sheila", rol: "ciudadano" };
    renderizar();
    expect(screen.getByText("Contenido de la app")).toBeInTheDocument();
  });
});
