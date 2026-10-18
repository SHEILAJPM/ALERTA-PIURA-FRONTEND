import { useEffect, useState } from "react";
import { useUltimaLectura } from "../../ganchos/useUltimaLectura";
import { useEstadoSensores } from "../../ganchos/useEstadoSensores";
import { useAlertasSOS } from "../../ganchos/useAlertasSOS";
import { difundirAlertaManual, actualizarEstadoSOS } from "../../utilidades/api";
import StatusBadge from "../../componentes/StatusBadge";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import ConfirmDialog from "../../componentes/ConfirmDialog";
import Icon from "../../componentes/Icon";
import { formatearFechaHora } from "../../utilidades/fecha";

const LIMITE_MENSAJE = 1000;

function AlertasSOS() {
  const { data: alertas, loading, error, setData } = useAlertasSOS();
  const [atendiendo, setAtendiendo] = useState(null);

  async function marcarAtendida(id) {
    setAtendiendo(id);
    try {
      await actualizarEstadoSOS(id, "atendido");
      // El WS (alerta_sos_actualizada) ya la saca de la lista -- esto es solo
      // por si el propio dispatcher no tiene el WebSocket conectado.
      setData((prev) => (prev ?? []).filter((a) => a.id !== id));
    } catch {
      // el error queda visible porque el botón deja de estar "atendiendo" y
      // la alerta sigue en la lista para reintentar.
    } finally {
      setAtendiendo(null);
    }
  }

  if (loading) return <Skeleton className="h-24 rounded-2xl mb-8" />;
  if (error) {
    return (
      <div className="mb-8">
        <ErrorBanner message={`No se pudieron cargar las alertas SOS: ${error}`} />
      </div>
    );
  }
  if (!alertas || alertas.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {alertas.map((alerta) => {
        const [lon, lat] = alerta.ubicacion.coordinates;
        return (
          <div
            key={alerta.id}
            className="rounded-2xl border-2 p-5 flex flex-wrap items-center justify-between gap-4 animate-pulse-alert"
            style={{ backgroundColor: "var(--color-alerta-soft)", borderColor: "var(--color-alerta)" }}
          >
            <div>
              <p className="font-bold flex items-center gap-2" style={{ color: "var(--color-alerta)" }}>
                <Icon name="bi-exclamation-octagon-fill" aria-hidden="true" />
                SOS — {alerta.nombre_contacto ?? "Anónimo"}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                {alerta.telefono_contacto && <>Tel: {alerta.telefono_contacto} · </>}
                {formatearFechaHora(alerta.creado_en)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
              >
                Ver ubicación
              </a>
              <button
                type="button"
                onClick={() => marcarAtendida(alerta.id)}
                disabled={atendiendo === alerta.id}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--color-alerta)" }}
              >
                {atendiendo === alerta.id ? "Marcando..." : "Marcar atendido"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DifusionManual() {
  const [mensaje, setMensaje] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviadoA, setEnviadoA] = useState(null);
  const [error, setError] = useState(null);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      const resultado = await difundirAlertaManual(mensaje);
      setEnviadoA(resultado.enviado_a);
      setMensaje("");
      setConfirmando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon name="bi-megaphone" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
        <h2 className="font-bold">Difusión manual a Telegram</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
        Envía un aviso a todos los suscriptores activos, además de los avisos automáticos por cambio de nivel
        del río.
      </p>

      <textarea
        value={mensaje}
        onChange={(e) => {
          setMensaje(e.target.value);
          setEnviadoA(null);
        }}
        maxLength={LIMITE_MENSAJE}
        rows={4}
        placeholder="Ej. Evacúen preventivamente el sector Puente Bolognesi hacia el Coliseo Gerónimo Seminario."
        className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
        }}
      />
      <p className="text-xs mt-1 text-right" style={{ color: "var(--color-text-muted)" }}>
        {mensaje.length} / {LIMITE_MENSAJE}
      </p>

      {error && (
        <p className="text-sm mt-2" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}

      {enviadoA !== null && (
        <p
          className="text-sm mt-2 font-medium flex items-center gap-1.5"
          style={{ color: "var(--color-normal)" }}
        >
          <Icon name="bi-check-circle-fill" aria-hidden="true" /> Enviado a {enviadoA} suscriptor
          {enviadoA === 1 ? "" : "es"}.
        </p>
      )}

      <button
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={mensaje.trim().length === 0}
        className="mt-4 text-sm font-semibold px-5 py-2.5 rounded-lg text-white disabled:opacity-50"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Enviar difusión
      </button>

      {confirmando && (
        <ConfirmDialog
          titulo="Confirmar difusión"
          textoConfirmar="Sí, enviar ahora"
          enviando={enviando}
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(false)}
        >
          ¿Confirmar el envío a todos los suscriptores activos? No se puede deshacer.
        </ConfirmDialog>
      )}
    </div>
  );
}

const SENSOR_POR_DEFECTO = "RIO-PIURA-01";

function Despacho() {
  const { data: sensores } = useEstadoSensores();
  const [sensorCodigo, setSensorCodigo] = useState(SENSOR_POR_DEFECTO);

  // Igual que Home.jsx: si el sensor por defecto ya no existe (renombrado o
  // borrado desde el panel), cae al primero disponible en vez de dejar la
  // consola de despacho pegada a un código muerto durante una emergencia.
  useEffect(() => {
    if (sensores && sensores.length > 0 && !sensores.some((s) => s.codigo === sensorCodigo)) {
      setSensorCodigo(sensores[0].codigo);
    }
  }, [sensores, sensorCodigo]);

  const { lectura, loading, error } = useUltimaLectura(sensorCodigo);
  const enLinea = sensores?.filter((s) => s.en_linea).length ?? 0;
  const total = sensores?.length ?? 0;

  return (
    <>
      <AdminPageHeader titulo="CONSOLA DE DESPACHO" subtitulo="DEFENSA CIVIL / COER" />

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar el estado del río: ${error}`} />
          </div>
        )}

        <AlertasSOS />

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>
              Estado actual del río
            </p>
            {loading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl font-bold font-mono-data">{lectura?.nivel_cm ?? "—"} cm</span>
                {lectura?.estado && <StatusBadge status={lectura.estado} />}
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>
              Nodos en línea
            </p>
            <p className="text-3xl font-bold font-mono-data">
              {enLinea}
              <span className="text-lg font-normal" style={{ color: "var(--color-text-muted)" }}>
                /{total}
              </span>
            </p>
          </div>
        </div>

        <DifusionManual />
      </div>
    </>
  );
}

export default Despacho;
