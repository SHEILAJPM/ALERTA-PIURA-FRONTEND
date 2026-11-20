import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { buscarDireccion } from "../utilidades/api";

const ESPERA_MS = 350; // se busca cuando la persona deja de escribir
const MIN_LETRAS = 3;

// Escribir la dirección en vez de tocar el mapa o usar el GPS, con
// sugerencias mientras se escribe. Busca solo en Piura, Castilla y
// Veintiséis de Octubre (backend /api/geocodificar, que usa OpenStreetMap).
function BuscadorDireccion({ onElegir }) {
  const [texto, setTexto] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const elegidoRef = useRef(null); // texto de la última sugerencia elegida
  const pedidoRef = useRef(0); // descarta respuestas que llegan tarde

  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < MIN_LETRAS || consulta === elegidoRef.current) {
      setSugerencias([]);
      setBuscando(false);
      return undefined;
    }
    const pedido = ++pedidoRef.current;
    setBuscando(true);
    const temporizador = setTimeout(async () => {
      try {
        const encontradas = await buscarDireccion(consulta);
        if (pedido !== pedidoRef.current) return;
        setSugerencias(encontradas);
        setActiva(-1);
        setAbierto(true);
        setError(
          encontradas.length === 0
            ? "No encontramos esa dirección en Piura. Prueba con la calle y el barrio, o toca el mapa."
            : null
        );
      } catch (err) {
        if (pedido !== pedidoRef.current) return;
        setSugerencias([]);
        setError(
          err.status === 0
            ? "Sin conexión: no se puede buscar ahora. Toca el mapa donde vives."
            : "No se pudo buscar la dirección. Toca el mapa donde vives."
        );
      } finally {
        if (pedido === pedidoRef.current) setBuscando(false);
      }
    }, ESPERA_MS);
    return () => clearTimeout(temporizador);
  }, [texto]);

  function elegir(s) {
    elegidoRef.current = s.nombre;
    setTexto(s.nombre);
    setSugerencias([]);
    setAbierto(false);
    setError(null);
    onElegir({ lat: s.lat, lon: s.lon });
  }

  function alTeclear(e) {
    if (!abierto || sugerencias.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => (i <= 0 ? sugerencias.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  // Enter o el botón de buscar: la sugerencia marcada, o la primera.
  function alEnviar(e) {
    e.preventDefault();
    if (sugerencias.length > 0) elegir(sugerencias[Math.max(activa, 0)]);
    else if (texto.trim().length < MIN_LETRAS) setError("Escribe al menos 3 letras de la dirección.");
  }

  const mostrarLista = abierto && sugerencias.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={alEnviar} className="relative flex gap-2" role="search">
        <label htmlFor="buscar-direccion" className="sr-only">
          Escribe tu dirección
        </label>
        <div className="relative flex-1 min-w-0">
          <input
            id="buscar-direccion"
            type="text"
            role="combobox"
            aria-expanded={mostrarLista}
            aria-controls="sugerencias-direccion"
            aria-autocomplete="list"
            aria-activedescendant={activa >= 0 ? `sugerencia-${activa}` : undefined}
            value={texto}
            onChange={(e) => {
              elegidoRef.current = null;
              setTexto(e.target.value);
            }}
            onKeyDown={alTeclear}
            onFocus={() => sugerencias.length > 0 && setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            placeholder="Escribe tu dirección o barrio"
            autoComplete="off"
            className="w-full rounded-2xl border pl-4 pr-10 min-h-[48px] text-[15px]"
            style={{
              backgroundColor: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          {buscando && (
            <LoaderCircle
              size={18}
              aria-label="Buscando"
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
              style={{ color: "var(--color-text-muted)" }}
            />
          )}
        </div>
        <button
          type="submit"
          aria-label="Buscar dirección"
          className="sr-presionable shrink-0 inline-flex items-center justify-center rounded-2xl min-h-[48px] min-w-[48px] px-3 text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Search size={18} aria-hidden="true" />
        </button>

        {mostrarLista && (
          <ul
            id="sugerencias-direccion"
            role="listbox"
            aria-label="Direcciones sugeridas"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1000] rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 16px 40px rgba(13,46,87,0.18)",
            }}
          >
            {sugerencias.map((s, i) => (
              <li
                key={`${s.lat},${s.lon}`}
                id={`sugerencia-${i}`}
                role="option"
                aria-selected={i === activa}
                // onMouseDown y no onClick: se elige antes de que el campo
                // pierda el foco y cierre la lista.
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(s);
                }}
                className="flex items-start gap-2 px-4 py-3 text-sm min-h-[48px] cursor-pointer border-b last:border-b-0"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: i === activa ? "var(--color-primary-soft)" : "transparent",
                  color: "var(--color-text)",
                }}
              >
                <MapPin
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--color-primary)" }}
                />
                {s.nombre}
              </li>
            ))}
          </ul>
        )}
      </form>

      {error && (
        <p className="text-xs" role="status" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default BuscadorDireccion;
