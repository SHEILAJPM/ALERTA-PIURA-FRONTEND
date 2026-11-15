import { useEffect, useState } from "react";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getAvisosLluvia } from "../utilidades/api";
import { avisoVigente } from "../utilidades/avisoLluvia";

const CLAVE_CERRADO = "piura-alerta-aviso-lluvia-cerrado";

function leerCerrado() {
  try {
    return sessionStorage.getItem(CLAVE_CERRADO);
  } catch {
    return null;
  }
}

// Franja con el aviso preventivo de lluvia fuerte (backend avisoLluvia.js):
// llega en vivo por WebSocket y, al abrir la app, se muestra el último si
// todavía está vigente. Se puede cerrar; un aviso nuevo vuelve a aparecer.
function AvisoLluvia() {
  const [aviso, setAviso] = useState(null);
  const [cerrado, setCerrado] = useState(leerCerrado);

  useEffect(() => {
    let vigente = true;
    getAvisosLluvia(1)
      .then((avisos) => {
        if (vigente && avisoVigente(avisos?.[0])) setAviso(avisos[0]);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  useWebSocketEvent("aviso_lluvia", (nuevo) => {
    setAviso({ ...nuevo, id: nuevo.id ?? `vivo-${Date.now()}`, enviado_en: new Date().toISOString() });
  });

  if (!aviso || String(aviso.id) === cerrado) return null;

  function cerrar() {
    setCerrado(String(aviso.id));
    try {
      sessionStorage.setItem(CLAVE_CERRADO, String(aviso.id));
    } catch {
      // sin almacenamiento: se cierra solo hasta recargar
    }
  }

  return (
    <div
      role="alert"
      className="sr-entra"
      style={{ backgroundColor: "var(--color-sol)", color: "var(--color-sol-texto)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start gap-3">
        <span
          className="sr-latido mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--color-sol-texto)", color: "var(--color-sol-texto)" }}
        />
        <p className="flex-1 text-sm font-bold leading-snug">{aviso.mensaje}</p>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso de lluvia"
          className="sr-presionable w-9 h-9 -my-1 rounded-full shrink-0 font-bold text-lg"
          style={{ backgroundColor: "rgba(14,45,71,0.1)" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default AvisoLluvia;
