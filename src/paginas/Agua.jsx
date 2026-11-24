import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, Flame, FlaskConical, LocateFixed, Package } from "lucide-react";
import { enviarAvisoAgua } from "../utilidades/api";
import { leerUbicacionGuardada, guardarUbicacion } from "../ganchos/useRiesgo";
import BotonEscuchar from "../componentes/BotonEscuchar";

// Agua segura después del fenómeno (ODS 6.1): cómo potabilizar el agua en
// casa y aviso ANÓNIMO de problemas con el agua (sin nombre ni texto libre;
// la ubicación sale del teléfono ya redondeada a ~500 m).
const PASOS = [
  {
    icono: Flame,
    titulo: "Hiérvela",
    texto: "Hazla hervir con burbujas grandes durante al menos 1 minuto y déjala enfriar tapada.",
  },
  {
    icono: FlaskConical,
    titulo: "O clórala",
    texto:
      "Echa 2 gotas de lejía (sin aroma ni detergente) por cada litro, mezcla y espera 30 minutos antes de tomarla.",
  },
  {
    icono: Package,
    titulo: "Guárdala bien",
    texto: "En baldes o bidones limpios y tapados. Sácala con un cucharón, sin meter las manos.",
  },
];

const RECORDAR = [
  "Usa agua segura también para lavar los alimentos, los platos y lavarte los dientes.",
  "Lávate las manos con jabón antes de comer y de cocinar, y después de ir al baño.",
  "Nunca uses el agua de la inundación, ni siquiera para lavar.",
  "Si el agua sale turbia, con olor o con un color raro, no la tomes aunque la hiervas: avisa abajo.",
];

const TIPOS = [
  { id: "sin_agua", texto: "No me llega agua" },
  { id: "agua_turbia", texto: "Sale turbia o sucia" },
  { id: "agua_olor", texto: "Tiene olor o sabor raro" },
];

const redondear = (v) => Number((Math.round(v / 0.005) * 0.005).toFixed(4));

function AvisoAgua() {
  const [tipo, setTipo] = useState(null);
  const [ubicacion, setUbicacion] = useState(leerUbicacionGuardada);
  const [buscando, setBuscando] = useState(false);
  const [estado, setEstado] = useState("inicial");
  const [error, setError] = useState(null);

  function usarMiUbicacion() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener tu ubicación.");
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
        setError("No se pudo obtener tu ubicación. Revisa que el GPS esté activado.");
        setBuscando(false);
      },
      { timeout: 10000, maximumAge: 5 * 60_000 }
    );
  }

  async function enviar(e) {
    e.preventDefault();
    if (!tipo || !ubicacion) return;
    setEstado("enviando");
    setError(null);
    try {
      await enviarAvisoAgua({ tipo, lon: redondear(ubicacion.lon), lat: redondear(ubicacion.lat) });
      setEstado("enviado");
    } catch (err) {
      setError(`No se pudo enviar el aviso: ${err.message}`);
      setEstado("inicial");
    }
  }

  return (
    <section
      className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      aria-labelledby="aviso-agua"
    >
      <div>
        <h2 id="aviso-agua" className="font-display text-xl">
          ¿Problemas con el agua en tu casa?
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Avísanos para que Defensa Civil sepa dónde hacen falta cisternas o revisar la red. No pedimos tu
          nombre y la ubicación se envía aproximada (unos 500 m).
        </p>
      </div>
      {estado === "enviado" ? (
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-normal-soft)" }}
        >
          <p className="font-bold" style={{ color: "var(--color-normal)" }}>
            Gracias por avisar.
          </p>
          <p className="text-sm">Mientras tanto, toma solo agua hervida o clorada.</p>
          <button
            type="button"
            onClick={() => {
              setEstado("inicial");
              setTipo(null);
            }}
            className="self-start font-bold text-sm min-h-[44px]"
            style={{ color: "var(--color-primary)" }}
          >
            Enviar otro aviso
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            role="group"
            aria-label="¿Qué pasa con el agua?"
          >
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={tipo === t.id}
                onClick={() => setTipo(t.id)}
                className="pa-tocable min-h-[52px] px-4 rounded-2xl text-sm font-semibold text-left"
                style={
                  tipo === t.id
                    ? { backgroundColor: "var(--color-activo)", color: "#ffffff" }
                    : { backgroundColor: "var(--color-surface-alt)", color: "var(--color-text)" }
                }
              >
                {t.texto}
              </button>
            ))}
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
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!tipo || !ubicacion || estado === "enviando"}
            className="btn-dorado pa-tocable self-start min-h-[52px] px-7 rounded-full font-extrabold disabled:opacity-50"
          >
            {estado === "enviando" ? "Enviando…" : "Enviar aviso anónimo"}
          </button>
        </form>
      )}
    </section>
  );
}

function Agua() {
  const textoGuia = `${PASOS.map((p) => `${p.titulo}. ${p.texto}`).join(" ")} ${RECORDAR.join(" ")}`;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Salud · Agua
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Agua segura</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Después de una inundación el agua se contamina fácilmente y causa diarreas y otras enfermedades. Así
          la haces segura en casa.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PASOS.map((p, i) => {
          const Icono = p.icono;
          return (
            <section
              key={p.titulo}
              className="pa-entra rounded-3xl border p-5 flex flex-col gap-2"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                "--i": i,
              }}
            >
              <span
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
              >
                <Icono size={22} aria-hidden="true" />
              </span>
              <h2 className="font-display text-lg">{p.titulo}</h2>
              <p className="text-sm" style={{ color: "var(--color-text)" }}>
                {p.texto}
              </p>
            </section>
          );
        })}
      </div>

      <section
        className="rounded-3xl p-5 sm:p-6 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-info-soft)" }}
      >
        <h2 className="font-display text-lg flex items-center gap-2">
          <Droplets size={20} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
          Recuerda
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: "var(--color-text)" }}>
          {RECORDAR.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <BotonEscuchar texto={textoGuia} className="self-start" />
      </section>

      <AvisoAgua />

      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        ¿Diarrea, vómitos o fiebre? Revisa tus síntomas en{" "}
        <Link to="/salud" className="font-bold underline" style={{ color: "var(--color-primary)" }}>
          Salud
        </Link>
        .
      </p>
    </main>
  );
}

export default Agua;
