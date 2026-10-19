import { useEffect, useRef, useState } from "react";
import { preguntarAsistente, enviarFeedbackAsistente } from "../utilidades/api";
import Icon from "./Icon";

// El backend acepta hasta 6 intercambios previos como contexto (ver
// preguntaAsistenteSchema): suficiente para preguntas de seguimiento
// ("¿y el más cercano?") sin mandar toda la conversación cada vez.
const MAX_HISTORIAL = 6;

const SUGERENCIAS = [
  "¿Cómo está el río ahora?",
  "¿Cuál es el albergue con más espacio?",
  "¿Qué llevo en una mochila de emergencia?",
];

function Mensaje({ intercambio, onFeedback }) {
  return (
    <div className="space-y-2">
      <p
        className="ml-8 rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {intercambio.pregunta}
      </p>
      {intercambio.respuesta ? (
        <div className="mr-8">
          <p
            className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-line"
            style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }}
          >
            {intercambio.respuesta}
          </p>
          {intercambio.feedback == null ? (
            <div
              className="flex items-center gap-2 mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              ¿Te sirvió?
              <button
                type="button"
                onClick={() => onFeedback(true)}
                className="font-semibold hover:underline"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => onFeedback(false)}
                className="font-semibold hover:underline"
              >
                No
              </button>
            </div>
          ) : (
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              Gracias por tu respuesta.
            </p>
          )}
        </div>
      ) : intercambio.error ? (
        <p className="mr-8 text-sm" style={{ color: "var(--color-alerta)" }}>
          {intercambio.error}
        </p>
      ) : (
        <p className="mr-8 text-sm animate-pulse" style={{ color: "var(--color-text-muted)" }}>
          Escribiendo...
        </p>
      )}
    </div>
  );
}

// Asistente virtual del sitio (Groq en el backend, ver servicios/asistente.js):
// responde con el estado real de sensores y albergues. Va encima del botón de
// emergencia, que siempre tiene que quedar a mano.
function AsistenteFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [conversacion, setConversacion] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversacion, abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarConEscape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierto]);

  async function preguntar(texto) {
    const limpia = texto.trim();
    if (!limpia || enviando) return;
    const historial = conversacion
      .filter((i) => i.respuesta)
      .slice(-MAX_HISTORIAL)
      .map(({ pregunta: p, respuesta }) => ({ pregunta: p, respuesta }));
    const indice = conversacion.length;

    setConversacion((prev) => [...prev, { pregunta: limpia }]);
    setPregunta("");
    setEnviando(true);
    try {
      const { respuesta } = await preguntarAsistente(limpia, historial);
      setConversacion((prev) => prev.map((i, n) => (n === indice ? { ...i, respuesta } : i)));
    } catch (err) {
      setConversacion((prev) =>
        prev.map((i, n) => (n === indice ? { ...i, error: err.message ?? "No se pudo responder." } : i))
      );
    } finally {
      setEnviando(false);
    }
  }

  function calificar(indice, util) {
    const intercambio = conversacion[indice];
    setConversacion((prev) => prev.map((i, n) => (n === indice ? { ...i, feedback: util } : i)));
    enviarFeedbackAsistente({ pregunta: intercambio.pregunta, respuesta: intercambio.respuesta, util }).catch(
      () => {}
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar asistente virtual" : "Abrir asistente virtual"}
        aria-expanded={abierto}
        className={`fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl text-white ${
          abierto ? "" : "animate-pulse-asistente"
        }`}
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Icon name={abierto ? "bi-x-lg" : "bi-robot"} aria-hidden="true" />
      </button>

      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente virtual"
          className="fixed z-40 bottom-44 right-4 left-4 sm:left-auto sm:w-96 max-h-[60vh] flex flex-col rounded-2xl border shadow-xl overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <header
            className="px-4 py-3 flex items-center gap-2 text-white"
            style={{ backgroundColor: "var(--color-brand-chrome)" }}
          >
            <Icon name="bi-robot" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm leading-tight">Asistente Piura Alerta</p>
              <p className="text-xs text-white/70">Responde con los datos en vivo del sistema</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
            {conversacion.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Pregúntame por el nivel del río, los albergues o qué hacer ante una inundación.
                </p>
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => preguntar(s)}
                    className="block w-full text-left text-sm rounded-xl border px-3 py-2 transition hover:opacity-80"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              conversacion.map((intercambio, i) => (
                <Mensaje key={i} intercambio={intercambio} onFeedback={(util) => calificar(i, util)} />
              ))
            )}
            <div ref={finRef} />
          </div>

          <p className="px-4 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            En una emergencia real llama al 105 o al 115; no esperes la respuesta del asistente.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              preguntar(pregunta);
            }}
            className="p-3 flex gap-2"
          >
            <input
              type="text"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              maxLength={500}
              placeholder="Escribe tu pregunta..."
              aria-label="Tu pregunta"
              className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
            <button
              type="submit"
              disabled={enviando || !pregunta.trim()}
              aria-label="Enviar pregunta"
              className="shrink-0 w-10 rounded-lg text-white flex items-center justify-center disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Icon name="bi-send" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default AsistenteFlotante;
