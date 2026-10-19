import { useMemo, useState } from "react";
import { distanciaKm, puntoDesdeGeoJSON } from "../utilidades/geo";

// "Ordenar por cercanía" en el feed de reportes: pide la ubicación una sola
// vez, al activarlo (nunca al cargar la página), y ordena del más cercano al
// más lejano. Los reportes sin ubicación quedan al final, en su orden original.
export function useOrdenPorCercania(reportes) {
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [activo, setActivo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  function activar() {
    setError(null);
    if (miUbicacion) {
      setActivo(true);
      return;
    }
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener tu ubicación.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMiUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setActivo(true);
        setBuscando(false);
      },
      () => {
        setError("No se pudo obtener tu ubicación. Revisa el permiso de ubicación del navegador.");
        setBuscando(false);
      },
      { timeout: 10000, maximumAge: 5 * 60_000 }
    );
  }

  function desactivar() {
    setActivo(false);
  }

  const reportesOrdenados = useMemo(() => {
    if (!activo || !miUbicacion) return reportes.map((reporte) => ({ reporte, distanciaKm: null }));

    const conDistancia = reportes.map((reporte, indice) => {
      const punto = puntoDesdeGeoJSON(reporte.ubicacion);
      return { reporte, indice, distanciaKm: punto ? distanciaKm(miUbicacion, punto) : null };
    });
    conDistancia.sort((a, b) => {
      if (a.distanciaKm == null && b.distanciaKm == null) return a.indice - b.indice;
      if (a.distanciaKm == null) return 1;
      if (b.distanciaKm == null) return -1;
      return a.distanciaKm - b.distanciaKm;
    });
    return conDistancia.map(({ reporte, distanciaKm: km }) => ({ reporte, distanciaKm: km }));
  }, [reportes, activo, miUbicacion]);

  return { activo, buscando, error, activar, desactivar, reportesOrdenados };
}
