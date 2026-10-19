import { useResource } from "./useResource";
import { getTickets } from "../utilidades/api";

export function useTickets() {
  return useResource(getTickets, []);
}
