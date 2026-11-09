import { useInstalarApp } from "../ganchos/useInstalarApp";
import Icon from "../componentes/Icon";
import QrDescarga from "../componentes/QrDescarga";
import { esAppNativa } from "../utilidades/plataforma";

// APK de la app Android (Capacitor, carpeta android/), publicado en GitHub
// Releases: "latest/download" siempre apunta a la última versión subida.
const URL_APK =
  import.meta.env.VITE_APK_URL ??
  "https://github.com/SHEILAJPM/ALERTA-PIURA-FRONTEND/releases/latest/download/PiuraAlerta.apk";

const VENTAJAS = [
  {
    icono: "bi-bell-fill",
    titulo: "Alertas al instante",
    texto: "Recibe una notificación en el celular apenas el río cambia de estado o empieza un simulacro.",
  },
  {
    icono: "bi-water",
    titulo: "Funciona sin señal",
    texto:
      "Si se cae el internet, sigues viendo el último nivel del río y el mapa de la zona que ya visitaste.",
  },
  {
    icono: "bi-geo-alt-fill",
    titulo: "Albergues y SOS a un toque",
    texto:
      "Abre directo desde la pantalla de inicio, como cualquier app, sin buscar la página en el navegador.",
  },
];

const PASOS_ANDROID = [
  "Toca “Descargar app para Android” (o escanea el código QR).",
  "Abre el archivo PiuraAlerta.apk que se descargó.",
  "Si Android lo pide, permite “instalar apps de origen desconocido” y toca Instalar.",
  "Abre la app, crea tu cuenta y permite las notificaciones.",
];

const PASOS_IPHONE = [
  "Abre esta página en Safari (en otros navegadores de iPhone no se puede instalar).",
  "Toca el botón Compartir (el cuadrado con la flecha hacia arriba).",
  "Elige “Agregar a inicio” y luego “Agregar”.",
];

function ListaPasos({ titulo, pasos, destacada }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: destacada ? "var(--color-primary)" : "var(--color-border)",
      }}
    >
      <p className="font-bold">{titulo}</p>
      <ol className="mt-3 space-y-2 text-sm list-decimal pl-5" style={{ color: "var(--color-text-muted)" }}>
        {pasos.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
    </div>
  );
}

// En Android se ofrece solo el APK: la versión web instalada desde Chrome
// queda como un acceso directo con el logo del navegador encima del ícono.
const esAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

function DescargarApp() {
  const { puedeInstalar, instalada: pwaInstalada, esIOS, instalar } = useInstalarApp();
  // Dentro de la app Android no tiene sentido ofrecer descargarla de nuevo.
  const instalada = pwaInstalada || esAppNativa;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <img
          src="/pwa-192.png"
          alt=""
          width={96}
          height={96}
          className="w-24 h-24 rounded-3xl shadow-md shrink-0"
        />
        <div>
          <p
            className="font-semibold text-sm uppercase tracking-wide"
            style={{ color: "var(--color-primary)" }}
          >
            App móvil
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Lleva Piura Alerta en tu celular</h2>
          <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
            Gratis, sin pasar por la tienda de apps y sin ocupar casi espacio. Se actualiza sola.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!instalada && !esIOS && (
              <a
                href={URL_APK}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Icon name="bi-download" aria-hidden="true" />
                Descargar app para Android
              </a>
            )}
            {instalada ? (
              <p
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold"
                style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
              >
                <Icon name="bi-check-circle-fill" aria-hidden="true" />
                Ya tienes la app instalada
              </p>
            ) : puedeInstalar && !esAndroid ? (
              <button
                type="button"
                onClick={instalar}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold border"
                style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
              >
                <Icon name="bi-house-door" aria-hidden="true" />
                Instalar versión web
              </button>
            ) : esIOS ? (
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                Sigue los pasos de abajo para instalarla en tu iPhone.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {!instalada && (
        <QrDescarga
          url={URL_APK}
          titulo="Escanea y descarga la app"
          texto="Apunta la cámara del celular (Android) a este código: se descarga la app Piura Alerta para instalarla."
        />
      )}

      <section className="grid gap-5 sm:grid-cols-3 mb-10">
        {VENTAJAS.map(({ icono, titulo, texto }) => (
          <div key={titulo} className="flex gap-3">
            <div
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
            >
              <Icon name={icono} aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-sm">{titulo}</p>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {texto}
              </p>
            </div>
          </div>
        ))}
      </section>

      {!instalada && (
        <section>
          <h3 className="text-xl font-bold mb-4">Cómo instalarla</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ListaPasos titulo="Android (app)" pasos={PASOS_ANDROID} destacada={!esIOS} />
            <ListaPasos titulo="iPhone" pasos={PASOS_IPHONE} destacada={esIOS} />
          </div>
        </section>
      )}
    </main>
  );
}

export default DescargarApp;
