# 💻 PIURA ALERTA — Dashboard de Mando, Control & Monitoreo Hidrológico

## 👥 Integrantes

- **Sheila Jacqueline Principe Merino** — Lead Hardware IoT & Backend Engineer
- **Adrian Steven Juarez Panta** — Lead Frontend UI/UX & Structural Engineer

## 📝 Descripción

El **Frontend de PIURA ALERTA** representa el Centro de Mando y Control Hidrológico para la prevención de inundaciones en la cuenca del Río Piura.

Es un Dashboard web interactivo desarrollado con **React 19**, utilizando una interfaz **Civic Tech Light Mode**.

La aplicación permite:

- Monitorear el nivel del agua en tiempo real.
- Visualizar el estado de riesgo: Verde, Amarillo y Rojo.
- Mostrar sensores mediante un mapa GIS.
- Visualizar gráficos de nivel de agua.
- Recibir información mediante WebSockets.
- Consultar alertas enviadas a la población.

## 🛠️ Tecnologías

| Tecnología              | Uso                                               |
| ----------------------- | ------------------------------------------------- |
| React 19                | Desarrollo de componentes e interfaz              |
| Tailwind CSS            | Diseño y estilos responsivos                      |
| Leaflet / React-Leaflet | Mapas interactivos                                |
| SVG inline (`Icon.jsx`) | Íconos, sin cargar una fuente de íconos completa  |
| WebSocket API           | Comunicación en tiempo real con el Backend        |
| vite-plugin-pwa         | App instalable + último dato visible sin conexión |

## ⚡ Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/SHEILAJPM/ALERTA-PIURA-FRONTEND.git
cd ALERTA-PIURA-FRONTEND
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abrir en el navegador:

```text
http://localhost:5173
```

### 4. Compilar para producción

```bash
npm run build
```

## 🧪 Tests

Unitarios/componente (Vitest + Testing Library, con mocks — no necesitan nada corriendo):

```bash
npm test
```

End-to-end (Playwright, contra el stack real: backend + frontend + la base de
Neon de desarrollo). Levanta lo que falte solo, o reusa lo que ya esté
corriendo (`npm run dev` en ambos repos):

```bash
npx playwright install chromium   # una sola vez
npm run test:e2e
```

Cubre los 3 flujos críticos: reportar sin sesión, registro/login/logout, y que
`/admin/*` rechace a quien no tiene sesión. Como pega contra la base real,
crea una cuenta y un reporte de prueba cada vez que corre (no es para CI, es
para verificar el flujo completo en local antes de un release).

## 🔌 Conexión con Backend

El Frontend recibe información en tiempo real mediante WebSockets, sobre el
mismo host/puerto que la API REST (ver backend):

```text
ws://localhost:4000
```

## ⚙️ Variables de entorno

Copiar [`.env.example`](.env.example) como `.env`. Todas son opcionales en
local; sin ellas la app usa `localhost:4000` para el backend, OpenStreetMap
para el mapa y avisa que la subida de fotos no está configurada.

| Variable                                                       | Uso                                      |
| -------------------------------------------------------------- | ---------------------------------------- |
| `VITE_API_URL` / `VITE_WS_URL`                                 | Dirección del backend (REST y WebSocket) |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | Subida de fotos de reportes y reclamos   |
| `VITE_CARTO_API_KEY`                                           | Mapa base claro/oscuro de CARTO          |

Servicios externos que se usan sin clave: Open-Meteo (pronóstico de lluvia) y
Overpass/OpenStreetMap (hospitales, comisarías y bomberos en el mapa).

## 🚢 Despliegue

Ver [`DEPLOY.md`](DEPLOY.md) para la guía completa (Render como sitio estático, cuenta de
Cloudinary y variables de entorno de producción).

## 📱 App Android

La misma web empaquetada como app con [Capacitor](https://capacitorjs.com) (carpeta `android/`).
Diferencias con la web:

- Hay que **iniciar sesión o registrarse** antes de entrar (`src/componentes/PuertaSesion.jsx`).
- Cada prealerta, alerta roja o simulacro que llega por WebSocket se muestra como
  **notificación de Android**, con la app abierta o minimizada (`src/componentes/NotificacionesNativas.jsx`).

Para generar el APK (requiere Android Studio instalado):

1. Copia `.env.android.example` como `.env.android` y pon la URL del backend. Si el backend corre
   en tu PC, usa la IP de `ipconfig`; el celular tiene que estar en la misma red WiFi.
2. En PowerShell, apunta `JAVA_HOME` al JDK de Android Studio (Gradle no soporta Java 26):
   `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`
3. `npm run android:apk`. El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Para probar la pantalla de acceso en el navegador sin compilar: `VITE_EXIGIR_SESION=true npm run dev`.

## 📊 Funcionalidades principales

- Dashboard de monitoreo.
- Indicadores KPI.
- Mapa GIS.
- Gráfico de nivel de agua.
- Semáforo de riesgo.
- Registro de alertas.
- Visualización de albergues.
- Reportes.
- Comunicación en tiempo real.

## 🌊 PIURA ALERTA

El sistema está orientado a la prevención y monitoreo de posibles
inundaciones en la ciudad de Piura, brindando información sobre el
estado del río, zonas de riesgo y alertas para la población.

### 👨‍💻 Desarrollo Frontend

El frontend fue desarrollado utilizando React y Vite, buscando una
interfaz sencilla, responsive e intuitiva para facilitar el acceso
a la información de prevención.
