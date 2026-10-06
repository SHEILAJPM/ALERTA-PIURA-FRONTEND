import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Piura Alerta",
        short_name: "Piura Alerta",
        description: "Monitoreo del río Piura y alertas de inundación en tiempo real",
        theme_color: "#0a2f52",
        background_color: "#0a2f52",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Default de Workbox no incluye woff/woff2: sin esto, la tipografía
        // de íconos (bootstrap-icons) no queda precacheada y los íconos
        // desaparecen offline si el navegador todavía no la había pedido.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}"],
        // Los listeners de push/notificationclick (public/push-sw.js) se
        // inyectan así en vez de pasar a la estrategia injectManifest, que
        // implicaría escribir a mano el precacheo que generateSW ya resuelve solo.
        importScripts: ["push-sw.js"],
        // Datos "en vivo" (KPIs del dashboard): red primero, con timeout
        // corto, cayendo al último dato cacheado si no hay conexión — así el
        // sensor sigue mostrando el último nivel conocido en vez de una
        // pantalla en blanco durante un corte de conectividad, que es
        // justamente el escenario de emergencia que esta app cubre.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/api\/(sensores(\/estado)?|lecturas(\/ultima)?)$/.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "piura-alerta-api",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tiles del mapa (CARTO/OpenStreetMap vía RiesgoMap.jsx): cache-first,
            // no cambian de un minuto a otro y así el mapa base sigue viéndose
            // offline en la zona ya visitada, aunque los marcadores no se actualicen.
            urlPattern: ({ url }) => url.hostname.endsWith("basemaps.cartocdn.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "piura-alerta-tiles",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/pruebas/setup.js",
    // e2e/ son specs de Playwright (npm run test:e2e), no de Vitest — sin
    // este exclude, Vitest los recoge también por el patrón *.spec.js y
    // falla al intentar correr test() de Playwright en su propio runner.
    exclude: ["node_modules/**", "e2e/**"],
  },
});
