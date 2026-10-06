import React, { useCallback, useState } from "react";
import { useUsuarios } from "../../ganchos/useUsuarios";
import { actualizarRolUsuario } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";
import { formatearFecha } from "../../utilidades/fecha";

const ROLES = [
  { valor: "ciudadano", etiqueta: "Ciudadano" },
  { valor: "operario", etiqueta: "Operador Técnico" },
  { valor: "defensa_civil", etiqueta: "Defensa Civil / COER" },
  { valor: "administrador", etiqueta: "Administrador" },
];

// Memoizado: con muchos usuarios, cambiar el rol de uno solo no debería
// re-renderizar (ni volver a montar el <select> de) todas las demás filas.
const FilaUsuario = React.memo(function FilaUsuario({ usuario, onCambiarRol }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function manejarCambio(e) {
    const nuevoRol = e.target.value;
    setGuardando(true);
    setError(null);
    try {
      await onCambiarRol(usuario.id, nuevoRol);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr className="border-t" style={{ borderColor: "var(--color-border)" }}>
      <td className="pl-5 pr-4 py-3">
        <p className="font-semibold">{usuario.nombre}</p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {usuario.correo}
        </p>
      </td>
      <td className="pr-4 py-3 text-xs font-mono-data" style={{ color: "var(--color-text-muted)" }}>
        {formatearFecha(usuario.creado_en)}
      </td>
      <td className="pr-5 py-3 text-right">
        <select
          value={usuario.rol}
          onChange={manejarCambio}
          disabled={guardando}
          className="rounded-lg border px-2 py-1.5 text-sm disabled:opacity-50"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
          }}
        >
          {ROLES.map((r) => (
            <option key={r.valor} value={r.valor}>
              {r.etiqueta}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs mt-1" style={{ color: "var(--color-alerta)" }}>
            {error}
          </p>
        )}
      </td>
    </tr>
  );
});

function Usuarios() {
  const { data: usuarios, loading, error, setData, recargar } = useUsuarios();

  const cambiarRol = useCallback(
    async (id, rol) => {
      const actualizado = await actualizarRolUsuario(id, rol);
      setData((prev) => prev.map((u) => (u.id === id ? { ...u, rol: actualizado.rol } : u)));
    },
    [setData]
  );

  return (
    <RequiereRol roles={ROLES_ADMINISTRADOR}>
      <AdminPageHeader titulo="USUARIOS" subtitulo="GESTIÓN DE ROLES (RBAC)" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los usuarios: ${error}`} onRetry={recargar} />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !usuarios || usuarios.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay cuentas registradas.</p>
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
                  <th className="pr-4 py-3 font-semibold">Registrado</th>
                  <th className="pr-5 py-3 font-semibold text-right">Rol</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <FilaUsuario key={u.id} usuario={u} onCambiarRol={cambiarRol} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequiereRol>
  );
}

export default Usuarios;
