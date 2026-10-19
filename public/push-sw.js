// Listeners de notificaciones push, inyectados en el service worker que
// genera vite-plugin-pwa (ver workbox.importScripts en vite.config.js).
// El backend manda { titulo, cuerpo, estado } (ver servicios/webpush.js).

const ICONO = "/pwa-192.png";

self.addEventListener("push", (event) => {
  let datos;
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { cuerpo: event.data ? event.data.text() : "" };
  }

  const esAlertaRoja = datos.estado === "alerta_roja";
  event.waitUntil(
    self.registration.showNotification(datos.titulo || "Piura Alerta", {
      body: datos.cuerpo || "Hay una actualización del estado del río.",
      icon: ICONO,
      badge: ICONO,
      // Un solo aviso de estado visible a la vez: el nuevo reemplaza al
      // anterior en vez de apilar "prealerta, normal, prealerta..."
      tag: datos.estado === "recordatorio" ? "piura-alerta-recordatorio" : "piura-alerta-estado",
      renotify: true,
      requireInteraction: esAlertaRoja,
      vibrate: esAlertaRoja ? [400, 150, 400, 150, 400] : [200],
      data: { url: "/" },
    })
  );
});

// Al tocar la notificación: enfoca la pestaña de la app si ya está abierta,
// si no abre una nueva.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin));
      if (abierta) {
        abierta.navigate(destino);
        return abierta.focus();
      }
      return self.clients.openWindow(destino);
    })
  );
});
