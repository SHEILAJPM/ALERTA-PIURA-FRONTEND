import Icon from "./Icon";

const CONTENIDO = {
  normal: {
    icono: "bi-check-circle-fill",
    color: "var(--color-normal)",
    bg: "var(--color-normal-soft)",
    chip: "Sin alertas",
    titulo: "No existen alertas activas",
    detalle: "El sistema no ha detectado condiciones que representen peligro para la población.",
  },
  prealerta: {
    icono: "bi-exclamation-triangle-fill",
    color: "var(--color-prealerta)",
    bg: "var(--color-prealerta-soft)",
    chip: "Advertencia",
    titulo: "Prealerta: nivel del río en ascenso",
    detalle: "Mantente atento a las próximas actualizaciones y evita acercarte al cauce del río.",
  },
  alerta_roja: {
    icono: "bi-exclamation-octagon-fill",
    color: "var(--color-alerta)",
    bg: "var(--color-alerta-soft)",
    chip: "Crítica",
    titulo: "Alerta roja: riesgo de desborde",
    detalle:
      "Dirígete a una zona segura o al albergue más cercano. Sigue las indicaciones de las autoridades.",
  },
};

function AlertCard({ estado = "normal" }) {
  const actual = CONTENIDO[estado] ?? CONTENIDO.normal;

  return (
    <div
      id="alertas"
      className="pa-entra rounded-3xl border p-5 sm:p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] shrink-0"
          style={{ backgroundColor: actual.bg, color: actual.color }}
        >
          <Icon name={actual.icono} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <span className="chip-estado" style={{ backgroundColor: actual.bg, color: actual.color }}>
            <span className="punto" aria-hidden="true" />
            {actual.chip}
          </span>
          <h3 className="font-bold text-[17px] mt-2" style={{ color: "var(--color-title)" }}>
            {actual.titulo}
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {actual.detalle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AlertCard;
