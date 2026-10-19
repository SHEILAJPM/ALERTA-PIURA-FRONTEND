import { useTheme } from "../contexto/ThemeContext";
import Icon from "./Icon";

// Va siempre sobre el azul institucional (header y menú lateral del panel),
// por eso el ícono es blanco en ambos temas.
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const oscuro = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
    >
      <Icon name={oscuro ? "bi-sun-fill" : "bi-moon-stars-fill"} aria-hidden="true" />
    </button>
  );
}

export default ThemeToggle;
