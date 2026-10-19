import { useState } from "react";
import { useAuth } from "../contexto/AuthContext";
import { useResource } from "../ganchos/useResource";
import { getMiUltimoChequeo, marcarEstoyASalvo } from "../utilidades/api";
import { formatearFechaHora } from "../utilidades/fecha";
import Icon from "./Icon";

// "Estoy a salvo": durante una emergencia, Defensa Civil ve quién marcó que
// está bien (ver admin/ChequeosSeguridad.jsx) y puede priorizar a quién
// buscar. Requiere cuenta, porque es la única forma de saber quién es quién.
function ChequeoSeguridad() {
  const { usuario, abrirModal } = useAuth();
  const { data, setData } = useResource(
    () => (usuario ? getMiUltimoChequeo() : Promise.resolve(null)),
    [usuario?.id]
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function marcar() {
    setEnviando(true);
    setError(null);
    try {
      const { creado_en } = await marcarEstoyASalvo();
      setData({ ultimoChequeo: creado_en });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const ultimo = data?.ultimoChequeo;

  return (
    <section
      className="mt-8 rounded-3xl border p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start gap-4">
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
        >
          <Icon name="bi-check-circle-fill" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold">¿Estás a salvo?</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {!usuario
              ? "Si hay una emergencia, avisa a Defensa Civil que estás bien para que prioricen a quien sí necesita ayuda."
              : ultimo
                ? `Tu último aviso fue el ${formatearFechaHora(ultimo)}. Márcalo de nuevo si la situación cambió.`
                : "Si hay una emergencia, márcalo para que Defensa Civil sepa que estás bien."}
          </p>
          {error && (
            <p className="text-sm mt-1" style={{ color: "var(--color-alerta)" }}>
              {error}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={usuario ? marcar : () => abrirModal("login")}
        disabled={enviando}
        className="shrink-0 text-sm font-semibold px-5 py-2.5 rounded-lg text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--color-normal)" }}
      >
        {!usuario ? "Inicia sesión para avisar" : enviando ? "Enviando..." : "Estoy a salvo"}
      </button>
    </section>
  );
}

export default ChequeoSeguridad;
