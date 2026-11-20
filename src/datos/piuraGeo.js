// Trazado del río Piura y puentes de la ciudad, a partir de OpenStreetMap
// (© colaboradores de OpenStreetMap, licencia ODbL: openstreetmap.org/copyright).
// Generado una sola vez y simplificado (Ramer-Douglas-Peucker, 20 m). Coordenadas
// en metros alrededor de la Plaza de Armas: x hacia el este, z hacia el sur.
// Lo usa solo la vista 3D del Laboratorio (escena estilizada, no un mapa).
export const RIO_PIURA = [
  [1774, -4711],
  [2049, -4204],
  [2007, -3979],
  [1262, -2428],
  [818, -1335],
  [827, -1192],
  [916, -926],
  [991, -18],
  [974, 294],
  [787, 820],
  [528, 1331],
  [496, 1463],
  [223, 1950],
  [-98, 2436],
  [-493, 2712],
  [-579, 2696],
  [-693, 2755],
  [-1147, 2791],
  [-1271, 2877],
  [-1453, 3131],
  [-1730, 3327],
  [-1898, 3625],
  [-1924, 3939],
  [-2106, 4251],
  [-2147, 4490],
  [-2248, 4788],
];

export const PUENTES_PIURA = [
  {
    nombre: "Puente Andrés Avelino Cáceres",
    x: 822,
    z: -1297,
    angulo: -3.135,
    largo: 153,
    peatonal: false,
  },
  {
    nombre: "Puente Luis Antonio Eguiguren",
    x: 937,
    z: -707,
    angulo: -0.052,
    largo: 113,
    peatonal: false,
  },
  {
    nombre: "Puente Sánchez Cerro",
    x: 1001,
    z: -93,
    angulo: -3.086,
    largo: 116,
    peatonal: false,
  },
  {
    nombre: "Puente Colgante",
    x: 954,
    z: 299,
    angulo: -2.956,
    largo: 109,
    peatonal: true,
  },
  {
    nombre: "Puente Bolognesi",
    x: 809,
    z: 706,
    angulo: 0.303,
    largo: 154,
    peatonal: false,
  },
  {
    nombre: "Puente Panamericana Norte",
    x: -1962,
    z: 3971,
    angulo: 0.603,
    largo: 307,
    peatonal: false,
  },
];
