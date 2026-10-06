import Icon from "./Icon";

const CONTENIDO = {
  normal: {
    icono: "bi-check-circle-fill",
    color: "var(--color-normal)",
    bg: "var(--color-normal-soft)",
    titulo: "No existen alertas activas",
    detalle: "El sistema no ha detectado condiciones que representen peligro para la población.",
  },
  prealerta: {
    icono: "bi-exclamation-triangle-fill",
    color: "var(--color-prealerta)",
    bg: "var(--color-prealerta-soft)",
    titulo: "Prealerta: nivel del río en ascenso",
    detalle: "Mantente atento a las próximas actualizaciones y evita acercarte al cauce del río.",
  },
  alerta_roja: {
    icono: "bi-exclamation-octagon-fill",
    color: "var(--color-alerta)",
    bg: "var(--color-alerta-soft)",
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
      className="rounded-2xl border-l-4 shadow-sm p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: actual.color }}
    >
      <div className="flex gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: actual.bg, color: actual.color }}
        >
          <Icon name={actual.icono} aria-hidden="true" />
        </div>

        <div>
          <h3 className="font-bold">{actual.titulo}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {actual.detalle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AlertCard;
