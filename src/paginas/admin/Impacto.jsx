import { useImpacto } from "../../ganchos/useImpacto";
import { useHistorialAlertas } from "../../ganchos/useHistorialAlertas";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import StatusBadge from "../../componentes/StatusBadge";
import Icon from "../../componentes/Icon";
import { exportarHistorialCSV, exportarHistorialPDF } from "../../utilidades/exportarHistorial";
import { formatearFechaHora } from "../../utilidades/fecha";
import { ROLES_DEFENSA_CIVIL } from "../../constantes/roles";

const ROL_LABEL = {
  ciudadano: "Ciudadanos",
  operario: "Operarios",
  defensa_civil: "Defensa Civil",
  administrador: "Administradores",
};

const ESTADO_LABEL = {
  pendiente: "Pendientes",
  verificado: "Verificados",
  descartado: "Descartados",
};

function StatCard({ valor, etiqueta, color = "var(--color-text)" }) {
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

function Desglose({ titulo, datos, labels }) {
  const entradas = Object.entries(datos ?? {});
  if (entradas.length === 0) return null;
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h3 className="font-semibold text-sm mb-3">{titulo}</h3>
      <ul className="space-y-2">
        {entradas.map(([clave, cantidad]) => (
          <li key={clave} className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--color-text-muted)" }}>{labels?.[clave] ?? clave}</span>
            <span className="font-mono-data font-semibold">{cantidad}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Impacto() {
  const { data: impacto, loading, error, recargar } = useImpacto();
  // 100 es el tope que ya aplica el backend a este endpoint (ver GET
  // /api/alertas/historial) -- como eventos_alerta solo registra CAMBIOS de
  // estado (no cada lectura), 100 eventos ya cubre meses de historial real.
  const { data: historial, loading: loadingHistorial } = useHistorialAlertas(100);

  return (
    <RequiereRol roles={ROLES_DEFENSA_CIVIL}>
      <AdminPageHeader titulo="PANEL DE IMPACTO" subtitulo="RESUMEN PARA DEFENSA CIVIL Y LA MUNICIPALIDAD" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar el panel de impacto: ${error}`} onRetry={recargar} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          impacto && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  valor={impacto.usuarios_totales}
                  etiqueta="Usuarios registrados"
                  color="var(--color-primary)"
                />
                <StatCard valor={impacto.suscriptores_telegram} etiqueta="Suscritos a Telegram" />
                <StatCard valor={impacto.suscriptores_push} etiqueta="Suscritos a notificaciones push" />
                <StatCard
                  valor={impacto.alertas_automaticas_enviadas}
                  etiqueta="Alertas automáticas enviadas"
                  color="var(--color-alerta)"
                />
                <StatCard valor={impacto.reportes_totales} etiqueta="Reportes ciudadanos" />
                <StatCard
                  valor={impacto.polizas_vigentes}
                  etiqueta="Pólizas de seguro vigentes"
                  color="var(--color-dorado)"
                />
                <StatCard
                  valor={impacto.chequeos_seguridad_ultimas_24h}
                  etiqueta="Ciudadanos a salvo (últimas 24h)"
                  color="var(--color-normal)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Desglose titulo="Usuarios por rol" datos={impacto.usuarios_por_rol} labels={ROL_LABEL} />
                <Desglose
                  titulo="Reportes por estado"
                  datos={impacto.reportes_por_estado}
                  labels={ESTADO_LABEL}
                />
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <h3 className="font-semibold text-sm">
                    Historial de eventos de alerta{" "}
                    {historial && (
                      <span style={{ color: "var(--color-text-muted)" }}>({historial.length})</span>
                    )}
                  </h3>
                  {!loadingHistorial && historial && historial.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => exportarHistorialCSV(historial)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg border px-3 py-2"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        <Icon name="bi-download" aria-hidden="true" /> Exportar CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => exportarHistorialPDF(historial)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg border px-3 py-2"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      >
                        <Icon name="bi-download" aria-hidden="true" /> Exportar PDF
                      </button>
                    </div>
                  )}
                </div>

                {loadingHistorial ? (
                  <Skeleton className="h-32 w-full rounded-xl" />
                ) : !historial || historial.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Todavía no se registró ningún cambio de estado.
                  </p>
                ) : (
                  <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {historial.slice(0, 5).map((evento) => (
                      <li key={evento.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <StatusBadge status={evento.estado_nuevo} />
                          <span className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                            {evento.sensor_nombre} · {evento.nivel_cm} cm
                          </span>
                        </div>
                        <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                          {formatearFechaHora(evento.iniciado_en)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )
        )}
      </div>
    </RequiereRol>
  );
}

export default Impacto;
