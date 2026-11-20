import { useResource } from "../../ganchos/useResource";
import { getIndicadoresODS } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { formatearFechaHoraCompleta } from "../../utilidades/fecha";
import { ROLES_DEFENSA_CIVIL } from "../../constantes/roles";
import BloqueODS from "../../componentes/ods/BloqueODS";

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
