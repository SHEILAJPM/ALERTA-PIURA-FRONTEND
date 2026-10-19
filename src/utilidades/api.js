import { obtenerTokenGuardado, dispararSesionExpirada } from "../contexto/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const SENSOR_POR_DEFECTO = "RIO-PIURA-01";

// Error con el status HTTP adjunto: algunos llamadores necesitan distinguir
// un 404 "todavía no hay datos" (ej. sensor sin lecturas) de una falla real.
export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

async function apiFetch(path, options) {
  const token = obtenerTokenGuardado();
  const headers = { "Content-Type": "application/json", ...options?.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Sin conexión con el servidor", 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    if (res.status === 401 && token) {
      dispararSesionExpirada();
    }

    throw new ApiError(body.error ?? `Error ${res.status} al consultar ${path}`, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

function enviar(path, metodo, datos) {
  return apiFetch(path, { method: metodo, body: datos === undefined ? undefined : JSON.stringify(datos) });
}

function query(params) {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== false) busqueda.set(clave, String(valor));
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : "";
}

// --- Salud y sensores ------------------------------------------------------

export function getSalud() {
  return apiFetch("/health");
}

export function getSensores() {
  return apiFetch("/api/sensores");
}

export function getEstadoSensores() {
  return apiFetch("/api/sensores/estado");
}

export function crearSensor(datos) {
  return enviar("/api/sensores", "POST", datos);
}

export function actualizarCalibracionSensor(id, umbrales) {
  return enviar(`/api/sensores/${id}`, "PATCH", umbrales);
}

export function actualizarActivoSensor(id, activo) {
  return enviar(`/api/sensores/${id}/activo`, "PATCH", { activo });
}

// --- Lecturas --------------------------------------------------------------

export function getUltimaLectura(sensorCodigo = SENSOR_POR_DEFECTO) {
  return apiFetch(`/api/lecturas/ultima${query({ sensor: sensorCodigo })}`);
}

export function getHistorico(sensorCodigo = SENSOR_POR_DEFECTO, minutos = 180) {
  return apiFetch(`/api/lecturas${query({ sensor: sensorCodigo, minutos })}`);
}

// --- Mapa: albergues y zonas de riesgo -------------------------------------

export function getAlbergues() {
  return apiFetch("/api/albergues");
}

export function crearAlbergue(datos) {
  return enviar("/api/albergues", "POST", datos);
}

export function actualizarOcupacionAlbergue(id, ocupacionActual) {
  return enviar(`/api/albergues/${id}/ocupacion`, "PATCH", { ocupacion_actual: ocupacionActual });
}

export function eliminarAlbergue(id) {
  return enviar(`/api/albergues/${id}`, "DELETE");
}

export function getZonasRiesgo() {
  return apiFetch("/api/zonas-riesgo");
}

// --- Reportes ciudadanos ---------------------------------------------------

export function getReportes({
  limite = 30,
  conFoto = false,
  antes,
  soloMios = false,
  incluirArchivados = false,
} = {}) {
  return apiFetch(
    `/api/reportes-ciudadanos${query({ limite, conFoto, antes, soloMios, incluirArchivados })}`
  );
}

export function crearReporte({ autor_nombre, descripcion, foto_url, lon, lat }) {
  return enviar("/api/reportes-ciudadanos", "POST", { autor_nombre, descripcion, foto_url, lon, lat });
}

export function darLike(reporteId) {
  return enviar(`/api/reportes-ciudadanos/${reporteId}/like`, "POST");
}

export function confirmarReporte(reporteId) {
  return enviar(`/api/reportes-ciudadanos/${reporteId}/confirmar`, "POST");
}

export function actualizarEstadoReporte(reporteId, estado) {
  return enviar(`/api/reportes-ciudadanos/${reporteId}/estado`, "PATCH", { estado });
}

// --- Autenticación y perfil ------------------------------------------------

export function registrarUsuario(datos) {
  return enviar("/api/auth/registro", "POST", datos);
}

export function iniciarSesion({ correo, password }) {
  return enviar("/api/auth/login", "POST", { correo, password });
}

export function verificarCodigo2FA({ referencia, codigo }) {
  return enviar("/api/auth/verificar-2fa", "POST", { referencia, codigo });
}

export function obtenerPerfil() {
  return apiFetch("/api/auth/yo");
}

export function actualizarPerfil(datos) {
  return enviar("/api/auth/yo", "PATCH", datos);
}

export function cambiarPassword({ passwordActual, passwordNueva }) {
  return enviar("/api/auth/contrasena", "PATCH", { passwordActual, passwordNueva });
}

export function olvidarPassword(correo) {
  return enviar("/api/auth/olvide-password", "POST", { correo });
}

export function restablecerPassword({ token, passwordNueva }) {
  return enviar("/api/auth/restablecer-password", "POST", { token, passwordNueva });
}

export function verificarCorreo(token) {
  return enviar("/api/auth/verificar-correo", "POST", { token });
}

export function reenviarVerificacionCorreo() {
  return enviar("/api/auth/reenviar-verificacion", "POST");
}

// --- Alertas, SOS y chequeos de seguridad ----------------------------------

export function getHistorialAlertas(limite = 30) {
  return apiFetch(`/api/alertas/historial${query({ limite })}`);
}

export function difundirAlertaManual(mensaje) {
  return enviar("/api/alertas/difundir", "POST", { mensaje });
}

export function enviarSOS({ lon, lat, nombre_contacto, telefono_contacto }) {
  return enviar("/api/sos", "POST", { lon, lat, nombre_contacto, telefono_contacto });
}

export function getAlertasSOS({ incluirAtendidas = false } = {}) {
  return apiFetch(`/api/sos${query({ incluirAtendidas })}`);
}

export function actualizarEstadoSOS(id, estado) {
  return enviar(`/api/sos/${id}/estado`, "PATCH", { estado });
}

export function marcarEstoyASalvo() {
  return enviar("/api/chequeos-seguridad", "POST");
}

export function getMiUltimoChequeo() {
  return apiFetch("/api/chequeos-seguridad/mio");
}

export function getChequeosSeguridad() {
  return apiFetch("/api/chequeos-seguridad");
}

// --- Panel operativo -------------------------------------------------------

export function getUsuarios() {
  return apiFetch("/api/usuarios");
}

export function actualizarRolUsuario(id, rol) {
  return enviar(`/api/usuarios/${id}/rol`, "PATCH", { rol });
}

export function actualizarActivoUsuario(id, activo) {
  return enviar(`/api/usuarios/${id}/activo`, "PATCH", { activo });
}

export function getAuditoria(limite = 100) {
  return apiFetch(`/api/auditoria${query({ limite })}`);
}

export function getTickets() {
  return apiFetch("/api/tickets");
}

export function crearTicket(datos) {
  return enviar("/api/tickets", "POST", datos);
}

export function actualizarEstadoTicket(id, estado) {
  return enviar(`/api/tickets/${id}/estado`, "PATCH", { estado });
}

export function getImpacto() {
  return apiFetch("/api/impacto");
}

export function getConfiguracion() {
  return apiFetch("/api/configuracion");
}

export function actualizarConfiguracion(cambios) {
  return enviar("/api/configuracion", "PATCH", cambios);
}

// --- Seguro ----------------------------------------------------------------

export function getPlanesSeguro() {
  return apiFetch("/api/polizas/planes");
}

export function getTopesIndemnizacion() {
  return apiFetch("/api/reclamos-seguro/topes");
}

export function getMiPoliza() {
  return apiFetch("/api/polizas/mia");
}

export function getPolizas() {
  return apiFetch("/api/polizas");
}

export function crearCheckoutSeguro(meses) {
  return enviar("/api/polizas/checkout", "POST", { meses });
}

export function crearReclamoSeguro({ fecha_dano, descripcion, foto_urls }) {
  return enviar("/api/reclamos-seguro", "POST", { fecha_dano, descripcion, foto_urls });
}

export function getMisReclamosSeguro() {
  return apiFetch("/api/reclamos-seguro/mios");
}

export function getReclamosSeguro() {
  return apiFetch("/api/reclamos-seguro");
}

export function revisarReclamoSeguro(id, datos) {
  return enviar(`/api/reclamos-seguro/${id}/estado`, "PATCH", datos);
}

// --- Asistente IA ----------------------------------------------------------

export function preguntarAsistente(pregunta, historial = []) {
  return enviar("/api/asistente/preguntar", "POST", { pregunta, historial });
}

export function enviarFeedbackAsistente({ pregunta, respuesta, util }) {
  return enviar("/api/asistente/feedback", "POST", { pregunta, respuesta, util });
}

export function getFeedbackAsistente() {
  return apiFetch("/api/asistente/feedback");
}

// --- Notificaciones push ---------------------------------------------------

export function obtenerClavePublicaPush() {
  return apiFetch("/api/push/clave-publica");
}

export function suscribirPush(subscription) {
  return enviar("/api/push/suscribir", "POST", subscription);
}

export function desuscribirPush(endpoint) {
  return enviar("/api/push/desuscribir", "POST", { endpoint });
}
