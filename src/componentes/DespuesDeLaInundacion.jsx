import { Link } from "react-router-dom";
import { Bug, Droplets, GlassWater, Stethoscope } from "lucide-react";
import BotonEscuchar from "./BotonEscuchar";
import { useHistorialAlertas } from "../ganchos/useHistorialAlertas";
import { rioRecienNormalizado } from "../utilidades/postInundacion";

const CONSEJOS = [
  {
    icono: Bug,
    texto: "Vacía el agua acumulada en llantas, latas, botellas y macetas: ahí nace el zancudo del dengue.",
  },
  { icono: Droplets, texto: "Tapa bien los tanques, baldes y bidones donde guardas agua." },
  {
    icono: GlassWater,
    texto: "Toma agua hervida o clorada: 2 gotas de lejía por cada litro, y espera 30 minutos.",
  },
  {
    icono: Stethoscope,
    texto: "Si tienes fiebre o dolor de cabeza o de cuerpo, ve al centro de salud. No te automediques.",
  },
];

// Salud después de la inundación (ODS 3.3): tras las lluvias, el agua
// estancada dispara los casos de dengue en Piura. Se muestra solo en las
// semanas siguientes a que el río vuelve a la normalidad.
function DespuesDeLaInundacion() {
  const { data: eventos } = useHistorialAlertas(5);
  if (!rioRecienNormalizado(eventos)) return null;

  const textoVoz = `El río volvió a la normalidad. Ahora cuida tu salud. ${CONSEJOS.map((c) => c.texto).join(" ")}`;

  return (
    <section
      aria-labelledby="despues-inundacion"
      className="vidrio pa-entra rounded-3xl p-5 sm:p-6 flex flex-col gap-4"
    >
      <div>
        <span
          className="chip-estado"
          style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
        >
          <span className="punto" aria-hidden="true" />
          El río volvió a la normalidad
        </span>
        <h2 id="despues-inundacion" className="text-[24px] leading-tight mt-2">
          Ahora cuida tu salud
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Después de las lluvias, el agua estancada hace que aumenten los casos de dengue.
        </p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CONSEJOS.map(({ icono: Icono, texto }) => (
          <li
            key={texto}
            className="flex items-start gap-3 rounded-2xl p-3.5"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--color-normal-soft)", color: "var(--color-normal)" }}
            >
              <Icono size={18} aria-hidden="true" />
            </span>
            <span className="text-sm pt-1" style={{ color: "var(--color-text)" }}>
              {texto}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/reportes"
          className="btn-dorado pa-tocable inline-flex items-center justify-center min-h-[48px] px-6 rounded-full font-extrabold"
        >
          Reportar agua estancada
        </Link>
        <Link
          to="/salud"
          className="pa-tocable inline-flex items-center justify-center min-h-[48px] px-5 rounded-full font-bold"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          Postas cercanas y cuidados
        </Link>
        <BotonEscuchar texto={textoVoz} />
      </div>
    </section>
  );
}

export default DespuesDeLaInundacion;
