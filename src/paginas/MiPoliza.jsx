import { Link, useSearchParams } from "react-router-dom";
import { useMiPoliza } from "../ganchos/useMiPoliza";
import { useMisReclamosSeguro } from "../ganchos/useReclamosSeguro";
import { crearReclamoSeguro } from "../utilidades/api";
import ReclamoSeguroForm from "../componentes/ReclamoSeguroForm";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import { formatearFechaLarga as formatearFecha } from "../utilidades/fecha";

const ESTADO_RECLAMO = {
  pendiente: { texto: "En revisión", color: "var(--color-prealerta)", bg: "var(--color-prealerta-soft)" },
  aprobado: { texto: "Aprobado", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
  pagado: { texto: "Pagado", color: "var(--color-normal)", bg: "var(--color-normal-soft)" },
  rechazado: { texto: "No aprobado", color: "var(--color-alerta)", bg: "var(--color-alerta-soft)" },
};

function TarjetaReclamo({ reclamo }) {
  const estado = ESTADO_RECLAMO[reclamo.estado];
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{formatearFecha(reclamo.fecha_dano)}</p>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: estado.color, backgroundColor: estado.bg }}
        >
          {estado.texto}
        </span>
      </div>
      <p className="text-sm mt-1.5" style={{ color: "var(--color-text-muted)" }}>
        {reclamo.descripcion}
      </p>
      {reclamo.estado === "rechazado" && reclamo.motivo_rechazo && (
        <p className="text-xs mt-2" style={{ color: "var(--color-alerta)" }}>
          Motivo: {reclamo.motivo_rechazo}
        </p>
      )}
      {(reclamo.estado === "aprobado" || reclamo.estado === "pagado") && (
        <p className="text-sm font-bold mt-2" style={{ color: "var(--color-normal)" }}>
          S/ {(reclamo.monto_aprobado_centavos / 100).toFixed(2)}
        </p>
      )}
    </div>
  );
}

function MiPoliza() {
  const [parametros] = useSearchParams();
  const pagoExitoso = parametros.get("pago") === "exitoso";
  const { data, loading, error, recargar } = useMiPoliza();
  const { data: reclamos, recargar: recargarReclamos } = useMisReclamosSeguro();

  async function manejarReclamo(datos) {
    await crearReclamoSeguro(datos);
    recargarReclamos();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-6">
        <p
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          Mi cuenta
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Mi póliza</h2>
      </section>

      {pagoExitoso && (
        <p
          className="text-sm mb-4 rounded-xl border p-4"
          style={{ borderColor: "var(--color-normal)", color: "var(--color-normal)" }}
        >
          Pago recibido. Puede tardar unos segundos en reflejarse acá — si no aparece, recarga la página.
        </p>
      )}

      {error && <ErrorBanner message={`No se pudo cargar tu póliza: ${error}`} onRetry={recargar} />}

      {loading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : data?.poliza ? (
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <span
            className="text-xs font-bold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: data.vigente ? "var(--color-normal)" : "var(--color-alerta)" }}
          >
            {data.vigente ? "Vigente" : "Vencida"}
          </span>
          <p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Periodo contratado
          </p>
          <p className="font-semibold">
            {data.poliza.meses} {data.poliza.meses === 1 ? "mes" : "meses"} — S/{" "}
            {(data.poliza.precio_centavos / 100).toFixed(2)}
          </p>
          <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {data.vigente ? "Cubierto hasta" : "Venció el"}
          </p>
          <p className="font-semibold">{formatearFecha(data.poliza.fecha_fin)}</p>

          {!data.vigente && (
            <Link
              to="/seguro"
              className="inline-block mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Renovar cobertura
            </Link>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <p style={{ color: "var(--color-text-muted)" }}>Todavía no tienes una póliza contratada.</p>
          <Link
            to="/seguro"
            className="inline-block mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Ver planes
          </Link>
        </div>
      )}

      {data?.poliza && (
        <section className="mt-8 space-y-4">
          <h3 className="font-bold text-lg">Daños por el río</h3>
          <ReclamoSeguroForm onEnviar={manejarReclamo} />

          {reclamos && reclamos.length > 0 && (
            <div className="space-y-3">
              {reclamos.map((r) => (
                <TarjetaReclamo key={r.id} reclamo={r} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default MiPoliza;
