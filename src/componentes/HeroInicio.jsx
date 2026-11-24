import { Waves } from "lucide-react";
import Skeleton from "./Skeleton";
import { NumeroAnimado } from "./Animados";
import { formatearTiempoRelativo } from "../utilidades/fecha";

const ESTADO_TEXTO = {
  normal: "Normal",
  prealerta: "Prealerta",
  alerta_roja: "Alerta roja",
};

function saludo(fecha = new Date()) {
  const h = fecha.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function haceCuanto(valor) {
  const r = formatearTiempoRelativo(valor);
  if (r === "—") return null;
  if (r === "ahora") return "hace un momento";
  return /\d (min|h|d|sem)$/.test(r) ? `hace ${r}` : `el ${r}`;
}

// Ola de la superficie del agua: dos periodos completos, así al desplazarla
// la mitad de su ancho el corte no se nota.
const OLA = "M0 8 Q 25 0 50 8 T 100 8 T 150 8 T 200 8 T 250 8 T 300 8 T 350 8 T 400 8 V 16 H 0 Z";

// Agua dentro de la tarjeta: sube según el % del umbral de alerta roja que
// marca el sensor elegido (piso de 10% para que siempre se vea la ola).
function Agua({ porcentaje }) {
  const p = Number(porcentaje);
  const altura = Number.isFinite(p) ? Math.min(92, Math.max(10, p)) : 10;
  return (
    <div className="pa-agua" style={{ height: `${altura}%` }} aria-hidden="true">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
      <svg viewBox="0 0 400 16" preserveAspectRatio="none" className="pa-agua-ola-2">
        <path d={OLA} fill="rgba(255,255,255,0.05)" />
      </svg>
      <svg viewBox="0 0 400 16" preserveAspectRatio="none" className="pa-agua-ola-1">
        <path d={OLA} fill="rgba(255,255,255,0.07)" />
      </svg>
    </div>
  );
}

// Saludo + tarjeta hero azul: cuántos sensores del río están ahora en
// prealerta o alerta roja (dato en vivo de /api/sensores/estado) y el nivel
// del sensor que la persona eligió.
function HeroInicio({ estadoSensores, cargandoEstado, lectura, sensorActivo, selectorSensor }) {
  const sensores = estadoSensores ?? [];
  const activas = sensores.filter((s) =>
    ["prealerta", "alerta_roja"].includes(s.ultima_lectura?.estado)
  ).length;
  const hayRoja = sensores.some((s) => s.ultima_lectura?.estado === "alerta_roja");
  const estado = lectura?.estado;
  const subtitulo =
    estado === "alerta_roja"
      ? "El río está en alerta roja. Sigue las indicaciones de Defensa Civil."
      : estado === "prealerta"
        ? "El río está en prealerta. Revisa los avisos de tu zona."
        : "El río está tranquilo. Te avisamos si algo cambia.";

  return (
    <section aria-labelledby="saludo-inicio" className="flex flex-col gap-5">
      <div className="pa-entra flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 id="saludo-inicio" className="text-[34px] sm:text-[40px] leading-[1.08]">
            {saludo()}
          </h1>
          <p className="mt-1.5 text-[15px] max-w-md" style={{ color: "var(--color-text-muted)" }}>
            {subtitulo}
          </p>
        </div>
        {selectorSensor}
      </div>

      <article
        className="pa-hero pa-entra p-6 sm:p-7"
        style={{ "--i": 1 }}
        aria-label="Alertas activas en el río Piura"
      >
        <Agua porcentaje={lectura?.porcentaje} />
        <p className="flex items-center gap-2 text-[14px] font-semibold text-white/85">
          <span
            className="pa-vivo w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--color-sol-claro)", color: "var(--color-sol-claro)" }}
            aria-hidden="true"
          />
          Alertas activas ahora
        </p>

        <div className="flex items-end gap-3 mt-2">
          {cargandoEstado && !estadoSensores ? (
            <Skeleton className="h-[76px] w-20 opacity-30" />
          ) : (
            <strong className="font-mono-data text-[84px] leading-[0.9] font-extrabold tracking-[-0.05em]">
              <NumeroAnimado valor={activas} />
            </strong>
          )}
          <span className="pb-2 text-sm text-white/80 leading-snug">
            {sensores.length ? (
              <>
                en {sensores.length} {sensores.length === 1 ? "sensor" : "sensores"}
                <br />
                del río Piura
              </>
            ) : (
              <>
                Sin datos de los
                <br />
                sensores todavía
              </>
            )}
          </span>
        </div>

        {hayRoja && (
          <p
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold"
            style={{ backgroundColor: "rgba(198,40,40,0.9)" }}
          >
            Hay un sensor en alerta roja
          </p>
        )}

        <div
          className="mt-5 flex items-center gap-3 rounded-[20px] p-3.5"
          style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.16)" }}
        >
          <span
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <Waves size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block text-[14px] truncate">{sensorActivo?.nombre ?? "Río Piura"}</b>
            <small className="text-xs text-white/75">
              {haceCuanto(lectura?.medido_en) ?? "Esperando la primera lectura"}
            </small>
          </span>
          {lectura && (
            <span className="text-right shrink-0">
              <b className="font-mono-data block text-xl leading-tight">
                <NumeroAnimado valor={lectura.nivel_cm} /> cm
              </b>
              <small
                className="block text-[11px] font-extrabold uppercase tracking-wide"
                style={{ color: "var(--color-sol-claro)" }}
              >
                {ESTADO_TEXTO[lectura.estado] ?? "—"}
              </small>
            </span>
          )}
        </div>
      </article>
    </section>
  );
}

export default HeroInicio;
