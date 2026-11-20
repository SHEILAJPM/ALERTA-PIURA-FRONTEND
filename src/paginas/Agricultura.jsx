import { useState } from "react";
import { Link } from "react-router-dom";
import { Beef, Building2, CloudRain, Sprout, Sun, Waves, Wheat } from "lucide-react";
import BotonEscuchar from "../componentes/BotonEscuchar";

// Recomendaciones para agricultores y criadores de animales de Piura frente
// a lluvias y desbordes. Orientación general y práctica: no indica productos
// ni dosis (para eso, la Agencia Agraria o un técnico).
const MOMENTOS = [
  {
    id: "antes",
    icono: Sun,
    titulo: "Antes de las lluvias",
    detalle: "De diciembre a febrero, o cuando se anuncia un Niño Costero.",
    consejos: [
      "Limpia drenes, acequias y canales de tu parcela, y coordina con tu comisión de regantes la limpieza de los drenes principales.",
      "Arma bordos o camellones en las partes bajas por donde suele entrar el agua.",
      "Ten pensado un lugar alto y seguro para tus animales, tus herramientas y tu motobomba.",
      "Guarda semillas, abono y forraje en un lugar alto, seco y tapado.",
      "Anota qué cultivas, cuántas hectáreas y cuándo sembraste: te sirve para reportar daños y pedir el seguro.",
      "Si puedes, cosecha lo que ya está listo antes de la temporada de lluvias.",
    ],
  },
  {
    id: "prealerta",
    icono: CloudRain,
    titulo: "Cuando hay prealerta o lluvia fuerte",
    detalle: "Cuando la app avisa prealerta o se anuncia lluvia intensa.",
    consejos: [
      "Lleva los animales a zona alta antes de que suba el agua: después es más peligroso.",
      "Sube la motobomba, las herramientas y los sacos de abono o semilla.",
      "Abre los drenes para que el agua de lluvia salga de la chacra.",
      "No apliques fertilizante ni pesticida: la lluvia lo lava y se pierde.",
      "Avisa a tus vecinos y mantente atento a los avisos de esta app.",
    ],
  },
  {
    id: "desborde",
    icono: Waves,
    titulo: "Durante el desborde",
    detalle: "Cuando el agua ya entró o el río está en alerta roja.",
    consejos: [
      "Tu vida va primero: sal hacia zona alta o al albergue. No vuelvas por los animales ni por la cosecha.",
      "No cruces canales, acequias ni drenes crecidos: la corriente arrastra aunque parezca baja.",
      "Aléjate de postes y cables caídos.",
    ],
  },
  {
    id: "despues",
    icono: Sprout,
    titulo: "Después del desborde",
    detalle: "Cuando el agua baja y es seguro volver.",
    consejos: [
      "Registra los daños con fotos antes de limpiar: cultivo, hectáreas afectadas, canales y animales.",
      "Reporta tus pérdidas en la Agencia Agraria de tu provincia: si eres pequeño productor, puedes estar cubierto por el Seguro Agrícola Catastrófico.",
      "Saca el agua estancada de la chacra lo antes posible: las raíces se asfixian con el agua parada.",
      "Vigila hongos y plagas, que aumentan con la humedad. Consulta a un técnico antes de aplicar cualquier producto.",
      "No comas ni vendas animales que murieron en la inundación; entiérralos lejos de pozos y canales.",
      "Pide en tu Junta de Usuarios la limpieza de los drenes y canales colmatados antes de volver a sembrar.",
    ],
  },
];

const CULTIVOS = [
  {
    id: "arroz",
    icono: Wheat,
    nombre: "Arroz",
    consejos: [
      "El arroz aguanta agua, pero no el barro ni la corriente: revisa los bordos y las compuertas después de cada lluvia fuerte.",
      "Si el agua trajo mucha arena o barro, consulta a la Agencia Agraria antes de resembrar.",
      "Seca bien el grano cosechado antes de guardarlo para que no se malogre con la humedad.",
    ],
  },
  {
    id: "frutales",
    icono: Sprout,
    nombre: "Mango y limón",
    consejos: [
      "Los frutales sufren cuando el agua se queda parada en sus raíces: abre zanjas para drenar entre las filas.",
      "Con lluvia y humedad aparecen más hongos en hojas y frutos: vigila manchas oscuras y consulta a un técnico.",
      "Después del desborde, quita ramas rotas y retira la fruta caída para que no se pudra junto al árbol.",
    ],
  },
  {
    id: "platano",
    icono: Sprout,
    nombre: "Plátano",
    consejos: [
      "El plátano no tolera el agua parada: mantén limpios los drenes de la parcela.",
      "Apuntala las plantas con racimo para que el viento y el suelo blando no las tumben.",
      "Retira las plantas muertas o podridas para que no contagien al resto.",
    ],
  },
  {
    id: "campana",
    icono: Wheat,
    nombre: "Algodón y maíz",
    consejos: [
      "Si la lluvia viene antes de la cosecha, adelántala en lo posible.",
      "Si se perdió la siembra, pregunta en la Agencia Agraria por semilla y por el momento adecuado para volver a sembrar.",
      "Guarda la cosecha en un lugar alto, seco y ventilado.",
    ],
  },
  {
    id: "animales",
    icono: Beef,
    nombre: "Animales",
    consejos: [
      "Ganado, cabras y aves: llévalos a zona alta antes de que suba el agua y guarda forraje para varios días.",
      "Dales agua limpia: el agua de la inundación los enferma.",
      "Después de la inundación vacúnalos y desparasítalos; pregunta por las campañas de SENASA.",
      "Si se enferman o mueren varios, avisa a SENASA o a un veterinario.",
    ],
  },
];

const DONDE_ACUDIR = [
  {
    nombre: "Agencia Agraria de tu provincia",
    detalle: "Reporte de pérdidas, semilla y asistencia técnica.",
  },
  {
    nombre: "Seguro Agrícola Catastrófico",
    detalle: "Para pequeños productores: pregunta en la Agencia Agraria si estás cubierto.",
  },
  { nombre: "SENASA", detalle: "Sanidad de tus animales y de tus cultivos." },
  { nombre: "Junta de Usuarios de riego", detalle: "Limpieza y reparación de canales, drenes y bocatomas." },
  { nombre: "Tu municipalidad", detalle: "Empadronamiento de damnificados y ayuda humanitaria." },
];

function Bloque({ titulo, children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border p-5 sm:p-6 flex flex-col gap-4 ${className}`}
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {titulo}
      {children}
    </section>
  );
}

function Agricultura() {
  const [cultivo, setCultivo] = useState("arroz");
  const elegido = CULTIVOS.find((c) => c.id === cultivo);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Agricultura y ganadería
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Recomendaciones para agricultores</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Qué hacer con tu chacra y tus animales antes, durante y después de las lluvias y los desbordes del
          río Piura.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOMENTOS.map((m, i) => {
          const Icono = m.icono;
          return (
            <section
              key={m.id}
              id={m.id}
              className="pa-entra rounded-3xl border p-5 flex flex-col gap-3 scroll-mt-24"
              style={{
                backgroundColor: m.id === "desborde" ? "var(--color-alerta-soft)" : "var(--color-surface)",
                borderColor: m.id === "desborde" ? "transparent" : "var(--color-border)",
                "--i": i,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={
                    m.id === "desborde"
                      ? { backgroundColor: "var(--color-surface)", color: "var(--color-alerta)" }
                      : { backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }
                  }
                >
                  <Icono size={22} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    className="font-display text-lg"
                    style={m.id === "desborde" ? { color: "var(--color-alerta)" } : undefined}
                  >
                    {m.titulo}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {m.detalle}
                  </p>
                </div>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: "var(--color-text)" }}>
                {m.consejos.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <BotonEscuchar texto={`${m.titulo}. ${m.consejos.join(" ")}`} className="self-start" />
            </section>
          );
        })}
      </div>

      <Bloque titulo={<h2 className="font-display text-xl">Según lo que siembras o crías</h2>}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cultivo o crianza">
          {CULTIVOS.map((c) => {
            const Icono = c.icono;
            const activo = c.id === cultivo;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={activo}
                onClick={() => setCultivo(c.id)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold"
                style={
                  activo
                    ? { backgroundColor: "var(--color-activo)", color: "#ffffff" }
                    : { backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }
                }
              >
                <Icono size={16} aria-hidden="true" />
                {c.nombre}
              </button>
            );
          })}
        </div>
        <div
          key={elegido.id}
          className="pa-entra rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: "var(--color-surface-alt)" }}
        >
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: "var(--color-text)" }}>
            {elegido.consejos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <BotonEscuchar texto={`${elegido.nombre}. ${elegido.consejos.join(" ")}`} className="self-start" />
        </div>
      </Bloque>

      <Bloque
        titulo={
          <h2 className="font-display text-xl flex items-center gap-2">
            <Building2 size={22} aria-hidden="true" style={{ color: "var(--color-primary)" }} />A dónde acudir
          </h2>
        }
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DONDE_ACUDIR.map((d) => (
            <li
              key={d.nombre}
              className="rounded-2xl p-4"
              style={{ backgroundColor: "var(--color-surface-alt)" }}
            >
              <p className="font-bold text-sm" style={{ color: "var(--color-title)" }}>
                {d.nombre}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {d.detalle}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          ¿Tu familia necesita ayuda o tienes síntomas después de la inundación? Mira{" "}
          <Link
            to="/ayuda#necesito-ayuda"
            className="font-bold underline"
            style={{ color: "var(--color-primary)" }}
          >
            Ayuda tras el fenómeno
          </Link>{" "}
          y{" "}
          <Link to="/salud" className="font-bold underline" style={{ color: "var(--color-primary)" }}>
            Salud
          </Link>
          .
        </p>
      </Bloque>

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Recomendaciones generales. Antes de aplicar fertilizantes, pesticidas o tratamientos, consulta a la
        Agencia Agraria o a un técnico.
      </p>
    </main>
  );
}

export default Agricultura;
