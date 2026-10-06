function ErrorBanner({ message, onRetry }) {
  return (
    <div
      className="rounded-xl border p-4 flex items-center justify-between gap-4"
      style={{
        borderColor: "var(--color-alerta)",
        backgroundColor: "var(--color-alerta-soft)",
        color: "var(--color-alerta)",
      }}
    >
      <p className="text-sm font-medium">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm font-semibold underline shrink-0">
          Reintentar
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
