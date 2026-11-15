import { useState } from "react";
import RiesgoMap from "../componentes/RiesgoMap";
import AnalisisPunto from "../componentes/AnalisisPunto";
import AlbergueCercano from "../componentes/AlbergueCercano";
import { useAlbergues } from "../ganchos/useAlbergues";
import { leerUbicacionGuardada, guardarUbicacion } from "../ganchos/useRiesgo";

function Mapa() {
  // Arranca en la ubicación que la persona ya compartió en Inicio (si lo hizo).
  const [punto, setPunto] = useState(leerUbicacionGuardada);
  const [buscando, setBuscando] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);
  const { data: albergues } = useAlbergues();

  function usarMiUbicacion() {
    setErrorUbicacion(null);
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite obtener tu ubicación.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nueva = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lon: Number(pos.coords.longitude.toFixed(5)),
        };
        guardarUbicacion(nueva);
        setPunto(nueva);
        setBuscando(false);
      },
      () => {
        setErrorUbicacion("No se pudo obtener tu ubicación. Toca el mapa donde vives.");
        setBuscando(false);
      },
      { timeout: 10000, maximumAge: 5 * 60_000 }
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="sr-entra mb-6">
        <p className="font-semibold text-sm uppercase tracking-wide" style={{ color: "var(--color-dorado)" }}>
          Mapa de riesgo
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold leading-none mt-1.5">¿Cómo está tu zona?</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Toca el mapa donde vives para ver su riesgo de inundación y el albergue más cercano con espacio.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <RiesgoMap altura="560px" puntoAnalizado={punto} onElegirPunto={setPunto} />
        </div>
        <div className="flex flex-col gap-4">
          <AnalisisPunto
            punto={punto}
            onUsarMiUbicacion={usarMiUbicacion}
            buscandoUbicacion={buscando}
            errorUbicacion={errorUbicacion}
          />
          <AlbergueCercano punto={punto} albergues={albergues} />
        </div>
      </div>
    </main>
  );
}

export default Mapa;
