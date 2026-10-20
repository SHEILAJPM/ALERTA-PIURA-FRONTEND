// Pitidos cortos con Web Audio, sin depender de un archivo de sonido. Se usan
// para avisos que no pueden depender de que alguien esté mirando la pantalla
// (SOS en la consola de despacho, el río entrando en alerta). Si el navegador
// los bloquea (sin interacción previa con la página), no pasa nada: el aviso
// igual queda visible.
export function avisarConSonido({ veces = 1, frecuencia = 880 } = {}) {
  try {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const DURACION = 0.35;
    const PAUSA = 0.2;
    for (let i = 0; i < veces; i++) {
      const inicio = ctx.currentTime + i * (DURACION + PAUSA);
      const oscilador = ctx.createOscillator();
      const volumen = ctx.createGain();
      oscilador.type = "square";
      oscilador.frequency.value = frecuencia;
      volumen.gain.setValueAtTime(0.15, inicio);
      volumen.gain.exponentialRampToValueAtTime(0.001, inicio + DURACION);
      oscilador.connect(volumen).connect(ctx.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + DURACION);
      if (i === veces - 1) oscilador.onended = () => ctx.close();
    }
  } catch {
    // sin audio disponible
  }
}
