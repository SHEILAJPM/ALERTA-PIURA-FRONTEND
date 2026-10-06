import { useModalA11y } from "../ganchos/useModalA11y";

// Diálogo de confirmación accesible (Escape cierra, foco atrapado adentro,
// foco vuelve al botón que lo abrió) para acciones destructivas/irreversibles
// del panel admin — ej. difusión manual a Telegram en Despacho.jsx.
function ConfirmDialog({
  titulo,
  children,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  enviando = false,
  onConfirmar,
  onCancelar,
}) {
  const contenedorRef = useModalA11y(onCancelar);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCancelar}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-titulo"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border p-6 outline-none"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-dialog-titulo"
          className="text-base font-bold mb-2"
          style={{ color: "var(--color-alerta)" }}
        >
          {titulo}
        </h3>
        <div className="text-sm" style={{ color: "var(--color-text)" }}>
          {children}
        </div>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onConfirmar}
            disabled={enviando}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-alerta)" }}
          >
            {enviando ? "Enviando..." : textoConfirmar}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
            className="text-sm font-medium px-4 py-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            {textoCancelar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
