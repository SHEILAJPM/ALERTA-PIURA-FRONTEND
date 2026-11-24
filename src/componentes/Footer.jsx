import { Link } from "react-router-dom";
import { abrirTourOnboarding } from "./OnboardingTour";

function Footer() {
  return (
    <footer className="mt-10 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center">
        <div className="orla w-28" aria-hidden="true" />
        <p className="font-display text-base">Piura Alerta</p>
        <p className="text-sm max-w-md" style={{ color: "var(--color-text-muted)" }}>
          Sistema de monitoreo y prevención ante peligros por lluvias
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-semibold">
          <button
            type="button"
            onClick={abrirTourOnboarding}
            className="min-h-[44px] transition hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            ¿Cómo funciona esta app?
          </button>
          <Link
            to="/app"
            className="min-h-[44px] inline-flex items-center transition hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            Descarga la app en tu celular
          </Link>
          <Link
            to="/datos-abiertos"
            className="min-h-[44px] inline-flex items-center transition hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            Datos abiertos
          </Link>
          <Link
            to="/impacto"
            className="min-h-[44px] inline-flex items-center transition hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            Nuestro impacto
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
