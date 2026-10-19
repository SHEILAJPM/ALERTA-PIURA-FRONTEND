import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getAlertasSOS } from "../utilidades/api";

// SOS pendientes para la consola de despacho. Llegan en vivo por WebSocket
// (solo a sockets autenticados como administrador/defensa civil, ver
// transmitirRestringido en el backend) y desaparecen apenas alguien las
// marca atendidas, desde esta u otra consola.
export function useAlertasSOS() {
  const recurso = useResource(() => getAlertasSOS(), []);
  const { setData } = recurso;

  useWebSocketEvent("alerta_sos", (alerta) => {
    setData((prev) => (prev?.some((a) => a.id === alerta.id) ? prev : [alerta, ...(prev ?? [])]));
    avisarConSonido();
  });

  useWebSocketEvent("alerta_sos_actualizada", (alerta) => {
    setData((prev) =>
      alerta.estado === "pendiente"
        ? prev?.map((a) => (a.id === alerta.id ? { ...a, ...alerta } : a))
        : prev?.filter((a) => a.id !== alerta.id)
    );
  });

  return recurso;
}

// Un pitido corto: un SOS no puede depender de que el despachador esté
// mirando la pantalla justo en ese momento. Web Audio en vez de un .mp3 para
// no depender de un archivo extra; si el navegador lo bloquea, no pasa nada.
function avisarConSonido() {
  try {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscilador = ctx.createOscillator();
    const volumen = ctx.createGain();
    oscilador.type = "square";
    oscilador.frequency.value = 880;
    volumen.gain.setValueAtTime(0.15, ctx.currentTime);
    volumen.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscilador.connect(volumen).connect(ctx.destination);
    oscilador.start();
    oscilador.stop(ctx.currentTime + 0.6);
    oscilador.onended = () => ctx.close();
  } catch {
    // sin audio disponible: la alerta igual queda visible en pantalla
  }
}
