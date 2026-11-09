import { render, screen } from "@testing-library/react";
import { CalificacionIADetalle, SelloVerificadoIA } from "../componentes/CalificacionIA";

describe("CalificacionIA", () => {
  it("muestra veredicto, puntaje y el análisis de la imagen y la descripción", () => {
    render(
      <CalificacionIADetalle
        veredicto="apto"
        puntaje={92}
        motivo="Foto y texto coinciden"
        detalle={{
          imagen: { apta: true, comentario: "Calle inundada" },
          descripcion: { apta: false, comentario: "Falta decir dónde es" },
        }}
      />
    );
    expect(screen.getByText("IA: Apta")).toBeInTheDocument();
    expect(screen.getByText("92/100")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Puntaje de la IA" })).toHaveAttribute("aria-valuenow", "92");
    expect(screen.getByText("Foto y texto coinciden")).toBeInTheDocument();
    expect(screen.getByText("Calle inundada")).toBeInTheDocument();
    expect(screen.getByText("apta")).toBeInTheDocument();
    expect(screen.getByText("no apta")).toBeInTheDocument();
  });

  it("indica cuando la foto no se pudo analizar", () => {
    render(
      <CalificacionIADetalle
        veredicto="revisar"
        puntaje={50}
        detalle={{ imagen: { apta: null, comentario: "No se pudo analizar la foto" }, descripcion: null }}
      />
    );
    expect(screen.getByText("IA: Revisar")).toBeInTheDocument();
    expect(screen.getByText("sin analizar")).toBeInTheDocument();
  });

  it("no muestra nada sin veredicto válido", () => {
    const { container } = render(<CalificacionIADetalle veredicto={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("el sello público solo aparece en publicaciones aptas", () => {
    const { rerender } = render(<SelloVerificadoIA veredicto="apto" puntaje={88} />);
    expect(screen.getByText("Verificada por IA")).toBeInTheDocument();
    rerender(<SelloVerificadoIA veredicto="revisar" puntaje={40} />);
    expect(screen.queryByText("Verificada por IA")).not.toBeInTheDocument();
  });
});
