// importScripts'd desde el service worker que genera vite-plugin-pwa (ver
// workbox.importScripts en vite.config.js): agrega el manejo de push sin
// tener que pasar a la estrategia injectManifest solo por esto.
self.addEventListener("push", (event) => {
  let datos = { titulo: "Piura Alerta", cuerpo: "Hay una novedad en el nivel del río." };
  if (event.data) {
    try {
      datos = event.data.json();
    } catch {
      datos.cuerpo = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo ?? "Piura Alerta", {
      body: datos.cuerpo,
      icon: "/pwa-192.png",
      badge: "/pwa-192.png",
      tag: "piura-alerta-estado",
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      const existente = lista.find((c) => new URL(c.url).pathname === url);
      if (existente) return existente.focus();
      return self.clients.openWindow(url);
    })
  );
});
