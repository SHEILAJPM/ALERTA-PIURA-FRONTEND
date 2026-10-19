import { render, screen, fireEvent } from "@testing-library/react";
import CalculadoraSacos from "../componentes/CalculadoraSacos";

describe("CalculadoraSacos", () => {
  it("calcula los sacos para una puerta de 1 m y 40 cm de alto", () => {
    render(<CalculadoraSacos />);
    // 4 filas de 12 cm x (ceil(1 / 0.4) + 1) = 4 sacos por fila
    expect(screen.getByText("~16 sacos")).toBeInTheDocument();
  });

  it("recalcula al cambiar las medidas", () => {
    render(<CalculadoraSacos />);
    fireEvent.change(screen.getByLabelText("Ancho a cubrir (m)"), { target: { value: "2" } });
    expect(screen.getByText("~24 sacos")).toBeInTheDocument();
  });

  it("usa forma de pirámide por encima de 50 cm", () => {
    render(<CalculadoraSacos />);
    fireEvent.change(screen.getByLabelText("Altura de la barrera (cm)"), { target: { value: "80" } });
    expect(screen.getByText(/en forma de pirámide/)).toBeInTheDocument();
  });

  it("avisa si las medidas no son válidas", () => {
    render(<CalculadoraSacos />);
    fireEvent.change(screen.getByLabelText("Ancho a cubrir (m)"), { target: { value: "0" } });
    expect(screen.getByText(/Ingresa un ancho/)).toBeInTheDocument();
  });
});
