import { useResource } from "../ganchos/useResource";
import { getImpactoPublico } from "../utilidades/api";
import BloqueODS from "../componentes/ods/BloqueODS";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import { formatearFechaHoraCompleta } from "../utilidades/fecha";

// "Nuestro impacto" (ODS 16.10, acceso público a la información): los mismos
// indicadores ODS del panel de Defensa Civil, abiertos a cualquiera. Son solo
// cifras agregadas, sin ningún dato de personas.
const DESTACADOS = [
  { clave: "suscripciones_alerta", etiqueta: "suscripciones a alertas" },
  { clave: "sensores_activos", etiqueta: "sensores vigilando el río" },
  { clave: "anticipacion_mediana", etiqueta: "min de anticipación (mediana)" },
  { clave: "reportes_ciudadanos", etiqueta: "reportes ciudadanos" },
];

function buscar(datos, clave) {
  for (const o of datos?.ods ?? []) {
    const i = o.indicadores.find((x) => x.clave === clave);
    if (i) return i;
  }
  return null;
}

function Impacto() {
  const { data, loading, error, recargar } = useResource(getImpactoPublico, []);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-8">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Transparencia · Agenda 2030
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Nuestro impacto</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Cómo Piura Alerta contribuye a los Objetivos de Desarrollo Sostenible, medido en vivo con los datos
          que registra el propio sistema. Solo cifras generales: ningún dato de personas.
        </p>
      </section>

      {error && <ErrorBanner message={`No se pudieron cargar las cifras: ${error}`} onRetry={recargar} />}

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 w-full rounded-[28px]" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      ) : (
        data && (
          <>
            <section
              className="pa-hero pa-entra p-6 sm:p-8"
              aria-label="Cifras destacadas"
              style={{ "--i": 1 }}
            >
              <p className="text-sm font-semibold text-white/85">
                Aporta a {data.ods.length} Objetivos de Desarrollo Sostenible
              </p>
              <dl className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
                {DESTACADOS.map((d) => {
                  const i = buscar(data, d.clave);
                  const valor =
                    i?.valor === null || i?.valor === undefined
                      ? "—"
                      : Number(i.valor).toLocaleString("es-PE", { maximumFractionDigits: 0 });
                  return (
                    <div key={d.clave}>
                      <dt className="sr-only">{d.etiqueta}</dt>
                      <dd className="font-mono-data text-[40px] leading-none font-extrabold">{valor}</dd>
                      <dd className="text-sm text-white/80 mt-1">{d.etiqueta}</dd>
                    </div>
                  );
                })}
              </dl>
              <p className="text-xs text-white/65 mt-5">
                Actualizado el {formatearFechaHoraCompleta(data.generado_en)}. Los marcados con "Sendai G"
                siguen la meta de sistemas de alerta temprana del Marco de Sendai.
              </p>
            </section>

            {data.ods.map((ods) => (
              <BloqueODS key={ods.numero} ods={ods} />
            ))}
          </>
        )
      )}
    </main>
  );
}

export default Impacto;
