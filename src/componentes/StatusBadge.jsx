const ESTADOS = {
  normal: { text: "Nivel normal", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
  prealerta: { text: "Prealerta", color: "var(--color-prealerta)", bg: "var(--color-prealerta-soft)" },
  alerta_roja: { text: "Alerta roja", color: "var(--color-alerta)", bg: "var(--color-alerta-soft)" },
};

function StatusBadge({ status }) {
  const actual = ESTADOS[status] ?? {
    text: "Sin datos",
    color: "var(--color-text-muted)",
    bg: "var(--color-surface-alt)",
  };
  const esAlertaRoja = status === "alerta_roja";

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
        esAlertaRoja ? "animate-pulse-alert" : ""
      }`}
      style={{ color: actual.color, backgroundColor: actual.bg }}
    >
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: actual.color }} />
      {actual.text}
    </span>
  );
}

export default StatusBadge;
