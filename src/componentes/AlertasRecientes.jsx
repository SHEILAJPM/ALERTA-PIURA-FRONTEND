import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import Icon from "./Icon";
import Skeleton from "./Skeleton";
import { useHistorialAlertas } from "../ganchos/useHistorialAlertas";
import { useSismos } from "../ganchos/useSismos";
import { nivelMagnitud } from "../utilidades/sismos";
import { formatearTiempoRelativo } from "../utilidades/fecha";
import { useFoco } from "../ganchos/useAnimaciones";

// Estados visuales: crítica (rojo), advertencia (ámbar), info (azul) y
// resuelta (verde). Cada uno con chip pastel, punto de color e ícono.
const ESTADOS = {
  critica: {
    nombre: "Crítica",
    icono: "bi-exclamation-octagon-fill",
    color: "var(--color-alerta)",
    bg: "var(--color-alerta-soft)",
  },
  advertencia: {
    nombre: "Advertencia",
    icono: "bi-exclamation-triangle-fill",
    color: "var(--color-prealerta)",
    bg: "var(--color-prealerta-soft)",
  },
  info: { nombre: "Info", icono: "bi-activity", color: "var(--color-info)", bg: "var(--color-info-soft)" },
  resuelta: {
    nombre: "Resuelta",
    icono: "bi-check-circle-fill",
    color: "var(--color-normal)",
    bg: "var(--color-normal-soft)",
  },
};

const FILTROS = [
  { id: "todas", texto: "Todas" },
  { id: "critica", texto: "Críticas" },
  { id: "advertencia", texto: "Advertencias" },
  { id: "info", texto: "Info" },
  { id: "resuelta", texto: "Resueltas" },
];

const DEL_RIO = {
  alerta_roja: { estado: "critica", titulo: "El río pasó a alerta roja", icono: "bi-water" },
  prealerta: { estado: "advertencia", titulo: "El río entró en prealerta", icono: "bi-water" },
  normal: { estado: "resuelta", titulo: "El río volvió a su nivel normal", icono: "bi-water" },
};

function haceCuanto(valor) {
  const r = formatearTiempoRelativo(valor);
  if (r === "ahora") return "hace un momento";
  return /\d (min|h|d|sem)$/.test(r) ? `hace ${r}` : r;
}

// Une los cambios de estado del río (historial público) y los sismos
// recientes (USGS) en una sola lista ordenada por fecha.
function unir(eventos, sismos) {
  const delRio = (eventos ?? []).map((e) => {
    const tipo = DEL_RIO[e.estado_nuevo] ?? DEL_RIO.normal;
    return {
      id: `rio-${e.id}`,
      estado: tipo.estado,
      icono: tipo.icono,
      titulo: tipo.titulo,
      detalle: `${e.nivel_cm} cm`,
      lugar: e.sensor_nombre,
      fecha: e.iniciado_en,
      fuente: "Sensor del río",
      enlace: "/historial",
    };
  });
  const deSismos = (sismos ?? []).map((s) => ({
    id: `sismo-${s.id}`,
    estado: nivelMagnitud(s.magnitud) === "alerta" ? "advertencia" : "info",
    icono: "bi-activity",
    titulo: `Sismo de magnitud ${Number(s.magnitud).toFixed(1)}`,
    detalle: null,
    lugar: s.lugar,
    fecha: s.fecha,
    fuente: "USGS",
    enlace: null,
  }));
  return [...delRio, ...deSismos]
    .filter((i) => i.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 8);
}

function TarjetaAlerta({ item, indice }) {
  const alMoverPuntero = useFoco();
  const e = ESTADOS[item.estado];
  const contenido = (
    <>
      <span
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-[20px] shrink-0"
        style={{ backgroundColor: e.bg, color: e.color }}
      >
        <Icon name={item.icono} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="chip-estado" style={{ backgroundColor: e.bg, color: e.color }}>
            <span className="punto" aria-hidden="true" />
            <Icon name={e.icono} aria-hidden="true" className="text-[13px]" />
            {e.nombre}
          </span>
          <span className="text-[11.5px] font-semibold truncate" style={{ color: "var(--color-text-muted)" }}>
            {item.fuente}
          </span>
        </span>
        <span
          className="block font-bold text-[15px] leading-snug mt-2"
          style={{ color: "var(--color-title)" }}
        >
          {item.titulo}
          {item.detalle && (
            <span className="font-mono-data font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {" "}
              · {item.detalle}
            </span>
          )}
        </span>
        <span
          className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[12.5px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{item.lugar}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} aria-hidden="true" />
            {haceCuanto(item.fecha)}
          </span>
        </span>
      </span>
    </>
  );
  const clase = "vidrio pa-entra pa-tocable pa-foco flex gap-3.5 rounded-3xl p-4 text-left";
  const estilo = { "--i": indice };
  return item.enlace ? (
    <Link to={item.enlace} className={clase} style={estilo} onPointerMove={alMoverPuntero}>
      {contenido}
    </Link>
  ) : (
    <div className={clase} style={estilo} onPointerMove={alMoverPuntero}>
      {contenido}
    </div>
  );
}

function EstadoVacio({ filtrado }) {
  return (
    <div className="vidrio pa-entra rounded-3xl px-6 py-8 flex flex-col items-center text-center gap-1.5">
      <svg viewBox="0 0 132 96" className="w-32 h-24 mb-2" aria-hidden="true">
        <circle cx="66" cy="44" r="36" fill="var(--color-sol-soft)" />
        <g className="pa-girar">
          <circle cx="66" cy="44" r="18" fill="var(--color-sol)" />
          <g stroke="var(--color-sol)" strokeWidth="3" strokeLinecap="round">
            <path d="M66 6v8M66 74v8M28 44h8M96 44h8M39 17l6 6M87 65l6 6M93 17l-6 6M45 65l-6 6" />
          </g>
        </g>
        <path
          className="pa-flotar"
          d="M8 86c12-8 24 8 36 0s24 8 36 0 24 8 36 0"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".55"
        />
      </svg>
      <p className="font-bold text-[17px]" style={{ color: "var(--color-title)" }}>
        {filtrado ? "Nada por aquí" : "Todo tranquilo"}
      </p>
      <p className="text-sm max-w-[30ch]" style={{ color: "var(--color-text-muted)" }}>
        {filtrado
          ? "No hay alertas de este tipo ahora mismo. Prueba con otro filtro."
          : "No hubo cambios en el río ni sismos recientes. Te avisaremos si algo cambia."}
      </p>
    </div>
  );
}

function AlertasRecientes() {
  const { data: eventos, loading: cargandoEventos } = useHistorialAlertas(10);
  const { data: sismos, loading: cargandoSismos } = useSismos();
  const [filtro, setFiltro] = useState("todas");

  const items = useMemo(() => unir(eventos, sismos), [eventos, sismos]);
  const visibles = filtro === "todas" ? items : items.filter((i) => i.estado === filtro);
  const cargando = (cargandoEventos && !eventos) || (cargandoSismos && !sismos && !eventos);

  return (
    <section aria-labelledby="recientes-titulo" className="flex flex-col gap-4 min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="recientes-titulo" className="text-[22px]">
          Alertas recientes
        </h2>
        <Link
          to="/historial"
          className="inline-flex items-center gap-0.5 min-h-[44px] text-sm font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          Ver todo <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div
        className="pa-deslizable flex gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
        role="group"
        aria-label="Filtrar alertas"
      >
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          const e = ESTADOS[f.id];
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(f.id)}
              className={`shrink-0 inline-flex items-center gap-2 min-h-[42px] px-4 rounded-full text-[13.5px] font-bold transition-colors duration-200 active:scale-95 ${
                activo ? "" : "vidrio"
              }`}
              style={
                activo
                  ? {
                      backgroundColor: "var(--color-activo)",
                      color: "#ffffff",
                      boxShadow: "var(--shadow-glass)",
                    }
                  : { color: "var(--color-text-muted)" }
              }
            >
              {e && <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: e.color }} />}
              {f.texto}
            </button>
          );
        })}
      </div>

      {/* key por filtro: al cambiarlo, las tarjetas vuelven a entrar escalonadas. */}
      <div key={filtro} className="flex flex-col gap-3" aria-live="polite">
        {cargando ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="vidrio rounded-3xl p-4 flex gap-3.5">
              <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : visibles.length === 0 ? (
          <EstadoVacio filtrado={filtro !== "todas" && items.length > 0} />
        ) : (
          visibles.map((item, i) => <TarjetaAlerta key={item.id} item={item} indice={i} />)
        )}
      </div>
    </section>
  );
}

export default AlertasRecientes;
