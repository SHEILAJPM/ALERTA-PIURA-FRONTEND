// Motor propio de simulación CONCEPTUAL (L0) del río para el Laboratorio.
// Didáctico: muestra cómo una lluvia se convierte en crecida que baja por tres
// tramos idealizados (ALTO, MEDIO, BAJO). No está calibrado con el río real ni
// es un pronóstico, y nunca se conecta a sensores, alertas ni notificaciones.
//
// Cadena de cálculo (métodos hidrológicos estándar):
//   lluvia -> escorrentía (método racional + embalse lineal)
//   -> tránsito entre tramos (Muskingum)
//   -> nivel desde el caudal (Manning, sección rectangular)
//   -> desborde a la planicie lateral (vertedero) que guarda agua y la devuelve.
// Los parámetros del cauce son supuestos ilustrativos, no medidas de Piura.

export const TRAMOS = ["ALTO", "MEDIO", "BAJO"];
export const DT = 30; // s
export const DURACION_TOTAL = 6 * 3600; // s
export const PASOS = DURACION_TOTAL / DT;

export const CAUCE = {
  largoTramo: 3000, // m
  ancho: 45, // m
  pendiente: 0.0012,
  manning: 0.035,
  ribera: 3.0, // m sobre el lecho
};
const A_TRIBUTARIA_KM2 = [30, 25, 20];
const C_ESCORRENTIA = 0.55;
const K_ESCORRENTIA = 1200; // s
const X_MUSKINGUM = 0.2;

// Umbrales del MODELO (no los del sensor real).
export const UMBRAL_PREALERTA = 2.0;
export const UMBRAL_ALERTA = 2.7;

export const ESCENARIOS = {
  normal: { nombre: "Normal", lluvia: 8, duracion: 120, caudal: 25, obstruccion: 0, transito: 240 },
  fuerte: { nombre: "Lluvia fuerte", lluvia: 45, duracion: 180, caudal: 60, obstruccion: 0, transito: 240 },
  extrema: {
    nombre: "Lluvia extrema",
    lluvia: 110,
    duracion: 240,
    caudal: 120,
    obstruccion: 10,
    transito: 300,
  },
  obstruccion: {
    nombre: "Cauce obstruido",
    lluvia: 40,
    duracion: 180,
    caudal: 60,
    obstruccion: 60,
    transito: 240,
  },
};

export function nivelDesdeCaudal(caudal, ancho = CAUCE.ancho) {
  if (!(caudal > 0)) return 0;
  let bajo = 0;
  let alto = 25;
  for (let i = 0; i < 60; i++) {
    const h = (bajo + alto) / 2;
    const area = ancho * h;
    const radio = area / (ancho + 2 * h);
    const q = (1 / CAUCE.manning) * area * Math.pow(radio, 2 / 3) * Math.sqrt(CAUCE.pendiente);
    if (q > caudal) alto = h;
    else bajo = h;
  }
  return (bajo + alto) / 2;
}

// params: { lluvia (mm/h), duracion (min), caudal (m3/s), obstruccion (%),
// transito (s), acoplado (bool: la planicie guarda agua) }
export function simularRio(params) {
  const { lluvia, duracion, caudal, obstruccion, transito, acoplado = true } = params;
  const K = transito;
  const D = K * (1 - X_MUSKINGUM) + 0.5 * DT;
  const c0 = (-K * X_MUSKINGUM + 0.5 * DT) / D;
  const c1 = (K * X_MUSKINGUM + 0.5 * DT) / D;
  const c2 = (K * (1 - X_MUSKINGUM) - 0.5 * DT) / D;
  // Con K < DT los coeficientes de Muskingum se vuelven inestables: el agua
  // pasa directo al tramo siguiente.
  const usarMuskingum = K >= DT;

  const escorrentia = [0, 0, 0];
  const entradaPrevia = [caudal, caudal, caudal];
  const salidaPrevia = [caudal, caudal, caudal];
  const volumen = [0, 0, 0];
  const res = { h: [[], [], []], q: [[], [], []], area: [[], [], []], volumen: [[], [], []], lluvia: [] };

  for (let n = 0; n <= PASOS; n++) {
    const t = n * DT;
    const i = t < duracion * 60 ? lluvia : 0;
    res.lluvia.push(i);
    let aguasArriba = caudal;
    for (let k = 0; k < 3; k++) {
      const equilibrio = (C_ESCORRENTIA * i * A_TRIBUTARIA_KM2[k]) / 3.6;
      escorrentia[k] += (equilibrio - escorrentia[k]) * (DT / K_ESCORRENTIA);
      const entrada = aguasArriba + escorrentia[k];
      let salida = usarMuskingum ? c0 * entrada + c1 * entradaPrevia[k] + c2 * salidaPrevia[k] : entrada;
      salida = Math.max(0, salida);
      entradaPrevia[k] = entrada;
      salidaPrevia[k] = salida;

      const ancho = k === 2 ? CAUCE.ancho * (1 - obstruccion / 100) : CAUCE.ancho;
      let h = nivelDesdeCaudal(salida, ancho);
      let area;
      if (acoplado) {
        let aPlanicie = 0;
        let devuelto = 0;
        if (h > CAUCE.ribera) aPlanicie = Math.min(0.6 * salida, 1.7 * 220 * Math.pow(h - CAUCE.ribera, 1.5));
        else if (volumen[k] > 0) devuelto = Math.min(volumen[k] / DT, volumen[k] / 2400);
        volumen[k] = Math.max(0, volumen[k] + (aPlanicie - devuelto) * DT);
        const enCauce = salida - aPlanicie + devuelto;
        h = nivelDesdeCaudal(enCauce, ancho);
        area = volumen[k] / 0.6; // lámina media de 0,6 m sobre la planicie
        aguasArriba = enCauce;
      } else {
        area = h > CAUCE.ribera ? (h - CAUCE.ribera) * CAUCE.largoTramo * 40 : 0;
        aguasArriba = salida;
      }
      res.h[k].push(h);
      res.q[k].push(aguasArriba);
      res.area[k].push(area);
      res.volumen[k].push(volumen[k]);
    }
  }
  return res;
}

export function estadoModelo(h) {
  if (h >= UMBRAL_ALERTA) return "ALERTA";
  if (h >= UMBRAL_PREALERTA) return "PREALERTA";
  return "NORMAL";
}

// Convierte el resultado al contrato piura.simulation.v1 (el mismo que exporta
// PiuraAlertaSim), así el Laboratorio lo trata igual que un archivo cargado.
// Se guarda un registro por minuto simulado.
export function aContrato(res, params, nombreEscenario = "Personalizado") {
  const series = [];
  const estados = [];
  const eventos = [];
  const sensores = [];
  const previo = {};
  for (let n = 0; n <= PASOS; n += 2) {
    const tiempo = n * DT;
    TRAMOS.forEach((tramo, k) => {
      const nivel = Number(res.h[k][n].toFixed(3));
      series.push({
        tiempo_s: tiempo,
        tramo_id: tramo,
        nivel_m: nivel,
        caudal_m3s: Number(res.q[k][n].toFixed(2)),
        area_m2: Math.round(res.area[k][n]),
        lluvia_mm_h: res.lluvia[n],
      });
      const estado = estadoModelo(nivel);
      estados.push({ tiempo_s: tiempo, tramo_id: tramo, estado });
      if (previo[tramo] && previo[tramo] !== estado) {
        eventos.push({
          tiempo_s: tiempo,
          tramo_id: tramo,
          estado_anterior: previo[tramo],
          estado_nuevo: estado,
        });
      }
      previo[tramo] = estado;
      sensores.push({
        sensor_id: `SIM-${tramo}-01`,
        secuencia: n / 2,
        // Origen sintético fijo, como en PiuraAlertaSim: no es una hora real.
        timestamp_utc: new Date(Date.UTC(2000, 0, 1) + tiempo * 1000).toISOString(),
        tiempo_s: tiempo,
        tramo_id: tramo,
        medicion: { nivel_m: nivel },
      });
    });
  }
  return {
    metadata: {
      schema: "piura.simulation.v1",
      version_prototipo: "piura-alerta-motor-1",
      escenario: nombreEscenario,
      origen: "simulacion",
      fidelidad: "L0_conceptual_no_pronostico",
      uso_permitido: "laboratorio_demo_aislado",
      apto_para_alerta_publica: false,
      georreferenciado: false,
      tiempo_unidad: "s",
      nivel_unidad: "m",
      caudal_unidad: "m3/s",
      area_unidad: "m2",
      parametros: { ...params },
    },
    tramos: TRAMOS.map((tramo_id) => ({ tramo_id, naturaleza: "sector_conceptual" })),
    series,
    estados,
    eventos,
    sensores,
  };
}
