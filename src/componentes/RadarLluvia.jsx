import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRadarLluvia } from "../ganchos/useRadarLluvia";
import { useTheme } from "../contexto/ThemeContext";
import { CARTO_API_KEY, urlTilesPara, atribucionMapaBase } from "../utilidades/mapaBase";
import { formatearHora } from "../utilidades/fecha";
import Skeleton from "./Skeleton";
import Icon from "./Icon";

const PIURA = [-5.1945, -80.6328];
const MS_POR_CUADRO = 700;
// La API gratuita de RainViewer no sirve teselas más allá del zoom 7: arriba
// de eso Leaflet estira las del 7 (maxNativeZoom) en vez de mostrar el
// cartel de "Zoom Level Not Supported".
const ZOOM_RADAR_MAX = 7;
const ATRIBUCION_RADAR =
  '<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>';

// Radar de lluvia animado de las últimas ~2 horas sobre el norte del Perú y
// Ecuador. Es una vista regional a propósito: la lluvia que hace crecer el río
// Piura cae en la cuenca alta (sierra de Piura y Huancabamba), no en la ciudad.
function RadarLluvia() {
  const { data: cuadros, loading, error } = useRadarLluvia();
  const { theme } = useTheme();
  const [indice, setIndice] = useState(null);
  const [reproduciendo, setReproduciendo] = useState(true);

  const total = cuadros?.length ?? 0;
  const actual = indice === null ? total - 1 : Math.min(indice, total - 1);

  useEffect(() => {
    if (!reproduciendo || total < 2) return undefined;
    const id = setInterval(() => {
      setIndice((i) => ((i === null ? total - 1 : i) + 1) % total);
    }, MS_POR_CUADRO);
    return () => clearInterval(id);
  }, [reproduciendo, total]);

  return (
    <section
      className="mt-8 rounded-3xl border p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="bi-water" aria-hidden="true" style={{ color: "var(--color-primary)" }} />
            Radar de lluvia en vivo
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Lluvia detectada por radar en la región durante las últimas 2 horas. Las lluvias de la sierra
            llegan al río Piura horas después.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1"
          style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "currentColor" }} />
          Datos de RainViewer
        </span>
      </div>

      <div className="mt-4 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        {loading && !cuadros ? (
          <Skeleton className="w-full h-90 rounded-none" />
        ) : error ? (
          <p className="p-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
            No se pudo cargar el radar de lluvia en este momento.
          </p>
        ) : (
          <MapContainer
            center={PIURA}
            zoom={6}
            minZoom={4}
            maxZoom={9}
            scrollWheelZoom={false}
            style={{ height: "360px", width: "100%" }}
            className={theme === "dark" && !CARTO_API_KEY ? "mapa-invertido" : undefined}
          >
            <TileLayer key={theme} attribution={atribucionMapaBase()} url={urlTilesPara(theme)} />
            {/* Todos los cuadros quedan montados y solo cambia la opacidad: así
                la animación no parpadea esperando que baje cada imagen. */}
            {cuadros.map((cuadro, i) => (
              <TileLayer
                key={cuadro.url}
                url={cuadro.url}
                attribution={i === 0 ? ATRIBUCION_RADAR : undefined}
                opacity={i === actual ? 0.75 : 0}
                maxNativeZoom={ZOOM_RADAR_MAX}
                zIndex={10}
              />
            ))}
            <CircleMarker
              center={PIURA}
              radius={7}
              pathOptions={{ color: "#fff", weight: 2, fillColor: "#c1272d", fillOpacity: 1 }}
            >
              <Tooltip permanent direction="right" offset={[8, 0]}>
                Piura
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        )}
      </div>

      {total > 0 && !error && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReproduciendo((r) => !r)}
            aria-label={reproduciendo ? "Pausar animación" : "Reproducir animación"}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0"
            style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
          >
            {reproduciendo ? "❚❚" : "▶"}
          </button>
          <input
            type="range"
            min={0}
            max={total - 1}
            value={actual}
            onChange={(e) => {
              setReproduciendo(false);
              setIndice(Number(e.target.value));
            }}
            aria-label="Momento del radar"
            className="flex-1 accent-[var(--color-primary)]"
          />
          <span className="text-sm font-mono font-semibold whitespace-nowrap text-right">
            {formatearHora(cuadros[actual].fecha)}
          </span>
        </div>
      )}
    </section>
  );
}

export default RadarLluvia;
