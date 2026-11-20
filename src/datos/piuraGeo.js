// Trazado del río Piura y puentes de la ciudad, a partir de OpenStreetMap
// (© colaboradores de OpenStreetMap, licencia ODbL: openstreetmap.org/copyright).
// Generado una sola vez y simplificado (Ramer-Douglas-Peucker, 20 m). Coordenadas
// en metros alrededor de la Plaza de Armas: x hacia el este, z hacia el sur.
// Lo usa solo la vista 3D del Laboratorio (escena estilizada, no un mapa).
export const RIO_PIURA = [
  [1282, -4684],
  [1366, -4495],
  [1324, -4270],
  [579, -2720],
  [135, -1627],
  [144, -1484],
  [251, -1086],
  [308, -310],
  [291, 2],
  [104, 528],
  [-155, 1039],
  [-170, 1136],
  [-460, 1658],
  [-825, 2185],
  [-1176, 2420],
  [-1261, 2404],
  [-1376, 2463],
  [-1830, 2499],
  [-1954, 2585],
  [-2136, 2839],
  [-2413, 3035],
  [-2581, 3333],
  [-2607, 3647],
  [-2789, 3959],
  [-2912, 4454],
  [-3085, 4788],
];

export const PUENTES_PIURA = [
  {
    nombre: "Puente Andrés Avelino Cáceres",
    x: 139,
    z: -1589,
    angulo: -3.135,
    largo: 153,
    peatonal: false,
  },
  {
    nombre: "Puente Luis Antonio Eguiguren",
    x: 254,
    z: -999,
    angulo: -0.052,
    largo: 113,
    peatonal: false,
  },
  {
    nombre: "Puente Sánchez Cerro",
    x: 318,
    z: -384,
    angulo: -3.086,
    largo: 116,
    peatonal: false,
  },
  {
    nombre: "Puente Colgante",
    x: 271,
    z: 8,
    angulo: -2.956,
    largo: 109,
    peatonal: true,
  },
  {
    nombre: "Puente Bolognesi",
    x: 126,
    z: 414,
    angulo: 0.303,
    largo: 154,
    peatonal: false,
  },
  {
    nombre: "Puente Panamericana Norte",
    x: -2645,
    z: 3679,
    angulo: 0.603,
    largo: 307,
    peatonal: false,
  },
];
