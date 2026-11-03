import { Link } from "react-router-dom";
import { abrirTourOnboarding } from "./OnboardingTour";

function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--color-brand-chrome)" }} className="text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-semibold">Río Piura Alerta</p>
        <p className="text-sm text-white/60 mt-1">
          Sistema de monitoreo y prevención ante peligros por lluvias
        </p>
        <button
          type="button"
          onClick={abrirTourOnboarding}
          className="text-sm text-white/60 hover:text-white transition underline mt-3"
        >
          ¿Cómo funciona esta app?
        </button>
        <Link to="/app" className="block text-sm text-white/60 hover:text-white transition underline mt-2">
          Descarga la app en tu celular
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
