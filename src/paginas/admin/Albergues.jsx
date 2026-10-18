import { useState } from "react";
import { useAlbergues } from "../../ganchos/useAlbergues";
import { actualizarOcupacionAlbergue, crearAlbergue, eliminarAlbergue } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import FormularioCreacion from "../../componentes/admin/FormularioCreacion";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import ConfirmDialog from "../../componentes/ConfirmDialog";

const CAMPOS_INICIALES = { nombre: "", direccion: "", capacidad: "", lon: "", lat: "" };

function nivelOcupacion(ocupacion, capacidad) {
  const pct = capacidad > 0 ? (ocupacion / capacidad) * 100 : 0;
  if (pct >= 90) return { texto: "Crítico", color: "var(--color-alerta)", bg: "var(--color-alerta-soft)" };
  if (pct >= 60)
    return { texto: "Casi lleno", color: "var(--color-prealerta)", bg: "var(--color-prealerta-soft)" };
  return { texto: "Disponible", color: "var(--color-normal)", bg: "var(--color-normal-soft)" };
}

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

function validarAlbergue(campos) {
  const datos = {
    nombre: campos.nombre.trim(),
    direccion: campos.direccion.trim() || undefined,
    capacidad: Number(campos.capacidad),
    lon: Number(campos.lon),
    lat: Number(campos.lat),
  };
  if (!datos.nombre || !Number.isFinite(datos.capacidad) || datos.capacidad <= 0) {
    return { error: "Completa nombre y capacidad (mayor a 0)" };
  }
  if (!Number.isFinite(datos.lon) || !Number.isFinite(datos.lat)) {
    return { error: "Completa latitud y longitud" };
  }
  return { datos };
}

function NuevoAlbergue({ onCrear }) {
  return (
    <FormularioCreacion
      camposIniciales={CAMPOS_INICIALES}
      validar={validarAlbergue}
      onCrear={onCrear}
      textoBoton="Agregar albergue"
      textoGuardar="Guardar albergue"
      textoGuardando="Guardando..."
    >
      {({ valores, actualizar }) => (
        <>
          <div>
            <label
              htmlFor="albergue-nombre"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Nombre
            </label>
            <input
              id="albergue-nombre"
              type="text"
              placeholder="I.E. San Miguel"
              value={valores.nombre}
              onChange={actualizar("nombre")}
              maxLength={150}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="albergue-direccion"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Dirección
            </label>
            <input
              id="albergue-direccion"
              type="text"
              placeholder="Jr. Ayacucho 400"
              value={valores.direccion}
              onChange={actualizar("direccion")}
              maxLength={200}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="albergue-capacidad"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Capacidad
            </label>
            <input
              id="albergue-capacidad"
              type="number"
              min="1"
              placeholder="200"
              value={valores.capacidad}
              onChange={actualizar("capacidad")}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="albergue-lat"
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                Latitud
              </label>
              <input
                id="albergue-lat"
                type="number"
                step="any"
                placeholder="-5.1945"
                value={valores.lat}
                onChange={actualizar("lat")}
                required
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                htmlFor="albergue-lon"
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-muted)" }}
              >
                Longitud
              </label>
              <input
                id="albergue-lon"
                type="number"
                step="any"
                placeholder="-80.6328"
                value={valores.lon}
                onChange={actualizar("lon")}
                required
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
                style={inputStyle}
              />
            </div>
          </div>
        </>
      )}
    </FormularioCreacion>
  );
}

function FilaAlbergue({ albergue, onGuardar, onQuitar }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(albergue.ocupacion_actual);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  const [quitando, setQuitando] = useState(false);
  const [error, setError] = useState(null);
  const nivel = nivelOcupacion(albergue.ocupacion_actual, albergue.capacidad);
  const pct = Math.min(100, Math.round((albergue.ocupacion_actual / albergue.capacidad) * 100));

  async function guardar() {
    const nueva = Number(valor);
    if (!Number.isFinite(nueva) || nueva < 0 || nueva > albergue.capacidad) {
      setError(`Debe ser un número entre 0 y ${albergue.capacidad}`);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(albergue.id, nueva);
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function cancelar() {
    setEditando(false);
    setValor(albergue.ocupacion_actual);
    setError(null);
  }

  async function confirmarQuitar() {
    setQuitando(true);
    try {
      await onQuitar(albergue.id);
      setConfirmandoQuitar(false);
    } catch (err) {
      setError(err.message);
      setConfirmandoQuitar(false);
    } finally {
      setQuitando(false);
    }
  }

  return (
    <tr className="border-t align-top" style={{ borderColor: "var(--color-border)" }}>
      <td className="py-3 pl-5 pr-4">
        <p className="font-semibold">{albergue.nombre}</p>
        {albergue.direccion && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {albergue.direccion}
          </p>
        )}
      </td>
      <td className="py-3 pr-4 w-56">
        <div
          className="h-2 rounded-full overflow-hidden mb-1.5"
          style={{ backgroundColor: "var(--color-surface-alt)" }}
        >
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: nivel.color }} />
        </div>
        <p className="text-xs font-mono-data" style={{ color: "var(--color-text-muted)" }}>
          {albergue.ocupacion_actual} / {albergue.capacidad}
        </p>
      </td>
      <td className="py-3 pr-4">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ color: nivel.color, backgroundColor: nivel.bg }}
        >
          {nivel.texto}
        </span>
      </td>
      <td className="py-3 pr-5 text-right">
        {editando ? (
          <div className="flex items-center justify-end gap-2">
            <input
              type="number"
              min="0"
              max={albergue.capacidad}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              aria-label={`Nueva ocupación de ${albergue.nombre}`}
              className="w-20 rounded-lg border px-2 py-1 text-sm font-mono-data text-right"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {guardando ? "..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-xs font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              Editar aforo
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoQuitar(true)}
              className="text-xs font-semibold"
              style={{ color: "var(--color-alerta)" }}
            >
              Quitar
            </button>
          </div>
        )}
        {error && (
          <p className="text-xs mt-1" style={{ color: "var(--color-alerta)" }}>
            {error}
          </p>
        )}
        {confirmandoQuitar && (
          <ConfirmDialog
            titulo="Quitar albergue"
            textoConfirmar="Sí, quitar"
            enviando={quitando}
            onConfirmar={confirmarQuitar}
            onCancelar={() => setConfirmandoQuitar(false)}
          >
            ¿Quitar «{albergue.nombre}» de la lista de albergues disponibles? Deja de mostrarse al público,
            pero su historial no se borra.
          </ConfirmDialog>
        )}
      </td>
    </tr>
  );
}

function Albergues() {
  const { data: albergues, loading, error, setData, recargar } = useAlbergues();

  async function guardarOcupacion(id, ocupacionActual) {
    const actualizado = await actualizarOcupacionAlbergue(id, ocupacionActual);
    setData((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ocupacion_actual: actualizado.ocupacion_actual } : a))
    );
  }

  async function manejarCrear(datos) {
    const nuevo = await crearAlbergue(datos);
    setData((prev) => [...(prev ?? []), { ...datos, ...nuevo, ocupacion_actual: 0 }]);
  }

  async function manejarQuitar(id) {
    await eliminarAlbergue(id);
    setData((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      <AdminPageHeader titulo="ALBERGUES" subtitulo="INVENTARIO Y AFORO" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los albergues: ${error}`} onRetry={recargar} />
          </div>
        )}

        <NuevoAlbergue onCrear={manejarCrear} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !albergues || albergues.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay albergues registrados.</p>
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
                  <th className="pl-5 pr-4 py-3 font-semibold">Albergue</th>
                  <th className="pr-4 py-3 font-semibold">Ocupación</th>
                  <th className="pr-4 py-3 font-semibold">Estado</th>
                  <th className="pr-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {albergues.map((a) => (
                  <FilaAlbergue
                    key={a.id}
                    albergue={a}
                    onGuardar={guardarOcupacion}
                    onQuitar={manejarQuitar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default Albergues;
