import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useModalA11y } from "../ganchos/useModalA11y";
import Icon from "./Icon";

const CLAVE_VISTO = "piura-alerta-tour-visto";
const EVENTO_ABRIR = "piura-alerta:abrir-tour";

// Rutas de tarea puntual a las que se llega por un enlace directo (ej. desde
// un correo): mostrar el tour ahí de sorpresa taparía el formulario que la
// persona vino a completar. El tour se sigue pudiendo abrir a mano desde el
// footer en cualquier página.
const RUTAS_SIN_TOUR_AUTOMATICO = ["/restablecer-password"];

// Mismo patrón que dispararSesionExpirada en AuthContext.jsx: un evento del
// DOM para poder reabrir el tour desde cualquier parte (ej. el link de ayuda
// en el Footer) sin tener que subir estado a un contexto solo para esto.
export function abrirTourOnboarding() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

const PASOS = [
  {
    icono: "bi-water",
    titulo: "Bienvenido a Piura Alerta",
    texto: "Monitorea en tiempo real el nivel del río Piura y entérate antes de que el riesgo suba.",
  },
  {
    icono: "bi-geo-alt-fill",
    titulo: "Reporta lo que ves",
    texto: "Comparte fotos y descripciones de tu zona en Reportes — no necesitas cuenta para publicar.",
  },
  {
    icono: "bi-house-door-fill",
    titulo: "Encuentra ayuda cercana",
    texto: "El Mapa muestra albergues disponibles y zonas de riesgo cerca de ti.",
  },
  {
    icono: "bi-bell-fill",
    titulo: "Activa las notificaciones",
    texto: "Tocá la campana del menú para recibir un aviso en tu navegador si el río llega a alerta roja.",
  },
];

function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [paso, setPaso] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => {
    if (RUTAS_SIN_TOUR_AUTOMATICO.includes(pathname)) return;
    if (!localStorage.getItem(CLAVE_VISTO)) {
      // Pequeño delay para no competir con la carga inicial del dashboard.
      const id = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function manejarAbrir() {
      setPaso(0);
      setVisible(true);
    }
    window.addEventListener(EVENTO_ABRIR, manejarAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR, manejarAbrir);
  }, []);

  function cerrar() {
    localStorage.setItem(CLAVE_VISTO, "1");
    setVisible(false);
  }

  if (!visible) return null;
  return <DialogoTour paso={paso} setPaso={setPaso} onCerrar={cerrar} />;
}

function DialogoTour({ paso, setPaso, onCerrar }) {
  const contenedorRef = useModalA11y(onCerrar);
  const esUltimo = paso === PASOS.length - 1;
  const actual = PASOS[paso];

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
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Omitir"
          className="float-right text-xl leading-none -mt-1 -mr-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          ×
        </button>

        <span
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto"
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

        <div className="flex items-center justify-center gap-1.5 mt-5">
          {PASOS.map((p, i) => (
            <span
              key={p.titulo}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                backgroundColor: i === paso ? "var(--color-primary)" : "var(--color-border)",
                width: i === paso ? "1.25rem" : "0.375rem",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5">
          {paso > 0 && (
            <button
              type="button"
              onClick={() => setPaso((p) => p - 1)}
              className="flex-1 text-sm font-semibold py-2.5 rounded-lg border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={esUltimo ? onCerrar : () => setPaso((p) => p + 1)}
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

export default OnboardingTour;
