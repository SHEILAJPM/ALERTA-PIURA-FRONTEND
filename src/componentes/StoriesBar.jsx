import { useEffect, useState } from "react";
import { useResource } from "../ganchos/useResource";
import { useModalA11y } from "../ganchos/useModalA11y";
import { getReportes } from "../utilidades/api";
import { formatearHora } from "../utilidades/fecha";
import Avatar from "./Avatar";
import Icon from "./Icon";

const VENTANA_MS = 24 * 60 * 60_000;
const DURACION_HISTORIA_MS = 5000;

// Reportes con foto de las últimas 24 h, como "historias": un vistazo rápido
// de cómo están las calles ahora, antes de bajar por el feed completo.
async function obtenerHistorias() {
  const reportes = await getReportes({ limite: 20, conFoto: true });
  const desde = Date.now() - VENTANA_MS;
  return reportes.filter((r) => new Date(r.creado_en).getTime() >= desde);
}

function VisorHistorias({ historias, inicial, onCerrar }) {
  const [indice, setIndice] = useState(inicial);
  const contenedorRef = useModalA11y(onCerrar);
  const actual = historias[indice];

  // Avanza sola cada 5 s, como cualquier app de historias; al terminar la
  // última se cierra.
  useEffect(() => {
    const id = setTimeout(() => {
      if (indice < historias.length - 1) setIndice(indice + 1);
      else onCerrar();
    }, DURACION_HISTORIA_MS);
    return () => clearTimeout(id);
  }, [indice, historias.length, onCerrar]);

  return (
    <div
      ref={contenedorRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Historia de ${actual.usuario_nombre}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center outline-none"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" && indice < historias.length - 1) setIndice(indice + 1);
        if (e.key === "ArrowLeft" && indice > 0) setIndice(indice - 1);
      }}
    >
      <div className="relative w-full max-w-md h-full sm:h-[90vh] flex flex-col">
        <div className="absolute top-0 inset-x-0 p-3 z-10 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex gap-1">
            {historias.map((h, i) => (
              <span key={h.id} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
                <span
                  key={i === indice ? `activa-${indice}` : "fija"}
                  className="block h-full bg-white"
                  style={
                    i === indice
                      ? { animation: `progreso-historia ${DURACION_HISTORIA_MS}ms linear forwards` }
                      : { width: i < indice ? "100%" : "0%" }
                  }
                />
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-white">
            <Avatar nombre={actual.usuario_nombre} size={32} />
            <p className="text-sm font-semibold flex-1 truncate">
              {actual.usuario_nombre}
              <span className="font-normal text-white/70"> · {formatearHora(actual.creado_en)}</span>
            </p>
            <button type="button" onClick={onCerrar} aria-label="Cerrar historias" className="p-2 text-lg">
              <Icon name="bi-x-lg" aria-hidden="true" />
            </button>
          </div>
        </div>

        <img src={actual.foto_url} alt={actual.descripcion} className="flex-1 w-full object-contain" />

        <p className="absolute bottom-0 inset-x-0 p-4 pb-6 text-white text-sm bg-gradient-to-t from-black/80 to-transparent">
          {actual.descripcion}
        </p>

        {/* Zonas táctiles: mitad izquierda retrocede, mitad derecha avanza. */}
        <button
          type="button"
          aria-label="Historia anterior"
          onClick={() => indice > 0 && setIndice(indice - 1)}
          className="absolute left-0 top-20 bottom-20 w-1/2"
        />
        <button
          type="button"
          aria-label="Historia siguiente"
          onClick={() => (indice < historias.length - 1 ? setIndice(indice + 1) : onCerrar())}
          className="absolute right-0 top-20 bottom-20 w-1/2"
        />
      </div>
    </div>
  );
}

function StoriesBar() {
  const { data: historias } = useResource(obtenerHistorias, []);
  const [abiertaEn, setAbiertaEn] = useState(null);

  if (!historias || historias.length === 0) return null;

  return (
    <>
      <div
        className="flex gap-4 overflow-x-auto pb-3 mb-4 -mx-1 px-1"
        aria-label="Fotos de las últimas 24 horas"
      >
        {historias.map((h, i) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setAbiertaEn(i)}
            className="flex flex-col items-center gap-1 shrink-0 w-16"
          >
            <span
              className="w-16 h-16 rounded-full p-[2.5px]"
              style={{ background: "linear-gradient(45deg, var(--color-dorado), var(--color-alerta))" }}
            >
              <img
                src={h.foto_url}
                alt=""
                loading="lazy"
                className="w-full h-full rounded-full object-cover border-2"
                style={{ borderColor: "var(--color-bg)" }}
              />
            </span>
            <span
              className="text-xs truncate w-full text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              {h.usuario_nombre.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {abiertaEn !== null && (
        <VisorHistorias historias={historias} inicial={abiertaEn} onCerrar={() => setAbiertaEn(null)} />
      )}
    </>
  );
}

export default StoriesBar;
