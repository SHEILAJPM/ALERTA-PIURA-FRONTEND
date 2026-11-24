import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, RotateCcw, X } from "lucide-react";
import { PREGUNTAS_QUIZ, mensajeResultado, ordenAleatorio } from "../datos/quiz";
import { registrarUso } from "../utilidades/api";
import BotonEscuchar from "../componentes/BotonEscuchar";
import { CheckAnimado } from "../componentes/Animados";

// Quiz "¿Estás preparado?" (ODS 4.7): una pregunta por pantalla, con la
// explicación de cada respuesta. Al terminar se cuenta, de forma anónima,
// como quiz completado.
function Quiz() {
  const [indice, setIndice] = useState(0);
  const [elegida, setElegida] = useState(null);
  const [aciertos, setAciertos] = useState(0);
  const [terminado, setTerminado] = useState(false);
  // Orden de las opciones de cada pregunta, nuevo en cada partida.
  const [ordenes, setOrdenes] = useState(() => PREGUNTAS_QUIZ.map((p) => ordenAleatorio(p.opciones.length)));
  const total = PREGUNTAS_QUIZ.length;
  const actual = PREGUNTAS_QUIZ[indice];
  const respondida = elegida !== null;

  function responder(i) {
    if (respondida) return;
    setElegida(i);
    if (i === actual.correcta) setAciertos((a) => a + 1);
  }

  function siguiente() {
    if (indice + 1 < total) {
      setIndice((n) => n + 1);
      setElegida(null);
    } else {
      setTerminado(true);
      registrarUso("quiz", "completado");
    }
  }

  function reiniciar() {
    setIndice(0);
    setElegida(null);
    setAciertos(0);
    setTerminado(false);
    setOrdenes(PREGUNTAS_QUIZ.map((p) => ordenAleatorio(p.opciones.length)));
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Aprende jugando
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">¿Estás preparado?</h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          {total} preguntas sobre qué hacer antes, durante y después de una inundación. Ideal para hacerlo en
          familia o en el colegio.
        </p>
      </section>

      {terminado ? (
        <section className="pa-hero pa-entra p-6 sm:p-8 flex flex-col items-start gap-4">
          <p className="text-sm font-semibold text-white/85">Tu resultado</p>
          <p className="font-mono-data text-[64px] leading-none font-extrabold">
            {aciertos}
            <span className="text-2xl text-white/70"> / {total}</span>
          </p>
          <p className="text-lg font-bold">{mensajeResultado(aciertos, total)}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Saqué ${aciertos} de ${total} en el quiz "¿Estás preparado?" de Piura Alerta. ¿Y tú?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-dorado pa-tocable inline-flex items-center min-h-[52px] px-6 rounded-full font-extrabold"
            >
              Retar por WhatsApp
            </a>
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-full font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff" }}
            >
              <RotateCcw size={16} aria-hidden="true" /> Volver a jugar
            </button>
          </div>
          <p className="text-sm text-white/80">
            Sigue preparándote:{" "}
            <Link to="/mochila" className="font-bold underline">
              tu mochila
            </Link>{" "}
            y{" "}
            <Link to="/plan" className="font-bold underline">
              tu plan familiar
            </Link>
            .
          </p>
        </section>
      ) : (
        <section
          className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-4"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
          aria-live="polite"
        >
          <div>
            <div className="flex justify-between text-xs font-bold mb-2">
              <span style={{ color: "var(--color-primary)" }}>
                Pregunta {indice + 1} de {total}
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {aciertos} {aciertos === 1 ? "acierto" : "aciertos"}
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--color-surface-alt)" }}>
              <div
                className="h-1.5 rounded-full transition-[width] duration-300"
                style={{
                  width: `${((indice + (respondida ? 1 : 0)) / total) * 100}%`,
                  background: "linear-gradient(90deg, var(--color-sol), var(--color-sol-claro))",
                }}
              />
            </div>
          </div>

          <h2 key={indice} className="pa-entra font-display text-xl leading-snug">
            {actual.pregunta}
          </h2>

          <div className="flex flex-col gap-2" role="group" aria-label="Opciones">
            {ordenes[indice].map((i) => {
              const o = actual.opciones[i];
              const esCorrecta = i === actual.correcta;
              const estilo = !respondida
                ? {
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-text)",
                    borderColor: "transparent",
                  }
                : esCorrecta
                  ? {
                      backgroundColor: "var(--color-normal-soft)",
                      color: "var(--color-normal)",
                      borderColor: "var(--color-normal)",
                    }
                  : i === elegida
                    ? {
                        backgroundColor: "var(--color-alerta-soft)",
                        color: "var(--color-alerta)",
                        borderColor: "var(--color-alerta)",
                      }
                    : {
                        backgroundColor: "var(--color-surface-alt)",
                        color: "var(--color-text-muted)",
                        borderColor: "transparent",
                      };
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => responder(i)}
                  disabled={respondida}
                  className="pa-tocable flex items-center gap-3 text-left min-h-[56px] px-4 rounded-2xl border-2 font-semibold text-[15px]"
                  style={estilo}
                >
                  <span className="flex-1">{o}</span>
                  {respondida && esCorrecta && <Check size={20} aria-label="Correcta" />}
                  {respondida && i === elegida && !esCorrecta && <X size={20} aria-label="Tu respuesta" />}
                </button>
              );
            })}
          </div>

          {respondida && (
            <div className="pa-entra flex flex-col gap-3">
              <div
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{
                  backgroundColor:
                    elegida === actual.correcta ? "var(--color-normal-soft)" : "var(--color-primary-soft)",
                }}
              >
                {elegida === actual.correcta && <CheckAnimado tamano={32} />}
                <p className="text-sm" style={{ color: "var(--color-text)" }}>
                  <strong>{elegida === actual.correcta ? "¡Correcto! " : "No es así. "}</strong>
                  {actual.explicacion}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={siguiente}
                  className="btn-dorado pa-tocable min-h-[52px] px-7 rounded-full font-extrabold"
                >
                  {indice + 1 < total ? "Siguiente" : "Ver mi resultado"}
                </button>
                <BotonEscuchar texto={actual.explicacion} />
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Quiz;
