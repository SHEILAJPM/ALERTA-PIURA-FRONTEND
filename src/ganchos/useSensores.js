import { useResource } from "./useResource";
import { getSensores } from "../utilidades/api";

// Catálogo de sensores (código, nombre, ubicación, umbrales). Cambia solo
// desde el panel admin, así que no necesita refresco en vivo.
export function useSensores() {
  return useResource(getSensores, []);
}
