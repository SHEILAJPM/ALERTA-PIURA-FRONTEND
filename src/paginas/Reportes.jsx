import ReportForm from "../componentes/ReportForm";
import ReportCard from "../componentes/ReportCard";
import StoriesBar from "../componentes/StoriesBar";
import RiesgoMap from "../componentes/RiesgoMap";
import CalculadoraSacos from "../componentes/CalculadoraSacos";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import Icon from "../componentes/Icon";
import { useReportes } from "../ganchos/useReportes";
import { useOrdenPorCercania } from "../ganchos/useOrdenPorCercania";
import { useAuth } from "../contexto/AuthContext";

function Reportes() {
  const {
    reportes,
    loading,
    error,
    enviando,
    enviarReporte,
    darLike,
    confirmarReporte,
    cargarMas,
    cargandoMas,
    hayMas,
    pendientes,
  } = useReportes();
  const { usuario, abrirModal } = useAuth();
  const cercania = useOrdenPorCercania(reportes);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-6">
        <p
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          Portal ciudadano
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Reportes y mapa de riesgo en vivo</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Comparte lo que ves en tu zona, revisa lo que reporta la comunidad y ubica el albergue y la ruta más
          seguros. No necesitas cuenta para reportar.
        </p>
        {!usuario && (
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            ¿Quieres que tu nombre quede fijo en tus reportes y poder dar like?{" "}
            <button
              type="button"
              onClick={() => abrirModal("login")}
              className="font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              Inicia sesión
            </button>
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start max-w-4xl mx-auto lg:max-w-none">
        {/* Columna del feed, ancho fijo tipo Instagram (no estira con la pantalla) */}
        <div className="w-full max-w-[470px] mx-auto lg:mx-0">
          <StoriesBar />

          {!loading && reportes.length > 0 && (
            <div className="flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                onClick={cercania.activo ? cercania.desactivar : cercania.activar}
                disabled={cercania.buscando}
                className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1.5 border disabled:opacity-60 transition"
                style={
                  cercania.activo
                    ? {
                        backgroundColor: "var(--color-primary)",
                        color: "#fff",
                        borderColor: "var(--color-primary)",
                      }
                    : { borderColor: "var(--color-border)", color: "var(--color-text)" }
                }
              >
                <Icon name="bi-geo-alt-fill" aria-hidden="true" />
                {cercania.buscando
                  ? "Ubicándote..."
                  : cercania.activo
                    ? "Ordenado por cercanía"
                    : "Ordenar por cercanía"}
              </button>
            </div>
          )}
          {cercania.error && (
            <p className="text-sm mb-4" style={{ color: "var(--color-alerta)" }}>
              {cercania.error}
            </p>
          )}

          {error && <ErrorBanner message={`No se pudieron cargar los reportes: ${error}`} />}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="w-full aspect-square rounded-none" />
                </div>
              ))}
            </div>
          ) : reportes.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed flex flex-col items-center text-center gap-3 py-16 px-6"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
              >
                <Icon name="bi-megaphone" aria-hidden="true" />
              </span>
              <div>
                <p className="font-bold">Aún no hay reportes ciudadanos</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Sé el primero en compartir lo que ves en tu zona.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cercania.reportesOrdenados.map(({ reporte, distanciaKm }) => (
                <ReportCard
                  key={reporte.id}
                  reporte={reporte}
                  onLike={darLike}
                  onConfirmar={confirmarReporte}
                  distanciaKm={distanciaKm}
                />
              ))}
              {hayMas && (
                <button
                  type="button"
                  onClick={cargarMas}
                  disabled={cargandoMas}
                  className="w-full text-sm font-semibold py-2.5 rounded-xl border disabled:opacity-50"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                >
                  {cargandoMas ? "Cargando..." : "Cargar más reportes"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rail lateral: publicar + herramientas — se queda fijo al hacer scroll, como los widgets de Instagram */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          {pendientes > 0 && (
            <p
              className="text-sm rounded-xl px-3 py-2 flex items-center gap-2"
              style={{ backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-prealerta)" }}
            >
              <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" />
              {pendientes === 1
                ? "1 reporte pendiente por enviar (sin conexión)."
                : `${pendientes} reportes pendientes por enviar (sin conexión).`}
            </p>
          )}
          <ReportForm onEnviar={enviarReporte} enviando={enviando} />
          <RiesgoMap altura="280px" mostrarLeyenda={false} />
          <CalculadoraSacos />
        </aside>
      </div>
    </main>
  );
}

export default Reportes;
