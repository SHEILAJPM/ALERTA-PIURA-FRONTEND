// Una sola acción recomendada según la situación de la persona y el riesgo.
// Es lo central de "¿Qué hago ahora?": en una emergencia nadie lee una lista
// de diez consejos, así que se elige UNO y se lo muestra en grande.

const ACCIONES = {
  evacuar: {
    titulo: "Sal ahora hacia el albergue",
    texto:
      "El río está en alerta roja. Lleva tu mochila, desconecta la luz y ve por la ruta segura. Avisa a tus vecinos.",
    boton: "Ver albergues cercanos",
    enlace: "/mapa",
    urgente: true,
  },
  casa_alto: {
    titulo: "Prepara tu mochila y ubica tu albergue",
    texto: "Tu zona tiene riesgo alto. Ten lista la mochila y sal al albergue si el río llega a alerta roja.",
    boton: "Preparar mi mochila",
    enlace: "/mochila",
    urgente: false,
  },
  calle_alto: {
    titulo: "Aléjate del río y sube a zona alta",
    texto: "No cruces calles inundadas: 30 cm de agua en movimiento pueden arrastrar a una persona.",
    boton: "Ver albergues cercanos",
    enlace: "/mapa",
    urgente: false,
  },
  casa_medio: {
    titulo: "Revisa tu mochila de emergencia",
    texto: "El riesgo es medio. Es buen momento para tener todo listo antes de que empeore.",
    boton: "Revisar mi mochila",
    enlace: "/mochila",
    urgente: false,
  },
  calle_medio: {
    titulo: "Evita acercarte al cauce del río",
    texto: "El riesgo es medio. Mantente lejos de la ribera y atento a los avisos de esta app.",
    boton: "Ver el mapa de riesgo",
    enlace: "/mapa",
    urgente: false,
  },
  bajo: {
    titulo: "Todo tranquilo: aprovecha para prepararte",
    texto:
      "No hay riesgo importante ahora. Arma tu mochila y conoce tu albergue antes de que llegue la lluvia.",
    boton: "Armar mi mochila",
    enlace: "/mochila",
    urgente: false,
  },
  // Situaciones de crisis más allá de casa/calle: la chacra, el negocio y las
  // familias que necesitan ayuda. El detalle está en /ayuda.
  campo_alto: {
    titulo: "Protege tus animales y tu cosecha",
    texto:
      "Lleva los animales a zona alta, sube semillas, abono y herramientas, y no cruces canales ni acequias crecidas. Tu vida va primero.",
    boton: "Qué hacer con mi chacra",
    enlace: "/agricultura",
    urgente: false,
  },
  campo_bajo: {
    titulo: "Prepara tu chacra antes de la lluvia",
    texto:
      "Limpia drenes y acequias y ten pensado un lugar alto para tus animales. Si pierdes la cosecha, repórtalo en la Agencia Agraria.",
    boton: "Qué hacer con mi chacra",
    enlace: "/agricultura",
    urgente: false,
  },
  negocio_alto: {
    titulo: "Protege tu negocio y tu mercadería",
    texto:
      "Sube la mercadería y los equipos a lo alto, guarda tus documentos en bolsas cerradas y corta la luz si entra agua.",
    boton: "Qué hacer con mi negocio",
    enlace: "/ayuda#negocio",
    urgente: false,
  },
  negocio_bajo: {
    titulo: "Prepara tu negocio",
    texto:
      "Toma fotos de tu local y tu mercadería: te sirven para reclamar un seguro o registrar daños. Revisa si tienes seguro.",
    boton: "Qué hacer con mi negocio",
    enlace: "/ayuda#negocio",
    urgente: false,
  },
  ayuda_alto: {
    titulo: "Ve al albergue antes de que suba el agua",
    texto:
      "Si tu casa es precaria o está cerca del río, no esperes: en el albergue tienes techo, agua y comida. Lleva tu DNI.",
    boton: "Ver albergues cercanos",
    enlace: "/mapa",
    urgente: false,
  },
  ayuda_bajo: {
    titulo: "Hay ayuda para tu familia",
    texto:
      "Si la emergencia te afecta, empadrónate como damnificado en tu municipalidad: así recibes la ayuda humanitaria. Conoce también tu albergue.",
    boton: "Cómo pedir ayuda",
    enlace: "/ayuda#necesito-ayuda",
    urgente: false,
  },
  sin_datos: {
    titulo: "No tenemos datos del río ahora",
    texto:
      "El sensor no está enviando lecturas, así que no podemos decirte que todo está tranquilo. Sigue los avisos de Defensa Civil y ten lista tu mochila.",
    boton: "Revisar mi mochila",
    enlace: "/mochila",
    urgente: false,
  },
};

export const SITUACIONES_CRISIS = ["casa", "calle", "campo", "negocio", "ayuda"];

// situacion: una de SITUACIONES_CRISIS; nivel: "bajo" | "medio" | "alto" (o null si
// todavía no hay puntaje); estadoRio: estado de la última lectura VIGENTE
// (null si el sensor no reporta); datosCompletos: false si al puntaje le
// faltan fuentes, para no decir "todo tranquilo" sin saberlo.
export function elegirAccion({ situacion = "casa", nivel, estadoRio, datosCompletos = true }) {
  // Con alerta roja manda evacuar sea cual sea la situación: la vida primero,
  // la chacra o el negocio después.
  if (estadoRio === "alerta_roja") return ACCIONES.evacuar;
  // Chacra, negocio y ayuda: nunca dicen "todo tranquilo", así que también
  // sirven cuando faltan datos.
  if (situacion === "campo" || situacion === "negocio") {
    return nivel === "alto" || nivel === "medio"
      ? ACCIONES[`${situacion}_alto`]
      : ACCIONES[`${situacion}_bajo`];
  }
  if (situacion === "ayuda") return nivel === "alto" ? ACCIONES.ayuda_alto : ACCIONES.ayuda_bajo;
  if (nivel === "alto") return situacion === "calle" ? ACCIONES.calle_alto : ACCIONES.casa_alto;
  if (nivel === "medio") return situacion === "calle" ? ACCIONES.calle_medio : ACCIONES.casa_medio;
  if (!datosCompletos) return ACCIONES.sin_datos;
  return ACCIONES.bajo;
}

// El estado de la última lectura solo vale si el puntaje confirma que el
// sensor está reportando: una lectura de hace días no describe el río de hoy.
export function estadoRioVigente(estadoRio, riesgo) {
  const rio = riesgo?.factores?.find((f) => f.clave === "rio");
  return rio?.sin_datos ? null : (estadoRio ?? null);
}

export const ESTILO_NIVEL = {
  bajo: { texto: "Riesgo bajo", color: "var(--color-normal)", fondo: "var(--color-normal-soft)" },
  medio: { texto: "Riesgo medio", color: "var(--color-prealerta)", fondo: "var(--color-prealerta-soft)" },
  alto: { texto: "Riesgo alto", color: "var(--color-alerta)", fondo: "var(--color-alerta-soft)" },
};
