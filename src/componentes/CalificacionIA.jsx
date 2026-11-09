import Icon from "./Icon";

// Calificación de la IA de una publicación (ver backend moderacionIA.js):
// veredicto apto/revisar/no_apto, puntaje 0-100 y un comentario sobre la foto
// y otro sobre la descripción.
const VEREDICTO_IA = {
  apto: { texto: "Apta", color: "var(--color-normal)", fondo: "var(--color-normal-soft)" },
  revisar: { texto: "Revisar", color: "var(--color-prealerta)", fondo: "var(--color-prealerta-soft)" },
  no_apto: { texto: "No apta", color: "var(--color-alerta)", fondo: "var(--color-alerta-soft)" },
};

function Criterio({ icono, titulo, criterio }) {
  if (!criterio || (criterio.apta == null && !criterio.comentario)) return null;
  const estado =
    criterio.apta === true
      ? { icono: "bi-check-circle-fill", color: "var(--color-normal)", texto: "apta" }
      : criterio.apta === false
        ? { icono: "bi-x-lg", color: "var(--color-alerta)", texto: "no apta" }
        : { icono: "bi-exclamation-triangle-fill", color: "var(--color-prealerta)", texto: "sin analizar" };

  return (
    <li className="flex items-start gap-2">
      <Icon name={icono} aria-hidden="true" className="mt-0.5" style={{ color: "var(--color-text-muted)" }} />
      <span className="min-w-0">
        <span className="font-semibold">{titulo}</span>{" "}
        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: estado.color }}>
          <Icon name={estado.icono} aria-hidden="true" />
          {estado.texto}
        </span>
        {criterio.comentario && (
          <span className="block" style={{ color: "var(--color-text-muted)" }}>
            {criterio.comentario}
          </span>
        )}
      </span>
    </li>
  );
}

// Tarjeta completa: para el panel de moderación y para quien acaba de publicar.
export function CalificacionIADetalle({ veredicto, puntaje, motivo, detalle, className = "" }) {
  const v = VEREDICTO_IA[veredicto];
  if (!v) return null;

  return (
    <section
      aria-label="Calificación de la IA"
      className={`rounded-xl border p-3 text-sm ${className}`}
      style={{ borderColor: v.color, backgroundColor: v.fondo }}
    >
      <div className="flex items-center gap-3">
        <span className="font-bold flex items-center gap-1.5" style={{ color: v.color }}>
          <Icon name="bi-robot" aria-hidden="true" />
          IA: {v.texto}
        </span>
        {typeof puntaje === "number" && (
          <span className="flex-1 flex items-center gap-2">
            <span
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
              role="meter"
              aria-label="Puntaje de la IA"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={puntaje}
            >
              <span
                className="block h-full rounded-full"
                style={{ width: `${puntaje}%`, backgroundColor: v.color }}
              />
            </span>
            <span className="font-mono font-bold" style={{ color: v.color }}>
              {puntaje}/100
            </span>
          </span>
        )}
      </div>
      {motivo && <p className="mt-2 font-medium">{motivo}</p>}
      <ul className="mt-2 space-y-1.5 text-xs">
        <Criterio icono="bi-camera" titulo="Imagen:" criterio={detalle?.imagen} />
        <Criterio icono="bi-journal-text" titulo="Descripción:" criterio={detalle?.descripcion} />
      </ul>
    </section>
  );
}

// Sello corto para el feed público: solo se muestra cuando la IA la aprobó.
export function SelloVerificadoIA({ veredicto, puntaje }) {
  if (veredicto !== "apto") return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5"
      style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
      title={typeof puntaje === "number" ? `Puntaje de la IA: ${puntaje}/100` : undefined}
    >
      <Icon name="bi-check-circle-fill" aria-hidden="true" />
      Verificada por IA
    </span>
  );
}
