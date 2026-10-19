import { useResource } from "./useResource";
import { getPolizas } from "../utilidades/api";

// "vigente" se recalcula acá contra la hora actual: así una póliza que vence
// mientras el panel está abierto no sigue figurando como vigente.
export function usePolizas() {
  return useResource(
    () =>
      getPolizas().then((polizas) =>
        polizas.map((p) => ({ ...p, vigente: new Date(p.fecha_fin).getTime() > Date.now() }))
      ),
    []
  );
}
