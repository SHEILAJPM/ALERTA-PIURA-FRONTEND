import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { useResource } from "../ganchos/useResource";
import { getPlanesSeguro, getTopesIndemnizacion, getMiPoliza, crearCheckoutSeguro } from "../utilidades/api";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";
import Icon from "../componentes/Icon";

const NOMBRE_PERIODO = { 1: "1 mes", 3: "3 meses", 6: "6 meses", 12: "1 año" };

const BENEFICIOS = [
  {
    icono: "bi-water",
    titulo: "Reportas el daño con fotos",
    texto:
      'Si el río daña tu casa o tus cosas durante tu cobertura, cuéntanos qué pasó y adjunta fotos desde "Mi póliza".',
  },
  {
    icono: "bi-person-badge",
    titulo: "Un administrador lo revisa",
    texto:
      "Cada caso se evalúa por separado — no es un monto automático, alguien del equipo mira tu reporte y decide cuánto reconocer.",
  },
  {
    icono: "bi-heart-fill",
    titulo: "Reconocimiento hasta un tope",
    texto:
      "El monto aprobado depende del daño, hasta el tope de tu plan (ver cada tarjeta abajo). El pago se coordina aparte, por Yape o transferencia.",
  },
];

function TarjetaBeneficio({ icono, titulo, texto }) {
  return (
    <div className="flex gap-3">
      <div
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg"
        style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
      >
        <Icon name={icono} aria-hidden="true" />
      </div>
      <div>
        <p className="font-bold text-sm">{titulo}</p>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {texto}
        </p>
      </div>
    </div>
  );
}

function formatearPrecio(centavos) {
  return `S/ ${(centavos / 100).toFixed(2)}`;
}

function TarjetaPlan({ plan, tope, destacado, procesando, onContratar }) {
  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-4"
      style={{
        borderColor: destacado ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        boxShadow: destacado ? "0 0 0 2px var(--color-primary)" : undefined,
      }}
    >
      {destacado && (
        <span
          className="self-start text-xs font-bold px-2 py-1 rounded-full text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Más ahorro
        </span>
      )}
      <div>
        <p className="font-bold text-lg">{NOMBRE_PERIODO[plan.meses]}</p>
        <p className="text-3xl font-extrabold mt-1">{formatearPrecio(plan.precio_centavos)}</p>
        {plan.descuento > 0 && (
          <p className="text-sm mt-1" style={{ color: "var(--color-normal)" }}>
            {Math.round(plan.descuento * 100)}% de descuento vs. pagar mes a mes
          </p>
        )}
        {tope != null && (
          <p
            className="text-xs mt-2 font-semibold px-2 py-1 rounded-full inline-block"
            style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-soft)" }}
          >
            Reconocimiento hasta {formatearPrecio(tope)}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={procesando}
        onClick={() => onContratar(plan.meses)}
        className="mt-auto rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {procesando ? "Redirigiendo..." : "Contratar"}
      </button>
    </div>
  );
}

function Seguro() {
  const { usuario, abrirModal } = useAuth();
  const { data: planes, loading, error, recargar } = useResource(getPlanesSeguro, []);
  const { data: topes } = useResource(getTopesIndemnizacion, []);
  // Sin `usuario`, se resuelve en null sin llamar al backend -- pedir
  // "mi póliza" a un visitante anónimo solo generaría un 401 de más en cada
  // visita a esta página, que es pública.
  const { data: miPoliza } = useResource(() => (usuario ? getMiPoliza() : Promise.resolve(null)), [usuario]);
  const [mesesProcesando, setMesesProcesando] = useState(null);
  const [errorPago, setErrorPago] = useState(null);

  async function manejarContratar(meses) {
    if (!usuario) {
      abrirModal("login");
      return;
    }
    setErrorPago(null);
    setMesesProcesando(meses);
    try {
      const { url } = await crearCheckoutSeguro(meses);
      window.location.href = url;
    } catch (err) {
      setErrorPago(err.message);
      setMesesProcesando(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-8">
        <p
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          Seguro Piura Alerta
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Cobertura contra inundaciones</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Paga por adelantado el periodo que prefieras. Si el río daña tu casa o tus cosas mientras tu póliza
          esté vigente, reporta el daño con fotos y el equipo evalúa cuánto reconocerte, hasta el tope de tu
          plan.
        </p>
      </section>

      {miPoliza?.vigente && (
        <div
          className="mb-8 rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
          style={{ borderColor: "var(--color-normal)", backgroundColor: "var(--color-normal-soft)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--color-normal)" }}>
            <Icon name="bi-check-circle-fill" aria-hidden="true" /> Ya tienes una póliza vigente.
          </p>
          <Link
            to="/mi-poliza"
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white text-center"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Reportar un daño
          </Link>
        </div>
      )}

      <section
        className="mb-8 rounded-2xl border p-6 sm:p-7"
        style={{
          borderColor: "var(--color-primary)",
          backgroundColor: "var(--color-surface)",
          boxShadow: "0 0 0 1px var(--color-primary-soft)",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Icon name="bi-heart-fill" aria-hidden="true" style={{ color: "var(--color-primary)" }} />
          <h3 className="font-extrabold text-lg">¿Qué incluye tu cobertura?</h3>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <TarjetaBeneficio key={b.titulo} {...b} />
          ))}
        </div>
        <p
          className="text-xs mt-6 pt-4 border-t"
          style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
        >
          El monto se define caso por caso al revisar tu reporte, no es un cálculo automático ni un pago
          garantizado — por eso hay un tope según el plan. Las alertas, el mapa, el botón de pánico y los
          albergues son y seguirán siendo gratuitos para todos, tengas o no un plan contratado.
        </p>
      </section>

      {error && <ErrorBanner message={`No se pudieron cargar los planes: ${error}`} onRetry={recargar} />}
      {errorPago && (
        <div className="mb-4">
          <ErrorBanner message={`No se pudo iniciar el pago: ${errorPago}`} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
        planes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {planes.map((plan) => (
              <TarjetaPlan
                key={plan.meses}
                plan={plan}
                tope={topes?.[plan.meses]}
                destacado={plan.meses === 12}
                procesando={mesesProcesando === plan.meses}
                onContratar={manejarContratar}
              />
            ))}
          </div>
        )
      )}

      <p className="text-xs mt-8" style={{ color: "var(--color-text-muted)" }}>
        Pago procesado por Stripe. Piura Alerta nunca ve ni guarda los datos de tu tarjeta.
      </p>
    </main>
  );
}

export default Seguro;
