import RiesgoMap from "../componentes/RiesgoMap";

function Mapa() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-6">
        <p
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          Mapa de riesgo
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Zonas de riesgo, albergues y sensor</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
          Visualiza las zonas con riesgo de inundación, los albergues disponibles y la ubicación del sensor
          del río.
        </p>
      </section>

      <RiesgoMap altura="520px" />
    </main>
  );
}

export default Mapa;
