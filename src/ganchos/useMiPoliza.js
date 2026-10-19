import { useResource } from "./useResource";
import { getMiPoliza } from "../utilidades/api";

// { vigente, poliza } -- poliza es null si el usuario nunca contrató.
export function useMiPoliza() {
  return useResource(getMiPoliza, []);
}
