// Revisor de síntomas de la página Salud. NO es un diagnóstico: orienta qué
// hacer (emergencia, posta o vigilar en casa) y con qué enfermedades del
// fenómeno puede estar relacionado. Ante la duda, siempre manda a atenderse:
// cualquier señal de alarma va a emergencias y cualquier fiebre, a la posta.

export const SINTOMAS = [
  { id: "fiebre", texto: "Fiebre" },
  { id: "dolor_ojos", texto: "Dolor detrás de los ojos" },
  { id: "dolor_musculos", texto: "Dolor de músculos o de pantorrillas" },
  { id: "dolor_cabeza", texto: "Dolor de cabeza" },
  { id: "manchas", texto: "Manchas o ronchas en la piel" },
  { id: "ojos_rojos", texto: "Ojos rojos" },
  { id: "diarrea", texto: "Diarrea" },
  { id: "vomitos", texto: "Vómitos" },
  { id: "tos", texto: "Tos o dolor de garganta" },
  { id: "herida", texto: "Herida roja, hinchada o con pus" },
  { id: "picazon", texto: "Picazón o piel abierta entre los dedos" },
  // Señales de alarma: si hay una, se va a emergencias.
  { id: "respirar", texto: "Dificultad para respirar", alarma: true },
  { id: "sangrado", texto: "Sangrado de encías o nariz, o vómitos con sangre", alarma: true },
  { id: "dolor_barriga_fuerte", texto: "Dolor de barriga fuerte que no se calma", alarma: true },
  { id: "no_toma_liquidos", texto: "Vómitos que no paran o no puede tomar líquidos", alarma: true },
  { id: "somnolencia", texto: "Mucho sueño, confusión o desmayo", alarma: true },
  { id: "no_orina", texto: "Casi no orina o está muy decaído", alarma: true },
];

const ALARMAS = new Set(SINTOMAS.filter((s) => s.alarma).map((s) => s.id));

// Síntomas típicos de cada enfermedad del fenómeno. Los "clave" son los
// característicos (pesan más al ordenar); los "generales", como la fiebre o
// el dolor de cabeza, aparecen en casi todas. `requiere` es la condición
// mínima para sugerirla.
export const TIPICOS = {
  dengue: {
    clave: ["dolor_ojos", "dolor_musculos", "manchas", "sangrado"],
    generales: ["fiebre", "dolor_cabeza"],
    requiere: (s) => s.has("fiebre"),
  },
  leptospirosis: {
    clave: ["dolor_musculos", "ojos_rojos"],
    generales: ["fiebre", "dolor_cabeza"],
    requiere: (s, { contactoAgua }) =>
      contactoAgua && (s.has("fiebre") || s.has("dolor_musculos") || s.has("ojos_rojos")),
  },
  diarrea: {
    clave: ["diarrea", "vomitos", "no_toma_liquidos", "dolor_barriga_fuerte"],
    generales: ["fiebre"],
    requiere: (s) => s.has("diarrea") || s.has("vomitos") || s.has("no_toma_liquidos"),
  },
  piel: {
    clave: ["herida", "picazon", "manchas"],
    generales: [],
    requiere: (s) => s.has("herida") || s.has("picazon") || (s.has("manchas") && !s.has("fiebre")),
  },
  respiratorias: {
    clave: ["tos", "respirar"],
    generales: ["fiebre", "dolor_cabeza"],
    requiere: (s) => s.has("tos") || s.has("respirar"),
  },
};

// seleccion: ids de SINTOMAS. contactoAgua: estuvo en agua o barro de la
// inundación. grupoRiesgo: bebé o niño pequeño, gestante o adulto mayor.
// Devuelve { nivel: "emergencia" | "posta" | "vigilar" | null, relacionadas,
// posibles }, donde `posibles` trae, de mayor a menor coincidencia, cada
// enfermedad con los síntomas típicos que coinciden y un grado orientativo.
export function evaluarSintomas(seleccion, { contactoAgua = false, grupoRiesgo = false } = {}) {
  const s = new Set(seleccion);
  if (s.size === 0) return { nivel: null, relacionadas: [], posibles: [] };

  const tiene = (...ids) => ids.some((id) => s.has(id));
  const posibles = Object.entries(TIPICOS)
    .filter(([, t]) => t.requiere(s, { contactoAgua }))
    .map(([id, t]) => {
      const tipicos = [...t.clave, ...t.generales];
      const coinciden = tipicos.filter((x) => s.has(x));
      // El contacto con agua de la inundación cuenta como un indicio
      // característico más de la leptospirosis.
      const claves = t.clave.filter((x) => s.has(x)).length + (id === "leptospirosis" ? 1 : 0);
      const proporcion = coinciden.length / tipicos.length;
      return {
        id,
        coinciden,
        total: tipicos.length,
        grado: claves >= 2 || (claves >= 1 && proporcion >= 0.5) ? "muchos" : "algunos",
        claves,
        proporcion,
      };
    })
    .sort((a, b) => b.claves - a.claves || b.proporcion - a.proporcion);
  const relacionadas = posibles.map((p) => p.id);

  let nivel;
  if ([...s].some((id) => ALARMAS.has(id))) nivel = "emergencia";
  else if (s.has("fiebre") || s.has("herida") || relacionadas.includes("leptospirosis")) nivel = "posta";
  else if (grupoRiesgo && tiene("diarrea", "vomitos", "tos")) nivel = "posta";
  else nivel = "vigilar";

  return { nivel, relacionadas, posibles };
}
