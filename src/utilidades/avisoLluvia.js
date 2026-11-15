// Un aviso de lluvia se sigue mostrando mientras sea reciente: el backend no
// repite el mismo aviso antes de 6 horas, así que pasado ese tiempo ya no
// describe lo que viene.
export const HORAS_VIGENCIA_AVISO = 6;

export function avisoVigente(aviso, ahora = Date.now()) {
  if (!aviso?.enviado_en) return false;
  const enviado = Date.parse(aviso.enviado_en);
  if (!Number.isFinite(enviado)) return false;
  return ahora - enviado < HORAS_VIGENCIA_AVISO * 60 * 60 * 1000;
}
