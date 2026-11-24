import { Link } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { useConexion } from "../ganchos/useConexion";

// Franja que aparece solo sin conexión: explica que los datos pueden ser
// viejos y recuerda lo que sí funciona sin internet.
function AvisoSinConexion() {
  const enLinea = useConexion();
  if (enLinea) return null;

  return (
    <div
      role="status"
      className="px-4 py-3 flex items-start gap-3 text-sm"
      style={{ backgroundColor: "var(--color-noche, #0D2E57)", color: "#ffffff" }}
    >
      <WifiOff size={20} aria-hidden="true" className="shrink-0 mt-0.5" />
      <p>
        <strong>Sin conexión.</strong> Ves los últimos datos guardados, que pueden no ser los de ahora. Sin
        internet siguen funcionando tu{" "}
        <Link to="/mochila" className="font-bold underline">
          mochila
        </Link>
        , tu{" "}
        <Link to="/plan" className="font-bold underline">
          plan familiar
        </Link>{" "}
        y el SOS por SMS. Si estás en peligro, llama al 115 o al 116.
      </p>
    </div>
  );
}

export default AvisoSinConexion;
