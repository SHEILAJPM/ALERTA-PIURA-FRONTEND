import { useCallback, useEffect, useRef, useState } from "react";

// Dictado por voz con la Web Speech API del navegador (Chrome, Edge, Safari y
// Chrome de Android; Firefox no la tiene). En una emergencia, con las manos
// ocupadas o mojadas, es más fácil hablar que escribir. Cada frase reconocida
// se entrega a `alTerminarFrase`; el texto parcial (mientras habla) va en
// `parcial` para mostrarlo en vivo.
function obtenerReconocedor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const MENSAJES_ERROR = {
  "not-allowed": "Permite el uso del micrófono para dictar.",
  "service-not-allowed": "Permite el uso del micrófono para dictar.",
  "no-speech": "No se escuchó nada. Intenta de nuevo.",
  "audio-capture": "No se encontró un micrófono.",
  network: "El dictado necesita internet.",
};

export function useDictado(alTerminarFrase) {
  const Reconocedor = obtenerReconocedor();
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState("");
  const [error, setError] = useState(null);
  const reconocedorRef = useRef(null);
  const callbackRef = useRef(alTerminarFrase);

  useEffect(() => {
    callbackRef.current = alTerminarFrase;
  }, [alTerminarFrase]);

  useEffect(() => () => reconocedorRef.current?.abort(), []);

  const iniciar = useCallback(() => {
    if (!Reconocedor || reconocedorRef.current) return;
    const rec = new Reconocedor();
    rec.lang = "es-PE";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (evento) => {
      let enCurso = "";
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const resultado = evento.results[i];
        const texto = resultado[0].transcript.trim();
        if (resultado.isFinal) {
          if (texto) callbackRef.current?.(texto);
        } else {
          enCurso += texto;
        }
      }
      setParcial(enCurso);
    };
    rec.onerror = (evento) => {
      if (evento.error !== "aborted") setError(MENSAJES_ERROR[evento.error] ?? "No se pudo usar el dictado.");
    };
    rec.onend = () => {
      reconocedorRef.current = null;
      setEscuchando(false);
      setParcial("");
    };

    reconocedorRef.current = rec;
    setError(null);
    setEscuchando(true);
    rec.start();
  }, [Reconocedor]);

  const detener = useCallback(() => reconocedorRef.current?.stop(), []);

  return { soportado: Boolean(Reconocedor), escuchando, parcial, error, iniciar, detener };
}
