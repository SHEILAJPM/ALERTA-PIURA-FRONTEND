import { useNotificacionesPush } from "../ganchos/useNotificacionesPush";
import Icon from "./Icon";

function NotificacionesToggle() {
  const { soportado, suscrito, cargando, procesando, activar, desactivar } = useNotificacionesPush();

  // Sin service worker/PushManager (navegador viejo, o Safari en iOS fuera
  // de una PWA instalada) no hay nada que ofrecer, así que ni se muestra.
  if (!soportado || cargando) return null;

  return (
    <button
      type="button"
      onClick={suscrito ? desactivar : activar}
      disabled={procesando}
      aria-label={suscrito ? "Desactivar notificaciones de alertas" : "Activar notificaciones de alertas"}
      aria-pressed={suscrito}
      title={suscrito ? "Notificaciones activadas" : "Avisarme cuando cambie el nivel del río"}
      className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition disabled:opacity-50"
      style={
        suscrito
          ? { backgroundColor: "var(--color-dorado)", color: "var(--color-brand-chrome)" }
          : { backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }
      }
    >
      <Icon name={suscrito ? "bi-bell-fill" : "bi-bell"} aria-hidden="true" />
    </button>
  );
}

export default NotificacionesToggle;
