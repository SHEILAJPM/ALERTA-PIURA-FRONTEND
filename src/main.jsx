import React from "react";
import ReactDOM from "react-dom/client";

import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// Con registerType "autoUpdate" (vite.config.js), registerSW recarga la
// página sola apenas el service worker nuevo toma el control. Sin esto, tras
// cada deploy se seguía viendo la versión vieja guardada hasta recargar dos
// veces o borrar los datos del sitio.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    if (!registro) return;
    // Además de al abrir la página: al volver a la pestaña (o a la app
    // instalada, que puede quedar abierta días) y cada hora.
    const buscarVersionNueva = () => registro.update().catch(() => {});
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") buscarVersionNueva();
    });
    setInterval(buscarVersionNueva, 60 * 60 * 1000);
  },
});

// ThemeProvider y WebSocketProvider se montan dentro de App.jsx (junto con el
// router), no acá, para no abrir dos conexiones WebSocket duplicadas.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
