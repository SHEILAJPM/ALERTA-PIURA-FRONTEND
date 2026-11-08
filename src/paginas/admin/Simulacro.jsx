import { useState } from "react";
import AdminPageHeader from "../../componentes/admin/AdminPageHeader";
import RequiereRol from "../../componentes/admin/RequiereRol";
import ErrorBanner from "../../componentes/ErrorBanner";
import Icon from "../../componentes/Icon";
import { ROLES_DEFENSA_CIVIL } from "../../constantes/roles";
import { useWebSocketStatus } from "../../contexto/WebSocketContext";
import { useSimulacro, useSegundosRestantes, formatearCuentaRegresiva } from "../../ganchos/useSimulacro";
import { iniciarSimulacro, detenerSimulacro } from "../../utilidades/api";

const DURACIONES = [1, 2, 5, 10];
const MENSAJE_SUGERIDO =
  "Esto es un SIMULACRO. Ubica tu ruta de evacuación y dirígete al albergue más cercano.";

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

function Simulacro() {
  const simulacro = useSimulacro();
  const segundos = useSegundosRestantes(simulacro.activo ? simulacro.termina_en : null);
  const conexion = useWebSocketStatus();
  const [minutos, setMinutos] = useState(2);
  const [mensaje, setMensaje] = useState(MENSAJE_SUGERIDO);
  const [conPush, setConPush] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function ejecutar(accion) {
    setEnviando(true);
    setError(null);
    try {
      await accion();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <RequiereRol roles={ROLES_DEFENSA_CIVIL}>
      <AdminPageHeader titulo="Simulacro en Vivo" subtitulo="ENTRENAMIENTO DE LA POBLACIÓN" />

      <div className="px-4 sm:px-8 py-6 max-w-3xl space-y-6">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Al iniciar, todas las personas que tengan Piura Alerta abierta ven en el mismo segundo una alerta
          roja en pantalla completa, con sirena y vibración, marcada como <strong>SIMULACRO</strong>. No toca
          las lecturas de los sensores ni el historial de alertas reales, y termina sola al acabar el tiempo.
        </p>

        {error && <ErrorBanner message={error} />}

        {simulacro.activo ? (
          <section className="rounded-3xl p-6 text-white text-center simulacro-fondo" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.25em]">SIMULACRO EN CURSO</p>
            <p className="mt-3 text-6xl font-black font-mono">{formatearCuentaRegresiva(segundos)}</p>
            <p className="mt-3 text-sm text-white/85">{simulacro.mensaje}</p>
            <button
              type="button"
              disabled={enviando}
              onClick={() => ejecutar(detenerSimulacro)}
              className="mt-6 rounded-xl bg-white px-6 py-3 font-bold disabled:opacity-60"
              style={{ color: "var(--color-alerta)" }}
            >
              {enviando ? "Deteniendo..." : "Detener simulacro"}
            </button>
          </section>
        ) : (
          <section
            className="rounded-3xl border p-6 space-y-5"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <fieldset>
              <legend className="font-semibold text-sm mb-2">Duración</legend>
              <div className="flex flex-wrap gap-2">
                {DURACIONES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={minutos === d}
                    onClick={() => setMinutos(d)}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold"
                    style={
                      minutos === d
                        ? {
                            backgroundColor: "var(--color-primary)",
                            borderColor: "var(--color-primary)",
                            color: "white",
                          }
                        : inputStyle
                    }
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="font-semibold text-sm">Mensaje para la población</span>
              <textarea
                value={mensaje}
                maxLength={300}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                style={inputStyle}
              />
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={conPush}
                onChange={(e) => setConPush(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="font-semibold">También enviar notificación push</span>
                <span className="block" style={{ color: "var(--color-text-muted)" }}>
                  Llega aunque tengan la app cerrada, a quienes activaron las notificaciones.
                </span>
              </span>
            </label>

            <button
              type="button"
              disabled={enviando}
              onClick={() => ejecutar(() => iniciarSimulacro({ minutos, mensaje, conPush }))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--color-alerta)" }}
            >
              <Icon name="bi-megaphone" aria-hidden="true" />
              {enviando ? "Iniciando..." : "Iniciar simulacro"}
            </button>

            {conexion !== "open" && (
              <p className="text-xs" style={{ color: "var(--color-prealerta)" }}>
                Este navegador no está conectado en tiempo real ahora mismo; el simulacro igual llega a los
                demás si el servidor está en línea.
              </p>
            )}
          </section>
        )}
      </div>
    </RequiereRol>
  );
}

export default Simulacro;
