import { Link } from "react-router-dom";
import ReportCard from "../componentes/ReportCard";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import Icon from "../componentes/Icon";
import { useReportes } from "../ganchos/useReportes";

function MisReportes() {
  const { reportes, loading, error, darLike, confirmarReporte, cargarMas, cargandoMas, hayMas } = useReportes(
    20,
    { soloMios: true }
  );

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-6">
        <Link to="/perfil" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
          ← Mi perfil
        </Link>
        <h2 className="text-3xl font-bold mt-2">Mis reportes</h2>
        <p className="mt-2" style={{ color: "var(--color-text-muted)" }}>
          El historial completo de lo que reportaste, incluido lo que un moderador o la IA archivó.
        </p>
      </section>

      {error && <ErrorBanner message={`No se pudieron cargar tus reportes: ${error}`} />}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
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
            <p className="font-bold">Todavía no mandaste ningún reporte</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              <Link to="/reportes" className="font-semibold" style={{ color: "var(--color-primary)" }}>
                Manda el primero
              </Link>{" "}
              desde el portal ciudadano.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reportes.map((reporte) => (
            <ReportCard key={reporte.id} reporte={reporte} onLike={darLike} onConfirmar={confirmarReporte} />
          ))}
          {hayMas && (
            <button
              type="button"
              onClick={cargarMas}
              disabled={cargandoMas}
              className="w-full text-sm font-semibold py-2.5 rounded-xl border disabled:opacity-50"
              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
            >
              {cargandoMas ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default MisReportes;
