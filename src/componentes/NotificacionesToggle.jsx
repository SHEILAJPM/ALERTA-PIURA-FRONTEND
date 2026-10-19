import { useEffect, useState } from "react";
import { obtenerClavePublicaPush, suscribirPush, desuscribirPush } from "../utilidades/api";
import Icon from "./Icon";

// La clave VAPID viaja en base64 "url-safe"; pushManager.subscribe la quiere
// en bytes.
function claveABytes(base64) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

// Ubicación opcional y sin bloquear: el backend la usa para avisar solo a
// quienes están cerca del sensor que cambió de estado (ver
// radio_notificacion_push_km). Sin ella igual recibe todas las alertas.
function ubicacionAproximada() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 6000, maximumAge: 30 * 60_000 }
    );
  });
}

const soportado =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

// Campana del header: activa/desactiva las notificaciones push del navegador
// ante cambios de estado del río. Se oculta sola si el navegador no las
// soporta, si el backend no tiene claves VAPID configuradas o si no hay
// service worker (en `npm run dev` no se registra; sí en build/preview).
function NotificacionesToggle() {
  // cargando | oculto | inactivo | activo | bloqueado
  const [estado, setEstado] = useState(soportado ? "cargando" : "oculto");
  const [clave, setClave] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!soportado) return undefined;
    let cancelado = false;
    (async () => {
      try {
        const [{ publicKey }, registro] = await Promise.all([
          obtenerClavePublicaPush(),
          navigator.serviceWorker.getRegistration(),
        ]);
        if (cancelado) return;
        if (!publicKey || !registro) {
          setEstado("oculto");
          return;
        }
        setClave(publicKey);
        const suscripcion = await registro.pushManager.getSubscription();
        if (cancelado) return;
        if (Notification.permission === "denied") setEstado("bloqueado");
        else setEstado(suscripcion ? "activo" : "inactivo");
      } catch {
        if (!cancelado) setEstado("oculto");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  async function activar() {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
      return;
    }
    const registro = await navigator.serviceWorker.ready;
    const suscripcion = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveABytes(clave),
    });
    try {
      await suscribirPush({ ...suscripcion.toJSON(), ...(await ubicacionAproximada()) });
    } catch (err) {
      // Si el backend no la guardó, no tiene sentido dejar la suscripción del
      // navegador colgada: nunca le llegaría nada.
      await suscripcion.unsubscribe();
      throw err;
    }
    setEstado("activo");
  }

  async function desactivar() {
    const registro = await navigator.serviceWorker.ready;
    const suscripcion = await registro.pushManager.getSubscription();
    if (suscripcion) {
      await desuscribirPush(suscripcion.endpoint).catch(() => {});
      await suscripcion.unsubscribe();
    }
    setEstado("inactivo");
  }

  async function alternar() {
    if (estado === "bloqueado") {
      alert(
        "Las notificaciones están bloqueadas para este sitio. Actívalas desde la configuración del navegador (ícono del candado junto a la dirección)."
      );
      return;
    }
    setProcesando(true);
    try {
      if (estado === "activo") await desactivar();
      else await activar();
    } catch {
      alert("No se pudieron cambiar las notificaciones. Intenta de nuevo en unos segundos.");
    } finally {
      setProcesando(false);
    }
  }

  if (estado === "cargando" || estado === "oculto") return null;

  const activo = estado === "activo";
  const etiqueta = activo ? "Desactivar notificaciones de alertas" : "Activar notificaciones de alertas";

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={procesando}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={estado === "bloqueado" ? "Notificaciones bloqueadas en el navegador" : etiqueta}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition disabled:opacity-50 hover:bg-white/10 ${
        activo ? "text-white" : "text-white/70 hover:text-white"
      }`}
      style={activo ? { color: "var(--color-dorado)" } : undefined}
    >
      <Icon name={activo ? "bi-bell-fill" : "bi-bell"} aria-hidden="true" />
    </button>
  );
}

export default NotificacionesToggle;
