import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Backpack,
  ChevronRight,
  Database,
  FlaskConical,
  CirclePlus,
  History,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map as MapIcon,
  Megaphone,
  Menu,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import ThemeToggle, { InterruptorModoOscuro } from "./ThemeToggle";
import NotificacionesToggle from "./NotificacionesToggle";
import BotonEmergencia from "./BotonEmergencia";
import { abrirTourOnboarding } from "./OnboardingTour";
import { useWebSocketStatus } from "../contexto/WebSocketContext";
import { useAuth } from "../contexto/AuthContext";
import { useModalA11y } from "../ganchos/useModalA11y";
import { ROLES_PANEL_ADMIN } from "../constantes/roles";
import Avatar from "./Avatar";

// Aislado en su propio componente a propósito: el estado que cambia cada
// segundo vive acá, no en la navegación, así el tic-tac del reloj no
// re-renderiza todo el menú una vez por segundo.
function RelojEnVivo() {
  const [hora, setHora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono-data text-sm font-bold tabular-nums" style={{ color: "var(--color-title)" }}>
      {hora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

const LINKS_BASE = [
  { to: "/", label: "Inicio", icono: House },
  { to: "/mapa", label: "Mapa", icono: MapIcon },
  { to: "/reportes", label: "Reportes", icono: Megaphone },
  { to: "/mochila", label: "Mi mochila", icono: Backpack },
  { to: "/historial", label: "Historial", icono: History },
  { to: "/seguro", label: "Seguro", icono: ShieldCheck },
  { to: "/datos-abiertos", label: "Datos abiertos", icono: Database },
  { to: "/laboratorio", label: "Laboratorio", icono: FlaskConical },
  { to: "/app", label: "Descargar app", icono: Smartphone },
];

const LINK_ADMIN = { to: "/admin", label: "Panel admin", icono: LayoutDashboard };

const ESTADOS_CONEXION = {
  open: { color: "var(--color-normal)", texto: "En vivo", vivo: true },
  connecting: { color: "var(--color-prealerta-punto)", texto: "Conectando", vivo: true },
  closed: { color: "var(--color-alerta)", texto: "Sin conexión", vivo: false },
};

function useLinks() {
  const { usuario } = useAuth();
  return usuario && ROLES_PANEL_ADMIN.includes(usuario.rol) ? [...LINKS_BASE, LINK_ADMIN] : LINKS_BASE;
}

function useConexion() {
  const wsStatus = useWebSocketStatus();
  return ESTADOS_CONEXION[wsStatus] ?? ESTADOS_CONEXION.closed;
}

function Marca({ conexion }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <img
        src="/images/escudo-piura.png"
        alt=""
        width={36}
        height={42}
        className="w-9 h-[42px] shrink-0 object-contain"
      />
      <div className="min-w-0">
        <p className="font-display text-[17px] leading-tight whitespace-nowrap">Piura Alerta</p>
        <p
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${conexion.vivo ? "pa-vivo" : ""}`}
            style={{ backgroundColor: conexion.color, color: conexion.color }}
          />
          {conexion.texto}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Escritorio (>= 1024 px): barra lateral blanca                       */
/* ------------------------------------------------------------------ */
export function BarraLateral() {
  const links = useLinks();
  const conexion = useConexion();
  const { usuario, logout, abrirModal } = useAuth();

  return (
    <aside
      className="vidrio-fuerte hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col gap-6 px-5 py-6 overflow-y-auto"
      style={{ width: "var(--ancho-sidebar)", borderRadius: 0, borderWidth: "0 1px 0 0" }}
      aria-label="Navegación principal"
    >
      <div className="flex flex-col gap-4 px-1">
        <Marca conexion={conexion} />
        <div className="orla w-24" aria-hidden="true" />
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icono: Icono }, i) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `pa-entra group flex items-center gap-3 min-h-[44px] px-3.5 rounded-2xl text-[15px] font-semibold transition-[background-color,color,box-shadow,padding] duration-200 ${
                isActive ? "" : "hover:bg-[var(--color-primary-soft)] hover:pl-4.5"
              }`
            }
            style={({ isActive }) => ({
              "--i": i,
              ...(isActive
                ? {
                    backgroundColor: "var(--color-activo)",
                    color: "#ffffff",
                    boxShadow: "0 8px 20px rgba(13,46,87,0.22)",
                  }
                : { color: to === "/admin" ? "var(--color-dorado)" : "var(--color-text-muted)" }),
            })}
          >
            <Icono
              size={19}
              strokeWidth={1.75}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:scale-110"
            />
            {label}
          </NavLink>
        ))}
      </nav>

      <BotonEmergencia variante="lateral" />

      <div className="mt-auto flex flex-col gap-3">
        <div
          className="flex items-center justify-between rounded-2xl px-3.5 py-2.5"
          style={{ backgroundColor: "var(--color-surface-alt)" }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Hora en Piura
          </span>
          <RelojEnVivo />
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Ajustes rápidos
          </span>
          <div className="flex items-center">
            <NotificacionesToggle tono="claro" />
            <ThemeToggle tono="claro" />
          </div>
        </div>

        {usuario ? (
          <div
            className="flex items-center gap-3 rounded-2xl p-2.5 pr-2"
            style={{ backgroundColor: "var(--color-surface-alt)" }}
          >
            <NavLink to="/perfil" className="flex items-center gap-3 min-w-0 flex-1" title="Mi perfil">
              <Avatar nombre={usuario.nombre} size={36} />
              <span className="min-w-0">
                <span className="block text-sm font-bold truncate" style={{ color: "var(--color-title)" }}>
                  {usuario.nombre}
                </span>
                <span className="block text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Mi perfil
                </span>
              </span>
            </NavLink>
            <button
              type="button"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="w-11 h-11 rounded-full flex items-center justify-center transition hover:bg-[var(--color-primary-soft)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => abrirModal("login")}
            className="btn-dorado pa-tocable min-h-[48px] rounded-full font-extrabold flex items-center justify-center gap-2"
          >
            <LogIn size={18} strokeWidth={2} aria-hidden="true" />
            Iniciar sesión
          </button>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Móvil: hoja "Más" con el resto de secciones y los ajustes           */
/* ------------------------------------------------------------------ */
function FilaHoja({ icono: Icono, children, onClick, to, color }) {
  const contenido = (
    <>
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--color-primary-soft)", color: color ?? "var(--color-primary)" }}
      >
        <Icono size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="flex-1 text-[15px] font-semibold" style={{ color: color ?? "var(--color-text)" }}>
        {children}
      </span>
      <ChevronRight size={18} aria-hidden="true" style={{ color: "var(--color-text-muted)" }} />
    </>
  );
  const clase = "flex items-center gap-3 w-full min-h-[52px] px-4 text-left";
  return to ? (
    <NavLink to={to} end={to === "/"} onClick={onClick} className={clase}>
      {contenido}
    </NavLink>
  ) : (
    <button type="button" onClick={onClick} className={clase}>
      {contenido}
    </button>
  );
}

function Grupo({ titulo, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="px-4 text-[11px] font-extrabold tracking-[0.12em] uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        {titulo}
      </p>
      <div
        className="rounded-[22px] overflow-hidden divide-y divide-[var(--color-border)]"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {children}
      </div>
    </div>
  );
}

function HojaMas({ onCerrar }) {
  const contenedorRef = useModalA11y(onCerrar);
  const links = useLinks();
  const { usuario, logout, abrirModal } = useAuth();
  const secundarios = links.filter((l) => !["/", "/mapa", "/reportes"].includes(l.to));

  // Arrastrar la manija hacia abajo cierra la hoja (como en iOS/Android).
  // El transform va en un envoltorio aparte: la animación de entrada
  // (sr-hoja) fija su propio transform en la hoja y pisaría el del arrastre.
  const arrastreRef = useRef(null);
  const inicioY = useRef(null);

  function alPresionar(e) {
    inicioY.current = e.clientY;
    arrastreRef.current.dataset.arrastrando = "";
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function alMover(e) {
    if (inicioY.current === null) return;
    const dy = Math.max(0, e.clientY - inicioY.current);
    arrastreRef.current.style.transform = `translateY(${dy}px)`;
  }
  function alSoltar(e) {
    if (inicioY.current === null) return;
    const dy = e.clientY - inicioY.current;
    inicioY.current = null;
    const hoja = arrastreRef.current;
    delete hoja.dataset.arrastrando;
    if (dy > 110) {
      hoja.style.transform = "translateY(100%)";
      setTimeout(onCerrar, 220);
    } else {
      hoja.style.transform = "";
    }
  }

  return (
    <div
      className="sr-velo fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(10,22,36,0.4)", backdropFilter: "blur(6px)" }}
      onClick={onCerrar}
    >
      <div ref={arrastreRef} className="pa-hoja-arrastrable w-full">
        <div
          ref={contenedorRef}
          role="dialog"
          aria-modal="true"
          aria-label="Más opciones"
          tabIndex={-1}
          className="sr-hoja w-full max-h-[88vh] overflow-y-auto rounded-t-[28px] px-4 outline-none"
          style={{
            backgroundColor: "var(--color-bg)",
            paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex justify-center pt-3 pb-3 -mx-4 cursor-grab touch-none"
            onPointerDown={alPresionar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            aria-hidden="true"
          >
            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
          </div>
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-2xl">Más</h2>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-title)" }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <Grupo titulo="Explorar">
              {secundarios.map((l) => (
                <FilaHoja
                  key={l.to}
                  to={l.to}
                  icono={l.icono}
                  onClick={onCerrar}
                  color={l.to === "/admin" ? "var(--color-dorado)" : undefined}
                >
                  {l.label}
                </FilaHoja>
              ))}
            </Grupo>

            <Grupo titulo="Ajustes">
              <InterruptorModoOscuro />
              <FilaHoja
                icono={Sparkles}
                onClick={() => {
                  onCerrar();
                  abrirTourOnboarding();
                }}
              >
                ¿Cómo funciona esta app?
              </FilaHoja>
            </Grupo>

            <Grupo titulo="Cuenta">
              {usuario ? (
                <>
                  <FilaHoja to="/perfil" icono={UserRound} onClick={onCerrar}>
                    {usuario.nombre}
                  </FilaHoja>
                  <FilaHoja
                    icono={LogOut}
                    color="var(--color-alerta)"
                    onClick={() => {
                      logout();
                      onCerrar();
                    }}
                  >
                    Cerrar sesión
                  </FilaHoja>
                </>
              ) : (
                <FilaHoja
                  icono={LogIn}
                  onClick={() => {
                    onCerrar();
                    abrirModal("login");
                  }}
                >
                  Iniciar sesión
                </FilaHoja>
              )}
            </Grupo>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Móvil: barra superior de vidrio                                     */
/* ------------------------------------------------------------------ */
function Header() {
  const conexion = useConexion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const barraRef = useRef(null);

  // Al bajar, la barra se compacta y gana opacidad. Se marca directo en el
  // DOM (sin estado) para no re-renderizar el header en cada evento de scroll.
  useEffect(() => {
    function alHacerScroll() {
      const barra = barraRef.current;
      if (!barra) return;
      if (window.scrollY > 12) barra.dataset.compacta = "";
      else delete barra.dataset.compacta;
    }
    alHacerScroll();
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    return () => window.removeEventListener("scroll", alHacerScroll);
  }, []);

  return (
    <>
      <header
        ref={barraRef}
        className="vidrio pa-barra-superior lg:hidden sticky z-30 mx-3 mt-2 rounded-[22px]"
        style={{ top: "calc(8px + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center justify-between gap-3 h-16 pl-3 pr-1.5">
          <Marca conexion={conexion} />
          <div className="flex items-center">
            <NotificacionesToggle tono="claro" />
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ color: "var(--color-title)" }}
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
            >
              <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      {menuAbierto && <HojaMas onCerrar={() => setMenuAbierto(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Móvil: barra inferior flotante en píldora, con SOS al centro        */
/* ------------------------------------------------------------------ */
function Pestana({ to, icono: Icono, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-[10.5px] font-bold transition-colors duration-200"
      style={({ isActive }) => ({ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" })}
    >
      {({ isActive }) => (
        <>
          {/* key: al activarse se vuelve a montar y el ícono "salta". */}
          <span
            key={isActive ? "activa" : "inactiva"}
            className={isActive ? "pa-salto inline-flex" : "inline-flex"}
          >
            <Icono size={22} strokeWidth={isActive ? 2.2 : 1.75} aria-hidden="true" />
          </span>
          {children}
        </>
      )}
    </NavLink>
  );
}

// Columna de la pestaña activa en la grilla de 5 (la 2 es el SOS).
function columnaActiva(pathname) {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/mapa")) return 1;
  if (pathname.startsWith("/reportes")) return 3;
  if (pathname.startsWith("/perfil")) return 4;
  return null;
}

export function BarraInferior() {
  const { usuario, abrirModal } = useAuth();
  const { pathname } = useLocation();
  const enPerfil = pathname.startsWith("/perfil");
  const columna = columnaActiva(pathname);

  return (
    <nav
      aria-label="Navegación principal"
      className="lg:hidden fixed z-40 left-3 right-3"
      style={{ bottom: "calc(14px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className="vidrio-fuerte relative grid grid-cols-5 items-center rounded-full px-2"
        style={{ height: "var(--alto-tabbar)" }}
      >
        {/* Fondo de la pestaña activa: se desliza de una a otra. */}
        <div className="absolute inset-y-2 left-2 right-2 pointer-events-none" aria-hidden="true">
          <div
            className="pa-indicador h-full w-1/5 rounded-full"
            style={{
              backgroundColor: "var(--color-primary-soft)",
              transform: `translateX(${(columna ?? 0) * 100}%)`,
              opacity: columna === null ? 0 : 1,
            }}
          />
        </div>
        <Pestana to="/" icono={House}>
          Inicio
        </Pestana>
        <Pestana to="/mapa" icono={MapIcon}>
          Mapa
        </Pestana>
        <div className="relative flex justify-center">
          <BotonEmergencia variante="barra" />
        </div>
        <Pestana to="/reportes" icono={CirclePlus}>
          Reportar
        </Pestana>
        {usuario ? (
          <Pestana to="/perfil" icono={UserRound}>
            Perfil
          </Pestana>
        ) : (
          <button
            type="button"
            onClick={() => abrirModal("login")}
            className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-[10.5px] font-bold"
            style={{ color: enPerfil ? "var(--color-primary)" : "var(--color-text-muted)" }}
          >
            <UserRound size={22} strokeWidth={1.75} aria-hidden="true" />
            Entrar
          </button>
        )}
      </div>
    </nav>
  );
}

export default Header;
