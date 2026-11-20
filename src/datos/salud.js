// Opciones del aviso: lo que un vecino puede reconocer, no un diagnóstico.
export const OPCIONES_AVISO = [
  { id: "fiebre_dengue", texto: "Fiebre o posible dengue" },
  { id: "diarrea", texto: "Diarrea o vómitos" },
  { id: "leptospirosis", texto: "Fiebre y dolor de músculos tras pisar agua de la inundación" },
  { id: "respiratoria", texto: "Tos o dificultad para respirar" },
  { id: "piel", texto: "Ronchas o heridas infectadas" },
  { id: "otra", texto: "Otra enfermedad" },
];

export const NOMBRE_ENFERMEDAD = Object.fromEntries(OPCIONES_AVISO.map((o) => [o.id, o.texto]));
