import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEstadoSensores } from "../ganchos/useEstadoSensores";
import { sensorMasCritico, esMasGrave } from "../utilidades/alertas";
import { avisarConSonido } from "../utilidades/sonido";
import { formatearHora } from "../utilidades/fecha";
import Icon from "./Icon";

const CLAVE_DESCARTES = "piura-alerta-banner-descartado";

function leerDescartes() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_DESCARTES)) ?? [];
  } catch {
    return [];
  }
}

// Banner que aparece en TODAS las páginas mientras algún sensor esté en
// prealerta o alerta roja: quien está mirando el mapa o los reportes tiene
// que enterarse igual que quien está en Inicio. Se actualiza en vivo (WebSocket
// + refresco cada 30 s, ver useEstadoSensores).
//
// - Alerta roja: no se puede cerrar, se anuncia a lectores de pantalla
//   (role="alert"), suena un aviso si el estado empeora con la página abierta
//   y el título de la pestaña lo muestra aunque esté en segundo plano.
// - Prealerta: se puede marcar "Entendido" (vuelve a aparecer si empeora o
//   en otra sesión del navegador).
//
// enPanel: en el panel operativo el enlace lleva a la consola de despacho en
// vez del mapa público.
function AlertaGlobal({ enPanel = false }) {
  const { data: sensores } = useEstadoSensores();
  const critico = sensorMasCritico(sensores);
  const estado = critico?.ultima_lectura.estado ?? null;
  const [descartes, setDescartes] = useState(leerDescartes);
  const estadoAnterior = useRef(null);
  const { pathname } = useLocation();
  const destino = enPanel ? "/admin/despacho" : "/mapa";

  // Aviso sonoro solo cuando el estado EMPEORA con la página abierta, nunca
  // al cargarla (sería molesto en cada visita durante una prealerta larga).
  useEffect(() => {
    if (!sensores) return;
    const actual = estado ?? "normal";
    if (estadoAnterior.current !== null && esMasGrave(actual, estadoAnterior.current)) {
      avisarConSonido({
        veces: actual === "alerta_roja" ? 3 : 1,
        frecuencia: actual === "alerta_roja" ? 988 : 660,
      });
    }
    estadoAnterior.current = actual;
  }, [sensores, estado]);

  useEffect(() => {
    if (!estado) return undefined;
    const tituloOriginal = document.title;
    document.title = `${estado === "alerta_roja" ? "🔴 ALERTA ROJA" : "🟠 Prealerta"} · ${tituloOriginal}`;
    return () => {
      document.title = tituloOriginal;
    };
  }, [estado]);

  if (!critico) return null;

  const lectura = critico.ultima_lectura;
  const claveDescarte = `${critico.codigo}:${estado}`;
  const esRoja = estado === "alerta_roja";
  if (!esRoja && descartes.includes(claveDescarte)) return null;

  function descartar() {
    const siguientes = [...descartes, claveDescarte];
    setDescartes(siguientes);
    try {
      sessionStorage.setItem(CLAVE_DESCARTES, JSON.stringify(siguientes));
    } catch {
      // sin almacenamiento: se oculta solo hasta recargar
    }
  }

  const avisoSinSenal = !critico.en_linea && (
    <span className="block text-xs mt-0.5 opacity-90">
      Último dato de las {formatearHora(lectura.medido_en)}: el sensor no está enviando lecturas.
    </span>
  );

  return (
    <div
      role={esRoja ? "alert" : "status"}
      className={esRoja ? "text-white" : ""}
      style={
        esRoja
          ? { backgroundColor: "var(--color-alerta)" }
          : { backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-text)" }
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Icon
          name={esRoja ? "bi-exclamation-octagon-fill" : "bi-exclamation-triangle-fill"}
          aria-hidden="true"
          className="text-2xl shrink-0"
          style={esRoja ? undefined : { color: "var(--color-prealerta)" }}
        />
        <p className="flex-1 min-w-56 text-sm">
          <strong className="uppercase tracking-wide">{esRoja ? "Alerta roja" : "Prealerta"}</strong> ·{" "}
          {critico.nombre}: el río está en <strong className="font-mono-data">{lectura.nivel_cm} cm</strong>.{" "}
          {esRoja
            ? "Aléjate del cauce y dirígete a un lugar seguro o al albergue más cercano."
            : "El nivel está subiendo: mantente atento y ubica tu albergue más cercano."}
          {avisoSinSenal}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {/* Sin el botón si ya estás en la página a la que lleva. */}
          {pathname !== destino && (
            <Link
              to={destino}
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={
                esRoja
                  ? { backgroundColor: "#fff", color: "var(--color-alerta)" }
                  : { backgroundColor: "var(--color-prealerta)", color: "#fff" }
              }
            >
              {enPanel ? "Ir a despacho" : "Ver albergues"}
            </Link>
          )}
          {!esRoja && (
            <button
              type="button"
              onClick={descartar}
              className="text-sm font-medium px-3 py-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertaGlobal;
