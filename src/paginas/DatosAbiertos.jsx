import { useState } from "react";
import { Copy, Database, Download, ExternalLink, Scale } from "lucide-react";
import { useResource } from "../ganchos/useResource";
import { getCatalogoDatosAbiertos, urlDatosAbiertos } from "../utilidades/api";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";

// Descargas listas para usar. Se abren con target="_blank": en la web el
// navegador descarga el CSV en otra pestaña; en la app Android el WebView no
// descarga archivos, pero los enlaces externos se abren en el navegador del
// teléfono, que sí lo hace.
const DESCARGAS = [
  { etiqueta: "Últimos 7 días", detalle: "cada 15 minutos", params: { agregacion: "15min" } },
  {
    etiqueta: "Últimos 30 días",
    detalle: "cada hora",
    params: { agregacion: "1h" },
    dias: 30,
  },
  { etiqueta: "Último año", detalle: "por día", params: { agregacion: "1d" }, dias: 365 },
];

function desdeHaceDias(dias) {
  if (!dias) return undefined;
  return new Date(Date.now() - dias * 86_400_000).toISOString();
}

function EnlaceDescarga({ href, children, principal = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`pa-tocable inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold ${
        principal ? "btn-dorado" : ""
      }`}
      style={
        principal
          ? undefined
          : { backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }
      }
    >
      <Download size={16} aria-hidden="true" />
      {children}
    </a>
  );
}

function CopiarUrl({ url }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      // sin portapapeles: la URL sigue visible para seleccionarla a mano
    }
  }
  return (
    <div
      className="flex items-center gap-2 rounded-2xl pl-4 pr-1.5 py-1.5"
      style={{ backgroundColor: "var(--color-surface-alt)" }}
    >
      <code className="flex-1 min-w-0 text-xs break-all select-all" style={{ color: "var(--color-text)" }}>
        {url}
      </code>
      <button
        type="button"
        onClick={copiar}
        className="shrink-0 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full text-xs font-bold"
        style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
      >
        <Copy size={14} aria-hidden="true" />
        {copiado ? "Copiada" : "Copiar"}
      </button>
    </div>
  );
}

function DatosAbiertos() {
  const { data: catalogo, loading, error, recargar } = useResource(getCatalogoDatosAbiertos, []);
  const sensores = catalogo?.sensores ?? [];
  const ejemplo = sensores[0]?.codigo ?? "CODIGO_SENSOR";

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-8">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Transparencia · ODS 17.18
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Datos abiertos del río</h1>
        <p className="mt-3 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Las mediciones del río Piura que toma nuestra red de sensores son de todos. Descárgalas para
          investigar, enseñar o planificar. No incluyen ningún dato personal.
        </p>
      </section>

      <section
        className="pa-entra rounded-3xl border p-5 sm:p-6 flex gap-4 items-start"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", "--i": 1 }}
      >
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          <Scale size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg">Licencia CC BY 4.0</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Puedes usar, compartir y adaptar estos datos, incluso con fines comerciales, siempre que cites la
            fuente: <strong style={{ color: "var(--color-text)" }}>"Fuente: Piura Alerta"</strong>.
          </p>
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm font-bold min-h-[44px]"
            style={{ color: "var(--color-primary)" }}
          >
            Leer la licencia <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[22px]">Lecturas por sensor</h2>
        {error && (
          <ErrorBanner message={`No se pudo cargar la lista de sensores: ${error}`} onRetry={recargar} />
        )}
        {loading ? (
          <Skeleton className="h-40 w-full rounded-3xl" />
        ) : sensores.length === 0 && !error ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Todavía no hay sensores registrados.
          </p>
        ) : (
          sensores.map((s, i) => (
            <article
              key={s.codigo}
              className="pa-entra rounded-3xl border p-5 sm:p-6 flex flex-col gap-4"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                "--i": i,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-lg">{s.nombre}</h3>
                  <p className="text-xs mt-0.5 font-mono-data" style={{ color: "var(--color-text-muted)" }}>
                    {s.codigo} · prealerta {Number(s.nivel_prealerta_cm)} cm · alerta roja{" "}
                    {Number(s.nivel_alerta_roja_cm)} cm
                  </p>
                </div>
                {!s.activo && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
                  >
                    Fuera de servicio
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DESCARGAS.map((d, n) => (
                  <EnlaceDescarga
                    key={d.etiqueta}
                    principal={n === 0}
                    href={urlDatosAbiertos("lecturas", {
                      sensor: s.codigo,
                      formato: "csv",
                      desde: desdeHaceDias(d.dias),
                      ...d.params,
                    })}
                  >
                    {d.etiqueta} <span className="font-semibold opacity-75">({d.detalle})</span>
                  </EnlaceDescarga>
                ))}
              </div>
            </article>
          ))
        )}
      </section>

      <section
        className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="font-display text-lg">Historial de alertas</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cada vez que un sensor cambió de estado (normal, prealerta, alerta roja), con fecha y nivel.
        </p>
        <div>
          <EnlaceDescarga href={urlDatosAbiertos("eventos", { formato: "csv" })}>
            Descargar CSV
          </EnlaceDescarga>
        </div>
      </section>

      <section
        className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <h2 className="font-display text-lg flex items-center gap-2">
          <Database size={20} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
          Para desarrolladores
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          API pública, sin clave y con CORS abierto. Parámetros: <code>sensor</code>, <code>desde</code> y{" "}
          <code>hasta</code> (ISO 8601), <code>agregacion</code> (<code>crudo</code>, <code>5min</code>,{" "}
          <code>15min</code>, <code>1h</code>, <code>1d</code>) y <code>formato</code> (<code>json</code> o{" "}
          <code>csv</code>). El rango máximo por consulta depende de la agregación: 2 días en crudo, 1 mes
          cada 15 minutos.
        </p>
        <CopiarUrl
          url={urlDatosAbiertos("lecturas", { sensor: ejemplo, agregacion: "1h", formato: "json" })}
        />
        <CopiarUrl url={urlDatosAbiertos("")} />
      </section>
    </main>
  );
}

export default DatosAbiertos;
