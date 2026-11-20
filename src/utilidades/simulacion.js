// Lector del contrato piura.simulation.v1 (PiuraAlertaSim.DSNeuralRNAS 1.0.0).
//
// Es una SIMULACIÓN CONCEPTUAL L0, no un pronóstico ni lecturas reales: se
// usa solo en el Laboratorio (paginas/Laboratorio.jsx), aislado del resto de
// la app. Nada de lo que se lee acá se envía al backend, se guarda, ni toca
// sensores, alertas, notificaciones o indicadores reales.
//
// El informe del simulador fija los metadatos, pero no los nombres exactos de
// los campos dentro de series/estados/eventos/sensores: por eso cada dato se
// busca entre variantes razonables (CANDIDATOS) y el resultado informa qué
// campos no se reconocieron, para ajustar con el JSON real.

// Colores por tramo conceptual: no comunican gravedad (para eso están los
// estados), solo distinguen ALTO / MEDIO / BAJO.
export const COLOR_TRAMO = ["#1565C0", "#00897B", "#8E24AA", "#6D4C41"];

export const ESQUEMA = "piura.simulation.v1";
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // el JSON de ejemplo pesa ~330 KB
const LIMITES = { series: 100_000, estados: 50_000, eventos: 5_000, sensores: 50_000 };

const CANDIDATOS = {
  tiempo: ["tiempo_s", "t_s", "tiempo", "t"],
  tramo: ["tramo_id", "tramo", "sector_id", "sector"],
  nivel: ["nivel_m", "nivel_relativo_m", "nivel", "h_m"],
  caudal: ["caudal_m3s", "caudal_m3_s", "caudal", "q_m3s"],
  area: ["area_m2", "superficie_lateral_m2", "area_lateral_m2", "superficie_m2", "area"],
  estado: ["estado", "estado_nuevo", "estado_simulado", "nivel_alerta"],
  estadoAnterior: ["estado_anterior", "desde"],
  descripcion: ["descripcion", "mensaje", "detalle", "tipo"],
  sensor: ["sensor_id", "id_sensor", "sensor", "id"],
  secuencia: ["secuencia", "seq", "n"],
  marca: ["timestamp_utc", "tiempo_utc", "ts_utc", "timestamp", "fecha_utc"],
  medicion: ["medicion", "valor", "nivel_m", "nivel"],
  lluvia: ["lluvia_mm_h", "lluvia_mmh", "lluvia"],
};

function buscar(registro, clave) {
  if (!registro || typeof registro !== "object") return undefined;
  for (const nombre of CANDIDATOS[clave]) if (nombre in registro) return registro[nombre];
  return undefined;
}

// Número finito, null explícito (permitido por el contrato) o undefined si no vino.
function numeroONulo(valor) {
  if (valor === null || valor === undefined) return valor;
  const n = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
  return typeof n === "number" && Number.isFinite(n) ? n : NaN;
}

function medicionNumerica(valor) {
  if (valor && typeof valor === "object")
    return numeroONulo(buscar(valor, "medicion") ?? valor.nivel ?? valor.valor);
  return numeroONulo(valor);
}

// Metadatos críticos: si alguno no coincide, el archivo se rechaza. Garantizan
// que lo cargado se declara a sí mismo como simulación no apta para alertas.
function validarMetadatos(m) {
  const errores = [];
  if (!m || typeof m !== "object") return ["Falta el bloque metadata."];
  if (m.schema !== ESQUEMA)
    errores.push(`El esquema debe ser "${ESQUEMA}" (llegó "${m.schema ?? "ninguno"}").`);
  if (m.origen !== "simulacion") errores.push('metadata.origen debe ser "simulacion".');
  if (m.apto_para_alerta_publica !== false)
    errores.push(
      "metadata.apto_para_alerta_publica debe ser false: un escenario de laboratorio no puede alertar."
    );
  if (m.georreferenciado !== false)
    errores.push(
      "metadata.georreferenciado debe ser false: los tramos son conceptuales, no ubicaciones reales."
    );
  return errores;
}

function lista(datos, nombre, errores, obligatoria = false) {
  const valor = datos[nombre];
  if (valor === undefined || valor === null) {
    if (obligatoria) errores.push(`Falta la lista "${nombre}".`);
    return [];
  }
  if (!Array.isArray(valor)) {
    errores.push(`"${nombre}" debe ser una lista.`);
    return [];
  }
  if (valor.length > LIMITES[nombre]) {
    errores.push(`"${nombre}" tiene ${valor.length} registros; el máximo aceptado es ${LIMITES[nombre]}.`);
    return [];
  }
  return valor;
}

// Recibe el texto del archivo (y su tamaño en bytes). Devuelve
// { ok: true, simulacion, avisos } o { ok: false, errores }.
export function leerSimulacion(texto, bytes = texto?.length ?? 0) {
  if (bytes > TAMANO_MAXIMO_BYTES) {
    return { ok: false, errores: [`El archivo pesa más de ${TAMANO_MAXIMO_BYTES / 1024 / 1024} MB.`] };
  }
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    return { ok: false, errores: ["El archivo no es un JSON válido."] };
  }
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return { ok: false, errores: ["El JSON debe ser un objeto con metadata, series y demás bloques."] };
  }

  const errores = validarMetadatos(datos.metadata);
  const seriesCrudas = lista(datos, "series", errores, true);
  const estadosCrudos = lista(datos, "estados", errores);
  const eventosCrudos = lista(datos, "eventos", errores);
  const sensoresCrudos = lista(datos, "sensores", errores);
  if (errores.length) return { ok: false, errores };

  const series = [];
  for (let i = 0; i < seriesCrudas.length; i++) {
    const r = seriesCrudas[i];
    const t = numeroONulo(buscar(r, "tiempo"));
    const tramo = buscar(r, "tramo");
    const nivel = numeroONulo(buscar(r, "nivel"));
    const caudal = numeroONulo(buscar(r, "caudal"));
    const area = numeroONulo(buscar(r, "area"));
    // Opcional (no está en el contrato base): lluvia del instante, para dibujarla.
    const lluvia = numeroONulo(buscar(r, "lluvia"));
    if (typeof t !== "number" || Number.isNaN(t) || t < 0) {
      return {
        ok: false,
        errores: [`series[${i}]: falta el tiempo simulado en segundos (tiempo_s) o no es válido.`],
      };
    }
    if (typeof tramo !== "string" || !tramo) {
      return { ok: false, errores: [`series[${i}]: falta el identificador del tramo (tramo_id).`] };
    }
    if ([nivel, caudal, area].some((v) => Number.isNaN(v))) {
      return { ok: false, errores: [`series[${i}]: nivel, caudal y área deben ser números o null.`] };
    }
    series.push({
      t,
      tramo,
      nivel: nivel ?? null,
      caudal: caudal ?? null,
      area: area ?? null,
      lluvia: Number.isFinite(lluvia) ? lluvia : null,
    });
  }
  if (series.length === 0) return { ok: false, errores: ['La lista "series" está vacía.'] };
  series.sort((a, b) => a.t - b.t);

  const conTiempo = (r) => numeroONulo(buscar(r, "tiempo"));
  const estados = estadosCrudos
    .map((r) => ({
      t: conTiempo(r),
      tramo: buscar(r, "tramo") ?? null,
      estado: String(buscar(r, "estado") ?? ""),
    }))
    .filter((e) => Number.isFinite(e.t) && e.estado)
    .sort((a, b) => a.t - b.t);
  const eventos = eventosCrudos
    .map((r) => ({
      t: conTiempo(r),
      tramo: buscar(r, "tramo") ?? null,
      estado: buscar(r, "estado") ?? null,
      estadoAnterior: buscar(r, "estadoAnterior") ?? null,
      descripcion: buscar(r, "descripcion") ?? null,
    }))
    .filter((e) => Number.isFinite(e.t))
    .sort((a, b) => a.t - b.t);
  const sensores = sensoresCrudos
    .map((r) => ({
      t: conTiempo(r),
      tramo: buscar(r, "tramo") ?? null,
      sensor: String(buscar(r, "sensor") ?? "SIM"),
      secuencia: buscar(r, "secuencia") ?? null,
      marca: buscar(r, "marca") ?? null,
      medicion: medicionNumerica(buscar(r, "medicion")),
    }))
    .filter((s) => Number.isFinite(s.t))
    .sort((a, b) => a.t - b.t);

  // Tramos: los declarados en "tramos" (ALTO, MEDIO, BAJO), o los que aparecen en series.
  const declarados = Array.isArray(datos.tramos)
    ? datos.tramos.map((x) => (typeof x === "string" ? x : (buscar(x, "tramo") ?? x?.id))).filter(Boolean)
    : [];
  const tramos = declarados.length ? declarados : [...new Set(series.map((p) => p.tramo))];

  const avisos = [];
  if (series.every((p) => p.nivel === null))
    avisos.push("No se reconoció el nivel en series (se buscó nivel_m o nivel).");
  if (series.every((p) => p.caudal === null))
    avisos.push("No se reconoció el caudal en series (se buscó caudal_m3s o caudal).");
  if (estadosCrudos.length && estados.length === 0)
    avisos.push("Hay estados, pero no se reconocieron sus campos.");
  if (eventosCrudos.length && eventos.length === 0)
    avisos.push("Hay eventos, pero no se reconocieron sus campos.");
  if (sensoresCrudos.length && sensores.length === 0)
    avisos.push("Hay sensores virtuales, pero no se reconocieron sus campos.");

  return {
    ok: true,
    avisos,
    simulacion: {
      metadata: datos.metadata,
      tramos,
      series,
      estados,
      eventos,
      sensores,
      duracion: series[series.length - 1].t,
    },
  };
}

// Último valor conocido de un tramo hasta el instante t (lista ordenada por t).
export function valorEn(registros, tramo, t) {
  let encontrado = null;
  for (const r of registros) {
    if (r.t > t) break;
    if (tramo === null || r.tramo === tramo) encontrado = r;
  }
  return encontrado;
}

// Tono visual de un estado simulado, por palabras clave (el contrato no fija
// los nombres de estado). Solo para colorear el punto, siempre dentro del
// marco DEMO.
export function tonoEstado(estado) {
  const e = String(estado ?? "").toLowerCase();
  // "prealerta" contiene "alerta": se revisa antes que los estados críticos.
  if (/(prealerta|pre_alerta|amarill|advert|atenci|vigil)/.test(e)) return "advertencia";
  if (/(alerta|roja|rojo|critic|desborde|emergencia)/.test(e)) return "critico";
  if (/(normal|verde|estable|bajo)/.test(e)) return "normal";
  return "neutro";
}
