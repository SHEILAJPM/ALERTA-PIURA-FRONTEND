import React, { useCallback, useState } from "react";
import { useReportes } from "../../ganchos/useReportes";
import { useAuth } from "../../contexto/AuthContext";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import Icon from "../../componentes/Icon";
import { exportarReportesCSV, exportarReportesPDF } from "../../utilidades/exportarReportes";
import { formatearFechaHora as formatearFecha } from "../../utilidades/fecha";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";

const ESTADO_LABEL = {
  pendiente: {
    text: "Pendiente de revisión",
    color: "var(--color-prealerta)",
    bg: "var(--color-prealerta-soft)",
  },
  verificado: { text: "Verificado", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
  descartado: { text: "Archivado", color: "var(--color-text-muted)", bg: "var(--color-surface-alt)" },
};

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

function DonutEstados({ pendientes, verificados, descartados }) {
  const total = pendientes + verificados + descartados;
  const segmentos = [
    { label: "Pendientes", valor: pendientes, color: "var(--color-prealerta)" },
    { label: "Verificados", valor: verificados, color: "var(--color-normal)" },
    { label: "Archivados", valor: descartados, color: "var(--color-text-muted)" },
  ];

  if (total === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Todavía no hay reportes para graficar.
      </p>
    );
  }

  let acumulado = 0;
  const stops = segmentos
    .map((s) => {
      const inicio = (acumulado / total) * 360;
      acumulado += s.valor;
      const fin = (acumulado / total) * 360;
      return `${s.color} ${inicio}deg ${fin}deg`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div
        className="w-32 h-32 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${stops})`,
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 22px), #000 calc(100% - 22px))",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 22px), #000 calc(100% - 22px))",
        }}
      />
      <ul className="space-y-2 text-sm">
        {segmentos.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span style={{ color: "var(--color-text-muted)" }}>{s.label}</span>
            <span className="font-semibold">{s.valor}</span>
            <span style={{ color: "var(--color-text-muted)" }}>({Math.round((s.valor / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ReporteModeracion = React.memo(function ReporteModeracion({ reporte, procesando, onCambiarEstado }) {
  const estado = ESTADO_LABEL[reporte.estado] ?? ESTADO_LABEL.pendiente;

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{reporte.usuario_nombre}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {formatearFecha(reporte.creado_en)}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
          style={{ color: estado.color, backgroundColor: estado.bg }}
        >
          {estado.text}
        </span>
      </div>

      {reporte.posible_spam === true && (
        <p
          className="mt-2 text-xs font-medium rounded-lg px-3 py-1.5 inline-block"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
          title={reporte.motivo_ia ?? undefined}
        >
          <Icon name="bi-robot" aria-hidden="true" /> Posible spam
          {reporte.motivo_ia ? `: ${reporte.motivo_ia}` : ""} — revisa igual, la IA puede equivocarse
        </p>
      )}

      <p className="mt-3 text-sm" style={{ color: "var(--color-text)" }}>
        {reporte.descripcion}
      </p>

      {reporte.foto_url && (
        <img
          src={reporte.foto_url}
          alt="Foto del reporte"
          loading="lazy"
          className="mt-3 rounded-xl max-h-64 w-full object-cover"
        />
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onCambiarEstado(reporte.id, "verificado")}
          disabled={procesando || reporte.estado === "verificado"}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-normal)" }}
        >
          <Icon name="bi-check-lg" aria-hidden="true" /> Verificar
        </button>
        <button
          type="button"
          onClick={() => onCambiarEstado(reporte.id, "descartado")}
          disabled={procesando || reporte.estado === "descartado"}
          className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }}
        >
          <Icon name="bi-x-lg" aria-hidden="true" /> Archivar
        </button>
      </div>
    </article>
  );
});

function ModeracionReportes() {
  const { usuario } = useAuth();
  // incluirArchivados: true siempre es seguro pedirlo acá -- el backend solo
  // lo honra si quien pregunta es administrador (ver GET /api/reportes-ciudadanos),
  // así que a operario/defensa_civil no les cambia nada.
  const { reportes, loading, error, actualizarEstado } = useReportes(50, { incluirArchivados: true });
  const [procesandoId, setProcesandoId] = useState(null);

  // Operario/Defensa Civil moderan lo pendiente y nada más: una vez
  // verificado o archivado deja de ser su responsabilidad. El backend ya ni
  // siquiera les manda esos reportes (ver GET /api/reportes-ciudadanos), así
  // que acá solo falta no mostrarles secciones que para ellos siempre van a
  // estar vacías — el archivo completo queda para Administrador.
  const esAdministrador = ROLES_ADMINISTRADOR.includes(usuario?.rol);

  // Los marcados como posible spam se quedan al final (no se ocultan: la IA
  // puede equivocarse), así los reportes probablemente reales aparecen primero.
  const pendientes = reportes
    .filter((r) => r.estado === "pendiente")
    .sort((a, b) => (a.posible_spam === true ? 1 : 0) - (b.posible_spam === true ? 1 : 0));
  const verificadosList = reportes.filter((r) => r.estado === "verificado");
  const archivadosList = reportes.filter((r) => r.estado === "descartado");
  const verificados = verificadosList.length;
  const descartados = archivadosList.length;

  const cambiarEstado = useCallback(
    async (id, estado) => {
      setProcesandoId(id);
      try {
        await actualizarEstado(id, estado);
      } finally {
        setProcesandoId(null);
      }
    },
    [actualizarEstado]
  );

  return (
    <>
      <AdminPageHeader titulo="MODERACIÓN" subtitulo="DE REPORTES" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los reportes: ${error}`} />
          </div>
        )}

        {!loading && reportes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => exportarReportesCSV(reportes)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              <Icon name="bi-download" aria-hidden="true" /> Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => exportarReportesPDF(reportes)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              <Icon name="bi-download" aria-hidden="true" /> Exportar PDF
            </button>
          </div>
        )}

        {esAdministrador ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1.4fr] gap-4 mb-8">
            <StatCard valor={pendientes.length} etiqueta="Pendientes" color="var(--color-prealerta)" />
            <StatCard valor={verificados} etiqueta="Verificados" color="var(--color-normal)" />
            <StatCard valor={descartados} etiqueta="Archivados" color="var(--color-text-muted)" />
            <div
              className="rounded-2xl border p-5"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <p className="text-sm font-semibold mb-3">Distribución por estado</p>
              <DonutEstados
                pendientes={pendientes.length}
                verificados={verificados}
                descartados={descartados}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 mb-8">
            <StatCard valor={pendientes.length} etiqueta="Pendientes" color="var(--color-prealerta)" />
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <h3 className="font-bold mb-3">Pendientes ({pendientes.length})</h3>
            {pendientes.length === 0 ? (
              <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                No hay reportes pendientes de revisión.
              </p>
            ) : (
              <div className="space-y-4 mb-8">
                {pendientes.map((reporte) => (
                  <ReporteModeracion
                    key={reporte.id}
                    reporte={reporte}
                    procesando={procesandoId === reporte.id}
                    onCambiarEstado={cambiarEstado}
                  />
                ))}
              </div>
            )}

            {esAdministrador && (
              <>
                <h3 className="font-bold mb-3">Verificados ({verificadosList.length})</h3>
                {verificadosList.length === 0 ? (
                  <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                    Aún no hay reportes verificados.
                  </p>
                ) : (
                  <div className="space-y-4 mb-8">
                    {verificadosList.map((reporte) => (
                      <ReporteModeracion
                        key={reporte.id}
                        reporte={reporte}
                        procesando={procesandoId === reporte.id}
                        onCambiarEstado={cambiarEstado}
                      />
                    ))}
                  </div>
                )}

                <h3 className="font-bold mb-3">Archivados ({archivadosList.length})</h3>
                {archivadosList.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Todavía no se archivó ningún reporte.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {archivadosList.map((reporte) => (
                      <ReporteModeracion
                        key={reporte.id}
                        reporte={reporte}
                        procesando={procesandoId === reporte.id}
                        onCambiarEstado={cambiarEstado}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default ModeracionReportes;
