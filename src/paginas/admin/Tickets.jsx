import React, { useCallback, useState } from "react";
import { useTickets } from "../../ganchos/useTickets";
import { useSensores } from "../../ganchos/useSensores";
import { crearTicket, actualizarEstadoTicket } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { formatearFechaHora as formatearFecha } from "../../utilidades/fecha";

const ESTADO_LABEL = {
  abierto: { texto: "Abierto", color: "var(--color-alerta)", bg: "var(--color-alerta-soft)" },
  en_progreso: { texto: "En progreso", color: "var(--color-prealerta)", bg: "var(--color-prealerta-soft)" },
  cerrado: { texto: "Cerrado", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
};

const SIGUIENTE_ESTADO = { abierto: "en_progreso", en_progreso: "cerrado" };
const SIGUIENTE_LABEL = { abierto: "Iniciar", en_progreso: "Cerrar" };

const PRIORIDAD_LABEL = {
  alta: { texto: "Alta", color: "var(--color-alerta)" },
  media: { texto: "Media", color: "var(--color-prealerta)" },
  baja: { texto: "Baja", color: "var(--color-text-muted)" },
};

function NuevoTicket({ sensores, onCrear }) {
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("media");
  const [sensorId, setSensorId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function manejarSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await onCrear({
        titulo,
        descripcion: descripcion || undefined,
        prioridad,
        sensor_id: sensorId || undefined,
      });
      setTitulo("");
      setDescripcion("");
      setPrioridad("media");
      setSensorId("");
      setAbierto(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mb-6 text-sm font-semibold px-4 py-2.5 rounded-lg text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        + Nuevo ticket
      </button>
    );
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="rounded-2xl border p-5 mb-6 space-y-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <input
        type="text"
        placeholder="Título (ej. Sensor sin señal en Puente Bolognesi)"
        aria-label="Título del ticket"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
        maxLength={150}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
        }}
      />
      <textarea
        placeholder="Descripción (opcional)"
        aria-label="Descripción del ticket"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
        }}
      />
      <div className="flex flex-wrap gap-3">
        <select
          value={sensorId}
          onChange={(e) => setSensorId(e.target.value)}
          aria-label="Nodo asociado"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
          }}
        >
          <option value="">Sin nodo asociado</option>
          {sensores?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.codigo} — {s.nombre}
            </option>
          ))}
        </select>
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          aria-label="Prioridad"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
          }}
        >
          <option value="baja">Prioridad baja</option>
          <option value="media">Prioridad media</option>
          <option value="alta">Prioridad alta</option>
        </select>
      </div>
      {error && (
        <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {enviando ? "Creando..." : "Crear ticket"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm font-medium px-4 py-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

const TarjetaTicket = React.memo(function TarjetaTicket({ ticket, onAvanzar }) {
  const [procesando, setProcesando] = useState(false);
  const estado = ESTADO_LABEL[ticket.estado];
  const prioridad = PRIORIDAD_LABEL[ticket.prioridad];
  const siguiente = SIGUIENTE_ESTADO[ticket.estado];

  async function avanzar() {
    setProcesando(true);
    try {
      await onAvanzar(ticket.id, siguiente);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{ticket.titulo}</p>
            <span className="text-xs font-semibold" style={{ color: prioridad.color }}>
              · {prioridad.texto}
            </span>
          </div>
          {ticket.sensor_codigo && (
            <p className="text-xs font-mono-data mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {ticket.sensor_codigo} — {ticket.sensor_nombre}
            </p>
          )}
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
          style={{ color: estado.color, backgroundColor: estado.bg }}
        >
          {estado.texto}
        </span>
      </div>

      {ticket.descripcion && (
        <p className="mt-3 text-sm" style={{ color: "var(--color-text)" }}>
          {ticket.descripcion}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Abierto {formatearFecha(ticket.creado_en)}
        </p>
        {siguiente && (
          <button
            type="button"
            onClick={avanzar}
            disabled={procesando}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }}
          >
            {procesando ? "..." : SIGUIENTE_LABEL[ticket.estado]}
          </button>
        )}
      </div>
    </article>
  );
});

function Tickets() {
  const { data: tickets, loading, error, setData, recargar } = useTickets();
  const { data: sensores } = useSensores();

  const manejarCrear = useCallback(
    async (datos) => {
      const nuevo = await crearTicket(datos);
      const sensor = sensores?.find((s) => s.id === datos.sensor_id);
      setData((prev) => [
        { ...nuevo, sensor_codigo: sensor?.codigo ?? null, sensor_nombre: sensor?.nombre ?? null },
        ...(prev ?? []),
      ]);
    },
    [sensores, setData]
  );

  const manejarAvanzar = useCallback(
    async (id, estado) => {
      const actualizado = await actualizarEstadoTicket(id, estado);
      setData((prev) => prev.map((t) => (t.id === id ? { ...t, estado: actualizado.estado } : t)));
    },
    [setData]
  );

  return (
    <>
      <AdminPageHeader titulo="MANTENIMIENTO" subtitulo="TICKETS DE HARDWARE" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudieron cargar los tickets: ${error}`} onRetry={recargar} />
          </div>
        )}

        <NuevoTicket sensores={sensores} onCrear={manejarCrear} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No hay tickets abiertos.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <TarjetaTicket key={t.id} ticket={t} onAvanzar={manejarAvanzar} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Tickets;
