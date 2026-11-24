import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { vozDisponible, leerEnVozAlta, detenerVoz } from "../utilidades/voz";

// "Escuchar este aviso": lee el texto en voz alta. Si el dispositivo no
// tiene voz disponible, no se muestra (no ofrece algo que no va a funcionar).
// tono="claro" sobre fondos claros; tono="oscuro" sobre rojo/azul.
function BotonEscuchar({ texto, tono = "claro", className = "" }) {
  const [leyendo, setLeyendo] = useState(false);
  const [disponible] = useState(vozDisponible);

  // Si se desmonta mientras lee (cambio de pantalla), corta la voz.
  useEffect(() => () => void detenerVoz(), []);

  if (!disponible || !texto) return null;

  async function alternar() {
    if (leyendo) {
      await detenerVoz();
      setLeyendo(false);
      return;
    }
    setLeyendo(true);
    try {
      await leerEnVozAlta(texto);
    } catch {
      // sin voz en este momento: el texto sigue en pantalla
    } finally {
      setLeyendo(false);
    }
  }

  const estilo =
    tono === "oscuro"
      ? { backgroundColor: "rgba(255,255,255,0.18)", color: "#ffffff" }
      : { backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={leyendo}
      className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold transition active:scale-95 ${className}`}
      style={estilo}
    >
      {leyendo ? (
        <Square size={16} fill="currentColor" aria-hidden="true" />
      ) : (
        <Volume2 size={18} aria-hidden="true" />
      )}
      {leyendo ? "Detener" : "Escuchar aviso"}
    </button>
  );
}

export default BotonEscuchar;
