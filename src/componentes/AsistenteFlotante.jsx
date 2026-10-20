import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { preguntarAsistente, enviarFeedbackAsistente } from "../utilidades/api";
import Icon from "./Icon";
import AvatarAsistente from "./AvatarAsistente";
import LimiteErrores from "./LimiteErrores";

// Three.js + react-three-fiber pesan bastante para lo que es un botón
// flotante: lazy para que ese peso no entre al paquete principal. Mientras
// carga (y si por lo que sea el navegador no soporta WebGL), se ve la nube
// plana de AvatarAsistente en su lugar -- nunca queda vacío.
const MascotaAsistente3D = lazy(() => import("./MascotaAsistente3D"));

const SALUDO_INICIAL =
  "¡Hola! Soy el asistente de Piura Alerta. Pregúntame cómo reportar una situación, dónde hay albergues, " +
  "o qué hacer si el río sube.";

// Panel flotante, no modal (no bloquea la página, se puede seguir viendo el
// resto del sitio) -- igual de espíritu que InvitacionSesion.jsx, pero
// interactivo: manda cada pregunta al backend (con el historial de la
// conversación) y muestra la respuesta de la IA.
function AsistenteFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [turnos, setTurnos] = useState([]); // [{ pregunta, respuesta }]
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  // { [índice del turno]: true | false | "enviando" } -- separado de `turnos`
  // porque el feedback es sobre una respuesta ya mostrada, no cambia su texto.
  const [feedback, setFeedback] = useState({});
  const finRef = useRef(null);

  async function votar(indice, util) {
    if (feedback[indice] === true || feedback[indice] === "enviando") return;
    setFeedback((prev) => ({ ...prev, [indice]: "enviando" }));
    const turno = turnos[indice];
    try {
      await enviarFeedbackAsistente({ pregunta: turno.pregunta, respuesta: turno.respuesta, util });
      setFeedback((prev) => ({ ...prev, [indice]: true }));
    } catch {
      // Falla silenciosa a propósito: es feedback opcional, no vale la pena
      // interrumpir la conversación con un error si no se pudo guardar.
      setFeedback((prev) => ({ ...prev, [indice]: false }));
    }
  }

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turnos, enviando]);

  useEffect(() => {
    if (!abierto) return;
    function manejarTeclado(e) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", manejarTeclado);
    return () => document.removeEventListener("keydown", manejarTeclado);
  }, [abierto]);

  async function manejarSubmit(e) {
    e.preventDefault();
    const texto = pregunta.trim();
    if (!texto || enviando) return;

    setPregunta("");
    setError(null);
    setEnviando(true);
    try {
      // Los últimos 6 turnos alcanzan para que la IA mantenga el hilo sin
      // mandar toda la conversación (ver preguntaAsistenteSchema en el backend).
      const { respuesta } = await preguntarAsistente({ pregunta: texto, historial: turnos.slice(-6) });
      setTurnos((prev) => [...prev, { pregunta: texto, respuesta }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente virtual"}
        aria-expanded={abierto}
        className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl animate-pulse-asistente"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {abierto ? (
          <Icon name="bi-x-lg" aria-hidden="true" style={{ color: "var(--color-primary)" }} />
        ) : (
          <LimiteErrores fallback={<AvatarAsistente size={40} />}>
            <Suspense fallback={<AvatarAsistente size={40} />}>
              <MascotaAsistente3D size={44} />
            </Suspense>
          </LimiteErrores>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Asistente virtual de Piura Alerta"
          className="fixed z-40 top-20 left-3 right-3 bottom-20 sm:top-auto sm:left-5 sm:right-auto sm:bottom-22 sm:w-96 sm:h-[70vh] sm:max-h-125 rounded-2xl border shadow-lg flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2 shrink-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <AvatarAsistente size={32} className="shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-sm">Asistente Piura Alerta</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Responde con IA, puede equivocarse
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <BurbujaAsistente texto={SALUDO_INICIAL} />
            {turnos.map((turno, i) => (
              <div key={i} className="space-y-1">
                <BurbujaUsuario texto={turno.pregunta} />
                <BurbujaAsistente texto={turno.respuesta} />
                <FeedbackRespuesta estado={feedback[i]} onVotar={(util) => votar(i, util)} />
              </div>
            ))}
            {enviando && <BurbujaAsistente texto="Escribiendo..." atenuado />}
            {error && (
              <p className="text-xs" style={{ color: "var(--color-alerta)" }}>
                {error}
              </p>
            )}
            <div ref={finRef} />
          </div>

          <form
            onSubmit={manejarSubmit}
            className="p-3 border-t flex gap-2 shrink-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <input
              type="text"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Escribe tu pregunta..."
              maxLength={500}
              disabled={enviando}
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
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Icon name="bi-send" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function BurbujaUsuario({ texto }) {
  return (
    <p
      className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white w-fit"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {texto}
    </p>
  );
}

function FeedbackRespuesta({ estado, onVotar }) {
  if (estado === true) {
    return (
      <p className="text-xs pl-1" style={{ color: "var(--color-text-muted)" }}>
        Gracias por tu opinión.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 pl-1">
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        ¿Te sirvió esta respuesta?
      </span>
      <button
        type="button"
        onClick={() => onVotar(true)}
        disabled={estado === "enviando"}
        className="text-xs font-semibold disabled:opacity-50"
        style={{ color: "var(--color-normal)" }}
      >
        Sí
      </button>
      <button
        type="button"
        onClick={() => onVotar(false)}
        disabled={estado === "enviando"}
        className="text-xs font-semibold disabled:opacity-50"
        style={{ color: "var(--color-alerta)" }}
      >
        No
      </button>
      {estado === false && (
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          (no se pudo guardar)
        </span>
      )}
    </div>
  );
}

function BurbujaAsistente({ texto, atenuado = false }) {
  return (
    <p
      className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm w-fit"
      style={{
        backgroundColor: "var(--color-surface-alt)",
        color: atenuado ? "var(--color-text-muted)" : "var(--color-text)",
      }}
    >
      {texto}
    </p>
  );
}

export default AsistenteFlotante;
