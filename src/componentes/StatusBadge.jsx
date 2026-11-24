import Icon from "./Icon";

// Estado del río como chip: fondo pastel + punto de color + ícono, para que
// no dependa solo del color.
const ESTADOS = {
  normal: {
    text: "Nivel normal",
    icono: "bi-check-circle-fill",
    color: "var(--color-normal)",
    bg: "var(--color-normal-soft)",
  },
  prealerta: {
    text: "Prealerta",
    icono: "bi-exclamation-triangle-fill",
    color: "var(--color-prealerta)",
    bg: "var(--color-prealerta-soft)",
  },
  alerta_roja: {
    text: "Alerta roja",
    icono: "bi-exclamation-octagon-fill",
    color: "var(--color-alerta)",
    bg: "var(--color-alerta-soft)",
  },
};

function StatusBadge({ status }) {
  const actual = ESTADOS[status] ?? {
    text: "Sin datos",
    icono: null,
    color: "var(--color-text-muted)",
    bg: "var(--color-surface-alt)",
  };
  const esAlertaRoja = status === "alerta_roja";

  return (
    <span
      className={`chip-estado ${esAlertaRoja ? "animate-pulse-alert" : ""}`}
      style={{ color: actual.color, backgroundColor: actual.bg }}
    >
      <span aria-hidden="true" className="punto" />
      {actual.icono && <Icon name={actual.icono} aria-hidden="true" className="text-[14px]" />}
      {actual.text}
    </span>
  );
}

export default StatusBadge;
