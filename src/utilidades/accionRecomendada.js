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
};

// situacion: "casa" | "calle"; nivel: "bajo" | "medio" | "alto" (o null si
// todavía no hay puntaje); estadoRio: estado de la última lectura.
export function elegirAccion({ situacion = "casa", nivel, estadoRio }) {
  if (estadoRio === "alerta_roja") return ACCIONES.evacuar;
  if (nivel === "alto") return situacion === "calle" ? ACCIONES.calle_alto : ACCIONES.casa_alto;
  if (nivel === "medio") return situacion === "calle" ? ACCIONES.calle_medio : ACCIONES.casa_medio;
  return ACCIONES.bajo;
}

export const ESTILO_NIVEL = {
  bajo: { texto: "Riesgo bajo", color: "var(--color-normal)", fondo: "var(--color-normal-soft)" },
  medio: { texto: "Riesgo medio", color: "var(--color-prealerta)", fondo: "var(--color-prealerta-soft)" },
  alto: { texto: "Riesgo alto", color: "var(--color-alerta)", fondo: "var(--color-alerta-soft)" },
};
