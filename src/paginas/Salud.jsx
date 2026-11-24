import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Footprints,
  Hospital,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Siren,
  Stethoscope,
} from "lucide-react";
import { useAyudaCercana } from "../ganchos/useAyudaCercana";
import { leerUbicacionGuardada, guardarUbicacion } from "../ganchos/useRiesgo";
import { establecimientosCercanos, formatearDistancia, urlRutaAPie } from "../utilidades/geo";
import BotonEscuchar from "../componentes/BotonEscuchar";
import { enviarAvisoSalud } from "../utilidades/api";
import { SINTOMAS, evaluarSintomas } from "../utilidades/sintomas";

const NOMBRE_SINTOMA = Object.fromEntries(SINTOMAS.map((x) => [x.id, x.texto]));
import { OPCIONES_AVISO } from "../datos/salud";
import Skeleton from "../componentes/Skeleton";

// Salud después de una inundación (ODS 3): no solo dengue. Cada enfermedad
// explica cómo se previene, qué síntomas vigilar y qué hacer, y la página
// deriva a la posta o centro de salud más cercano. Información general, no
// reemplaza la atención médica.
const ENFERMEDADES = [
  {
    id: "dengue",
    titulo: "Dengue",
    origen:
      "Lo transmite el zancudo Aedes aegypti, que se cría en agua estancada: baldes, llantas, floreros y tanques sin tapa.",
    prevenir: [
      "Cada semana vacía, escobilla y tapa los recipientes donde guardas agua.",
      "Usa repelente y mosquitero, sobre todo durante el día.",
      "Deja que el personal de salud revise y fumigue tu casa.",
    ],
    sintomas:
      "Fiebre alta, dolor detrás de los ojos, de cabeza, de músculos y articulaciones, manchas en la piel.",
    accion:
      "Ve a la posta. No tomes aspirina ni ibuprofeno porque pueden causar sangrado; para la fiebre, solo lo que te indiquen.",
  },
  {
    id: "leptospirosis",
    titulo: "Leptospirosis",
    origen:
      "Se contagia por contacto con el agua o el barro de la inundación contaminados con orina de ratas, sobre todo si tienes heridas o caminas descalzo.",
    prevenir: [
      "No camines ni dejes jugar a los niños descalzos en el agua o el barro; usa botas.",
      "Lava con agua y jabón y cubre cualquier herida.",
      "Guarda los alimentos en recipientes cerrados, lejos de las ratas.",
    ],
    sintomas:
      "Fiebre, dolor fuerte de músculos (sobre todo en las pantorrillas), dolor de cabeza y ojos rojos.",
    accion: "Ve a la posta y cuenta que estuviste en contacto con agua de la inundación.",
  },
  {
    id: "diarrea",
    titulo: "Diarreas e infecciones del estómago",
    origen: "Por tomar agua o comer alimentos contaminados con el agua de la inundación.",
    prevenir: [
      "Toma solo agua hervida o clorada: 2 gotas de lejía por cada litro, y espera 30 minutos.",
      "Lávate las manos con agua y jabón antes de comer y después de ir al baño.",
      "Bota los alimentos que tocaron el agua de la inundación.",
    ],
    sintomas: "Diarrea, vómitos, dolor de barriga y fiebre.",
    accion:
      "Toma suero oral para no deshidratarte y ve a la posta. Lleva rápido a los niños pequeños y a los adultos mayores.",
  },
  {
    id: "piel",
    titulo: "Infecciones de la piel y hongos",
    origen: "Por pasar mucho tiempo con la piel o la ropa mojada, y por heridas que tocaron agua sucia.",
    prevenir: [
      "Seca bien los pies y entre los dedos, y cámbiate la ropa mojada.",
      "Lava y cubre las heridas, aunque sean pequeñas.",
    ],
    sintomas: "Picazón, ronchas, piel roja o caliente, heridas con pus.",
    accion: "Ve a la posta si una herida se pone roja, hinchada o caliente.",
  },
  {
    id: "respiratorias",
    titulo: "Infecciones respiratorias",
    origen: "La humedad, el frío y los albergues llenos facilitan los resfríos y la neumonía.",
    prevenir: [
      "Abriga y mantén secos a los niños y a los adultos mayores.",
      "Cúbrete al toser y ventila los ambientes.",
    ],
    sintomas: "Tos, fiebre y dolor de garganta. En niños: respiración rápida o con silbido.",
    accion: "Ve a la posta. Si a un niño se le hunde el pecho al respirar, llévalo de inmediato.",
  },
];

const SIGNOS_ALARMA = [
  "Dificultad para respirar",
  "Sangrado de encías o nariz, o vómitos con sangre",
  "Dolor de barriga fuerte que no se calma",
  "Vómitos que no paran o no puede tomar líquidos",
  "Mucho sueño, confusión o desmayo",
  "Un bebé o adulto mayor que casi no orina o está muy decaído",
];

const NUMEROS = [
  { numero: "106", nombre: "SAMU", detalle: "Emergencias médicas, gratis" },
  { numero: "113", nombre: "Línea MINSA", detalle: "Orientación de salud, gratis" },
];

function Tarjeta({ children, className = "", id }) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-3xl border p-5 sm:p-6 ${className}`}
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {children}
    </section>
  );
}

// Ubicación compartida por la lista de postas y el aviso de enfermedad.
function useMiUbicacion() {
  const [ubicacion, setUbicacion] = useState(leerUbicacionGuardada);
  const [buscando, setBuscando] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState(null);

  function usarMiUbicacion() {
    setErrorUbicacion(null);
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite obtener tu ubicación.");
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nueva = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lon: Number(pos.coords.longitude.toFixed(5)),
        };
        guardarUbicacion(nueva);
        setUbicacion(nueva);
        setBuscando(false);
      },
      () => {
        setErrorUbicacion("No se pudo obtener tu ubicación. Revisa que el GPS esté activado.");
        setBuscando(false);
      },
      { timeout: 10000, maximumAge: 5 * 60_000 }
    );
  }
  return { ubicacion, buscando, errorUbicacion, usarMiUbicacion };
}

function PostasCercanas({ ubicacion, buscando, errorUbicacion, usarMiUbicacion }) {
  const { data: puntos, loading, error } = useAyudaCercana();
  const cercanos = establecimientosCercanos(puntos, ubicacion, 5);

  return (
    <Tarjeta id="postas" className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl flex items-center gap-2">
          <Hospital size={22} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
          Tu posta más cercana
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Centros y puestos de salud, postas y hospitales cerca de ti para que te atiendan.
        </p>
      </div>

      {!ubicacion ? (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={usarMiUbicacion}
            disabled={buscando}
            className="btn-dorado pa-tocable inline-flex items-center gap-2 min-h-[48px] px-5 rounded-full font-extrabold disabled:opacity-60"
          >
            <LocateFixed size={18} aria-hidden="true" />
            {buscando ? "Buscando tu ubicación…" : "Usar mi ubicación"}
          </button>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Tu ubicación se usa solo en este dispositivo para ordenar las postas por cercanía.
          </p>
        </div>
      ) : loading && !puntos ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : error && !puntos ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No pudimos cargar la lista de establecimientos. Llama al 113 para que te orienten.
        </p>
      ) : cercanos.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No encontramos establecimientos de salud registrados cerca. Llama al 113 para que te orienten.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {cercanos.map((p, i) => (
            <li
              key={p.id}
              className="pa-entra flex flex-wrap items-center gap-3 rounded-2xl p-3.5"
              style={{ backgroundColor: "var(--color-surface-alt)", "--i": i }}
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold"
                style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 basis-[180px]">
                <span className="block font-bold text-[15px]" style={{ color: "var(--color-title)" }}>
                  {p.nombre === p.etiqueta ? `${p.etiqueta} (sin nombre en el mapa)` : p.nombre}
                </span>
                <span
                  className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span>{p.etiqueta}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} aria-hidden="true" />
                    {formatearDistancia(p.km)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Footprints size={12} aria-hidden="true" />~{p.minutos} min a pie
                  </span>
                </span>
              </span>
              <a
                href={urlRutaAPie(p, ubicacion)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-full text-sm font-bold"
                style={{ backgroundColor: "var(--color-primary)", color: "#ffffff" }}
              >
                <Navigation size={15} aria-hidden="true" />
                Cómo llegar
              </a>
            </li>
          ))}
        </ol>
      )}

      {errorUbicacion && (
        <p className="text-sm" role="alert" style={{ color: "var(--color-alerta)" }}>
          {errorUbicacion}
        </p>
      )}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>Lista de OpenStreetMap: confirma la atención llamando al 113.</span>
        {ubicacion && (
          <button
            type="button"
            onClick={usarMiUbicacion}
            className="font-bold min-h-[44px]"
            style={{ color: "var(--color-primary)" }}
          >
            {buscando ? "Actualizando…" : "Actualizar mi ubicación"}
          </button>
        )}
        <Link
          to="/mapa"
          className="font-bold min-h-[44px] inline-flex items-center"
          style={{ color: "var(--color-primary)" }}
        >
          Verlas en el mapa
        </Link>
      </div>
    </Tarjeta>
  );
}

function Enfermedad({ e, abierta, onAlternar }) {
  const texto = `${e.titulo}. ${e.origen} Para prevenir: ${e.prevenir.join(" ")} Síntomas: ${e.sintomas} Qué hacer: ${e.accion}`;
  return (
    <li
      className="rounded-3xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        className="w-full flex items-center justify-between gap-3 min-h-[60px] px-5 text-left"
      >
        <span className="font-display text-[17px]" style={{ color: "var(--color-title)" }}>
          {e.titulo}
        </span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className="shrink-0 transition-transform duration-300"
          style={{ transform: abierta ? "rotate(180deg)" : "none", color: "var(--color-text-muted)" }}
        />
      </button>
      {abierta && (
        <div className="pa-entra px-5 pb-5 flex flex-col gap-3 text-sm">
          <p style={{ color: "var(--color-text-muted)" }}>{e.origen}</p>
          <div>
            <p className="font-bold mb-1" style={{ color: "var(--color-title)" }}>
              Cómo prevenir
            </p>
            <ul className="list-disc pl-5 space-y-1" style={{ color: "var(--color-text)" }}>
              {e.prevenir.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <p>
            <strong style={{ color: "var(--color-title)" }}>Síntomas: </strong>
            {e.sintomas}
          </p>
          <p
            className="rounded-2xl px-4 py-3"
            style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-text)" }}
          >
            <strong style={{ color: "var(--color-primary)" }}>Qué hacer: </strong>
            {e.accion}
          </p>
          <BotonEscuchar texto={texto} className="self-start" />
        </div>
      )}
    </li>
  );
}

// Aviso ANÓNIMO de casos en la zona: sin nombre, sin foto, sin texto libre.
// El backend redondea la ubicación a unos 500 m antes de guardarla.
function AvisoEnfermedad({ ubicacion, buscando, usarMiUbicacion }) {
  const [enfermedad, setEnfermedad] = useState(null);
  const [personas, setPersonas] = useState(1);
  const [estado, setEstado] = useState("inicial"); // inicial | enviando | enviado | error
  const [error, setError] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    if (!enfermedad || !ubicacion) return;
    setEstado("enviando");
    setError(null);
    try {
      // Se redondea en el teléfono (grilla de ~550 m, la misma del backend): la
      // ubicación exacta nunca sale del dispositivo.
      const redondear = (v) => Number((Math.round(v / 0.005) * 0.005).toFixed(4));
      await enviarAvisoSalud({
        enfermedad,
        personas,
        lon: redondear(ubicacion.lon),
        lat: redondear(ubicacion.lat),
      });
      setEstado("enviado");
    } catch (err) {
      setError(err.message);
      setEstado("error");
    }
  }

  if (estado === "enviado") {
    return (
      <Tarjeta className="flex flex-col gap-2">
        <h2 className="font-display text-xl">Gracias por avisar</h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Tu aviso ayuda a Defensa Civil y al personal de salud a ver en qué zonas aumentan los casos. Si
          alguien tiene síntomas, llévalo a la posta.
        </p>
        <button
          type="button"
          onClick={() => {
            setEstado("inicial");
            setEnfermedad(null);
            setPersonas(1);
          }}
          className="self-start font-bold text-sm min-h-[44px]"
          style={{ color: "var(--color-primary)" }}
        >
          Enviar otro aviso
        </button>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl">¿Hay enfermos en tu zona?</h2>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Avísanos para que Defensa Civil y el personal de salud sepan dónde aumentan los casos después del
            fenómeno. No pedimos tu nombre y la ubicación se guarda aproximada (unos 500 m).
          </p>
        </div>
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <legend className="text-sm font-bold mb-2">¿Qué estás viendo?</legend>
          {OPCIONES_AVISO.map((o) => {
            const activa = enfermedad === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={activa}
                onClick={() => setEnfermedad(o.id)}
                className="pa-tocable text-left min-h-[52px] px-4 rounded-2xl text-sm font-semibold border"
                style={
                  activa
                    ? { backgroundColor: "var(--color-activo)", borderColor: "transparent", color: "#ffffff" }
                    : {
                        backgroundColor: "var(--color-surface-alt)",
                        borderColor: "transparent",
                        color: "var(--color-text)",
                      }
                }
              >
                {o.texto}
              </button>
            );
          })}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold" id="personas-etiqueta">
            ¿Cuántas personas?
          </span>
          <div
            className="inline-flex items-center gap-1 rounded-full p-1"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            <button
              type="button"
              aria-label="Una persona menos"
              onClick={() => setPersonas((n) => Math.max(1, n - 1))}
              className="w-11 h-11 rounded-full text-xl font-bold"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-title)" }}
            >
              −
            </button>
            <output
              aria-labelledby="personas-etiqueta"
              className="font-mono-data w-12 text-center text-lg font-extrabold"
              style={{ color: "var(--color-title)" }}
            >
              {personas}
              {personas === 20 ? "+" : ""}
            </output>
            <button
              type="button"
              aria-label="Una persona más"
              onClick={() => setPersonas((n) => Math.min(20, n + 1))}
              className="w-11 h-11 rounded-full text-xl font-bold"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-title)" }}
            >
              +
            </button>
          </div>
        </div>
        {!ubicacion ? (
          <button
            type="button"
            onClick={usarMiUbicacion}
            disabled={buscando}
            className="self-start inline-flex items-center gap-2 min-h-[48px] px-5 rounded-full font-bold disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
          >
            <LocateFixed size={18} aria-hidden="true" />
            {buscando ? "Buscando tu ubicación…" : "Usar mi ubicación para el aviso"}
          </button>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Se usará tu ubicación aproximada.
          </p>
        )}
        {error && (
          <p className="text-sm" role="alert" style={{ color: "var(--color-alerta)" }}>
            No se pudo enviar el aviso: {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!enfermedad || !ubicacion || estado === "enviando"}
          className="btn-dorado pa-tocable self-start min-h-[52px] px-7 rounded-full font-extrabold disabled:opacity-50"
        >
          {estado === "enviando" ? "Enviando…" : "Enviar aviso anónimo"}
        </button>
      </form>
    </Tarjeta>
  );
}

const RESULTADO_SINTOMAS = {
  emergencia: {
    titulo: "Ve a emergencias ahora",
    texto: "Marcaste una señal de alarma. No esperes: ve al hospital más cercano o llama al SAMU (106).",
    color: "var(--color-alerta)",
    fondo: "var(--color-alerta-soft)",
  },
  posta: {
    titulo: "Ve a la posta hoy",
    texto:
      "Estos síntomas necesitan que te vea el personal de salud. No te automediques: para la fiebre, no tomes aspirina ni ibuprofeno.",
    color: "var(--color-primary)",
    fondo: "var(--color-primary-soft)",
  },
  vigilar: {
    titulo: "Cuídate en casa y vigila",
    texto:
      "Toma bastante líquido (suero oral si hay diarrea) y descansa. Si aparece fiebre, empeoras o no mejoras en un día, ve a la posta.",
    color: "var(--color-prealerta)",
    fondo: "var(--color-prealerta-soft)",
  },
};

// "¿Qué síntomas tienes?": orienta qué hacer y con qué enfermedad del
// fenómeno puede estar relacionado. No es un diagnóstico.
function RevisorSintomas({ onVerEnfermedad }) {
  const [marcados, setMarcados] = useState([]);
  const [contactoAgua, setContactoAgua] = useState(false);
  const [grupoRiesgo, setGrupoRiesgo] = useState(false);
  const { nivel, posibles } = evaluarSintomas(marcados, { contactoAgua, grupoRiesgo });
  const resultado = nivel ? RESULTADO_SINTOMAS[nivel] : null;

  function alternar(id) {
    setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  const comunes = SINTOMAS.filter((x) => !x.alarma);
  const alarmas = SINTOMAS.filter((x) => x.alarma);
  const chip = (x) => {
    const activo = marcados.includes(x.id);
    return (
      <button
        key={x.id}
        type="button"
        aria-pressed={activo}
        onClick={() => alternar(x.id)}
        className="pa-tocable min-h-[44px] px-4 rounded-full text-sm font-semibold border text-left"
        style={
          activo
            ? {
                backgroundColor: x.alarma ? "var(--color-alerta)" : "var(--color-activo)",
                color: "#ffffff",
                borderColor: "transparent",
              }
            : {
                backgroundColor: "var(--color-surface-alt)",
                color: "var(--color-text)",
                borderColor: "transparent",
              }
        }
      >
        {x.texto}
      </button>
    );
  };

  return (
    <Tarjeta className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl flex items-center gap-2">
          <Stethoscope size={22} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
          ¿Qué síntomas tienes?
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Marca lo que sientes tú o la persona que cuidas. Te decimos qué hacer.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Síntomas">
        {comunes.map(chip)}
      </div>
      <div>
        <p
          className="text-xs font-extrabold uppercase tracking-[0.1em] mb-2"
          style={{ color: "var(--color-alerta)" }}
        >
          Señales de alarma
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Señales de alarma">
          {alarmas.map(chip)}
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {[
          [contactoAgua, setContactoAgua, "Estuvo en contacto con agua o barro de la inundación"],
          [grupoRiesgo, setGrupoRiesgo, "Es un bebé o niño pequeño, una gestante o un adulto mayor"],
        ].map(([valor, cambiar, texto]) => (
          <label key={texto} className="flex items-center gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={valor}
              onChange={(e) => cambiar(e.target.checked)}
              className="w-5 h-5 shrink-0 accent-[var(--color-primary)]"
            />
            {texto}
          </label>
        ))}
      </div>

      {resultado && (
        <div
          role="status"
          className="pa-entra rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: resultado.fondo }}
        >
          <p className="font-display text-lg" style={{ color: resultado.color }}>
            {resultado.titulo}
          </p>
          <p className="text-sm" style={{ color: "var(--color-text)" }}>
            {resultado.texto}
          </p>
          {posibles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold" style={{ color: "var(--color-title)" }}>
                Por tus síntomas, posiblemente sea:
              </p>
              {posibles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onVerEnfermedad(p.id)}
                  className="pa-tocable text-left rounded-2xl px-4 py-3 flex flex-col gap-1"
                  style={{ backgroundColor: "var(--color-surface)" }}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-base" style={{ color: "var(--color-primary)" }}>
                      {ENFERMEDADES.find((e) => e.id === p.id)?.titulo ?? p.id}
                    </span>
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
                      style={
                        p.grado === "muchos"
                          ? { backgroundColor: "var(--color-primary)", color: "#ffffff" }
                          : { backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }
                      }
                    >
                      {p.grado === "muchos" ? "Muchos síntomas coinciden" : "Algunos síntomas coinciden"}
                    </span>
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Coinciden {p.coinciden.length} de {p.total} síntomas típicos:{" "}
                    {p.coinciden.map((id) => NOMBRE_SINTOMA[id]?.toLowerCase() ?? id).join(", ")}
                    {p.id === "leptospirosis" ? ", y el contacto con agua de la inundación" : ""}. Toca para
                    ver cómo cuidarte.
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {nivel === "emergencia" ? (
              <a
                href="tel:106"
                className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-full font-extrabold"
                style={{ backgroundColor: "var(--color-alerta)", color: "#ffffff" }}
              >
                <Phone size={16} aria-hidden="true" /> Llamar al SAMU (106)
              </a>
            ) : null}
            {nivel !== "vigilar" && (
              <a
                href="#postas"
                className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-full font-bold"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
              >
                <Hospital size={16} aria-hidden="true" /> Ver postas cercanas
              </a>
            )}
            <BotonEscuchar texto={`${resultado.titulo}. ${resultado.texto}`} />
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Esto no es un diagnóstico: solo el personal de salud puede confirmarlo, a veces con un análisis.
            Si dudas, ve a la posta o llama al 113.
          </p>
        </div>
      )}
    </Tarjeta>
  );
}

function Salud() {
  const [abierta, setAbierta] = useState("dengue");
  const miUbicacion = useMiUbicacion();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Salud · Después de la inundación
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Cuida tu salud</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Después de las lluvias aumentan el dengue, la leptospirosis, las diarreas y otras enfermedades.
          Revisa tus síntomas, cómo prevenirlas y dónde atenderte.
        </p>
      </section>

      <RevisorSintomas
        onVerEnfermedad={(id) => {
          setAbierta(id);
          requestAnimationFrame(() =>
            document.getElementById("que-vigilar")?.scrollIntoView({ block: "start" })
          );
        }}
      />

      <AvisoEnfermedad {...miUbicacion} />

      <section
        className="rounded-3xl p-5 sm:p-6 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-alerta-soft)" }}
        aria-labelledby="signos-alarma"
      >
        <h2
          id="signos-alarma"
          className="font-display text-xl flex items-center gap-2"
          style={{ color: "var(--color-alerta)" }}
        >
          <Siren size={22} aria-hidden="true" />
          Ve de inmediato a emergencias si hay
        </h2>
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm list-disc pl-5"
          style={{ color: "var(--color-text)" }}
        >
          {SIGNOS_ALARMA.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 mt-1">
          {NUMEROS.map((n) => (
            <a
              key={n.numero}
              href={`tel:${n.numero}`}
              className="inline-flex items-center gap-2 min-h-[48px] px-4 rounded-full font-bold"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-alerta)" }}
            >
              <Phone size={16} aria-hidden="true" />
              <span className="font-mono-data text-lg">{n.numero}</span>
              <span className="text-sm">
                {n.nombre} <span className="font-semibold opacity-75">· {n.detalle}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <PostasCercanas {...miUbicacion} />

      <Link
        to="/agua"
        className="pa-tocable rounded-3xl p-5 flex items-center justify-between gap-3"
        style={{ backgroundColor: "var(--color-info-soft)" }}
      >
        <span>
          <span className="block font-display text-lg" style={{ color: "var(--color-title)" }}>
            Agua segura
          </span>
          <span className="block text-sm" style={{ color: "var(--color-text-muted)" }}>
            Cómo potabilizar el agua en casa y avisar si no te llega o sale turbia.
          </span>
        </span>
        <span className="font-bold text-sm shrink-0" style={{ color: "var(--color-primary)" }}>
          Ver →
        </span>
      </Link>

      <section className="flex flex-col gap-3" aria-labelledby="que-vigilar">
        <h2 id="que-vigilar" className="text-[22px] scroll-mt-24">
          Qué vigilar después de la inundación
        </h2>
        <ul className="flex flex-col gap-2">
          {ENFERMEDADES.map((e) => (
            <Enfermedad
              key={e.id}
              e={e}
              abierta={abierta === e.id}
              onAlternar={() => setAbierta((a) => (a === e.id ? null : e.id))}
            />
          ))}
        </ul>
      </section>

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Información general de prevención. No reemplaza la consulta con el personal de salud.
      </p>
    </main>
  );
}

export default Salud;
