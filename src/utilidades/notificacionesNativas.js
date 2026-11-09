// Textos de las notificaciones de la app Android (ver
// componentes/NotificacionesNativas.jsx). Mismos mensajes que el push web del
// backend (servicios/webpush.js) para que el aviso diga lo mismo en todos lados.
const TITULOS_ESTADO = {
  normal: "El río volvió a la normalidad",
  prealerta: "PREALERTA · río Piura",
  alerta_roja: "ALERTA ROJA · río Piura",
};

const MENSAJES_ESTADO = {
  normal: "El nivel del río volvió a la normalidad.",
  prealerta: "El nivel del río está subiendo, mantente atento.",
  alerta_roja: "Nivel crítico del río. Sigue las indicaciones de las autoridades.",
};

// Android pide ids enteros de 32 bits.
const MAX_ID = 2_147_483_647;

// Mismo evento -> mismo id: si el aviso llega dos veces (reconexión del
// WebSocket), Android reemplaza la notificación en vez de duplicarla.
export function idNotificacion(prefijo, clave) {
  const texto = `${prefijo}:${clave ?? Date.now()}`;
  let hash = 0;
  for (const c of texto) hash = (hash * 31 + c.charCodeAt(0)) % MAX_ID;
  return hash || 1;
}

export function notificacionDeEvento(evento) {
  const titulo = TITULOS_ESTADO[evento?.estado_nuevo];
  if (!titulo) return null;
  const nivel = Number(evento.nivel_cm);
  const detalle = Number.isFinite(nivel) ? ` Nivel actual: ${nivel} cm.` : "";
  const sensor = evento.sensor_codigo ? ` (${evento.sensor_codigo})` : "";
  return {
    id: idNotificacion("evento", evento.id),
    title: titulo,
    body: `${MENSAJES_ESTADO[evento.estado_nuevo]}${detalle}${sensor}`,
  };
}

export function notificacionDeSimulacro(simulacro) {
  if (!simulacro?.activo) return null;
  return {
    id: idNotificacion("simulacro", simulacro.id),
    title: "SIMULACRO · Piura Alerta",
    body: simulacro.mensaje || "Simulacro de evacuación en curso. Dirígete a tu zona segura.",
  };
}
