import { useState } from "react";
import { useModalA11y } from "../ganchos/useModalA11y";
import { useAuth } from "../contexto/AuthContext";
import { emergencyContacts } from "../datos/content";
import { enviarSOS } from "../utilidades/api";
import Icon from "./Icon";

// Geolocalización con permiso ya negado/no soportado: se resuelve igual (con
// coords null) en vez de rechazar, para no complicar el flujo de un botón de
// pánico con un catch aparte -- BotonSOS decide qué hacer si no hay ubicación.
function obtenerUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

function BotonSOS() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState("inicial"); // inicial | confirmando | enviando | enviado | error
  const [error, setError] = useState(null);
  // Solo tiene sentido pedirlo sin cuenta: con sesión, el backend ya saca
  // nombre/teléfono del perfil (ver POST /api/sos). Opcional a propósito --
  // en una emergencia real no hay que trabar el envío por un campo vacío.
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");

  async function confirmarEnvio() {
    setEstado("enviando");
    setError(null);
    const ubicacion = await obtenerUbicacion();
    if (!ubicacion) {
      setError("No se pudo obtener tu ubicación. Activa el GPS/ubicación e intenta de nuevo.");
      setEstado("error");
      return;
    }
    try {
      await enviarSOS({
        lon: ubicacion.lon,
        lat: ubicacion.lat,
        nombre_contacto: nombreContacto.trim() || undefined,
        telefono_contacto: telefonoContacto.trim() || undefined,
      });
      setEstado("enviado");
    } catch (err) {
      setError(err.message);
      setEstado("error");
    }
  }

  if (estado === "enviado") {
    return (
      <p
        className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2"
        style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
      >
        <Icon name="bi-check-circle-fill" aria-hidden="true" />
        Listo, avisamos a Defensa Civil con tu ubicación.
      </p>
    );
  }

  return (
    <div className="mb-4">
      {estado === "confirmando" ? (
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-alerta-soft)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-alerta)" }}>
            ¿Confirmas que necesitas ayuda ahora? Vamos a mandar tu ubicación exacta a Defensa Civil.
          </p>
          {!usuario && (
            <div className="space-y-2 mb-3">
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Opcional: dejar tu nombre y teléfono ayuda a que te ubiquen más rápido.
              </p>
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={nombreContacto}
                onChange={(e) => setNombreContacto(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
              />
              <input
                type="tel"
                placeholder="Tu teléfono (opcional)"
                value={telefonoContacto}
                onChange={(e) => setTelefonoContacto(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmarEnvio}
              className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg text-white"
              style={{ backgroundColor: "var(--color-alerta)" }}
            >
              Sí, necesito ayuda
            </button>
            <button
              type="button"
              onClick={() => setEstado("inicial")}
              className="text-sm font-semibold px-4 py-2.5 rounded-lg"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEstado("confirmando")}
          disabled={estado === "enviando"}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-xl text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-alerta)" }}
        >
          <Icon name="bi-geo-alt-fill" aria-hidden="true" />
          {estado === "enviando"
            ? "Enviando ubicación..."
            : usuario
              ? "Enviar SOS con mi ubicación a Defensa Civil"
              : "Enviar SOS con mi ubicación (sin necesidad de cuenta)"}
        </button>
      )}
      {error && (
        <p className="text-sm mt-2" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function DialogoEmergencia({ onCerrar }) {
  const contenedorRef = useModalA11y(onCerrar);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCerrar}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergencia-titulo"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border p-6 outline-none"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            id="emergencia-titulo"
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--color-alerta)" }}
          >
            <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" />
            Números de emergencia
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-xl leading-none"
            style={{ color: "var(--color-text-muted)" }}
          >
            ×
          </button>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          Si es una emergencia real, llama directamente. No esperes a que la app confirme nada.
        </p>

        <BotonSOS />

        <ul className="space-y-2">
          {emergencyContacts.map((c) => (
            <li key={c.numero}>
              <a
                href={`tel:${c.numero}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold transition"
                style={{ backgroundColor: "var(--color-alerta-soft)", color: "var(--color-alerta)" }}
              >
                {c.nombre}
                <span className="font-mono-data text-lg">{c.numero}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BotonEmergencia() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Ver números de emergencia"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl text-white animate-pulse-alert"
        style={{ backgroundColor: "var(--color-alerta)" }}
      >
        <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" />
      </button>
      {abierto && <DialogoEmergencia onCerrar={() => setAbierto(false)} />}
    </>
  );
}

export default BotonEmergencia;
