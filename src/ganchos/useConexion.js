import { useEffect, useState } from "react";

// true si el teléfono tiene conexión. navigator.onLine solo sabe si hay red,
// no si el servidor responde, pero basta para avisar del caso más común en
// una inundación: datos móviles caídos.
export function useConexion() {
  const [enLinea, setEnLinea] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const conectado = () => setEnLinea(true);
    const desconectado = () => setEnLinea(false);
    window.addEventListener("online", conectado);
    window.addEventListener("offline", desconectado);
    return () => {
      window.removeEventListener("online", conectado);
      window.removeEventListener("offline", desconectado);
    };
  }, []);

  return enLinea;
}
