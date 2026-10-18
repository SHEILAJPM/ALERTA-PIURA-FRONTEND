import { usePolizas } from "../../ganchos/usePolizas";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";
import { formatearFecha } from "../../utilidades/fecha";

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

function Polizas() {
  const { data: polizas, loading, error, recargar } = usePolizas();

  const vigentes = (polizas ?? []).filter((p) => p.vigente).length;
  const totalCentavos = (polizas ?? []).reduce((acc, p) => acc + p.precio_centavos, 0);

  return (
    <RequiereRol roles={ROLES_ADMINISTRADOR}>
      <AdminPageHeader titulo="SEGURO" subtitulo="PÓLIZAS CONTRATADAS" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar las pólizas: ${error}`} onRetry={recargar} />
          </div>
        )}

        {!loading && polizas && polizas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard valor={polizas.length} etiqueta="Pólizas totales" color="var(--color-primary)" />
            <StatCard valor={vigentes} etiqueta="Vigentes ahora" color="var(--color-normal)" />
            <StatCard
              valor={`S/ ${(totalCentavos / 100).toFixed(2)}`}
              etiqueta="Recaudado (histórico)"
              color="var(--color-dorado)"
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !polizas || polizas.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>Todavía nadie contrató el seguro.</p>
        ) : (
          <div
            className="rounded-2xl border overflow-x-auto"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <th className="pl-5 pr-4 py-3 font-semibold">Usuario</th>
                  <th className="pr-4 py-3 font-semibold">Periodo</th>
                  <th className="pr-4 py-3 font-semibold">Pagado</th>
                  <th className="pr-4 py-3 font-semibold">Vence</th>
                  <th className="pr-5 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {polizas.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    <td className="pl-5 pr-4 py-3">
                      <p className="font-semibold">{p.usuario_nombre}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {p.usuario_correo}
                      </p>
                    </td>
                    <td className="pr-4 py-3">
                      {p.meses} {p.meses === 1 ? "mes" : "meses"}
                    </td>
                    <td className="pr-4 py-3 font-mono-data">S/ {(p.precio_centavos / 100).toFixed(2)}</td>
                    <td className="pr-4 py-3 font-mono-data text-xs">{formatearFecha(p.fecha_fin)}</td>
                    <td className="pr-5 py-3">
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={
                          p.vigente
                            ? { color: "var(--color-normal)", backgroundColor: "var(--color-normal-soft)" }
                            : {
                                color: "var(--color-text-muted)",
                                backgroundColor: "var(--color-surface-alt)",
                              }
                        }
                      >
                        {p.vigente ? "Vigente" : "Vencida"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequiereRol>
  );
}

export default Polizas;
