// Plan familiar de emergencia: se guarda SOLO en este dispositivo (nunca se
// envía al servidor), así funciona sin internet y los datos de la familia no
// salen del teléfono.

const CLAVE = "piura-alerta-plan-familiar";

export const TAREAS = [
  "Lleva la mochila de emergencia",
  "Recoge a los niños",
  "Ayuda a un adulto mayor o persona con discapacidad",
  "Corta la luz, el agua y el gas",
  "Lleva los documentos",
  "Cuida a las mascotas",
  "Avisa a los vecinos",
];

export function planVacio() {
  return {
    puntoEncuentro: "",
    puntoAlterno: "",
    albergue: "",
    contactos: [{ nombre: "", telefono: "" }],
    integrantes: [{ nombre: "", tarea: TAREAS[0] }],
    necesidades: "",
    actualizado: null,
  };
}

export function leerPlan() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    return guardado && typeof guardado === "object" ? { ...planVacio(), ...guardado } : null;
  } catch {
    return null;
  }
}

// Devuelve true si es la primera vez que se guarda un plan en este dispositivo.
export function guardarPlan(plan) {
  const eraNuevo = !leerPlan();
  const limpio = {
    ...plan,
    contactos: plan.contactos.filter((c) => c.nombre.trim() || c.telefono.trim()),
    integrantes: plan.integrantes.filter((i) => i.nombre.trim()),
    actualizado: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(limpio));
  } catch {
    // sin almacenamiento: el plan vale solo mientras esté abierta la página
  }
  return { plan: limpio, eraNuevo };
}

export function planEstaCompleto(plan) {
  return Boolean(plan.puntoEncuentro.trim()) && plan.contactos.some((c) => c.telefono.trim());
}

// Texto para compartir por WhatsApp o copiar.
export function textoPlan(plan) {
  const lineas = ["*Plan familiar de emergencia* (Piura Alerta)", ""];
  if (plan.puntoEncuentro.trim()) lineas.push(`📍 Punto de encuentro: ${plan.puntoEncuentro.trim()}`);
  if (plan.puntoAlterno.trim()) lineas.push(`📍 Si no se puede llegar: ${plan.puntoAlterno.trim()}`);
  if (plan.albergue.trim()) lineas.push(`🏠 Albergue: ${plan.albergue.trim()}`);
  const contactos = plan.contactos.filter((c) => c.nombre.trim() || c.telefono.trim());
  if (contactos.length) {
    lineas.push("", "📞 Contactos:");
    for (const c of contactos) lineas.push(`- ${c.nombre.trim() || "Contacto"}: ${c.telefono.trim()}`);
  }
  const integrantes = plan.integrantes.filter((i) => i.nombre.trim());
  if (integrantes.length) {
    lineas.push("", "👪 Quién hace qué:");
    for (const i of integrantes) lineas.push(`- ${i.nombre.trim()}: ${i.tarea}`);
  }
  if (plan.necesidades.trim()) lineas.push("", `⚕️ A tener en cuenta: ${plan.necesidades.trim()}`);
  lineas.push("", "Emergencias: SAMU 106 · Bomberos 116 · Defensa Civil 115");
  return lineas.join("\n");
}
