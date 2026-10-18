import { useState } from "react";
import { useSensores } from "../../ganchos/useSensores";
import { actualizarCalibracionSensor } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";

// Prealerta y alerta roja se editan igual, solo cambian etiqueta/color/valor
// -- antes eran dos bloques de JSX casi idénticos copiados uno debajo del
// otro dentro de TarjetaSensor.
function FilaUmbral({ id, etiqueta, color, editando, valor, onCambiar, valorMostrado }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {editando ? (
        <>
          <label htmlFor={id} className="text-sm font-medium" style={{ color }}>
            {etiqueta}
          </label>
          <div className="flex items-center gap-1">
            <input
              id={id}
              type="number"
              min="0"
              step="0.1"
              value={valor}
              onChange={onCambiar}
              className="w-20 rounded-lg border px-2 py-1 text-sm font-mono-data text-right"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              cm
            </span>
          </div>
        </>
      ) : (
        <>
          <span className="text-sm font-medium" style={{ color }}>
            {etiqueta}
          </span>
          <span className="font-mono-data font-semibold">{valorMostrado} cm</span>
        </>
      )}
    </div>
  );
}

function TarjetaSensor({ sensor, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [prealerta, setPrealerta] = useState(sensor.nivel_prealerta_cm);
  const [alertaRoja, setAlertaRoja] = useState(sensor.nivel_alerta_roja_cm);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  function cancelar() {
    setEditando(false);
    setPrealerta(sensor.nivel_prealerta_cm);
    setAlertaRoja(sensor.nivel_alerta_roja_cm);
    setError(null);
  }

  async function guardar() {
    const pre = Number(prealerta);
    const roja = Number(alertaRoja);
    if (!Number.isFinite(pre) || !Number.isFinite(roja) || pre <= 0 || roja <= 0) {
      setError("Ambos umbrales deben ser números positivos");
      return;
    }
    if (roja <= pre) {
      setError("El umbral de alerta roja debe ser mayor que el de prealerta");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(sensor.id, { nivel_prealerta_cm: pre, nivel_alerta_roja_cm: roja });
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <p className="font-semibold">{sensor.nombre}</p>
      <p className="text-xs font-mono-data mb-4" style={{ color: "var(--color-text-muted)" }}>
        {sensor.codigo}
      </p>

      <div className="space-y-3">
        <FilaUmbral
          id={`prealerta-${sensor.id}`}
          etiqueta="Prealerta"
          color="var(--color-prealerta)"
          editando={editando}
          valor={prealerta}
          onCambiar={(e) => setPrealerta(e.target.value)}
          valorMostrado={sensor.nivel_prealerta_cm}
        />
        <FilaUmbral
          id={`alerta-roja-${sensor.id}`}
          etiqueta="Alerta roja"
          color="var(--color-alerta)"
          editando={editando}
          valor={alertaRoja}
          onCambiar={(e) => setAlertaRoja(e.target.value)}
          valorMostrado={sensor.nivel_alerta_roja_cm}
        />
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}

      {editando ? (
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex-1 text-xs font-semibold py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="text-xs font-medium px-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-4 w-full text-xs font-semibold py-2 rounded-lg"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-primary)" }}
        >
          Editar umbral
        </button>
      )}
    </div>
  );
}

function Calibracion() {
  const { data: sensores, loading, error, setData, recargar } = useSensores();

  async function guardarCalibracion(id, umbrales) {
    const actualizado = await actualizarCalibracionSensor(id, umbrales);
    setData((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              nivel_prealerta_cm: actualizado.nivel_prealerta_cm,
              nivel_alerta_roja_cm: actualizado.nivel_alerta_roja_cm,
            }
          : s
      )
    );
  }

  return (
    <>
      <AdminPageHeader titulo="CALIBRACIÓN" subtitulo="UMBRALES DE NIVEL (H MÁX)" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los umbrales: ${error}`} onRetry={recargar} />
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : !sensores || sensores.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay nodos registrados todavía.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sensores.map((s) => (
              <TarjetaSensor key={s.id} sensor={s} onGuardar={guardarCalibracion} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Calibracion;
