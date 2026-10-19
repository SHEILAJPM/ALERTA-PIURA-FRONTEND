import { exportarCSV, exportarPDF } from "./exportar";
import { formatearFechaHoraCompleta } from "./fecha";

const ESTADO = { pendiente: "Pendiente", verificado: "Verificado", descartado: "Archivado" };

const COLUMNAS = [
  { titulo: "Fecha", valor: (r) => formatearFechaHoraCompleta(r.creado_en) },
  { titulo: "Autor", valor: (r) => r.usuario_nombre },
  { titulo: "Estado", valor: (r) => ESTADO[r.estado] ?? r.estado },
  { titulo: "Descripción", valor: (r) => r.descripcion },
  { titulo: "Me gusta", valor: (r) => r.likes_count ?? 0 },
  { titulo: "Confirmaciones", valor: (r) => r.confirmaciones_count ?? 0 },
  { titulo: "Posible spam (IA)", valor: (r) => (r.posible_spam ? "Sí" : "No") },
  {
    titulo: "Ubicación (lat, lon)",
    valor: (r) => {
      const [lon, lat] = r.ubicacion?.coordinates ?? [];
      return lat != null ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : "";
    },
  },
  { titulo: "Foto", valor: (r) => r.foto_url ?? "" },
];

export function exportarReportesCSV(reportes) {
  exportarCSV(reportes, COLUMNAS, "reportes-ciudadanos");
}

// En el PDF la URL de la foto no aporta (no se puede hacer clic en papel) y
// ensancha la tabla hasta volverla ilegible.
export function exportarReportesPDF(reportes) {
  exportarPDF(
    reportes,
    COLUMNAS.filter((c) => c.titulo !== "Foto"),
    "Reportes ciudadanos"
  );
}
