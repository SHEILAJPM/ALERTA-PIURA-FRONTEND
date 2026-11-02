// Base compartida de exportarReportes.js y exportarHistorial.js: CSV que Excel
// abre bien en español y "PDF" vía la ventana de impresión del navegador
// (Guardar como PDF) -- evita sumar una librería de PDF de cientos de KB para
// una tabla simple que solo usa el panel operativo.

function celdaCSV(valor) {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  // Un reporte ciudadano que empiece con "=", "+", "-" o "@" Excel lo
  // ejecutaría como fórmula al abrir el CSV: el apóstrofo lo deja como texto.
  if (typeof valor === "string" && /^[=+\-@]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function nombreConFecha(base, extension) {
  const hoy = new Date().toISOString().slice(0, 10);
  return `${base}-${hoy}.${extension}`;
}

function descargar(contenido, nombre, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// columnas: [{ titulo, valor: (fila) => any }]
// Separador ";" + BOM UTF-8: Excel con configuración regional de Perú usa la
// coma como separador decimal y, sin el BOM, rompe las tildes.
export function exportarCSV(filas, columnas, nombreBase) {
  const lineas = [
    columnas.map((c) => celdaCSV(c.titulo)).join(";"),
    ...filas.map((fila) => columnas.map((c) => celdaCSV(c.valor(fila))).join(";")),
  ];
  descargar(`\uFEFF${lineas.join("\r\n")}`, nombreConFecha(nombreBase, "csv"), "text/csv;charset=utf-8");
}

function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportarPDF(filas, columnas, titulo) {
  const ventana = window.open("", "_blank");
  if (!ventana) {
    alert("El navegador bloqueó la ventana. Permite ventanas emergentes para exportar a PDF.");
    return;
  }
  const encabezado = columnas.map((c) => `<th>${escaparHTML(c.titulo)}</th>`).join("");
  const cuerpo = filas
    .map((fila) => `<tr>${columnas.map((c) => `<td>${escaparHTML(c.valor(fila))}</td>`).join("")}</tr>`)
    .join("");
  const generado = new Date().toLocaleString("es-PE");

  ventana.document.write(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${escaparHTML(titulo)}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #16232c; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; color: #0a2f52; }
  p { font-size: 12px; color: #5b6b76; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #e2e8ee; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #eef2f5; }
  tr { break-inside: avoid; }
</style></head>
<body>
  <h1>${escaparHTML(titulo)}</h1>
  <p>Río Piura Alerta · generado el ${escaparHTML(generado)} · ${filas.length} registros</p>
  <table><thead><tr>${encabezado}</tr></thead><tbody>${cuerpo}</tbody></table>
</body></html>`);
  ventana.document.close();
  ventana.focus();
  ventana.print();
}
