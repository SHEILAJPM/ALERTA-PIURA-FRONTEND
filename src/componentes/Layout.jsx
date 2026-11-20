import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header, { BarraLateral, BarraInferior } from "./Header";
import AlertaGlobal from "./AlertaGlobal";
import AvisoLluvia from "./AvisoLluvia";
import AvisoSinConexion from "./AvisoSinConexion";
import Footer from "./Footer";
import OnboardingTour from "./OnboardingTour";
import AsistenteFlotante from "./AsistenteFlotante";

// Fondo cálido con manchas de luz (fijo, detrás de todo). Navegación:
// barra lateral en escritorio; barra superior + barra inferior flotante con
// el SOS al centro en móvil.
function Layout() {
  const { pathname } = useLocation();

  // Cada pantalla nueva empieza arriba (si no, al cambiar de pestaña se
  // queda con el scroll de la anterior).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <div className="pa-fondo" aria-hidden="true">
        <span className="pa-mancha pa-mancha-1" />
        <span className="pa-mancha pa-mancha-2" />
        <span className="pa-mancha pa-mancha-3" />
      </div>

      <BarraLateral />

      <div className="pa-contenido min-h-screen flex flex-col">
        <Header />
        <div className="empty:hidden flex flex-col gap-2 px-3 sm:px-6 lg:px-8 pt-3 lg:pt-5 [&>*]:rounded-[22px] [&>*]:overflow-hidden [&>*]:shadow-[var(--shadow-glass)]">
          <AvisoSinConexion />
          <AlertaGlobal />
          <AvisoLluvia />
        </div>
        {/* key por ruta: al navegar, la pantalla nueva entra con fade + slide. */}
        <div key={pathname} className="pa-pagina flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>

      <BarraInferior />
      <OnboardingTour />
      <AsistenteFlotante />
    </div>
  );
}

export default Layout;
