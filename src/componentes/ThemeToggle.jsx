import { useTheme } from "../contexto/ThemeContext";
import Icon from "./Icon";

// tono="oscuro" (por defecto): sobre el azul institucional del panel admin,
// ícono blanco en ambos temas. tono="claro": sobre el vidrio claro de la
// navegación pública.
function ThemeToggle({ tono = "oscuro" }) {
  const { theme, toggleTheme } = useTheme();
  const oscuro = theme === "dark";
  const clases =
    tono === "claro"
      ? "w-11 h-11 rounded-full flex items-center justify-center text-lg transition hover:bg-[var(--color-primary-soft)]"
      : "w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={clases}
      style={tono === "claro" ? { color: "var(--color-title)" } : undefined}
    >
      <Icon name={oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"} aria-hidden="true" />
    </button>
  );
}

// Fila de ajustes estilo iOS con interruptor: es el lugar "oficial" del modo
// oscuro (la app siempre arranca en claro).
export function InterruptorModoOscuro() {
  const { theme, toggleTheme } = useTheme();
  const oscuro = theme === "dark";

  return (
    <div className="flex items-center gap-3 min-h-[52px] px-4">
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
      >
        <Icon name="bi-moon-stars-fill" aria-hidden="true" />
      </span>
      <span id="etiqueta-modo-oscuro" className="flex-1 text-[15px] font-semibold">
        Modo oscuro
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={oscuro}
        aria-labelledby="etiqueta-modo-oscuro"
        onClick={toggleTheme}
        className="pa-switch"
      />
    </div>
  );
}

export default ThemeToggle;
