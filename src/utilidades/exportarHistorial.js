import { exportarCSV, exportarPDF } from "./exportar";
import { formatearFechaHoraCompleta } from "./fecha";

const ESTADO = { normal: "Normal", prealerta: "Prealerta", alerta_roja: "Alerta roja" };

const COLUMNAS = [
  { titulo: "Fecha", valor: (e) => formatearFechaHoraCompleta(e.iniciado_en) },
  { titulo: "Sensor", valor: (e) => `${e.sensor_nombre} (${e.sensor_codigo})` },
  { titulo: "Estado anterior", valor: (e) => (e.estado_anterior ? ESTADO[e.estado_anterior] : "—") },
  { titulo: "Estado nuevo", valor: (e) => ESTADO[e.estado_nuevo] ?? e.estado_nuevo },
  { titulo: "Nivel (cm)", valor: (e) => e.nivel_cm },
];

export function exportarHistorialCSV(eventos) {
  exportarCSV(eventos, COLUMNAS, "historial-alertas");
}

export function exportarHistorialPDF(eventos) {
  exportarPDF(eventos, COLUMNAS, "Historial de eventos de alerta");
}
