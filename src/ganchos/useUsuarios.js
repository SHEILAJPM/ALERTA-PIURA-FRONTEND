import { useResource } from "./useResource";
import { getUsuarios } from "../utilidades/api";

export function useUsuarios() {
  return useResource(getUsuarios, []);
}
