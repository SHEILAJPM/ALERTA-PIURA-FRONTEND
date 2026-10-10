import { useState } from "react";
import { useSensores } from "../../ganchos/useSensores";
import { crearSensor, actualizarActivoSensor } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import FormularioCreacion from "../../componentes/admin/FormularioCreacion";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

const CAMPOS_INICIALES = {
  codigo: "",
  nombre: "",
  lon: "",
  lat: "",
  nivel_prealerta_cm: "",
  nivel_alerta_roja_cm: "",
};

function coordenadas(ubicacionGeoJSON) {
  const [lon, lat] = ubicacionGeoJSON?.coordinates ?? [null, null];
  if (lon == null || lat == null) return "—";
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function validarNodo(campos) {
  const datos = {
    codigo: campos.codigo.trim(),
    nombre: campos.nombre.trim(),
    lon: Number(campos.lon),
    lat: Number(campos.lat),
    nivel_prealerta_cm: Number(campos.nivel_prealerta_cm),
    nivel_alerta_roja_cm: Number(campos.nivel_alerta_roja_cm),
  };
  if (Object.values(datos).some((v) => v === "" || (typeof v === "number" && Number.isNaN(v)))) {
    return { error: "Completa todos los campos" };
  }
  if (datos.nivel_alerta_roja_cm <= datos.nivel_prealerta_cm) {
    return { error: "El umbral de alerta roja debe ser mayor que el de prealerta" };
  }
  return { datos };
}

function NuevoNodo({ onCrear }) {
  return (
    <FormularioCreacion
      camposIniciales={CAMPOS_INICIALES}
      validar={validarNodo}
      onCrear={onCrear}
      textoBoton="Registrar nodo ESP32"
      textoGuardar="Registrar nodo"
      textoGuardando="Registrando..."
    >
      {({ valores, actualizar }) => (
        <>
          <div>
            <label
              htmlFor="sensor-codigo"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Código del ESP32
            </label>
            <input
              id="sensor-codigo"
              type="text"
              placeholder="RIO-PIURA-02"
              value={valores.codigo}
              onChange={actualizar("codigo")}
              maxLength={50}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="sensor-nombre"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Nombre / ubicación
            </label>
            <input
              id="sensor-nombre"
              type="text"
              placeholder="Puente Bolognesi"
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
              htmlFor="sensor-lat"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Latitud
            </label>
            <input
              id="sensor-lat"
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
              htmlFor="sensor-lon"
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              Longitud
            </label>
            <input
              id="sensor-lon"
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
          <div>
            <label
              htmlFor="sensor-prealerta"
              className="text-xs font-semibold"
              style={{ color: "var(--color-prealerta)" }}
            >
              Umbral prealerta (cm)
            </label>
            <input
              id="sensor-prealerta"
              type="number"
              step="0.1"
              min="0"
              placeholder="10"
              value={valores.nivel_prealerta_cm}
              onChange={actualizar("nivel_prealerta_cm")}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="sensor-alerta-roja"
              className="text-xs font-semibold"
              style={{ color: "var(--color-alerta)" }}
            >
              Umbral alerta roja (cm)
            </label>
            <input
              id="sensor-alerta-roja"
              type="number"
              step="0.1"
              min="0"
              placeholder="16"
              value={valores.nivel_alerta_roja_cm}
              onChange={actualizar("nivel_alerta_roja_cm")}
              required
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm font-mono-data"
              style={inputStyle}
            />
          </div>
        </>
      )}
    </FormularioCreacion>
  );
}

function FilaSensor({ sensor, onCambiarActivo }) {
  const [cambiando, setCambiando] = useState(false);

  async function alternar() {
    setCambiando(true);
    try {
      await onCambiarActivo(sensor.id, !sensor.activo);
    } finally {
      setCambiando(false);
    }
  }

  return (
    <tr className="border-t" style={{ borderColor: "var(--color-border)" }}>
      <td className="pl-5 pr-4 py-3 font-mono-data">{sensor.codigo}</td>
      <td className="pr-4 py-3">{sensor.nombre}</td>
      <td className="pr-4 py-3 font-mono-data text-xs" style={{ color: "var(--color-text-muted)" }}>
        {coordenadas(sensor.ubicacion)}
      </td>
      <td className="pr-5 py-3">
        <button
          type="button"
          onClick={alternar}
          disabled={cambiando}
          className="text-xs font-semibold px-3 py-1 rounded-full disabled:opacity-50"
          style={
            sensor.activo
              ? { color: "var(--color-normal)", backgroundColor: "var(--color-normal-soft)" }
              : { color: "var(--color-text-muted)", backgroundColor: "var(--color-surface-alt)" }
          }
        >
          {cambiando ? "..." : sensor.activo ? "Activo" : "Inactivo"}
        </button>
      </td>
    </tr>
  );
}

function CatalogoNodos() {
  const { data: sensores, loading, error, setData, recargar } = useSensores();

  async function manejarCrear(datos) {
    const nuevo = await crearSensor(datos);
    setData((prev) => [...(prev ?? []), nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  }

  async function manejarCambiarActivo(id, activo) {
    const actualizado = await actualizarActivoSensor(id, activo);
    setData((prev) => prev.map((s) => (s.id === id ? { ...s, activo: actualizado.activo } : s)));
  }

  return (
    <>
      <AdminPageHeader titulo="CATÁLOGO DE NODOS" subtitulo="ESP32 · COORDENADAS GPS" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar el catálogo: ${error}`} onRetry={recargar} />
          </div>
        )}

        <NuevoNodo onCrear={manejarCrear} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !sensores || sensores.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay nodos registrados todavía.</p>
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
                  <th className="pl-5 pr-4 py-3 font-semibold">Código</th>
                  <th className="pr-4 py-3 font-semibold">Nombre</th>
                  <th className="pr-4 py-3 font-semibold">Coordenadas GPS</th>
                  <th className="pr-5 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sensores.map((s) => (
                  <FilaSensor key={s.id} sensor={s} onCambiarActivo={manejarCambiarActivo} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
          Un nodo recién registrado empieza a aparecer en Telemetría en cuanto el ESP32 envíe su primera
          lectura con este mismo código. Un nodo inactivo deja de aceptar lecturas nuevas; haz clic en su
          estado para activarlo o desactivarlo.
        </p>
      </div>
    </>
  );
}

export default CatalogoNodos;
