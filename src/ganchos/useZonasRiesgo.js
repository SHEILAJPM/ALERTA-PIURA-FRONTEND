import { useResource } from "./useResource";
import { getZonasRiesgo } from "../utilidades/api";

export function useZonasRiesgo() {
  return useResource(getZonasRiesgo, []);
}
