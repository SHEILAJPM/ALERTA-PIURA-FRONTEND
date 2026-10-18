import { useFeedbackAsistente } from "../../ganchos/useFeedbackAsistente";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";
import { formatearFechaHora as formatearFecha } from "../../utilidades/fecha";

function StatCard({ valor, etiqueta, color }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <p className="font-mono-data text-3xl font-bold" style={{ color }}>
        {valor}
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
        {etiqueta}
      </p>
    </div>
  );
}

function AsistenteFeedback() {
  const { data: feedback, loading, error, recargar } = useFeedbackAsistente();

  const util = (feedback ?? []).filter((f) => f.util).length;
  const noUtil = (feedback ?? []).length - util;

  return (
    <RequiereRol roles={ROLES_ADMINISTRADOR}>
      <AdminPageHeader titulo="ASISTENTE IA" subtitulo="FEEDBACK DE RESPUESTAS" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar el feedback: ${error}`} onRetry={recargar} />
          </div>
        )}

        {!loading && feedback && feedback.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard valor={util} etiqueta="Marcadas como útiles" color="var(--color-normal)" />
            <StatCard valor={noUtil} etiqueta="Marcadas como no útiles" color="var(--color-alerta)" />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : !feedback || feedback.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            Todavía nadie calificó una respuesta del asistente.
          </p>
        ) : (
          <div className="space-y-3">
            {feedback.map((f) => (
              <article
                key={f.id}
                className="rounded-2xl border p-4"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                    style={
                      f.util
                        ? { color: "var(--color-normal)", backgroundColor: "var(--color-normal-soft)" }
                        : { color: "var(--color-alerta)", backgroundColor: "var(--color-alerta-soft)" }
                    }
                  >
                    {f.util ? "Útil" : "No útil"}
                  </span>
                  <span className="text-xs font-mono-data" style={{ color: "var(--color-text-muted)" }}>
                    {formatearFecha(f.creado_en)}
                  </span>
                </div>
                <p className="text-sm font-semibold">{f.pregunta}</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {f.respuesta}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </RequiereRol>
  );
}

export default AsistenteFeedback;
