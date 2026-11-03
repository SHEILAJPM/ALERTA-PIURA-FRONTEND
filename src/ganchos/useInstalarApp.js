import { useEffect, useState } from "react";

// Chrome/Edge/Samsung Internet disparan `beforeinstallprompt` una sola vez,
// apenas carga la página. Se escucha al importar el módulo (no al montar el
// componente) porque si la persona entra a /app desde otra página, el evento
// ya pasó y el botón "Instalar" nunca aparecería.
let avisoGuardado = null;
const suscriptores = new Set();

function notificar() {
  for (const fn of suscriptores) fn(avisoGuardado);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Sin esto el navegador muestra su propio banner cuando quiere; así lo
    // controla el botón de la página.
    e.preventDefault();
    avisoGuardado = e;
    notificar();
  });
  window.addEventListener("appinstalled", () => {
    avisoGuardado = null;
    notificar();
  });
}

function yaInstalada() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari en iPhone no soporta display-mode: usa esta propiedad propia.
    window.navigator.standalone === true
  );
}

// iPhone/iPad no tienen `beforeinstallprompt`: solo se instala a mano desde
// Safari (Compartir > Agregar a inicio), así que la página muestra esos pasos.
function esIOS() {
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function useInstalarApp() {
  const [aviso, setAviso] = useState(avisoGuardado);
  const [instalada, setInstalada] = useState(yaInstalada);

  useEffect(() => {
    const alCambiar = (nuevo) => {
      setAviso(nuevo);
      if (!nuevo) setInstalada(yaInstalada());
    };
    suscriptores.add(alCambiar);
    return () => suscriptores.delete(alCambiar);
  }, []);

  async function instalar() {
    if (!aviso) return false;
    aviso.prompt();
    const { outcome } = await aviso.userChoice;
    // El evento sirve una sola vez: si la persona cancela, el navegador
    // vuelve a dispararlo más adelante por su cuenta.
    avisoGuardado = null;
    setAviso(null);
    if (outcome === "accepted") setInstalada(true);
    return outcome === "accepted";
  }

  return { puedeInstalar: Boolean(aviso), instalada, esIOS: esIOS(), instalar };
}
