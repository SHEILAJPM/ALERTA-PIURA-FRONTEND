import { useState } from "react";
import Icon from "../Icon";

// Formulario plegable de "alta" del panel (albergues, nodos ESP32...). Maneja
// abrir/cerrar, estado de los campos, validación, envío y errores; cada
// página solo dibuja sus campos con el render prop:
//
//   <FormularioCreacion camposIniciales={...} validar={...} onCrear={...}>
//     {({ valores, actualizar }) => <input value={valores.x} onChange={actualizar("x")} />}
//   </FormularioCreacion>
//
// validar(valores) devuelve { datos } (ya convertidos, listos para la API) o
// { error } con un mensaje para mostrar.
function FormularioCreacion({
  camposIniciales,
  validar,
  onCrear,
  textoBoton,
  textoGuardar = "Guardar",
  textoGuardando = "Guardando...",
  children,
}) {
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState(camposIniciales);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  function actualizar(campo) {
    return (e) => setValores((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  function cerrar() {
    setAbierto(false);
    setValores(camposIniciales);
    setError(null);
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    const { datos, error: errorValidacion } = validar(valores);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await onCrear(datos);
      cerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Icon name="bi-plus-lg" aria-hidden="true" />
        {textoBoton}
      </button>
    );
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="mb-6 rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="grid gap-3 sm:grid-cols-2">{children({ valores, actualizar })}</div>

      {error && (
        <p className="text-sm mt-3" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={enviando}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {enviando ? textoGuardando : textoGuardar}
        </button>
        <button
          type="button"
          onClick={cerrar}
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

export default FormularioCreacion;
