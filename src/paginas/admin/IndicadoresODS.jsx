import { useResource } from "../../ganchos/useResource";
import { getIndicadoresODS } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { formatearFechaHoraCompleta } from "../../utilidades/fecha";
import { ROLES_DEFENSA_CIVIL } from "../../constantes/roles";

// Colores oficiales de cada ODS (guía de identidad de Naciones Unidas): el
// número va en blanco sobre su color, como en los íconos oficiales.
const COLOR_ODS = {
  1: "#E5243B",
  3: "#4C9F38",
  9: "#FD6925",
  10: "#DD1367",
  11: "#FD9D24",
  2: "#DDA63A",
  4: "#C5192D",
  13: "#3F7E44",
  17: "#19486A",
};

function formatearValor(valor, unidad) {
  if (valor === null || valor === undefined) return null;
  const numero = Number(valor).toLocaleString("es-PE", { maximumFractionDigits: 1 });
  return unidad === "%" ? `${numero}%` : numero;
}

function Indicador({ indicador }) {
  const valor = formatearValor(indicador.valor, indicador.unidad);
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-2"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex flex-wrap gap-1.5">
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          Meta {indicador.meta}
        </span>
        {indicador.sendai && (
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--color-dorado-soft)", color: "var(--color-dorado)" }}
            title="Marco de Sendai, Meta G: sistemas de alerta temprana"
          >
            Sendai G
          </span>
        )}
      </div>
      {valor === null ? (
        <p className="text-lg font-semibold" style={{ color: "var(--color-text-muted)" }}>
          Sin datos aún
        </p>
      ) : (
        <p
          className="font-mono-data text-3xl font-extrabold leading-none"
          style={{ color: "var(--color-title)" }}
        >
          {valor}
          {indicador.unidad && indicador.unidad !== "%" && (
            <span className="text-sm font-semibold ml-1.5" style={{ color: "var(--color-text-muted)" }}>
              {indicador.unidad}
            </span>
          )}
        </p>
      )}
      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        {indicador.etiqueta}
      </p>
      {indicador.ayuda && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          {indicador.ayuda}
        </p>
      )}
    </div>
  );
}

function BloqueODS({ ods }) {
  return (
    <section aria-labelledby={`ods-${ods.numero}`} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shrink-0 leading-none"
          style={{ backgroundColor: COLOR_ODS[ods.numero] ?? "var(--color-primary)" }}
          aria-hidden="true"
        >
          <span className="text-[9px] font-bold tracking-wider">ODS</span>
          <span className="text-xl font-extrabold">{ods.numero}</span>
        </span>
        <h2 id={`ods-${ods.numero}`} className="text-lg font-bold">
          ODS {ods.numero} · {ods.titulo}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {ods.indicadores.map((i) => (
          <Indicador key={i.clave} indicador={i} />
        ))}
      </div>
    </section>
  );
}

// Indicadores del sistema alineados a la Agenda 2030 y al Marco de Sendai:
// para el informe a la municipalidad, Defensa Civil o una evaluación del
// proyecto. Todo sale de datos reales registrados por la app.
function IndicadoresODS() {
  const { data, loading, error, recargar } = useResource(getIndicadoresODS, []);

  return (
    <RequiereRol roles={ROLES_DEFENSA_CIVIL}>
      <AdminPageHeader titulo="INDICADORES ODS" subtitulo="AGENDA 2030 Y MARCO DE SENDAI" />

      <div className="p-4 sm:p-8 flex flex-col gap-8">
        <p className="text-sm max-w-3xl" style={{ color: "var(--color-text-muted)" }}>
          Cómo contribuye Piura Alerta a los Objetivos de Desarrollo Sostenible, medido con los datos que
          registra el propio sistema. Los marcados con <strong>Sendai G</strong> corresponden a la meta de
          sistemas de alerta temprana del Marco de Sendai para la Reducción del Riesgo de Desastres.
          {data?.generado_en && <> Calculado el {formatearFechaHoraCompleta(data.generado_en)}.</>}
        </p>

        {error && (
          <ErrorBanner message={`No se pudieron calcular los indicadores: ${error}`} onRetry={recargar} />
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          data?.ods.map((ods) => <BloqueODS key={ods.numero} ods={ods} />)
        )}
      </div>
    </RequiereRol>
  );
}

export default IndicadoresODS;
