// CARTO dejó de servir sus basemaps sin clave (los tiles vienen con una
// marca de agua de "API KEY REQUIRED" encima). La clave es gratis e
// instantánea (carto.com/basemaps/apikey, sin necesitar cuenta) y da mapa
// claro/oscuro a juego con el tema de la app. Sin ella, se usa OpenStreetMap
// (siempre gratis, sin clave) como respaldo -- un solo estilo, sin variante
// oscura, pero nunca queda un mapa roto mientras se consigue la clave.
export const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY;

export function urlTilesPara(theme) {
  if (CARTO_API_KEY) {
    const estilo = theme === "dark" ? "dark_all" : "light_all";
    return `https://basemaps.cartocdn.com/rastertiles/${estilo}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;
  }
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
}

const ATRIBUCION_CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ATRIBUCION_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function atribucionMapaBase() {
  return CARTO_API_KEY ? ATRIBUCION_CARTO : ATRIBUCION_OSM;
}
