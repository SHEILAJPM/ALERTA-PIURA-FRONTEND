import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HandHeart, Phone, Sprout, Store } from "lucide-react";
import BotonEscuchar from "../componentes/BotonEscuchar";

// Ayuda tras el fenómeno: qué hacer en una crisis según lo que te toca
// proteger (tu familia, tu chacra, tu negocio) y a dónde acudir. Orientación
// general; los trámites y programas dependen de cada municipalidad y entidad.
const SECCIONES = [
  {
    id: "necesito-ayuda",
    icono: HandHeart,
    titulo: "Si tu familia necesita ayuda",
    lema: "Para familias que lo perdieron todo o viven en casas precarias o cerca del río.",
    pasos: [
      {
        momento: "Ahora",
        items: [
          "Si tu casa es precaria o está cerca del río, ve al albergue antes de que suba el agua: allí hay techo, agua y comida.",
          "Lleva tu DNI y el de tu familia, en una bolsa cerrada.",
        ],
      },
      {
        momento: "Después",
        items: [
          "Empadrónate como damnificado o afectado en tu municipalidad: ese registro es el que da acceso a la ayuda humanitaria (alimentos, abrigo, techo temporal) y a los apoyos del Estado.",
          "Pregunta en tu municipalidad por las ollas comunes y los comedores de tu zona.",
          "Si tu casa quedó dañada, no vuelvas a entrar hasta que la revise Defensa Civil.",
        ],
      },
    ],
    enlaces: [{ to: "/mapa", texto: "Ver albergues cercanos" }],
  },
  {
    id: "campo",
    icono: Sprout,
    titulo: "Si tienes chacra o animales",
    lema: "Agricultores, ganaderos y criadores de animales.",
    pasos: [
      {
        momento: "Antes de la lluvia",
        items: [
          "Limpia drenes, acequias y canales para que el agua corra.",
          "Ten pensado un lugar alto para tus animales y para guardar semillas, abono y herramientas.",
          "Anota qué cultivos tienes y cuántas hectáreas: te servirá para reportar daños.",
        ],
      },
      {
        momento: "Durante la crecida",
        items: [
          "Tu vida va primero: no cruces canales ni acequias crecidas, ni vuelvas por los animales.",
          "Si hay tiempo, lleva los animales a zona alta.",
        ],
      },
      {
        momento: "Después",
        items: [
          "Reporta tus pérdidas en la Agencia Agraria de tu provincia. Si eres pequeño productor, tus cultivos pueden estar cubiertos por el Seguro Agrícola Catastrófico: pregunta allí.",
          "No consumas ni vendas animales que murieron en la inundación.",
          "Si tus animales se enferman, consulta a SENASA o a un veterinario.",
        ],
      },
    ],
    enlaces: [{ to: "/agricultura", texto: "Ver todas las recomendaciones" }],
  },
  {
    id: "negocio",
    icono: Store,
    titulo: "Si tienes un negocio",
    lema: "Bodegas, puestos, talleres y cualquier negocio que da de comer a tu familia.",
    pasos: [
      {
        momento: "Antes de la lluvia",
        items: [
          "Toma fotos de tu local y tu mercadería: te sirven para reclamar un seguro o registrar daños.",
          "Guarda boletas, facturas y documentos del negocio en bolsas cerradas.",
          "Revisa si tienes seguro contra inundaciones.",
        ],
      },
      {
        momento: "Durante la crecida",
        items: [
          "Sube la mercadería y los equipos a lo alto.",
          "Si entra agua al local, corta la luz desde la llave general.",
        ],
      },
      {
        momento: "Después",
        items: [
          "Registra los daños con fotos antes de limpiar o botar nada.",
          "Si tienes seguro, reporta el daño cuanto antes.",
          "Si tienes un préstamo, conversa con tu banco o caja: en emergencias suelen ofrecer reprogramar las cuotas.",
        ],
      },
    ],
    enlaces: [{ to: "/seguro", texto: "Ver el seguro contra inundaciones" }],
  },
];

function Seccion({ s, i }) {
  const Icono = s.icono;
  const texto = `${s.titulo}. ${s.pasos.map((p) => `${p.momento}: ${p.items.join(" ")}`).join(" ")}`;
  return (
    <section
      id={s.id}
      aria-labelledby={`${s.id}-titulo`}
      className="pa-entra scroll-mt-24 rounded-3xl border p-5 sm:p-6 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", "--i": i }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          <Icono size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id={`${s.id}-titulo`} className="font-display text-xl">
            {s.titulo}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {s.lema}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {s.pasos.map((p) => (
          <div
            key={p.momento}
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            <p
              className="text-[11px] font-extrabold uppercase tracking-[0.12em] mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              {p.momento}
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-sm" style={{ color: "var(--color-text)" }}>
              {p.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {s.enlaces.map((e) => (
          <Link
            key={e.to}
            to={e.to}
            className="btn-dorado pa-tocable inline-flex items-center min-h-[48px] px-5 rounded-full font-extrabold"
          >
            {e.texto}
          </Link>
        ))}
        <BotonEscuchar texto={texto} />
      </div>
    </section>
  );
}

function Ayuda() {
  const { hash } = useLocation();

  // Llega desde "¿Qué hago ahora?" con #campo, #negocio o #necesito-ayuda:
  // baja hasta esa sección (el Layout ya subió al inicio al cambiar de página).
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 80);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Qué hacer en una crisis
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Ayuda tras el fenómeno</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Qué hacer para proteger a tu familia, tu chacra y tu negocio, y a dónde acudir para recibir apoyo.
        </p>
        <nav className="flex flex-wrap gap-2 mt-4" aria-label="Secciones">
          {SECCIONES.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center min-h-[40px] px-4 rounded-full text-sm font-bold"
              style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
            >
              {s.titulo.replace(/^Si /, "").replace(/^\w/, (c) => c.toUpperCase())}
            </a>
          ))}
        </nav>
      </section>

      {SECCIONES.map((s, i) => (
        <Seccion key={s.id} s={s} i={i} />
      ))}

      <section
        className="rounded-3xl p-5 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: "var(--color-alerta-soft)" }}
      >
        <Phone size={20} aria-hidden="true" style={{ color: "var(--color-alerta)" }} />
        <p className="text-sm flex-1 min-w-[200px]" style={{ color: "var(--color-text)" }}>
          En una emergencia llama a <strong>Defensa Civil (115)</strong> o a los{" "}
          <strong>Bomberos (116)</strong>. Para síntomas o enfermedades, mira la sección{" "}
          <Link to="/salud" className="font-bold underline" style={{ color: "var(--color-primary)" }}>
            Salud
          </Link>
          .
        </p>
      </section>

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Orientación general. Los trámites, programas y requisitos dependen de cada municipalidad y entidad.
      </p>
    </main>
  );
}

export default Ayuda;
