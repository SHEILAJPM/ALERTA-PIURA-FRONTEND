// Semanas en que se muestran los consejos de salud tras una inundación.
const DIAS_VIGENCIA = 21;

// ¿El río acaba de volver a la normalidad después de una prealerta o alerta
// roja? Mira el cambio de estado más reciente del historial público.
export function rioRecienNormalizado(eventos, ahora = Date.now()) {
  const ultimo = eventos?.[0];
  if (!ultimo || ultimo.estado_nuevo !== "normal") return false;
  if (!["prealerta", "alerta_roja"].includes(ultimo.estado_anterior)) return false;
  const dias = (ahora - new Date(ultimo.iniciado_en).getTime()) / 86_400_000;
  return dias >= 0 && dias <= DIAS_VIGENCIA;
}
