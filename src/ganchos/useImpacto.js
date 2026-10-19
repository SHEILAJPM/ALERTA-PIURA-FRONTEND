import { useResource } from "./useResource";
import { getImpacto } from "../utilidades/api";

export function useImpacto() {
  return useResource(getImpacto, []);
}
