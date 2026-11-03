import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import NotificacionesToggle from "./NotificacionesToggle";
import { useWebSocketStatus } from "../contexto/WebSocketContext";
import { useAuth } from "../contexto/AuthContext";
import { ROLES_PANEL_ADMIN } from "../constantes/roles";
import Avatar from "./Avatar";

// Aislado en su propio componente a propósito: el estado que cambia cada
// segundo vive acá, no en Header, así el tic-tac del reloj no re-renderiza
// todo el header (nav, menú, toggles) una vez por segundo.
function RelojEnVivo() {
  const [hora, setHora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="hidden 2xl:inline font-mono-data text-sm tabular-nums whitespace-nowrap"
      style={{ color: "var(--color-dorado)" }}
    >
      {hora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

const LINKS_BASE = [
  { to: "/", label: "Inicio" },
  { to: "/mapa", label: "Mapa" },
  { to: "/reportes", label: "Reportes" },
  { to: "/historial", label: "Historial" },
  { to: "/seguro", label: "Seguro" },
  { to: "/app", label: "Descargar app" },
];

const ESTADOS_CONEXION = {
  open: { color: "bg-emerald-400", texto: "En vivo" },
  connecting: { color: "bg-amber-400 animate-pulse", texto: "Conectando" },
  closed: { color: "bg-red-400", texto: "Sin conexión" },
};

function navClass({ isActive }) {
  return `whitespace-nowrap transition font-medium ${isActive ? "text-white" : "text-white/70 hover:text-white"}`;
}

function navClassMobile({ isActive }) {
  return `block py-2 transition font-medium ${isActive ? "text-white" : "text-white/70 hover:text-white"}`;
}

// El link a /admin lleva a una zona distinta (panel operativo, no público):
// se marca con una insignia dorada en vez del estilo de nav plano, para que
// se note que no es "una pestaña más".
function navClassAdmin({ isActive }) {
  return `whitespace-nowrap text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition ${
    isActive ? "text-white" : "text-white/85 hover:text-white"
  }`;
}

const estiloAdminBadge = { backgroundColor: "color-mix(in srgb, var(--color-dorado) 35%, transparent)" };

function IconoMenu({ abierto }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function Header() {
  const wsStatus = useWebSocketStatus();
  const conexion = ESTADOS_CONEXION[wsStatus] ?? ESTADOS_CONEXION.closed;
  const { usuario, logout, abrirModal } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const links =
    usuario && ROLES_PANEL_ADMIN.includes(usuario.rol)
      ? [...LINKS_BASE, { to: "/admin", label: "Admin" }]
      : LINKS_BASE;

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <header
      className="shadow-md sticky top-0 z-20 border-b-2"
      style={{ backgroundColor: "var(--color-brand-chrome)", borderColor: "var(--color-dorado)" }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-20">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/images/logo.svg" alt="" width={44} height={44} className="w-11 h-11 shrink-0" />

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white leading-tight whitespace-nowrap">
                Río Piura Alerta
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span className={`w-1.5 h-1.5 rounded-full ${conexion.color}`} />
                {conexion.texto}
              </div>
            </div>
          </div>

          {/* Recién desde xl entran todos los enlaces + sesión en una sola
              línea; por debajo, el menú hamburguesa. */}
          <div className="hidden xl:flex items-center">
            <nav className="flex items-center gap-5 text-[15px]">
              {links.map((link) =>
                link.to === "/admin" ? (
                  <NavLink key={link.to} to={link.to} className={navClassAdmin} style={estiloAdminBadge}>
                    {link.label}
                  </NavLink>
                ) : (
                  <NavLink key={link.to} to={link.to} end={link.to === "/"} className={navClass}>
                    {link.label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="flex items-center gap-4 ml-5 pl-5 border-l border-white/15">
              <RelojEnVivo />

              {usuario ? (
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <NavLink
                    to="/perfil"
                    title={`${usuario.nombre} · Mi perfil`}
                    aria-label={`${usuario.nombre} · Mi perfil`}
                    className="rounded-full ring-2 ring-white/40 hover:ring-white transition"
                  >
                    <Avatar nombre={usuario.nombre} size={34} />
                  </NavLink>
                  <button
                    type="button"
                    onClick={logout}
                    className="whitespace-nowrap font-medium text-white/70 hover:text-white transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => abrirModal("login")}
                  className="whitespace-nowrap font-medium text-white/70 hover:text-white transition"
                >
                  Iniciar sesión
                </button>
              )}

              <NotificacionesToggle />
              <ThemeToggle />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="xl:hidden shrink-0 text-white p-2 -mr-2"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
          >
            <IconoMenu abierto={menuAbierto} />
          </button>
        </div>

        {menuAbierto && (
          <div className="xl:hidden pb-4 border-t border-white/10 pt-3">
            <nav className="flex flex-col">
              {links.map((link) =>
                link.to === "/admin" ? (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="block py-2 transition font-bold"
                    style={{ color: "var(--color-dorado)" }}
                    onClick={cerrarMenu}
                  >
                    {link.label} · modo operativo
                  </NavLink>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    className={navClassMobile}
                    onClick={cerrarMenu}
                  >
                    {link.label}
                  </NavLink>
                )
              )}
            </nav>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              {usuario ? (
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <NavLink to="/perfil" onClick={cerrarMenu} className="hover:underline">
                    {usuario.nombre}
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      cerrarMenu();
                    }}
                    className="font-medium text-white/70 hover:text-white transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    abrirModal("login");
                    cerrarMenu();
                  }}
                  className="font-medium text-white/70 hover:text-white transition"
                >
                  Iniciar sesión
                </button>
              )}
              <div className="flex items-center gap-2">
                <NotificacionesToggle />
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
