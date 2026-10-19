import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

const CLAVE_DESCARTE = "piura-alerta-invitacion-descartada";
const DEMORA_MS = 45_000;
const NO_MOSTRAR_POR_MS = 7 * 24 * 60 * 60_000;

function descartadaRecientemente() {
  try {
    const descartadaEn = Number(localStorage.getItem(CLAVE_DESCARTE));
    return Number.isFinite(descartadaEn) && Date.now() - descartadaEn < NO_MOSTRAR_POR_MS;
  } catch {
    return false;
  }
}

// Aviso discreto para visitantes sin cuenta, después de un rato usando la
// app (nunca apenas entran: primero tienen que ver el estado del río, que es
// lo urgente). La cuenta es opcional para todo lo crítico -- esto solo
// cuenta qué suma tenerla. "Ahora no" lo silencia por una semana.
function InvitacionSesion() {
  const { usuario, modal, abrirModal } = useAuth();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Con sesión no hace falta apagarlo acá: el render ya lo oculta si hay usuario.
    if (usuario || descartadaRecientemente()) return undefined;
    const id = setTimeout(() => setVisible(true), DEMORA_MS);
    return () => clearTimeout(id);
  }, [usuario]);

  function descartar() {
    setVisible(false);
    try {
      localStorage.setItem(CLAVE_DESCARTE, String(Date.now()));
    } catch {
      // sin almacenamiento: se vuelve a mostrar en la próxima visita
    }
  }

  // Ni en el panel operativo ni encima de otro diálogo abierto.
  if (!visible || usuario || modal || pathname.startsWith("/admin")) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="invitacion-titulo"
      className="fixed bottom-5 left-4 right-24 sm:right-auto sm:max-w-sm z-30 rounded-2xl border shadow-lg p-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <p id="invitacion-titulo" className="font-bold text-sm">
        ¿Te avisamos por SMS si el río sube?
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
        Con una cuenta gratis recibes alertas en tu celular, puedes marcar «Estoy a salvo» y tus reportes
        quedan con tu nombre.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => {
            descartar();
            abrirModal("registro");
          }}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={descartar}
          className="text-sm font-medium px-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

export default InvitacionSesion;
