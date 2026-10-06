function Skeleton({ className = "", style }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ backgroundColor: "var(--color-surface-alt)", ...style }}
    />
  );
}

export default Skeleton;
