# 💻 PIURA ALERTA — Dashboard de Mando, Control & Monitoreo Hidrológico

## 👥 Integrantes

- **Sheila Jacqueline Principe Merino** — Lead Hardware IoT & Backend Engineer
- **Adrian Steven Juarez Panta** — Lead Frontend UI/UX & Structural Engineer

## 📝 Descripción

El **Frontend de PIURA ALERTA** representa el Centro de Mando y Control Hidrológico para la prevención de inundaciones en la cuenca del Río Piura.

Es un Dashboard web interactivo desarrollado con **React 18**, utilizando una interfaz **Civic Tech Light Mode**.

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
| Recharts                | Gráficos en tiempo real                           |
| Leaflet / React-Leaflet | Mapas interactivos                                |
| SVG inline (`Icon.jsx`) | Íconos, sin cargar una fuente de íconos completa  |
| WebSocket API           | Comunicación en tiempo real con el Backend        |
| vite-plugin-pwa         | App instalable + último dato visible sin conexión |

## ⚡ Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/sheilajpm/piura-alerta-frontend.git
cd piura-alerta-frontend
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

## 🚢 Despliegue

Ver [`DEPLOY.md`](DEPLOY.md) para la guía completa (Vercel/Netlify, cuenta de
Cloudinary y variables de entorno de producción).

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
