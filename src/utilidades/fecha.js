// Formatos de fecha/hora de toda la app, en un solo lugar y siempre en
// español de Perú. Todos aceptan ISO string o Date y devuelven "—" si el
// valor falta o es inválido (ej. un sensor que todavía no tiene lecturas),
// así ningún componente tiene que chequear null antes de formatear.
const LOCALE = "es-PE";

function aFecha(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatear(valor, opciones) {
  const fecha = aFecha(valor);
  return fecha ? fecha.toLocaleString(LOCALE, opciones) : "—";
}

// 14:05
export function formatearHora(valor) {
  return formatear(valor, { hour: "2-digit", minute: "2-digit" });
}

// 19 oct. 2026
export function formatearFecha(valor) {
  return formatear(valor, { day: "2-digit", month: "short", year: "numeric" });
}

// 19 oct., 14:05
export function formatearFechaHora(valor) {
  return formatear(valor, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// 19 oct. 2026, 14:05
export function formatearFechaHoraCompleta(valor) {
  return formatear(valor, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 19 de octubre de 2026
export function formatearFechaLarga(valor) {
  return formatear(valor, { day: "numeric", month: "long", year: "numeric" });
}

// "ahora", "5 min", "3 h", "2 d", "1 sem" y, pasado un mes, "19 oct.". Antes
// estaba copiado en ReportCard.jsx y (con otra variante) en Telemetria.jsx.
export function formatearTiempoRelativo(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return "—";
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `${dias} d`;
  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return `${semanas} sem`;
  return formatear(fecha, { day: "2-digit", month: "short" });
}
