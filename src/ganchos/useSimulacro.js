import { useEffect, useState } from "react";
import { useWebSocketEvent } from "../contexto/WebSocketContext";
import { getSimulacro } from "../utilidades/api";

const INACTIVO = { activo: false };

// Estado del simulacro en vivo (ver backend servicios/simulacro.js). Al montar
// se consulta una vez (por si el simulacro empezó antes de abrir la app) y
// después cada cambio llega por WebSocket en el mismo segundo. El vencimiento
// también se respeta acá, para que la pantalla se apague aunque el aviso de
// "terminó" no llegue (ej. el celular perdió señal justo en ese momento).
export function useSimulacro() {
  const [simulacro, setSimulacro] = useState(INACTIVO);

  useEffect(() => {
    let vigente = true;
    getSimulacro()
      .then((estado) => vigente && setSimulacro(estado ?? INACTIVO))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  useWebSocketEvent("simulacro", (estado) => setSimulacro(estado ?? INACTIVO));

  useEffect(() => {
    if (!simulacro.activo) return undefined;
    const restante = Math.max(0, Date.parse(simulacro.termina_en) - Date.now());
    const id = setTimeout(() => setSimulacro(INACTIVO), restante);
    return () => clearTimeout(id);
  }, [simulacro]);

  return simulacro;
}

// Segundos que faltan para `terminaEn`, actualizado cada segundo.
export function useSegundosRestantes(terminaEn) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!terminaEn) return undefined;
    // El primer tic es inmediato: `ahora` puede venir de mucho antes (el
    // componente estaba montado sin simulacro) y mostraría tiempo de más.
    const inmediato = setTimeout(() => setAhora(Date.now()), 0);
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      clearTimeout(inmediato);
      clearInterval(id);
    };
  }, [terminaEn]);

  if (!terminaEn) return 0;
  return Math.max(0, Math.ceil((Date.parse(terminaEn) - ahora) / 1000));
}

export function formatearCuentaRegresiva(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
