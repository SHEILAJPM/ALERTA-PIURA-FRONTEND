import { useState } from "react";
import { useReclamosSeguroAdmin } from "../../ganchos/useReclamosSeguro";
import { revisarReclamoSeguro } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import Icon from "../../componentes/Icon";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";
import { formatearFecha, formatearFechaHora } from "../../utilidades/fecha";

const ESTADO_LABEL = {
  pendiente: { text: "Pendiente", color: "var(--color-prealerta)", bg: "var(--color-prealerta-soft)" },
  aprobado: { text: "Aprobado", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
  pagado: { text: "Pagado", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
  rechazado: { text: "Rechazado", color: "var(--color-alerta)", bg: "var(--color-alerta-soft)" },
};

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

function PanelAprobar({ tope, onConfirmar, onCancelar, enviando }) {
  const [monto, setMonto] = useState("");
  const excedeTope = Number(monto) > tope / 100;

  return (
    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "var(--color-surface-alt)" }}>
      <label className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
        Monto a reconocer (tope S/ {(tope / 100).toFixed(2)})
      </label>
      <div className="flex gap-2 mt-1">
        <input
          type="number"
          min="0"
          step="0.01"
          max={tope / 100}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0.00"
          className="flex-1 rounded-lg border px-3 py-1.5 text-sm font-mono-data"
          style={inputStyle}
        />
        <button
          type="button"
          disabled={enviando || !monto || excedeTope}
          onClick={() => onConfirmar(Math.round(Number(monto) * 100))}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-normal)" }}
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="text-sm font-medium px-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
      </div>
      {excedeTope && (
        <p className="text-xs mt-1" style={{ color: "var(--color-alerta)" }}>
          Supera el tope de este plan.
        </p>
      )}
    </div>
  );
}

function PanelRechazar({ onConfirmar, onCancelar, enviando }) {
  const [motivo, setMotivo] = useState("");

  return (
    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "var(--color-surface-alt)" }}>
      <label className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
        Motivo del rechazo
      </label>
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej. las fotos no corresponden a la fecha indicada"
          maxLength={500}
          className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
          style={inputStyle}
        />
        <button
          type="button"
          disabled={enviando || !motivo.trim()}
          onClick={() => onConfirmar(motivo.trim())}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-alerta)" }}
        >
          Confirmar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="text-sm font-medium px-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TarjetaReclamo({ reclamo, onRevisar }) {
  const [panel, setPanel] = useState(null); // "aprobar" | "rechazar" | null
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const estado = ESTADO_LABEL[reclamo.estado];

  async function confirmar(datos) {
    setEnviando(true);
    setError(null);
    try {
      await onRevisar(reclamo.id, datos);
      setPanel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{reclamo.usuario_nombre}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {reclamo.usuario_correo} · plan de {reclamo.meses} {reclamo.meses === 1 ? "mes" : "meses"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Daño del {formatearFecha(reclamo.fecha_dano)} · reclamado el{" "}
            {formatearFechaHora(reclamo.creado_en)}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
          style={{ color: estado.color, backgroundColor: estado.bg }}
        >
          {estado.text}
        </span>
      </div>

      <p className="mt-3 text-sm">{reclamo.descripcion}</p>

      {reclamo.foto_urls?.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {reclamo.foto_urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt="Foto del daño"
                loading="lazy"
                className="w-full h-24 object-cover rounded-lg"
              />
            </a>
          ))}
        </div>
      )}

      {reclamo.estado === "rechazado" && reclamo.motivo_rechazo && (
        <p className="text-xs mt-2" style={{ color: "var(--color-alerta)" }}>
          Motivo: {reclamo.motivo_rechazo}
        </p>
      )}
      {(reclamo.estado === "aprobado" || reclamo.estado === "pagado") && (
        <p className="text-sm font-bold mt-2" style={{ color: "var(--color-normal)" }}>
          Monto reconocido: S/ {(reclamo.monto_aprobado_centavos / 100).toFixed(2)}
        </p>
      )}

      {reclamo.estado === "pendiente" && !panel && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPanel("aprobar")}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--color-normal)" }}
          >
            <Icon name="bi-check-lg" aria-hidden="true" /> Aprobar
          </button>
          <button
            type="button"
            onClick={() => setPanel("rechazar")}
            className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }}
          >
            <Icon name="bi-x-lg" aria-hidden="true" /> Rechazar
          </button>
        </div>
      )}

      {reclamo.estado === "aprobado" && (
        <button
          type="button"
          disabled={enviando}
          onClick={() => confirmar({ estado: "pagado" })}
          className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Marcar como pagado
        </button>
      )}

      {panel === "aprobar" && (
        <PanelAprobar
          tope={reclamo.tope_indemnizacion_centavos}
          enviando={enviando}
          onCancelar={() => setPanel(null)}
          onConfirmar={(monto_aprobado_centavos) =>
            confirmar({ estado: "aprobado", monto_aprobado_centavos })
          }
        />
      )}
      {panel === "rechazar" && (
        <PanelRechazar
          enviando={enviando}
          onCancelar={() => setPanel(null)}
          onConfirmar={(motivo_rechazo) => confirmar({ estado: "rechazado", motivo_rechazo })}
        />
      )}

      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}
    </article>
  );
}

function ReclamosSeguro() {
  const { data: reclamos, loading, error, setData, recargar } = useReclamosSeguroAdmin();

  async function manejarRevisar(id, datos) {
    const actualizado = await revisarReclamoSeguro(id, datos);
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...actualizado } : r)));
  }

  const pendientes = (reclamos ?? []).filter((r) => r.estado === "pendiente");
  const resueltos = (reclamos ?? []).filter((r) => r.estado !== "pendiente");

  return (
    <RequiereRol roles={ROLES_ADMINISTRADOR}>
      <AdminPageHeader titulo="SEGURO" subtitulo="RECLAMOS POR DAÑOS DEL RÍO" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los reclamos: ${error}`} onRetry={recargar} />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : !reclamos || reclamos.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay reclamos registrados todavía.</p>
        ) : (
          <div className="space-y-6">
            {pendientes.length > 0 && (
              <div>
                <h3
                  className="font-bold text-sm uppercase tracking-wide mb-3"
                  style={{ color: "var(--color-prealerta)" }}
                >
                  Pendientes ({pendientes.length})
                </h3>
                <div className="space-y-4">
                  {pendientes.map((r) => (
                    <TarjetaReclamo key={r.id} reclamo={r} onRevisar={manejarRevisar} />
                  ))}
                </div>
              </div>
            )}
            {resueltos.length > 0 && (
              <div>
                <h3
                  className="font-bold text-sm uppercase tracking-wide mb-3"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Resueltos
                </h3>
                <div className="space-y-4">
                  {resueltos.map((r) => (
                    <TarjetaReclamo key={r.id} reclamo={r} onRevisar={manejarRevisar} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </RequiereRol>
  );
}

export default ReclamosSeguro;
