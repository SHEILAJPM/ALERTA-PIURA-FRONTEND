// Encabezado común de cada página del panel operativo: título y subtítulo en
// mayúsculas, estilo "consola" -- refuerza que esto no es el sitio público.
// En móvil queda pegado debajo de la barra superior del panel (h-14, ver AdminLayout).
function AdminPageHeader({ titulo, subtitulo, children }) {
  return (
    <header
      className="sticky top-14 lg:top-0 z-10 border-b px-4 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide">{titulo}</h1>
        {subtitulo && (
          <p
            className="text-xs font-semibold tracking-widest mt-0.5"
            style={{ color: "var(--color-dorado)" }}
          >
            {subtitulo}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

export default AdminPageHeader;
