import { useCallback, useEffect, useState } from "react";
import { useResource } from "./useResource";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { useAuth } from "../contexto/AuthContext";
import {
  getReportes,
  crearReporte,
  darLike as darLikeApi,
  confirmarReporte as confirmarReporteApi,
  actualizarEstadoReporte,
} from "../utilidades/api";

// Cola de reportes hechos sin conexión. En una inundación la señal se corta
// justo cuando más importa reportar: el reporte (con la URL de la foto ya
// subida) queda guardado en el navegador y se envía solo al volver internet.
const CLAVE_COLA = "piura-alerta-reportes-pendientes";
const EVENTO_COLA = "piura-alerta:cola-reportes";

function leerCola() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_COLA)) ?? [];
  } catch {
    return [];
  }
}

function guardarCola(cola) {
  try {
    localStorage.setItem(CLAVE_COLA, JSON.stringify(cola));
  } catch {
    // almacenamiento lleno o bloqueado: no hay más que hacer
  }
  window.dispatchEvent(new Event(EVENTO_COLA));
}

function esFallaDeConexion(err) {
  return err?.status === 0 || !navigator.onLine;
}

let enviandoCola = false;

async function enviarCola() {
  if (enviandoCola || !navigator.onLine) return;
  enviandoCola = true;
  try {
    let cola = leerCola();
    while (cola.length > 0) {
      try {
        await crearReporte(cola[0]);
      } catch (err) {
        // Sin conexión otra vez: se reintenta en el próximo "online". Un
        // rechazo del backend (ej. 400) no se va a arreglar reintentando, así
        // que ese reporte se descarta en vez de trabar la cola para siempre.
        if (esFallaDeConexion(err)) break;
      }
      cola = leerCola().slice(1);
      guardarCola(cola);
    }
  } finally {
    enviandoCola = false;
  }
}

function usePendientesEnCola() {
  const [pendientes, setPendientes] = useState(() => leerCola().length);

  useEffect(() => {
    const actualizar = () => setPendientes(leerCola().length);
    const alVolverConexion = () => enviarCola();
    window.addEventListener(EVENTO_COLA, actualizar);
    window.addEventListener("storage", actualizar);
    window.addEventListener("online", alVolverConexion);
    enviarCola();
    return () => {
      window.removeEventListener(EVENTO_COLA, actualizar);
      window.removeEventListener("storage", actualizar);
      window.removeEventListener("online", alVolverConexion);
    };
  }, []);

  return pendientes;
}

// Feed de reportes ciudadanos con paginación por cursor ("antes" = creado_en
// del último recibido, ver GET /api/reportes-ciudadanos), likes,
// confirmaciones, moderación y reportes nuevos en vivo por WebSocket.
//
// opciones.soloMios: historial propio (incluye archivados, ver MisReportes.jsx).
// opciones.incluirArchivados: panel de moderación (el backend solo lo honra
// para administrador).
export function useReportes(limite = 30, { soloMios = false, incluirArchivados = false } = {}) {
  const { usuario } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMas, setHayMas] = useState(false);
  const pendientes = usePendientesEnCola();

  // Se vuelve a pedir al cambiar de sesión: te_gusta/tu_confirmaste dependen
  // de quién mira, y "mis reportes" de quién es "mío".
  const { data, loading, error, setData } = useResource(
    () =>
      getReportes({ limite, soloMios, incluirArchivados }).then((pagina) => {
        setHayMas(pagina.length === limite);
        return pagina;
      }),
    [limite, soloMios, incluirArchivados, usuario?.id]
  );
  const reportes = data ?? [];

  const fusionar = useCallback(
    (id, cambios) => setData((prev) => prev?.map((r) => (r.id === id ? { ...r, ...cambios } : r))),
    [setData]
  );

  useWebSocketEvent("reporte_ciudadano", (reporte) => {
    if (soloMios && reporte.usuario_id !== usuario?.id) return;
    setData((prev) => (prev?.some((r) => r.id === reporte.id) ? prev : [reporte, ...(prev ?? [])]));
  });

  async function cargarMas() {
    const ultimo = reportes[reportes.length - 1];
    if (!ultimo || cargandoMas) return;
    setCargandoMas(true);
    try {
      const pagina = await getReportes({ limite, soloMios, incluirArchivados, antes: ultimo.creado_en });
      setData((prev) => {
        const ids = new Set((prev ?? []).map((r) => r.id));
        return [...(prev ?? []), ...pagina.filter((r) => !ids.has(r.id))];
      });
      setHayMas(pagina.length === limite);
    } finally {
      setCargandoMas(false);
    }
  }

  async function enviarReporte(datos) {
    setEnviando(true);
    try {
      const reporte = await crearReporte(datos);
      // Archivado por la IA (ver moderacionIA.js en el backend): no entra al
      // feed, y el formulario le explica a la persona por qué.
      if (reporte.estado === "descartado") return { archivado: true };
      setData((prev) => (prev?.some((r) => r.id === reporte.id) ? prev : [reporte, ...(prev ?? [])]));
      return { reporte };
    } catch (err) {
      if (!esFallaDeConexion(err)) throw err;
      guardarCola([...leerCola(), datos]);
      return { encolado: true };
    } finally {
      setEnviando(false);
    }
  }

  const darLike = useCallback(
    async (id) => {
      const { te_gusta, likes_count } = await darLikeApi(id);
      fusionar(id, { te_gusta, likes_count });
    },
    [fusionar]
  );

  const confirmarReporte = useCallback(
    async (id) => {
      const { tu_confirmaste, confirmaciones_count } = await confirmarReporteApi(id);
      fusionar(id, { tu_confirmaste, confirmaciones_count });
    },
    [fusionar]
  );

  const actualizarEstado = useCallback(
    async (id, estado) => {
      const actualizado = await actualizarEstadoReporte(id, estado);
      fusionar(id, { estado: actualizado?.estado ?? estado });
    },
    [fusionar]
  );

  return {
    reportes,
    loading,
    error,
    enviando,
    enviarReporte,
    darLike,
    confirmarReporte,
    actualizarEstado,
    cargarMas,
    cargandoMas,
    hayMas,
    pendientes,
  };
}
