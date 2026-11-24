import Skeleton from "./Skeleton";
import { useFoco } from "../ganchos/useAnimaciones";

function KpiCard({ title, value, description, icon, indice = 0 }) {
  const alMoverPuntero = useFoco();
  return (
    <div
      onPointerMove={alMoverPuntero}
      className="pa-entra pa-tocable pa-foco rounded-3xl border p-5"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        "--i": indice,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
          {title}
        </p>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          {icon}
        </div>
      </div>
      <h3
        className="font-mono-data text-[28px] leading-none font-extrabold mt-3"
        style={{ color: "var(--color-title)" }}
      >
        {value}
      </h3>
      <p className="text-[13px] mt-2" style={{ color: "var(--color-text-muted)" }}>
        {description}
      </p>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div
      className="rounded-3xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </div>
      <Skeleton className="h-7 w-24 mb-3" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export default KpiCard;
