import { useState } from "react";
import { useAuth } from "../contexto/AuthContext";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { formatearDistancia } from "../utilidades/geo";

// 'descartado' solo lo ve el propio autor en "Mis reportes" (ver
// MisReportes.jsx): el feed público nunca recibe reportes archivados (ver
// GET /api/reportes-ciudadanos), pero soloMios=true es la excepción a
// propósito, para que alguien sepa por qué su reporte no se publicó.
const ESTADO_LABEL = {
  pendiente: { text: "Pendiente de revisión", color: "var(--color-prealerta)" },
  verificado: null, // el caso normal no necesita aclaración aparte
  descartado: { text: "No se publicó (archivado)", color: "var(--color-alerta)" },
};

function formatearRelativo(iso) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `${dias} d`;
  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return `${semanas} sem`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

async function compartir(reporte) {
  const texto = `${reporte.usuario_nombre} en Piura Alerta: ${reporte.descripcion}`;
  if (navigator.share) {
    try {
      await navigator.share({ text: texto, url: window.location.href });
    } catch {
      // el usuario canceló el share sheet — no es un error a mostrar
    }
    return;
  }
  await navigator.clipboard?.writeText(`${texto} — ${window.location.href}`);
}

function ReportCard({ reporte, onLike, onConfirmar, distanciaKm }) {
  const { usuario, abrirModal } = useAuth();
  const [enviandoLike, setEnviandoLike] = useState(false);
  const [enviandoConfirmar, setEnviandoConfirmar] = useState(false);
  const aviso = ESTADO_LABEL[reporte.estado];

  async function manejarLike() {
    if (!usuario) {
      abrirModal("login");
      return;
    }
    if (enviandoLike) return;
    setEnviandoLike(true);
    try {
      await onLike(reporte.id);
    } finally {
      setEnviandoLike(false);
    }
  }

  async function manejarConfirmar() {
    if (!usuario) {
      abrirModal("login");
      return;
    }
    if (enviandoConfirmar) return;
    setEnviandoConfirmar(true);
    try {
      await onConfirmar(reporte.id);
    } finally {
      setEnviandoConfirmar(false);
    }
  }

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar nombre={reporte.usuario_nombre} size={36} />
        <div className="min-w-0 leading-tight">
          <p className="font-semibold text-sm truncate">
            {reporte.usuario_nombre}
            <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>
              {" "}
              · {formatearRelativo(reporte.creado_en)}
              {distanciaKm != null && <> · {formatearDistancia(distanciaKm)}</>}
            </span>
          </p>
          {aviso && (
            <p className="text-xs font-medium" style={{ color: aviso.color }}>
              {aviso.text}
            </p>
          )}
        </div>
      </header>

      {reporte.posible_spam === true && (
        <p
          className="mx-4 mb-3 text-xs font-medium rounded-lg px-3 py-1.5"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
          title={reporte.motivo_ia ?? undefined}
        >
          <Icon name="bi-robot" aria-hidden="true" /> Posible spam — revisa igual, la IA puede equivocarse
        </p>
      )}

      {reporte.foto_url ? (
        <img
          src={reporte.foto_url}
          alt={reporte.descripcion}
          loading="lazy"
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div
          className="w-full px-6 flex items-center justify-center text-center min-h-48"
          style={{ backgroundColor: "var(--color-primary-soft)" }}
        >
          <p className="text-lg font-semibold leading-snug" style={{ color: "var(--color-primary)" }}>
            “{reporte.descripcion}”
          </p>
        </div>
      )}

      <div className="px-4 pt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={manejarLike}
          disabled={enviandoLike}
          aria-label={reporte.te_gusta ? "Quitar me gusta" : "Dar me gusta"}
          className="disabled:opacity-60 transition-transform active:scale-90"
          style={{ color: reporte.te_gusta ? "var(--color-alerta)" : "var(--color-text)" }}
        >
          <Icon
            name={reporte.te_gusta ? "bi-heart-fill" : "bi-heart"}
            aria-hidden="true"
            className="text-2xl"
          />
        </button>
        <button
          type="button"
          onClick={manejarConfirmar}
          disabled={enviandoConfirmar}
          aria-label={reporte.tu_confirmaste ? "Quitar confirmación" : "Confirmar que esto es real"}
          title="Confirmar que esto es real"
          className="disabled:opacity-60 transition-transform active:scale-90"
          style={{ color: reporte.tu_confirmaste ? "var(--color-primary)" : "var(--color-text)" }}
        >
          <Icon
            name={reporte.tu_confirmaste ? "bi-check-circle-fill" : "bi-check-lg"}
            aria-hidden="true"
            className="text-2xl"
          />
        </button>
        <button
          type="button"
          onClick={() => compartir(reporte)}
          aria-label="Compartir reporte"
          className="transition-transform active:scale-90"
          style={{ color: "var(--color-text)" }}
        >
          <Icon name="bi-send" aria-hidden="true" className="text-xl -rotate-12" />
        </button>
      </div>

      <div className="px-4 pt-2 pb-4">
        {reporte.likes_count > 0 && <p className="text-sm font-semibold">{reporte.likes_count} me gusta</p>}
        {reporte.confirmaciones_count > 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {reporte.confirmaciones_count}{" "}
            {reporte.confirmaciones_count === 1 ? "persona confirmó" : "personas confirmaron"} que esto es
            real
          </p>
        )}
        {reporte.foto_url && (
          <p className="text-sm mt-1">
            <span className="font-semibold">{reporte.usuario_nombre}</span> {reporte.descripcion}
          </p>
        )}
      </div>
    </article>
  );
}

export default ReportCard;
