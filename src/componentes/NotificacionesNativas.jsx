import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { notificacionDeEvento, notificacionDeSimulacro } from "../utilidades/notificacionesNativas";

// Android fija el sonido de un canal al crearlo y no deja cambiarlo después:
// por eso la sirena va en un canal nuevo y el de la primera versión se borra.
const CANAL_VIEJO = "alertas-rio";

// Prealerta, alerta roja y simulacro: sirena (res/raw/sirena.wav), vibración
// larga y aparece arriba de la pantalla aunque el celular esté en otra app.
const CANAL_ALARMA = {
  id: "alarma-rio",
  name: "Alarma del río Piura",
  description: "Prealertas, alertas rojas y simulacros, con sirena",
  importance: 5,
  visibility: 1,
  sound: "sirena.wav",
  vibration: true,
  lights: true,
  lightColor: "#DC2626",
};

// "El río volvió a la normalidad": buena noticia, sin sirena.
const CANAL_AVISOS = {
  id: "avisos-rio",
  name: "Avisos del río Piura",
  description: "Cuando el río vuelve a la normalidad",
  importance: 4,
  visibility: 1,
  vibration: true,
};

async function prepararNotificaciones() {
  await LocalNotifications.deleteChannel({ id: CANAL_VIEJO }).catch(() => {});
  await LocalNotifications.createChannel(CANAL_ALARMA);
  await LocalNotifications.createChannel(CANAL_AVISOS);
  const { display } = await LocalNotifications.checkPermissions();
  // Android 13+ pide permiso explícito para mostrar notificaciones.
  if (display !== "granted") await LocalNotifications.requestPermissions();
}

function mostrar(notificacion) {
  if (!notificacion) return;
  const { alarma, ...datos } = notificacion;
  const canal = alarma ? CANAL_ALARMA : CANAL_AVISOS;
  LocalNotifications.schedule({
    notifications: [
      {
        ...datos,
        channelId: canal.id,
        // Para Android 7 o anterior, que no tiene canales.
        sound: alarma ? CANAL_ALARMA.sound : undefined,
        autoCancel: true,
      },
    ],
  }).catch(() => {});
  if (alarma) navigator.vibrate?.([600, 200, 600, 200, 600]);
}

// Solo en la app Android (ver App.jsx). El push web del navegador no existe
// dentro de la app, así que cada alerta y simulacro que llega por WebSocket
// se convierte en una notificación nativa de Android: llega con la app
// abierta o minimizada.
function NotificacionesNativas() {
  useEffect(() => {
    prepararNotificaciones().catch(() => {});
  }, []);

  useWebSocketEvent("evento_alerta", (evento) => mostrar(notificacionDeEvento(evento)));
  useWebSocketEvent("simulacro", (simulacro) => mostrar(notificacionDeSimulacro(simulacro)));

  return null;
}

export default NotificacionesNativas;
