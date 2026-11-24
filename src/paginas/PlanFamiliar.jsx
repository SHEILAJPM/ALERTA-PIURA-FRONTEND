import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, MapPin, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import {
  TAREAS,
  guardarPlan,
  leerPlan,
  planEstaCompleto,
  planVacio,
  textoPlan,
} from "../utilidades/planFamiliar";
import { registrarUso } from "../utilidades/api";
import BotonEscuchar from "../componentes/BotonEscuchar";

const estiloInput = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
};

function Campo({ id, etiqueta, ayuda, ...props }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm font-bold">
      {etiqueta}
      <input
        id={id}
        {...props}
        className="min-h-[48px] rounded-2xl border px-4 text-[15px] font-normal"
        style={estiloInput}
      />
      {ayuda && (
        <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
          {ayuda}
        </span>
      )}
    </label>
  );
}

function Seccion({ titulo, icono: Icono, children }) {
  return (
    <section
      className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h2 className="font-display text-lg flex items-center gap-2">
        <Icono size={20} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Editor({ inicial, onGuardado }) {
  const [plan, setPlan] = useState(inicial);
  const cambiar = (campo) => (e) => setPlan((p) => ({ ...p, [campo]: e.target.value }));
  const cambiarFila = (lista, i, campo, valor) =>
    setPlan((p) => ({ ...p, [lista]: p[lista].map((f, n) => (n === i ? { ...f, [campo]: valor } : f)) }));
  const quitarFila = (lista, i) => setPlan((p) => ({ ...p, [lista]: p[lista].filter((_, n) => n !== i) }));

  function guardar(e) {
    e.preventDefault();
    const { plan: guardado, eraNuevo } = guardarPlan(plan);
    // Indicador ODS 11.5 / 13.3: cuenta un plan por dispositivo, de forma anónima.
    if (eraNuevo) registrarUso("plan", "creado");
    onGuardado(guardado);
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <Seccion titulo="¿Dónde nos encontramos?" icono={MapPin}>
        <Campo
          id="plan-encuentro"
          etiqueta="Punto de encuentro"
          placeholder="Ej.: Parque de mi barrio, frente a la iglesia"
          value={plan.puntoEncuentro}
          onChange={cambiar("puntoEncuentro")}
          ayuda="Un lugar alto y conocido, cerca de casa, donde se juntan si se separan."
        />
        <Campo
          id="plan-alterno"
          etiqueta="Si no se puede llegar ahí"
          placeholder="Ej.: Casa de la abuela en Castilla"
          value={plan.puntoAlterno}
          onChange={cambiar("puntoAlterno")}
        />
        <Campo
          id="plan-albergue"
          etiqueta="Albergue más cercano"
          placeholder="Ej.: Colegio San José"
          value={plan.albergue}
          onChange={cambiar("albergue")}
          ayuda={
            <>
              ¿No sabes cuál es?{" "}
              <Link to="/mapa" className="font-bold underline" style={{ color: "var(--color-primary)" }}>
                Búscalo en el mapa
              </Link>
              .
            </>
          }
        />
      </Seccion>

      <Seccion titulo="¿A quién llamamos?" icono={Phone}>
        <p className="text-xs -mt-2" style={{ color: "var(--color-text-muted)" }}>
          Incluye a alguien que viva lejos: si se caen las líneas locales, a veces sí entra una llamada de
          fuera.
        </p>
        {plan.contactos.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <input
              aria-label={`Nombre del contacto ${i + 1}`}
              placeholder="Nombre"
              value={c.nombre}
              onChange={(e) => cambiarFila("contactos", i, "nombre", e.target.value)}
              className="min-h-[48px] min-w-0 rounded-2xl border px-4 text-[15px]"
              style={estiloInput}
            />
            <input
              aria-label={`Teléfono del contacto ${i + 1}`}
              placeholder="Teléfono"
              type="tel"
              value={c.telefono}
              onChange={(e) => cambiarFila("contactos", i, "telefono", e.target.value)}
              className="min-h-[48px] min-w-0 rounded-2xl border px-4 text-[15px]"
              style={estiloInput}
            />
            <button
              type="button"
              aria-label={`Quitar contacto ${i + 1}`}
              onClick={() => quitarFila("contactos", i)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
        {plan.contactos.length < 5 && (
          <button
            type="button"
            onClick={() =>
              setPlan((p) => ({ ...p, contactos: [...p.contactos, { nombre: "", telefono: "" }] }))
            }
            className="self-start inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full text-sm font-bold"
            style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
          >
            <Plus size={16} aria-hidden="true" /> Agregar contacto
          </button>
        )}
      </Seccion>

      <Seccion titulo="¿Quién hace qué?" icono={Users}>
        {plan.integrantes.map((p, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-end">
            <input
              aria-label={`Nombre del integrante ${i + 1}`}
              placeholder="Nombre (ej.: Papá)"
              value={p.nombre}
              onChange={(e) => cambiarFila("integrantes", i, "nombre", e.target.value)}
              className="min-h-[48px] min-w-0 rounded-2xl border px-4 text-[15px]"
              style={estiloInput}
            />
            <select
              aria-label={`Tarea del integrante ${i + 1}`}
              value={p.tarea}
              onChange={(e) => cambiarFila("integrantes", i, "tarea", e.target.value)}
              className="min-h-[48px] min-w-0 rounded-2xl border px-3 text-[15px]"
              style={estiloInput}
            >
              {TAREAS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              aria-label={`Quitar integrante ${i + 1}`}
              onClick={() => quitarFila("integrantes", i)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center justify-self-end"
              style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setPlan((p) => ({ ...p, integrantes: [...p.integrantes, { nombre: "", tarea: TAREAS[0] }] }))
          }
          className="self-start inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          <Plus size={16} aria-hidden="true" /> Agregar integrante
        </button>
        <label htmlFor="plan-necesidades" className="flex flex-col gap-1.5 text-sm font-bold">
          A tener en cuenta
          <textarea
            id="plan-necesidades"
            rows={2}
            placeholder="Ej.: la abuela usa silla de ruedas; papá toma pastillas para la presión"
            value={plan.necesidades}
            onChange={cambiar("necesidades")}
            className="rounded-2xl border px-4 py-3 text-[15px] font-normal"
            style={estiloInput}
          />
        </label>
      </Seccion>

      <button
        type="submit"
        disabled={!planEstaCompleto(plan)}
        className="btn-dorado pa-tocable self-start min-h-[52px] px-8 rounded-full font-extrabold disabled:opacity-50"
      >
        Guardar mi plan
      </button>
      {!planEstaCompleto(plan) && (
        <p className="text-xs -mt-2" style={{ color: "var(--color-text-muted)" }}>
          Para guardar, completa al menos el punto de encuentro y un teléfono.
        </p>
      )}
    </form>
  );
}

function Resumen({ plan, onEditar }) {
  const [copiado, setCopiado] = useState(false);
  const texto = textoPlan(plan);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // sin portapapeles: el plan sigue visible en pantalla
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="pa-hero pa-entra p-6 sm:p-7 flex flex-col gap-4">
        <p className="text-sm font-semibold text-white/85">Tu plan familiar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/70">Punto de encuentro</p>
            <p className="text-xl font-extrabold">{plan.puntoEncuentro}</p>
            {plan.puntoAlterno && (
              <p className="text-sm text-white/80 mt-1">Si no se puede: {plan.puntoAlterno}</p>
            )}
          </div>
          {plan.albergue && (
            <div>
              <p className="text-xs text-white/70">Albergue</p>
              <p className="text-xl font-extrabold">{plan.albergue}</p>
            </div>
          )}
        </div>
        {plan.contactos.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {plan.contactos.map((c, i) => (
              <li key={i}>
                <a
                  href={`tel:${c.telefono.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Phone size={15} aria-hidden="true" />
                  {c.nombre || "Contacto"} · {c.telefono}
                </a>
              </li>
            ))}
          </ul>
        )}
        {plan.integrantes.length > 0 && (
          <ul className="text-sm space-y-1">
            {plan.integrantes.map((p, i) => (
              <li key={i}>
                <strong>{p.nombre}:</strong> <span className="text-white/85">{p.tarea}</span>
              </li>
            ))}
          </ul>
        )}
        {plan.necesidades && <p className="text-sm text-white/85">A tener en cuenta: {plan.necesidades}</p>}
      </section>

      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-dorado pa-tocable inline-flex items-center gap-2 min-h-[52px] px-6 rounded-full font-extrabold"
        >
          Compartir por WhatsApp
        </a>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-full font-bold"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          <Copy size={16} aria-hidden="true" /> {copiado ? "Copiado" : "Copiar"}
        </button>
        <button
          type="button"
          onClick={onEditar}
          className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-full font-bold"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-title)" }}
        >
          <Pencil size={16} aria-hidden="true" /> Editar
        </button>
        <BotonEscuchar texto={texto.replace(/\*|\p{Extended_Pictographic}|\uFE0F/gu, "")} />
      </div>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Tu plan se guarda solo en este teléfono y funciona sin internet. Compártelo con tu familia y revísenlo
        juntos antes de la temporada de lluvias.
      </p>
    </div>
  );
}

function PlanFamiliar() {
  const [plan, setPlan] = useState(leerPlan);
  const [editando, setEditando] = useState(() => !leerPlan());

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Prepárate
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Plan familiar de emergencia</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          En una emergencia no hay tiempo para decidir. Pónganse de acuerdo ahora: dónde se encuentran, a
          quién llaman y qué hace cada uno.
        </p>
      </section>

      {editando || !plan ? (
        <Editor
          inicial={plan ?? planVacio()}
          onGuardado={(guardado) => {
            setPlan(guardado);
            setEditando(false);
          }}
        />
      ) : (
        <Resumen plan={plan} onEditar={() => setEditando(true)} />
      )}
    </main>
  );
}

export default PlanFamiliar;
