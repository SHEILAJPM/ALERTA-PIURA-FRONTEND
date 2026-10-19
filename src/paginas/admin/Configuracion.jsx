import { useState } from "react";
import { useResource } from "../../ganchos/useResource";
import { getConfiguracion, actualizarConfiguracion } from "../../utilidades/api";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import Skeleton from "../../componentes/Skeleton";
import ErrorBanner from "../../componentes/ErrorBanner";
import { ROLES_ADMINISTRADOR } from "../../constantes/roles";
import { formatearFechaHoraCompleta } from "../../utilidades/fecha";

const CANALES = [
  {
    campo: "telegram_habilitado",
    titulo: "Telegram",
    descripcion: "Avisos automáticos al bot de Telegram en cada cambio de estado del río.",
  },
  {
    campo: "push_habilitado",
    titulo: "Notificaciones push",
    descripcion: "Notificaciones del navegador a quienes activaron la campana en la web.",
  },
  {
    campo: "sms_habilitado",
    titulo: "SMS",
    descripcion: "Mensajes de texto a ciudadanos con teléfono que aceptaron recibirlos. Tiene costo por mensaje.",
  },
  {
    campo: "email_habilitado",
    titulo: "Correo",
    descripcion:
      "Avisos automáticos por correo (vencimiento de póliza, reclamo revisado). Nunca apaga la recuperación de contraseña ni los códigos de acceso.",
  },
];

// Interruptor por canal. Se guarda al instante (sin botón "Guardar") porque
// cada cambio es independiente y queda registrado en la auditoría.
function FilaCanal({ canal, activo, guardando, onCambiar }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-t first:border-t-0" style={{ borderColor: "var(--color-border)" }}>
      <div>
        <p className="font-semibold">{canal.titulo}</p>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {canal.descripcion}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={`${activo ? "Desactivar" : "Activar"} ${canal.titulo}`}
        disabled={guardando}
        onClick={() => onCambiar(canal.campo, !activo)}
        className="relative shrink-0 w-12 h-7 rounded-full transition disabled:opacity-50"
        style={{ backgroundColor: activo ? "var(--color-normal)" : "var(--color-border)" }}
      >
        <span
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all"
          style={{ left: activo ? "1.5rem" : "0.25rem" }}
        />
      </button>
    </div>
  );
}

function Configuracion() {
  const { data: config, loading, error, setData, recargar } = useResource(getConfiguracion, []);
  const [guardando, setGuardando] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [radio, setRadio] = useState(null);

  async function guardar(cambios) {
    setGuardando(Object.keys(cambios)[0]);
    setErrorGuardar(null);
    try {
      setData(await actualizarConfiguracion(cambios));
    } catch (err) {
      setErrorGuardar(err.message);
    } finally {
      setGuardando(null);
    }
  }

  const radioActual = radio ?? String(config?.radio_notificacion_push_km ?? "");
  const radioNumero = Number(radioActual);
  const radioValido = radioNumero > 0 && radioNumero <= 100;
  const radioCambio = config && radioValido && radioNumero !== Number(config.radio_notificacion_push_km);

  return (
    <RequiereRol roles={ROLES_ADMINISTRADOR}>
      <AdminPageHeader titulo="CONFIGURACIÓN" subtitulo="CANALES DE NOTIFICACIÓN" />

      <div className="p-4 sm:p-8 max-w-3xl">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo cargar la configuración: ${error}`} onRetry={recargar} />
          </div>
        )}
        {errorGuardar && (
          <div className="mb-6">
            <ErrorBanner message={`No se pudo guardar el cambio: ${errorGuardar}`} />
          </div>
        )}

        {loading ? (
          <Skeleton className="h-80 w-full rounded-2xl" />
        ) : (
          config && (
            <>
              <section
                className="rounded-2xl border px-5"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                {CANALES.map((canal) => (
                  <FilaCanal
                    key={canal.campo}
                    canal={canal}
                    activo={Boolean(config[canal.campo])}
                    guardando={guardando === canal.campo}
                    onCambiar={(campo, valor) => guardar({ [campo]: valor })}
                  />
                ))}
              </section>

              <section
                className="rounded-2xl border p-5 mt-6"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <label htmlFor="radio-push" className="font-semibold">
                  Radio de las notificaciones push
                </label>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  Solo se avisa a quienes compartieron su ubicación y están a esta distancia del sensor que
                  cambió de estado. Quienes no la compartieron reciben todas las alertas.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    id="radio-push"
                    type="number"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={radioActual}
                    onChange={(e) => setRadio(e.target.value)}
                    className="w-28 rounded-lg border px-3 py-2 text-sm font-mono-data"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text)",
                    }}
                  />
                  <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    km
                  </span>
                  <button
                    type="button"
                    disabled={!radioCambio || guardando === "radio_notificacion_push_km"}
                    onClick={async () => {
                      await guardar({ radio_notificacion_push_km: radioNumero });
                      setRadio(null);
                    }}
                    className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Guardar
                  </button>
                </div>
                {!radioValido && radioActual !== "" && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-alerta)" }}>
                    Debe ser mayor a 0 y de hasta 100 km.
                  </p>
                )}
              </section>

              {config.actualizado_en && (
                <p className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
                  Último cambio: {formatearFechaHoraCompleta(config.actualizado_en)}. Cada cambio queda en el
                  registro de auditoría.
                </p>
              )}
            </>
          )
        )}
      </div>
    </RequiereRol>
  );
}

export default Configuracion;
