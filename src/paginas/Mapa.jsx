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

  // En celular el resultado queda debajo del mapa, fuera de la vista: al
  // elegir un punto se baja hasta él para que la persona vea la respuesta.
  function elegirPunto(nuevo) {
    setPunto(nuevo);
    if (window.matchMedia?.("(max-width: 1023px)").matches) {
      const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() =>
        document
          .getElementById("analisis-titulo")
          ?.closest("section")
          ?.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" })
      );
    }
  }

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
        elegirPunto(nueva);
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
    <main className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8">
      <section className="pa-entra mb-6 px-1">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Mapa de riesgo
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">¿Cómo está tu zona?</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Escribe tu dirección o toca el mapa donde vives para ver su riesgo de inundación y el albergue más
          cercano con espacio.
        </p>
      </section>

      {/* Escritorio: mapa grande al centro y panel fijo a la derecha. Móvil:
          mapa arriba y el resultado debajo. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
        <div className="pa-entra min-w-0" style={{ "--i": 1 }}>
          <RiesgoMap altura="clamp(380px, 68vh, 760px)" puntoAnalizado={punto} onElegirPunto={elegirPunto} />
        </div>
        <div className="pa-entra flex flex-col gap-4 lg:sticky lg:top-8" style={{ "--i": 2 }}>
          <AnalisisPunto
            punto={punto}
            onUsarMiUbicacion={usarMiUbicacion}
            onElegirDireccion={(nueva) => {
              guardarUbicacion(nueva);
              elegirPunto(nueva);
            }}
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
