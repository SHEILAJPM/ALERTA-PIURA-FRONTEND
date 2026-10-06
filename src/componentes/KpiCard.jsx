import Skeleton from "./Skeleton";

function KpiCard({ title, value, description, icon }) {
  return (
    <div
      className="rounded-2xl border border-t-[3px] p-5 hover:shadow-md transition"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        borderTopColor: "var(--color-dorado)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-2 font-mono-data">{value}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            {description}
          </p>
        </div>

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-6 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export default KpiCard;
