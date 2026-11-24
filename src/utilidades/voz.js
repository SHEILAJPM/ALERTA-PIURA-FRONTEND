import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { esAppNativa } from "./plataforma";

// Lectura en voz alta de avisos (accesibilidad: personas que no leen bien o
// ven poco). Web: Web Speech API del navegador. App Android: el WebView no
// trae speechSynthesis, así que se usa el motor de voz nativo del teléfono
// (plugin @capacitor-community/text-to-speech).

const IDIOMA = "es-PE";

export function vozDisponible() {
  if (esAppNativa) return true;
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// Prefiere una voz de Perú; si no hay, cualquier voz en español.
function elegirVozWeb() {
  const voces = window.speechSynthesis.getVoices();
  return (
    voces.find((v) => v.lang?.toLowerCase() === "es-pe") ??
    voces.find((v) => v.lang?.toLowerCase().startsWith("es-")) ??
    voces.find((v) => v.lang?.toLowerCase().startsWith("es")) ??
    null
  );
}

// Lee el texto y resuelve al terminar (o al detenerse). Rechaza si no se pudo.
export async function leerEnVozAlta(texto) {
  if (esAppNativa) {
    await TextToSpeech.speak({ text: texto, lang: IDIOMA, rate: 0.95, pitch: 1, volume: 1 });
    return;
  }
  await new Promise((resolve, reject) => {
    const sintetizador = window.speechSynthesis;
    sintetizador.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = IDIOMA;
    frase.rate = 0.95;
    const voz = elegirVozWeb();
    if (voz) frase.voice = voz;
    frase.onend = () => resolve();
    // "interrupted"/"canceled" = la persona tocó detener: no es un error.
    frase.onerror = (e) => (["interrupted", "canceled"].includes(e.error) ? resolve() : reject(e));
    sintetizador.speak(frase);
  });
}

export async function detenerVoz() {
  if (esAppNativa) {
    await TextToSpeech.stop().catch(() => {});
    return;
  }
  window.speechSynthesis?.cancel();
}
