import { useState } from "react";
import { useResource } from "../../ganchos/useResource";
import { getAuditoria } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";
import { formatearFechaHoraCompleta } from "../../utilidades/fecha";

// "configuracion_actualizada" -> "Configuración actualizada". Las acciones
// las registra el backend (servicios/auditoria.js) como slugs; las más
// comunes tienen un texto propio y el resto se lee igual sin guiones bajos.
const ACCIONES = {
  configuracion_actualizada: "Configuración actualizada",
  cambiar_rol: "Rol de usuario cambiado",
  activar_usuario: "Usuario activado",
  desactivar_usuario: "Usuario desactivado",
  crear_sensor: "Nodo registrado",
  calibrar_sensor: "Sensor calibrado",
  crear_ticket: "Ticket creado",
  actualizar_ticket: "Ticket actualizado",
  difusion_manual: "Difusión manual enviada",
};

function textoAccion(accion) {
  if (ACCIONES[accion]) return ACCIONES[accion];
  const texto = String(accion ?? "").replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const LIMITES = [100, 250, 500];

function Auditoria() {
  const [limite, setLimite] = useState(LIMITES[0]);
  const [filtro, setFiltro] = useState("");
  const { data: acciones, loading, error, recargar } = useResource(() => getAuditoria(limite), [limite]);

  const termino = filtro.trim().toLowerCase();
  const visibles = (acciones ?? []).filter(
    (a) =>
      !termino ||
      [a.usuario_nombre, textoAccion(a.accion), a.detalle].some((v) => v?.toLowerCase().includes(termino))
  );

  return (
    <RequiereRol roles={ROLES_ADMINISTRADOR}>
      <AdminPageHeader titulo="AUDITORÍA" subtitulo="REGISTRO DE ACCIONES DEL PANEL" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar el registro: ${error}`} onRetry={recargar} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por usuario, acción o detalle"
            aria-label="Filtrar registro de auditoría"
            className="flex-1 min-w-56 rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
          <label className="text-sm flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
            Mostrar
            <select
              value={limite}
              onChange={(e) => setLimite(Number(e.target.value))}
              className="rounded-lg border px-2 py-2 text-sm"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            >
              {LIMITES.map((n) => (
                <option key={n} value={n}>
                  últimas {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            {termino ? "Ninguna acción coincide con la búsqueda." : "Todavía no hay acciones registradas."}
          </p>
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
                  <th className="pl-5 pr-4 py-3 font-semibold">Fecha</th>
                  <th className="pr-4 py-3 font-semibold">Usuario</th>
                  <th className="pr-4 py-3 font-semibold">Acción</th>
                  <th className="pr-5 py-3 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t align-top"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <td
                      className="pl-5 pr-4 py-3 font-mono-data text-xs whitespace-nowrap"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {formatearFechaHoraCompleta(a.creado_en)}
                    </td>
                    <td className="pr-4 py-3 font-semibold">{a.usuario_nombre ?? "Sistema"}</td>
                    <td className="pr-4 py-3">{textoAccion(a.accion)}</td>
                    <td
                      className="pr-5 py-3 text-xs wrap-break-word"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {a.detalle ?? "—"}
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

export default Auditoria;
