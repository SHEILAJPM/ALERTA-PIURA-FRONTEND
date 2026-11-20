import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { buscarDireccion } from "../utilidades/api";

// Escribir la dirección en vez de tocar el mapa o usar el GPS. Busca solo
// dentro de Piura, Castilla y Veintiséis de Octubre (backend /api/geocodificar).
function BuscadorDireccion({ onElegir }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState(null);
  const [estado, setEstado] = useState("inicial"); // inicial | buscando
  const [error, setError] = useState(null);

  async function buscar(e) {
    e.preventDefault();
    const consulta = texto.trim();
    if (consulta.length < 3) {
      setError("Escribe al menos 3 letras de la dirección.");
      return;
    }
    setEstado("buscando");
    setError(null);
    setResultados(null);
    try {
      const encontrados = await buscarDireccion(consulta);
      setResultados(encontrados);
      if (encontrados.length === 0) {
        setError("No encontramos esa dirección en Piura. Prueba con la calle y el barrio, o toca el mapa.");
      }
    } catch (err) {
      setError(
        err.status === 0
          ? "Sin conexión: no se puede buscar ahora. Toca el mapa donde vives."
          : "No se pudo buscar la dirección. Toca el mapa donde vives."
      );
    } finally {
      setEstado("inicial");
    }
  }

  function elegir(r) {
    onElegir({ lat: r.lat, lon: r.lon });
    setResultados(null);
    setTexto(r.nombre);
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={buscar} className="flex gap-2" role="search">
        <label htmlFor="buscar-direccion" className="sr-only">
          Escribe tu dirección
        </label>
        <input
          id="buscar-direccion"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu dirección o barrio"
          autoComplete="street-address"
          className="flex-1 min-w-0 rounded-2xl border px-4 min-h-[48px] text-[15px]"
          style={{
            backgroundColor: "var(--color-surface-alt)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        <button
          type="submit"
          disabled={estado === "buscando"}
          aria-label="Buscar dirección"
          className="sr-presionable shrink-0 inline-flex items-center justify-center gap-1.5 rounded-2xl min-h-[48px] px-4 text-sm font-extrabold text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Search size={18} aria-hidden="true" />
          <span className="hidden sm:inline">{estado === "buscando" ? "Buscando…" : "Buscar"}</span>
        </button>
      </form>

      {resultados?.length > 0 && (
        <ul
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--color-border)" }}
          aria-label="Direcciones encontradas"
        >
          {resultados.map((r) => (
            <li
              key={`${r.lat},${r.lon}`}
              className="border-b last:border-b-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <button
                type="button"
                onClick={() => elegir(r)}
                className="w-full flex items-start gap-2 text-left px-4 py-3 text-sm min-h-[48px]"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <MapPin
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--color-primary)" }}
                />
                {r.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-xs" role="status" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default BuscadorDireccion;
