import { useMemo } from "react";
import { albergueMasCercano, formatearDistancia, minutosAPie, urlRutaAPie } from "../utilidades/geo";

// "Ruta al albergue": el albergue más cercano con espacio al punto elegido,
// con distancia, tiempo aproximado a pie, lugares libres y la ruta a pie en
// Google Maps.
function AlbergueCercano({ punto, albergues }) {
  const cercano = useMemo(() => albergueMasCercano(albergues, punto), [albergues, punto]);
  if (!punto) return null;

  if (!cercano) {
    return (
      <section
        className="sr-entra rounded-3xl border p-5 text-sm"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        No hay albergues registrados todavía. Sigue las indicaciones de Defensa Civil.
      </section>
    );
  }

  const { albergue, ubicacion, km, libres, lleno } = cercano;
  const ocupacion = Math.min(100, Math.round((albergue.ocupacion_actual / albergue.capacidad) * 100));
  const minutos = minutosAPie(km);

  return (
    <section
      aria-labelledby="albergue-cercano-titulo"
      className="sr-entra rounded-3xl border p-5 flex flex-col gap-4"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        animationDelay: "0.1s",
      }}
    >
      <div>
        <span
          className="text-[11px] font-extrabold tracking-[0.12em]"
          style={{ color: "var(--color-text-muted)" }}
        >
          TU ALBERGUE MÁS CERCANO
        </span>
        <h3 id="albergue-cercano-titulo" className="font-display text-2xl font-extrabold leading-tight mt-1">
          {albergue.nombre}
        </h3>
        {albergue.direccion && (
          <p className="text-[13px] mt-1" style={{ color: "var(--color-text-muted)" }}>
            {albergue.direccion}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: "var(--color-surface-alt)" }}>
          <div className="text-[11px] font-bold" style={{ color: "var(--color-text-muted)" }}>
            A pie (aprox.)
          </div>
          <div className="font-display text-xl font-extrabold">{minutos} min</div>
        </div>
        <div className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: "var(--color-surface-alt)" }}>
          <div className="text-[11px] font-bold" style={{ color: "var(--color-text-muted)" }}>
            Distancia
          </div>
          <div className="font-display text-xl font-extrabold">
            {formatearDistancia(km).replace("a ", "")}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[13px] font-bold">
          <span>Espacio disponible</span>
          <span style={{ color: lleno ? "var(--color-alerta)" : "var(--color-normal)" }}>
            {lleno ? "Lleno" : `${libres} de ${albergue.capacidad} libres`}
          </span>
        </div>
        <div
          className="h-2.5 rounded-full mt-1.5 overflow-hidden"
          style={{ backgroundColor: "var(--color-surface-alt)" }}
        >
          <div
            className="sr-barra h-2.5 rounded-full"
            style={{
              width: `${ocupacion}%`,
              backgroundColor: lleno ? "var(--color-alerta)" : "var(--color-normal)",
              animationDelay: "0.3s",
            }}
          />
        </div>
        {lleno && (
          <p className="text-xs mt-1.5" style={{ color: "var(--color-alerta)" }}>
            Todos los albergues cercanos están llenos: consulta a Defensa Civil por otra opción.
          </p>
        )}
      </div>

      <a
        href={urlRutaAPie(ubicacion, punto)}
        target="_blank"
        rel="noopener noreferrer"
        className="sr-presionable rounded-2xl min-h-[52px] flex items-center justify-center gap-2 font-extrabold text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Cómo llegar a pie →
      </a>
      <p className="text-[11px] -mt-2" style={{ color: "var(--color-text-muted)" }}>
        Tiempo calculado en línea recta: por calles puede ser un poco más. La ruta se abre en Google Maps.
      </p>
    </section>
  );
}

export default AlbergueCercano;
