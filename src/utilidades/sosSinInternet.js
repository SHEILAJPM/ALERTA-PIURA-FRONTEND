// SOS sin internet: si el SOS no llega al servidor (sin datos móviles o con el
// servidor caído), el teléfono todavía puede mandar un SMS, que solo necesita
// señal de voz. El mensaje va a los contactos del plan familiar, que se
// guardan en el propio teléfono, así que no hace falta conexión para leerlos.

export function mensajeSOS(ubicacion) {
  const base = "SOS: necesito ayuda, estoy en peligro por la inundación.";
  if (!ubicacion) return `${base} No pude obtener mi ubicación: llámame. (Piura Alerta)`;
  const lat = Number(ubicacion.lat).toFixed(5);
  const lon = Number(ubicacion.lon).toFixed(5);
  return `${base} Mi ubicación: https://maps.google.com/?q=${lat},${lon} . Avisa a Defensa Civil (115). (Piura Alerta)`;
}

// Deja solo dígitos y el "+" inicial: "999 123 456" -> "999123456".
export function limpiarTelefono(telefono) {
  const texto = String(telefono ?? "").trim();
  const digitos = texto.replace(/\D/g, "");
  if (digitos.length < 6) return null;
  return texto.startsWith("+") ? `+${digitos}` : digitos;
}

// Enlace que abre la app de mensajes con el texto ya escrito.
export function enlaceSMS(telefono, texto) {
  return `sms:${telefono}?body=${encodeURIComponent(texto)}`;
}

// Contactos del plan familiar con un teléfono válido (máximo 3, sin repetir).
export function contactosParaSOS(plan) {
  const vistos = new Set();
  const lista = [];
  for (const c of plan?.contactos ?? []) {
    const telefono = limpiarTelefono(c.telefono);
    if (!telefono || vistos.has(telefono)) continue;
    vistos.add(telefono);
    lista.push({ nombre: c.nombre?.trim() || "Contacto", telefono });
    if (lista.length === 3) break;
  }
  return lista;
}
