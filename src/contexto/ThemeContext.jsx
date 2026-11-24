import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const CLAVE_TEMA = "piura-alerta-tema";

// La app SIEMPRE abre en claro, sin importar el sistema operativo: el oscuro
// es solo una opción manual de Ajustes y se respeta si la persona la eligió.
// La clase "dark" en <html> activa las variables de modo oscuro de index.css
// (y la variante dark: de Tailwind, ver @custom-variant en index.css).
function temaInicial() {
  try {
    if (localStorage.getItem(CLAVE_TEMA) === "dark") return "dark";
  } catch {
    // localStorage bloqueado: claro, como siempre
  }
  return "light";
}

function aplicarTema(tema) {
  document.documentElement.classList.toggle("dark", tema === "dark");
  document.documentElement.style.colorScheme = tema;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial);

  useEffect(() => {
    aplicarTema(theme);
    try {
      localStorage.setItem(CLAVE_TEMA, theme);
    } catch {
      // no se pudo recordar la elección: igual se aplica en esta visita
    }
  }, [theme]);

  // Con View Transitions, el tema nuevo se revela en un círculo que crece
  // desde donde se tocó (evento opcional). Sin soporte o con "reducir
  // movimiento", cambia de inmediato como siempre.
  function toggleTheme(evento) {
    const nuevo = theme === "dark" ? "light" : "dark";
    const raiz = document.documentElement;
    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reducir) {
      setTheme(nuevo);
      return;
    }
    const x = evento?.clientX || window.innerWidth / 2;
    const y = evento?.clientY || window.innerHeight / 2;
    const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    raiz.style.setProperty("--vt-x", `${x}px`);
    raiz.style.setProperty("--vt-y", `${y}px`);
    raiz.style.setProperty("--vt-r", `${radio}px`);
    raiz.classList.add("pa-cambio-tema");
    const transicion = document.startViewTransition(() => {
      // La clase se aplica acá mismo (no en el efecto) para que la captura
      // "después" de la transición ya tenga el tema nuevo.
      aplicarTema(nuevo);
      setTheme(nuevo);
    });
    transicion.finished.finally(() => raiz.classList.remove("pa-cambio-tema"));
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
