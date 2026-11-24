// Quiz "¿Estás preparado?" (ODS 4.7): preguntas cortas para charlas en
// colegios y comunidades. Cada respuesta explica el porqué, en línea con lo
// que dice el resto de la app (Salud, Ayuda, Mochila, ¿Qué hago ahora?).
export const PREGUNTAS_QUIZ = [
  {
    pregunta: "El río está en alerta roja y vives cerca. ¿Qué haces?",
    opciones: [
      "Espero en casa a ver si sigue subiendo",
      "Salgo con mi mochila al albergue y aviso a mis vecinos",
      "Voy al río a ver cuánto subió",
    ],
    correcta: 1,
    explicacion:
      "Con alerta roja hay que salir ya: lleva tu mochila, desconecta la luz y avisa a tus vecinos.",
  },
  {
    pregunta: "¿Cuánta agua en movimiento basta para hacer caer a una persona?",
    opciones: ["Unos 15 cm, a la altura del tobillo", "Un metro", "Dos metros"],
    correcta: 0,
    explicacion:
      "Bastan unos 15 cm de agua en movimiento para tumbarte, y unos 30 cm pueden arrastrar un auto. Nunca cruces una calle inundada.",
  },
  {
    pregunta: "¿Cómo llevas tus documentos en la mochila de emergencia?",
    opciones: [
      "Sueltos, para sacarlos rápido",
      "En una bolsa plástica bien cerrada",
      "No hace falta llevarlos",
    ],
    correcta: 1,
    explicacion:
      "Así no se mojan. Con tu DNI te empadronan como damnificado y puedes recibir ayuda humanitaria.",
  },
  {
    pregunta: "¿Dónde se cría el zancudo del dengue?",
    opciones: [
      "En el agua estancada de baldes, llantas y floreros",
      "En la basura seca",
      "En las ramas de los árboles",
    ],
    correcta: 0,
    explicacion:
      "Por eso hay que vaciar, escobillar y tapar cada semana los recipientes donde se junta agua.",
  },
  {
    pregunta: "Tienes fiebre después de la inundación. ¿Qué NO debes tomar sin indicación médica?",
    opciones: ["Agua", "Aspirina o ibuprofeno", "Suero oral"],
    correcta: 1,
    explicacion:
      "Si es dengue, la aspirina y el ibuprofeno pueden causar sangrado. Ve a la posta y toma solo lo que te indiquen.",
  },
  {
    pregunta: "¿Cómo haces segura el agua para tomar?",
    opciones: [
      "Dejándola reposar una hora",
      "Hirviéndola, o con 2 gotas de lejía por litro y esperando 30 minutos",
      "Colándola con un trapo limpio",
    ],
    correcta: 1,
    explicacion: "Reposar o colar no mata los microbios. Hervirla o clorarla, sí.",
  },
  {
    pregunta: "¿Por qué no hay que caminar descalzo en el agua o el barro de la inundación?",
    opciones: [
      "Porque se ensucian los pies",
      "Por la leptospirosis y las heridas que se infectan",
      "No pasa nada si después te lavas",
    ],
    correcta: 1,
    explicacion:
      "El agua de la inundación puede tener orina de ratas, que transmite la leptospirosis. Usa botas y cubre tus heridas.",
  },
  {
    pregunta: "Ves un cable eléctrico caído en el agua. ¿Qué haces?",
    opciones: ["Lo muevo con un palo", "Me alejo y aviso a las autoridades", "Cruzo rápido para no mojarme"],
    correcta: 1,
    explicacion: "El agua conduce la electricidad. No te acerques ni dejes que nadie se acerque.",
  },
  {
    pregunta: "¿A qué número llamas para pedir una ambulancia?",
    opciones: ["105", "106", "116"],
    correcta: 1,
    explicacion: "106 es el SAMU (ambulancias). 105 es la Policía, 116 los Bomberos y 115 Defensa Civil.",
  },
  {
    pregunta: "Bajó el agua. ¿Qué haces antes de volver a tu casa?",
    opciones: [
      "Entro rápido a ver mis cosas",
      "Espero a que sea seguro y no prendo la luz si hay agua dentro",
      "Prendo la luz para ver mejor",
    ],
    correcta: 1,
    explicacion:
      "La casa puede estar dañada y la instalación eléctrica mojada. Espera a que Defensa Civil diga que es seguro.",
  },
];

export function mensajeResultado(aciertos, total) {
  const proporcion = aciertos / total;
  if (proporcion === 1) return "¡Excelente! Estás muy bien preparado. Comparte el quiz con tu familia.";
  if (proporcion >= 0.7) return "¡Bien! Sabes casi todo. Repasa las preguntas que fallaste.";
  if (proporcion >= 0.4)
    return "Vas por buen camino. Revisa la mochila, la página de Salud y arma tu plan familiar.";
  return "Te conviene prepararte más. Empieza por tu mochila y tu plan familiar: te pueden salvar la vida.";
}

// Orden al azar de las opciones (Fisher-Yates), distinto en cada partida: así
// la respuesta correcta no cae siempre en la misma posición.
export function ordenAleatorio(cantidad, azar = Math.random) {
  const orden = Array.from({ length: cantidad }, (_, i) => i);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}
