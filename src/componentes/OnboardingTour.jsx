import { useEffect, useState } from "react";
import { useModalA11y } from "../ganchos/useModalA11y";
import Icon from "./Icon";

const CLAVE_VISTO = "piura-alerta-tour-visto";
const EVENTO_ABRIR = "piura-alerta:abrir-tour";

const PASOS = [
  {
    icono: "bi-water",
    titulo: "El río, en tiempo real",
    texto:
      "En Inicio ves el nivel del río Piura medido por nuestros sensores, si está subiendo y cuánto falta para una alerta.",
  },
  {
    icono: "bi-map",
    titulo: "Mapa de riesgo",
    texto:
      "Ubica las zonas inundables, los albergues con su aforo actual y cómo llegar caminando al más cercano.",
  },
  {
    icono: "bi-camera",
    titulo: "Reporta lo que ves",
    texto:
      "Comparte una foto de calles inundadas o daños en tu zona. No necesitas cuenta para reportar.",
  },
  {
    icono: "bi-exclamation-triangle-fill",
    titulo: "Botón de emergencia",
    texto:
      "El botón rojo de abajo a la derecha tiene los números de emergencia y un SOS que manda tu ubicación a Defensa Civil.",
  },
  {
    icono: "bi-bell",
    titulo: "Recibe las alertas",
    texto:
      "Activa la campana de arriba para recibir notificaciones, o crea una cuenta para que también te avisemos por SMS.",
  },
];

// Para el link "¿Cómo funciona esta app?" del footer: reabre el tour aunque
// ya se haya visto.
export function abrirTourOnboarding() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

function yaLoVio() {
  try {
    return localStorage.getItem(CLAVE_VISTO) === "1";
  } catch {
    return true; // sin almacenamiento, mejor no mostrarlo en cada visita
  }
}

function DialogoTour({ onCerrar }) {
  const [paso, setPaso] = useState(0);
  const contenedorRef = useModalA11y(onCerrar);
  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCerrar}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border p-6 outline-none text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          <Icon name={actual.icono} aria-hidden="true" />
        </span>
        <h3 id="tour-titulo" className="text-lg font-bold mt-4">
          {actual.titulo}
        </h3>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
          {actual.texto}
        </p>

        <div className="flex justify-center gap-1.5 mt-5" aria-hidden="true">
          {PASOS.map((p, i) => (
            <span
              key={p.titulo}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === paso ? 20 : 6,
                backgroundColor: i === paso ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Paso {paso + 1} de {PASOS.length}
        </p>

        <div className="flex gap-2 mt-6">
          {paso > 0 ? (
            <button
              type="button"
              onClick={() => setPaso((p) => p - 1)}
              className="flex-1 text-sm font-semibold py-2.5 rounded-lg"
              style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }}
            >
              Atrás
            </button>
          ) : (
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 text-sm font-medium py-2.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Saltar
            </button>
          )}
          <button
            type="button"
            onClick={() => (esUltimo ? onCerrar() : setPaso((p) => p + 1))}
            className="flex-1 text-sm font-semibold py-2.5 rounded-lg text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {esUltimo ? "Empezar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Se muestra solo la primera visita; después, solo a pedido (footer).
function OnboardingTour() {
  const [abierto, setAbierto] = useState(() => !yaLoVio());

  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  function cerrar() {
    setAbierto(false);
    try {
      localStorage.setItem(CLAVE_VISTO, "1");
    } catch {
      // no se pudo recordar: se mostrará otra vez la próxima visita
    }
  }

  return abierto ? <DialogoTour onCerrar={cerrar} /> : null;
}

export default OnboardingTour;
