import { Outlet } from "react-router-dom";
import Header from "./Header";
import AlertaGlobal from "./AlertaGlobal";
import Footer from "./Footer";
import OnboardingTour from "./OnboardingTour";
import BotonEmergencia from "./BotonEmergencia";
import AsistenteFlotante from "./AsistenteFlotante";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
      <Header />
      <AlertaGlobal />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <OnboardingTour />
      <BotonEmergencia />
      <AsistenteFlotante />
    </div>
  );
}

export default Layout;
