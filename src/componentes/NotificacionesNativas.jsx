import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { notificacionDeEvento, notificacionDeSimulacro } from "../utilidades/notificacionesNativas";

// Canal de Android con importancia máxima: suena, vibra y aparece arriba de
// la pantalla aunque el celular esté en otra app.
const CANAL = {
  id: "alertas-rio",
  name: "Alertas del río Piura",
  description: "Prealertas, alertas rojas y simulacros",
  importance: 5,
  visibility: 1,
  vibration: true,
  lights: true,
  lightColor: "#DC2626",
};

async function prepararNotificaciones() {
  await LocalNotifications.createChannel(CANAL);
  const { display } = await LocalNotifications.checkPermissions();
  // Android 13+ pide permiso explícito para mostrar notificaciones.
  if (display !== "granted") await LocalNotifications.requestPermissions();
}

function mostrar(notificacion) {
  if (!notificacion) return;
  LocalNotifications.schedule({
    notifications: [{ ...notificacion, channelId: CANAL.id, autoCancel: true }],
  }).catch(() => {});
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
