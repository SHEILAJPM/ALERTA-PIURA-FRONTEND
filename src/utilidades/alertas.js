const GRAVEDAD = { normal: 0, prealerta: 1, alerta_roja: 2 };

// De todos los sensores (ver GET /api/sensores/estado), el que está en el
// peor estado según su última lectura -- es el que define si hay que avisar
// en toda la app. A igual gravedad gana el de nivel más alto. Devuelve null
// si ninguno está en prealerta o alerta roja.
//
// Un sensor sin señal cuenta igual con su último dato: si se cayó estando en
// alerta roja, lo prudente es seguir avisando, no asumir que todo volvió a
// la normalidad.
export function sensorMasCritico(sensores) {
  let peor = null;
  for (const sensor of sensores ?? []) {
    const lectura = sensor.ultima_lectura;
    const gravedad = GRAVEDAD[lectura?.estado] ?? 0;
    if (gravedad === 0) continue;
    const gravedadPeor = peor ? GRAVEDAD[peor.ultima_lectura.estado] : 0;
    if (
      gravedad > gravedadPeor ||
      (gravedad === gravedadPeor && Number(lectura.nivel_cm) > Number(peor.ultima_lectura.nivel_cm))
    ) {
      peor = sensor;
    }
  }
  return peor;
}

export function esMasGrave(estadoNuevo, estadoAnterior) {
  return (GRAVEDAD[estadoNuevo] ?? 0) > (GRAVEDAD[estadoAnterior] ?? 0);
}
