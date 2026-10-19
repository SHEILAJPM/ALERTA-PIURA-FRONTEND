import { useEffect, useRef } from "react";

const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Comportamiento accesible común a todos los diálogos (AuthModal,
// ConfirmDialog, números de emergencia...): devuelve un ref para el
// contenedor del diálogo y se encarga de
// - mover el foco adentro al abrir,
// - mantener el Tab dentro del diálogo (no "escapar" al contenido de atrás),
// - cerrar con Escape,
// - bloquear el scroll de la página de fondo,
// - devolver el foco al elemento que lo abrió al cerrar.
export function useModalA11y(onCerrar) {
  const contenedorRef = useRef(null);
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    const previo = document.activeElement;
    const contenedor = contenedorRef.current;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const primero = contenedor?.querySelector(SELECTOR_ENFOCABLES);
    (primero ?? contenedor)?.focus();

    function manejarTecla(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrarRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !contenedor) return;

      const enfocables = [...contenedor.querySelectorAll(SELECTOR_ENFOCABLES)];
      if (enfocables.length === 0) {
        e.preventDefault();
        return;
      }
      const inicio = enfocables[0];
      const fin = enfocables[enfocables.length - 1];
      if (e.shiftKey && (document.activeElement === inicio || document.activeElement === contenedor)) {
        e.preventDefault();
        fin.focus();
      } else if (!e.shiftKey && document.activeElement === fin) {
        e.preventDefault();
        inicio.focus();
      }
    }

    document.addEventListener("keydown", manejarTecla);
    return () => {
      document.removeEventListener("keydown", manejarTecla);
      document.body.style.overflow = overflowPrevio;
      if (previo instanceof HTMLElement) previo.focus();
    };
  }, []);

  return contenedorRef;
}
