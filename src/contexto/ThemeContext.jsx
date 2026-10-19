import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const CLAVE_TEMA = "piura-alerta-tema";

// Sin preferencia guardada, sigue al sistema operativo. La clase "dark" en
// <html> activa las variables de modo oscuro de index.css (y la variante
// dark: de Tailwind, ver @custom-variant en index.css).
function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (guardado === "light" || guardado === "dark") return guardado;
  } catch {
    // localStorage bloqueado: se usa la preferencia del sistema
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(CLAVE_TEMA, theme);
    } catch {
      // no se pudo recordar la elección: igual se aplica en esta visita
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((actual) => (actual === "dark" ? "light" : "dark"));
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
