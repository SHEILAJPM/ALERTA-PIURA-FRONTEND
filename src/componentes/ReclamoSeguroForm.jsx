import { useState } from "react";
import { subirFoto } from "../utilidades/cloudinary";
import Icon from "./Icon";

const MAX_FOTOS = 6;

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

function hoyISO() {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  return hoy.toISOString().slice(0, 10);
}

// Reportar un daño cubierto por la póliza: fecha, descripción y de 1 a 6
// fotos (ver crearReclamoSeguroSchema en el backend). Las fotos se suben a
// Cloudinary apenas se eligen, igual que en ReportForm.
function ReclamoSeguroForm({ onEnviar }) {
  const [abierto, setAbierto] = useState(false);
  const [fechaDano, setFechaDano] = useState(hoyISO);
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState([]); // [{ id, previsualizacion, url, subiendo }]
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  async function agregarFotos(e) {
    const archivos = [...(e.target.files ?? [])].slice(0, MAX_FOTOS - fotos.length);
    e.target.value = "";
    setError(null);

    for (const archivo of archivos) {
      const id = crypto.randomUUID();
      setFotos((prev) => [
        ...prev,
        { id, previsualizacion: URL.createObjectURL(archivo), url: null, subiendo: true },
      ]);
      try {
        const url = await subirFoto(archivo);
        setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, url, subiendo: false } : f)));
      } catch (err) {
        setFotos((prev) => prev.filter((f) => f.id !== id));
        setError(err.message);
      }
    }
  }

  function quitarFoto(id) {
    setFotos((prev) => prev.filter((f) => f.id !== id));
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    if (fotos.some((f) => f.subiendo)) {
      setError("Espera a que terminen de subir las fotos.");
      return;
    }
    const fotoUrls = fotos.map((f) => f.url).filter(Boolean);
    if (fotoUrls.length === 0) {
      setError("Adjunta al menos una foto del daño.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await onEnviar({ fecha_dano: fechaDano, descripcion: descripcion.trim(), foto_urls: fotoUrls });
      setDescripcion("");
      setFotos([]);
      setFechaDano(hoyISO());
      setAbierto(false);
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <div className="space-y-2">
        {enviado && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--color-normal)" }}>
            <Icon name="bi-check-circle-fill" aria-hidden="true" /> Recibimos tu reclamo. Te avisaremos cuando
            un administrador lo revise.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setAbierto(true);
            setEnviado(false);
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <Icon name="bi-plus-lg" aria-hidden="true" />
          Reportar un daño
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="rounded-2xl border p-5 space-y-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <label className="block text-sm">
        <span className="font-medium">¿Cuándo pasó?</span>
        <input
          type="date"
          value={fechaDano}
          max={hoyISO()}
          onChange={(e) => setFechaDano(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium">¿Qué se dañó?</span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          placeholder="Ej. El agua entró a la casa y malogró la refrigeradora y la cama."
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      <div>
        <p className="text-sm font-medium">
          Fotos del daño{" "}
          <span style={{ color: "var(--color-text-muted)" }}>
            ({fotos.length}/{MAX_FOTOS})
          </span>
        </p>
        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative">
                <img
                  src={foto.previsualizacion}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {foto.subiendo ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg text-white text-xs">
                    Subiendo...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => quitarFoto(foto.id)}
                    aria-label="Quitar foto"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                  >
                    <Icon name="bi-x-lg" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {fotos.length < MAX_FOTOS && (
          <label
            className="mt-2 text-sm font-semibold cursor-pointer inline-flex items-center gap-1.5"
            style={{ color: "var(--color-primary)" }}
          >
            <Icon name="bi-camera" aria-hidden="true" /> Agregar fotos
            <input type="file" accept="image/*" multiple onChange={agregarFotos} className="hidden" />
          </label>
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {enviando ? "Enviando..." : "Enviar reclamo"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          disabled={enviando}
          className="text-sm font-medium px-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default ReclamoSeguroForm;
