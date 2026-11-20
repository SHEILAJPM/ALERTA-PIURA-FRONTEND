import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileJson, FlaskConical, Pause, Play, RotateCcw, Upload } from "lucide-react";
import GraficoTramos from "../componentes/laboratorio/GraficoTramos";
import CiudadPiura3D from "../componentes/laboratorio/CiudadPiura3D";
import { simularRio, aContrato, ESCENARIOS } from "../utilidades/motorRio";
import { esAppNativa } from "../utilidades/plataforma";
import {
  leerSimulacion,
  valorEn,
  tonoEstado,
  TAMANO_MAXIMO_BYTES,
  COLOR_TRAMO,
} from "../utilidades/simulacion";

// Laboratorio de simulación: muestra un escenario exportado por
// PiuraAlertaSim (contrato piura.simulation.v1). Es una simulación conceptual
// L0, sin validez de pronóstico: TODO ocurre en el navegador. El archivo no se
// envía al backend ni se guarda, y nada de acá toca sensores, alertas,
// notificaciones ni indicadores reales.

// URL pública del simulador Shiny, si está publicada (opcional).
const URL_SIMULADOR = import.meta.env.VITE_URL_SIMULADOR;

const SEGUNDOS_POR_RECORRIDO = 20; // a velocidad 1x, el escenario completo dura ~20 s
const VELOCIDADES = [0.5, 1, 2, 4];

const TONO = {
  critico: "var(--color-alerta)",
  advertencia: "var(--color-prealerta-punto)",
  normal: "var(--color-normal)",
  neutro: "var(--color-text-muted)",
};

function formatoTiempo(segundos) {
  const s = Math.max(0, Math.round(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const dos = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${dos(m)}:${dos(r)}` : `${dos(m)}:${dos(r)}`;
}

function formatoNumero(v, decimales = 2) {
  return v === null || v === undefined
    ? "—"
    : Number(v).toLocaleString("es-PE", { maximumFractionDigits: decimales });
}

function FranjaSimulacion() {
  return (
    <div className="pa-franja-demo rounded-[22px] px-4 py-3 flex items-start gap-3" role="note">
      <FlaskConical
        size={22}
        aria-hidden="true"
        className="shrink-0 mt-0.5"
        style={{ color: "var(--color-demo)" }}
      />
      <p className="text-sm" style={{ color: "var(--color-text)" }}>
        <strong style={{ color: "var(--color-demo)" }}>SIMULACIÓN CONCEPTUAL L0.</strong> No es un pronóstico
        ni mediciones del río real. Los tramos ALTO, MEDIO y BAJO son sectores idealizados, no lugares de
        Piura. Nada de lo que ves aquí genera alertas.
      </p>
    </div>
  );
}

function ChipSim() {
  return (
    <span
      className="text-[10.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }}
    >
      SIM
    </span>
  );
}

function CargarArchivo({ onCargado }) {
  const [errores, setErrores] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);

  async function procesar(archivo) {
    if (!archivo) return;
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      setErrores([`El archivo pesa más de ${TAMANO_MAXIMO_BYTES / 1024 / 1024} MB.`]);
      return;
    }
    const resultado = leerSimulacion(await archivo.text(), archivo.size);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }
    setErrores([]);
    onCargado({ ...resultado, nombre: archivo.name });
  }

  return (
    <section
      className="rounded-3xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center text-center gap-3 transition-colors"
      style={{
        borderColor: arrastrando ? "var(--color-demo)" : "var(--color-border)",
        backgroundColor: arrastrando ? "var(--color-demo-soft)" : "var(--color-glass)",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        procesar(e.dataTransfer.files?.[0]);
      }}
    >
      <span
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }}
      >
        <FileJson size={28} aria-hidden="true" />
      </span>
      <h2 className="font-display text-xl">Carga un escenario simulado</h2>
      <p className="text-sm max-w-md" style={{ color: "var(--color-text-muted)" }}>
        Elige el archivo JSON exportado desde PiuraAlertaSim (por ejemplo{" "}
        <code className="text-xs">piura_simulacion_demo_v1.json</code>). Se lee solo en tu dispositivo: no se
        envía a ningún servidor.
      </p>
      <label
        htmlFor="archivo-simulacion"
        className="btn-dorado pa-tocable inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full font-extrabold cursor-pointer"
      >
        <Upload size={18} aria-hidden="true" />
        Elegir archivo JSON
      </label>
      <input
        id="archivo-simulacion"
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          procesar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {errores.length > 0 && (
        <div
          role="alert"
          className="w-full max-w-lg text-left text-sm rounded-2xl px-4 py-3"
          style={{ backgroundColor: "var(--color-alerta-soft)", color: "var(--color-alerta)" }}
        >
          <p className="font-bold mb-1">No se pudo cargar el escenario:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function FichaEscenario({ metadata, nombre, avisos, onOtro }) {
  const escenario =
    typeof metadata.escenario === "string"
      ? metadata.escenario
      : (metadata.escenario?.nombre ?? metadata.escenario?.id);
  const filas = [
    ["Escenario", escenario],
    ["Versión del simulador", metadata.version_prototipo],
    ["Fidelidad", metadata.fidelidad],
    ["Uso permitido", metadata.uso_permitido],
    ["Archivo", nombre],
  ].filter(([, v]) => v);

  return (
    <section
      className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg flex items-center gap-2">
          Ficha del escenario <ChipSim />
        </h2>
        <button
          type="button"
          onClick={onOtro}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }}
        >
          <Upload size={16} aria-hidden="true" />
          Cargar otro archivo
        </button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {filas.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-3 border-b pb-2"
            style={{ borderColor: "var(--color-border)" }}
          >
            <dt style={{ color: "var(--color-text-muted)" }}>{k}</dt>
            <dd className="font-semibold text-right break-all" style={{ color: "var(--color-text)" }}>
              {String(v)}
            </dd>
          </div>
        ))}
      </dl>
      {avisos.length > 0 && (
        <ul
          className="text-sm rounded-2xl px-4 py-3 list-disc pl-8"
          style={{ backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-prealerta)" }}
        >
          {avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Reproductor({
  t,
  duracion,
  reproduciendo,
  velocidad,
  onAlternar,
  onReiniciar,
  onBuscar,
  onVelocidad,
}) {
  return (
    <section
      className="vidrio rounded-3xl p-4 sm:p-5 flex flex-col gap-3 z-10 lg:sticky lg:top-6"
      aria-label="Reproducción del escenario"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAlternar}
          className="btn-dorado pa-tocable inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-full font-extrabold"
        >
          {reproduciendo ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {reproduciendo ? "Pausar" : t >= duracion ? "Repetir" : "Reproducir"}
        </button>
        <button
          type="button"
          onClick={onReiniciar}
          aria-label="Volver al inicio"
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-title)" }}
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
        <div className="flex gap-1 ml-auto" role="group" aria-label="Velocidad">
          {VELOCIDADES.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={velocidad === v}
              onClick={() => onVelocidad(v)}
              className="min-w-[44px] min-h-[40px] px-2 rounded-full text-xs font-bold"
              style={
                velocidad === v
                  ? { backgroundColor: "var(--color-demo)", color: "#ffffff" }
                  : { backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }
              }
            >
              {v}x
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono-data text-sm font-bold shrink-0" style={{ color: "var(--color-demo)" }}>
          {formatoTiempo(t)}
        </span>
        <input
          type="range"
          min={0}
          max={duracion}
          step={duracion / 500 || 1}
          value={Math.min(t, duracion)}
          onChange={(e) => onBuscar(Number(e.target.value))}
          aria-label="Tiempo simulado"
          className="flex-1 min-w-0 accent-[var(--color-demo)]"
        />
        <span className="font-mono-data text-sm shrink-0" style={{ color: "var(--color-text-muted)" }}>
          {formatoTiempo(duracion)}
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Tiempo simulado desde el inicio del escenario, no la hora actual.
      </p>
    </section>
  );
}

function TarjetaTramo({ tramo, indice, simulacion, t }) {
  const punto = valorEn(simulacion.series, tramo, t);
  const estado = valorEn(simulacion.estados, tramo, t);
  const tono = estado ? tonoEstado(estado.estado) : "neutro";
  const unidades = simulacion.metadata;
  return (
    <article
      className="rounded-3xl border p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: COLOR_TRAMO[indice % COLOR_TRAMO.length] }}
            aria-hidden="true"
          />
          Tramo {tramo}
        </span>
        <ChipSim />
      </div>
      <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--color-text)" }}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TONO[tono] }} aria-hidden="true" />
        {estado?.estado || "Sin estado"}
      </p>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Nivel", punto?.nivel, unidades.nivel_unidad ?? "m"],
          ["Caudal", punto?.caudal, unidades.caudal_unidad ?? "m³/s"],
          ["Área", punto?.area, unidades.area_unidad ?? "m²"],
        ].map(([etiqueta, valor, unidad]) => (
          <div
            key={etiqueta}
            className="rounded-2xl py-2"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            <dt className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {etiqueta}
            </dt>
            <dd className="font-mono-data text-[15px] font-extrabold" style={{ color: "var(--color-title)" }}>
              {formatoNumero(valor, etiqueta === "Área" ? 0 : 2)}
            </dd>
            <dd className="text-[10.5px]" style={{ color: "var(--color-text-muted)" }}>
              {unidad}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Eventos({ eventos, t }) {
  if (eventos.length === 0) return null;
  return (
    <section
      className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h2 className="font-display text-lg flex items-center gap-2">
        Cambios de estado simulados <ChipSim />
      </h2>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Eventos de laboratorio: no generan ninguna acción pública.
      </p>
      <ol className="flex flex-col gap-2">
        {eventos.map((e, i) => {
          const ocurrido = e.t <= t;
          return (
            <li
              key={`${e.t}-${i}`}
              className="flex items-start gap-3 rounded-2xl px-3.5 py-2.5 transition-opacity duration-300"
              style={{ backgroundColor: "var(--color-surface-alt)", opacity: ocurrido ? 1 : 0.45 }}
            >
              <span
                className="font-mono-data text-xs font-bold pt-0.5 shrink-0"
                style={{ color: "var(--color-demo)" }}
              >
                {formatoTiempo(e.t)}
              </span>
              <span className="text-sm min-w-0" style={{ color: "var(--color-text)" }}>
                {e.tramo && <strong>Tramo {e.tramo}: </strong>}
                {e.estadoAnterior && e.estado
                  ? `${e.estadoAnterior} → ${e.estado}`
                  : (e.estado ?? e.descripcion ?? "Evento")}
                {e.descripcion && e.estado && (
                  <span style={{ color: "var(--color-text-muted)" }}> · {e.descripcion}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SensoresVirtuales({ sensores, t, unidad }) {
  const recientes = useMemo(() => {
    const hasta = [];
    for (const s of sensores) {
      if (s.t > t) break;
      hasta.push(s);
    }
    return hasta.slice(-6).reverse();
  }, [sensores, t]);
  if (sensores.length === 0) return null;

  return (
    <section
      className="rounded-3xl border p-5 sm:p-6 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h2 className="font-display text-lg flex items-center gap-2">
        Sensores virtuales <ChipSim />
      </h2>
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Mensajes generados por el simulador (RF09). No son sensores instalados en el río, y su marca de hora
        es sintética.
      </p>
      {recientes.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Reproduce el escenario para ver los mensajes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="off">
          {recientes.map((s, i) => (
            <li
              key={`${s.sensor}-${s.secuencia}-${s.t}-${i}`}
              className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm"
              style={{ backgroundColor: "var(--color-surface-alt)" }}
            >
              <ChipSim />
              <span className="font-semibold truncate min-w-0" style={{ color: "var(--color-text)" }}>
                {s.sensor}
                {s.secuencia !== null && (
                  <span style={{ color: "var(--color-text-muted)" }}> · #{s.secuencia}</span>
                )}
              </span>
              <span
                className="ml-auto font-mono-data font-bold shrink-0"
                style={{ color: "var(--color-title)" }}
              >
                {Number.isFinite(s.medicion) ? `${formatoNumero(s.medicion)} ${unidad}` : "—"}
              </span>
              <span className="font-mono-data text-xs shrink-0" style={{ color: "var(--color-demo)" }}>
                {formatoTiempo(s.t)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const CONTROLES = [
  { id: "lluvia", etiqueta: "Lluvia", min: 0, max: 150, paso: 1, unidad: (v) => `${v} mm/h` },
  {
    id: "duracion",
    etiqueta: "Duración de la lluvia",
    min: 15,
    max: 360,
    paso: 15,
    unidad: (v) =>
      v >= 60 ? `${(v / 60).toLocaleString("es-PE", { maximumFractionDigits: 2 })} h` : `${v} min`,
  },
  { id: "caudal", etiqueta: "Caudal de cabecera", min: 0, max: 200, paso: 1, unidad: (v) => `${v} m³/s` },
  {
    id: "obstruccion",
    etiqueta: "Obstrucción en tramo bajo",
    min: 0,
    max: 90,
    paso: 5,
    unidad: (v) => `${v} %`,
  },
  {
    id: "transito",
    etiqueta: "Tiempo de tránsito entre tramos",
    min: 0,
    max: 600,
    paso: 30,
    unidad: (v) => `${v} s`,
  },
];

function PanelEscenario({ escenario, params, onEscenario, onCambio }) {
  const [abierto, setAbierto] = useState(true);
  return (
    <section
      className="rounded-3xl border p-5 flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      aria-labelledby="titulo-escenario"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-escenario" className="font-display text-lg flex items-center gap-2">
          Escenario <ChipSim />
        </h2>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="lg:hidden min-h-[40px] px-3 rounded-full text-xs font-bold"
          style={{ backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }}
        >
          {abierto ? "Ocultar controles" : "Ajustar"}
        </button>
      </div>
      <div className={`${abierto ? "flex" : "hidden"} lg:flex flex-col gap-4`}>
        <label className="flex flex-col gap-1.5 text-sm font-bold" htmlFor="escenario-didactico">
          Escenario didáctico
          <select
            id="escenario-didactico"
            value={escenario}
            onChange={(e) => onEscenario(e.target.value)}
            className="min-h-[46px] rounded-2xl border px-3 font-bold"
            style={{
              backgroundColor: "var(--color-surface-alt)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {Object.entries(ESCENARIOS).map(([id, e]) => (
              <option key={id} value={id}>
                {e.nombre}
              </option>
            ))}
            <option value="personalizado">Personalizado</option>
          </select>
        </label>
        {CONTROLES.map((c) => (
          <label key={c.id} htmlFor={`ctrl-${c.id}`} className="flex flex-col gap-1 text-sm font-bold">
            <span className="flex justify-between gap-2">
              {c.etiqueta}
              <output className="font-mono-data" style={{ color: "var(--color-demo)" }}>
                {c.unidad(params[c.id])}
              </output>
            </span>
            <input
              id={`ctrl-${c.id}`}
              type="range"
              min={c.min}
              max={c.max}
              step={c.paso}
              value={params[c.id]}
              onChange={(e) => onCambio({ [c.id]: Number(e.target.value) })}
              className="w-full min-h-[32px] accent-[var(--color-demo)]"
            />
          </label>
        ))}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">Planicie lateral</span>
          <div
            className="grid grid-cols-2 gap-1 rounded-2xl p-1"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            {[
              [true, "Guarda agua"],
              [false, "Solo geometría"],
            ].map(([valor, texto]) => (
              <button
                key={texto}
                type="button"
                aria-pressed={params.acoplado === valor}
                onClick={() => onCambio({ acoplado: valor })}
                className="min-h-[40px] rounded-xl text-xs font-bold"
                style={
                  params.acoplado === valor
                    ? { backgroundColor: "var(--color-surface)", color: "var(--color-title)" }
                    : { color: "var(--color-text-muted)" }
                }
              >
                {texto}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            "Guarda agua": el desborde se queda en la planicie y vuelve al río despacio.
          </p>
        </div>
      </div>
    </section>
  );
}

// Web: descarga el archivo. App Android: el WebView no descarga, se copia.
async function exportarJSON(contrato, nombre) {
  const texto = JSON.stringify(contrato, null, 2);
  if (esAppNativa) {
    await navigator.clipboard.writeText(texto);
    return "copiado";
  }
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "descargado";
}

function Laboratorio() {
  const [modo, setModo] = useState("crear"); // crear | archivo
  const [escenario, setEscenario] = useState("extrema");
  const [params, setParams] = useState({ ...ESCENARIOS.extrema, acoplado: true });
  const [cargado, setCargado] = useState(null); // { simulacion, avisos, nombre }
  const [t, setT] = useState(null); // null = instante inicial sugerido
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const [avisoExportar, setAvisoExportar] = useState(null);

  // Motor propio: se recalcula al mover cualquier control (unos milisegundos).
  const creado = useMemo(() => {
    if (modo !== "crear") return null;
    const nombre = ESCENARIOS[escenario]?.nombre ?? "Personalizado";
    const contrato = aContrato(simularRio(params), params, nombre);
    const lectura = leerSimulacion(JSON.stringify(contrato));
    return lectura.ok ? { ...lectura, contrato, nombre: `Motor Piura Alerta · ${nombre}` } : null;
  }, [modo, escenario, params]);

  const actual = modo === "crear" ? creado : cargado;
  const simulacion = actual?.simulacion;
  const duracion = simulacion?.duracion ?? 0;

  // Sin tiempo elegido, arranca en el pico del tramo bajo: así la ciudad ya
  // muestra la crecida (y el desborde, si lo hay) sin tener que reproducir.
  const tInicial = useMemo(() => {
    if (!simulacion) return 0;
    const bajo = simulacion.tramos[simulacion.tramos.length - 1];
    let pico = null;
    for (const p of simulacion.series)
      if (p.tramo === bajo && p.nivel !== null && (!pico || p.nivel > pico.nivel)) pico = p;
    return pico ? Math.round(pico.t) : 0;
  }, [simulacion]);
  const tActual = Math.min(t ?? tInicial, duracion);

  useEffect(() => {
    if (!reproduciendo || !duracion) return undefined;
    let anterior = performance.now();
    let cuadro;
    const paso = (ahora) => {
      const dt = (ahora - anterior) / 1000;
      anterior = ahora;
      setT((previo) => {
        const siguiente = (previo ?? 0) + (dt * velocidad * duracion) / SEGUNDOS_POR_RECORRIDO;
        if (siguiente >= duracion) {
          setReproduciendo(false);
          return duracion;
        }
        return siguiente;
      });
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [reproduciendo, velocidad, duracion]);

  // Estado de la ciudad 3D en el instante actual.
  const vista3D = useMemo(() => {
    if (!simulacion) return null;
    const tramos = simulacion.tramos.slice(0, 3);
    while (tramos.length < 3) tramos.push(tramos[tramos.length - 1]);
    const niveles = tramos.map((tr) => valorEn(simulacion.series, tr, tActual)?.nivel ?? 0);
    const ultimo = valorEn(simulacion.series, tramos[2], tActual);
    return { niveles, lluvia: ultimo?.lluvia ?? 0, caudal: ultimo?.caudal ?? 0 };
  }, [simulacion, tActual]);

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setT(null);
    setReproduciendo(false);
  }

  function alCargar(resultado) {
    setCargado(resultado);
    setT(null);
    setReproduciendo(false);
  }

  function alternar() {
    if (!reproduciendo && tActual >= duracion) setT(0);
    else if (t === null) setT(tActual);
    setReproduciendo((r) => !r);
  }

  async function alExportar() {
    try {
      const resultado = await exportarJSON(creado.contrato, `piura_simulacion_${escenario}`);
      setAvisoExportar(resultado === "copiado" ? "JSON copiado al portapapeles." : "JSON descargado.");
    } catch {
      setAvisoExportar("No se pudo exportar el archivo en este dispositivo.");
    }
    setTimeout(() => setAvisoExportar(null), 2500);
  }

  const graficos = [
    ["Nivel relativo", simulacion?.metadata.nivel_unidad ?? "m", "nivel"],
    ["Caudal", simulacion?.metadata.caudal_unidad ?? "m³/s", "caudal"],
    ["Superficie lateral", simulacion?.metadata.area_unidad ?? "m²", "area"],
  ];

  const resultados = simulacion && (
    <>
      <Reproductor
        t={tActual}
        duracion={duracion}
        reproduciendo={reproduciendo}
        velocidad={velocidad}
        onAlternar={alternar}
        onReiniciar={() => {
          setReproduciendo(false);
          setT(0);
        }}
        onBuscar={(v) => {
          setReproduciendo(false);
          setT(v);
        }}
        onVelocidad={setVelocidad}
      />
      {vista3D && <CiudadPiura3D niveles={vista3D.niveles} lluvia={vista3D.lluvia} caudal={vista3D.caudal} />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {simulacion.tramos.map((tramo, i) => (
          <TarjetaTramo key={tramo} tramo={tramo} indice={i} simulacion={simulacion} t={tActual} />
        ))}
      </div>
      <section
        className="rounded-3xl border p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-6"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {graficos.map(([titulo, unidad, campo]) => (
          <GraficoTramos
            key={campo}
            titulo={titulo}
            unidad={unidad}
            campo={campo}
            series={simulacion.series}
            tramos={simulacion.tramos}
            t={tActual}
            duracion={duracion}
          />
        ))}
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Eventos eventos={simulacion.eventos} t={tActual} />
        <SensoresVirtuales
          sensores={simulacion.sensores}
          t={tActual}
          unidad={simulacion.metadata.nivel_unidad ?? "m"}
        />
      </div>
    </>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8 flex flex-col gap-6">
      <section className="pa-entra">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-demo)" }}
        >
          Laboratorio · Demostración
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Simulación del río</h1>
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Elige una lluvia y mira cómo la crecida baja por el río y llega a la ciudad. Sirve para aprender y
          comunicar, no para saber cómo está el río hoy: para eso mira Inicio y el Mapa.
        </p>
      </section>

      <FranjaSimulacion />

      <div className="flex gap-2" role="tablist" aria-label="Origen de la simulación">
        {[
          ["crear", "Crear escenario"],
          ["archivo", "Cargar archivo JSON"],
        ].map(([id, texto]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={modo === id}
            onClick={() => cambiarModo(id)}
            className="min-h-[44px] px-4 rounded-full text-sm font-bold transition-colors"
            style={
              modo === id
                ? { backgroundColor: "var(--color-demo)", color: "#ffffff" }
                : { backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }
            }
          >
            {texto}
          </button>
        ))}
      </div>

      {modo === "crear" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          <div className="flex flex-col gap-3 lg:sticky lg:top-6">
            <PanelEscenario
              escenario={escenario}
              params={params}
              onEscenario={(id) => {
                setEscenario(id);
                if (ESCENARIOS[id]) setParams((p) => ({ ...p, ...ESCENARIOS[id] }));
                setT(null);
              }}
              onCambio={(cambio) => {
                setEscenario("personalizado");
                setParams((p) => ({ ...p, ...cambio }));
              }}
            />
            <button
              type="button"
              onClick={alExportar}
              disabled={!creado}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold"
              style={{ backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }}
            >
              <FileJson size={16} aria-hidden="true" />
              {esAppNativa ? "Copiar JSON del escenario" : "Descargar JSON del escenario"}
            </button>
            {avisoExportar && (
              <p className="text-xs text-center" role="status" style={{ color: "var(--color-text-muted)" }}>
                {avisoExportar}
              </p>
            )}
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Motor propio de Piura Alerta: escorrentía, tránsito Muskingum y nivel por Manning, con un cauce
              idealizado. No está calibrado con el río real.
            </p>
          </div>
          <div className="flex flex-col gap-6 min-w-0">{resultados}</div>
        </div>
      ) : !cargado ? (
        <CargarArchivo onCargado={alCargar} />
      ) : (
        <>
          <FichaEscenario
            metadata={cargado.simulacion.metadata}
            nombre={cargado.nombre}
            avisos={cargado.avisos}
            onOtro={() => setCargado(null)}
          />
          {resultados}
        </>
      )}

      {URL_SIMULADOR && (
        <a
          href={URL_SIMULADOR}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--color-demo-soft)", color: "var(--color-demo)" }}
        >
          Abrir PiuraAlertaSim (vista 2.5D) <ExternalLink size={15} aria-hidden="true" />
        </a>
      )}
    </main>
  );
}

export default Laboratorio;
