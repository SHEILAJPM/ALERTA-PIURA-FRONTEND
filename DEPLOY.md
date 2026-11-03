# Despliegue de PIURA ALERTA — Frontend

El frontend es un sitio estático (Vite compila todo a `dist/`), así que en
Render va como **Static Site**, gratis y sin servidor que se duerma. Conviene
desplegar primero el backend (ver su `DEPLOY.md`) para tener su URL.

## 0. Cuentas externas

| Servicio                                   | Para qué                                                       | Costo  |
| ------------------------------------------ | -------------------------------------------------------------- | ------ |
| [Render](https://render.com)               | Hostear el sitio estático                                      | Gratis |
| [Cloudinary](https://cloudinary.com)       | Subida de fotos en reportes y reclamos (opcional)              | Gratis |
| [CARTO](https://carto.com/basemaps/apikey) | Mapa base claro/oscuro (opcional, sin clave usa OpenStreetMap) | Gratis |

## 1. Desplegar en Render (usa `render.yaml` ya incluido)

1. En Render: **New > Blueprint**, conectar este repo. Render detecta
   [`render.yaml`](render.yaml) y crea `piura-alerta-frontend` (sitio estático,
   `npm ci && npm run build`, publica `dist/`).
2. Completar las variables:
   - `VITE_API_URL=https://<backend>.onrender.com`
   - `VITE_WS_URL=wss://<backend>.onrender.com` (mismo host, esquema `wss`)
   - `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` (preset en modo
     "Unsigned"; sin esto el formulario avisa que la subida de fotos no está configurada)
   - `VITE_CARTO_API_KEY` (opcional)
3. Deploy.

Las `VITE_*` se incrustan en el JavaScript **al compilar**: si se cambia alguna
en el dashboard, hay que hacer **Manual Deploy > Clear build cache & deploy**
para que tome efecto.

`render.yaml` ya resuelve lo que un sitio estático de React suele olvidar:

- **Rewrite `/*` → `/index.html`**: la app usa `BrowserRouter`, así que sin esto
  recargar o abrir directo `/admin/...` daría 404.
- **`sw.js` sin cache**: si el service worker queda cacheado, los usuarios no
  reciben las versiones nuevas de la PWA.
- **`/assets/*` con cache de un año**: los nombres llevan hash, nunca cambian.

## 2. Conectar con el backend

Con la URL final del frontend (ej. `https://piura-alerta-frontend.onrender.com`),
volver al servicio del backend en Render y completar:

- `CORS_ORIGIN=https://piura-alerta-frontend.onrender.com` — sin esto el
  navegador bloquea las requests.
- `FRONTEND_URL=https://piura-alerta-frontend.onrender.com` — para el enlace de
  recuperación de contraseña.

## 3. Verificar

- Abrir la URL, ver que el dashboard carga datos y que el indicador de conexión
  en vivo (WebSocket) queda conectado.
- Recargar estando en una ruta interna (ej. `/admin`): no debe dar 404.
- En Chrome, DevTools > Application > Manifest: los íconos cargan y la app es
  instalable.
- Si el backend está en el plan free, la primera carga tras un rato sin uso
  puede tardar unos segundos mientras despierta.
