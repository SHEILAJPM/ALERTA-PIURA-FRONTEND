import { useResource } from "./useResource";
import { getFeedbackAsistente } from "../utilidades/api";

export function useFeedbackAsistente() {
  return useResource(getFeedbackAsistente, []);
}
