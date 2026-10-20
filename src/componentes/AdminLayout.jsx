import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import Icon from "./Icon";
import AlertaGlobal from "./AlertaGlobal";
import { useAuth } from "../contexto/AuthContext";
import { ROLES_ADMINISTRADOR, ROLES_OPERADOR_TECNICO, ROLES_DEFENSA_CIVIL } from "../constantes/roles";

// Un grupo por rol operativo. "roles" controla quién ve el grupo en el menú
// (administrador ve los tres); las páginas más sensibles (usuarios,
// auditoría) además se protegen a sí mismas con <RequiereRol>, por si
// alguien navega directo a la URL.
const GRUPOS = [
  {
    id: "sistema",
    label: "Administrador del Sistema",
    roles: ROLES_ADMINISTRADOR,
    items: [
      { to: "/admin/usuarios", label: "Gestión de Usuarios (RBAC)", icon: "bi-person-badge" },
      { to: "/admin/sensores", label: "Catálogo de Nodos (ESP32 / GPS)", icon: "bi-broadcast-pin" },
      { to: "/admin/auditoria", label: "Registro de Auditoría", icon: "bi-journal-text" },
      { to: "/admin/polizas", label: "Pólizas de Seguro", icon: "bi-check-circle-fill" },
      { to: "/admin/reclamos-seguro", label: "Reclamos de Seguro", icon: "bi-exclamation-triangle-fill" },
      { to: "/admin/asistente", label: "Feedback del Asistente IA", icon: "bi-robot" },
      { to: "/admin/configuracion", label: "Configuración de Notificaciones", icon: "bi-bell" },
    ],
  },
  {
    id: "tecnico",
    label: "Operador Técnico",
    roles: ROLES_OPERADOR_TECNICO,
    items: [
      { to: "/admin/telemetria", label: "Telemetría IoT", icon: "bi-reception-4" },
      { to: "/admin/calibracion", label: "Calibración de Sensores", icon: "bi-sliders" },
      { to: "/admin/tickets", label: "Tickets de Mantenimiento", icon: "bi-tools" },
    ],
  },
  {
    id: "coer",
    label: "Defensa Civil / COER",
    roles: ROLES_DEFENSA_CIVIL,
    items: [
      { to: "/admin/despacho", label: "Consola de Despacho", icon: "bi-broadcast" },
      { to: "/admin/albergues", label: "Albergues: Inventario y Aforo", icon: "bi-house-door" },
      { to: "/admin/reportes", label: "Moderación de Publicaciones", icon: "bi-clipboard-check" },
      { to: "/admin/chequeos-seguridad", label: "Chequeos de Seguridad", icon: "bi-person-badge" },
      { to: "/admin/impacto", label: "Panel de Impacto", icon: "bi-graph-up-arrow" },
    ],
  },
];

function itemClass({ isActive }) {
  return `flex items-center gap-3 pl-9 pr-4 py-2 rounded-xl text-sm transition ${
    isActive ? "bg-white/15 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
  }`;
}

function GrupoAccordion({ grupo, abierto, onToggle, onNavegar }) {
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-white/45 hover:text-white/80 transition"
      >
        <span className="flex-1 text-left">{grupo.label}</span>
        <span className={`inline-block transition-transform ${abierto ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {abierto && (
        <nav className="flex flex-col gap-0.5 mt-0.5 mb-2">
          {grupo.items.map((item) => (
            <NavLink key={item.to} to={item.to} className={itemClass} onClick={onNavegar}>
              <Icon name={item.icon} className="w-4 text-center -ml-1" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

function AdminLayout() {
  const { usuario, logout } = useAuth();
  const gruposVisibles = GRUPOS.filter((g) => g.roles.includes(usuario?.rol));
  const [abiertos, setAbiertos] = useState(() => new Set(gruposVisibles.slice(0, 1).map((g) => g.id)));
  // Solo en pantallas chicas: el menú lateral pasa a ser un panel deslizable
  // (Defensa Civil usa el panel desde el celular, en campo). En escritorio
  // siempre está visible y este estado no tiene efecto.
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto) return undefined;
    const cerrarConEscape = (e) => e.key === "Escape" && setMenuAbierto(false);
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto]);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  function alternar(id) {
    setAbiertos((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  return (
    <div className="min-h-screen lg:flex" style={{ backgroundColor: "var(--color-bg)" }}>
      <div
        className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 text-white"
        style={{ backgroundColor: "var(--color-brand-chrome)" }}
      >
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú del panel"
          aria-expanded={menuAbierto}
          aria-controls="menu-panel"
          className="p-2 -ml-2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <p className="font-bold truncate flex-1">Río Piura Alerta</p>
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--color-dorado)", color: "var(--color-brand-chrome)" }}
        >
          Modo operativo
        </span>
      </div>

      {menuAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={cerrarMenu} aria-hidden="true" />
      )}

      <aside
        id="menu-panel"
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col p-4 overflow-y-auto transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:visible ${
          menuAbierto ? "translate-x-0" : "-translate-x-full invisible"
        }`}
        style={{ backgroundColor: "var(--color-brand-chrome)" }}
      >
        <button
          type="button"
          onClick={cerrarMenu}
          aria-label="Cerrar menú del panel"
          className="lg:hidden self-end p-2 -mr-1 text-white/70 hover:text-white"
        >
          <Icon name="bi-x-lg" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
            <img src="/images/escudo-piura.png" alt="Escudo de Piura" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold leading-tight truncate">Río Piura Alerta</p>
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: "var(--color-dorado)", color: "var(--color-brand-chrome)" }}
            >
              Modo operativo
            </span>
          </div>
        </div>

        <div className="mt-6 flex-1">
          {gruposVisibles.map((grupo) => (
            <GrupoAccordion
              key={grupo.id}
              grupo={grupo}
              abierto={abiertos.has(grupo.id)}
              onToggle={() => alternar(grupo.id)}
              onNavegar={cerrarMenu}
            />
          ))}
        </div>

        <NavLink
          to="/"
          onClick={cerrarMenu}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition mt-2"
        >
          <span>←</span>
          Volver al sitio público
        </NavLink>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between px-2">
            <NavLink to="/perfil" onClick={cerrarMenu} className="min-w-0 hover:opacity-80 transition">
              <p className="text-sm font-semibold text-white truncate">{usuario?.nombre}</p>
              <p className="text-xs text-white/50 truncate">{usuario?.rol}</p>
            </NavLink>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full text-left text-sm font-medium text-white/60 hover:text-white transition px-2 py-2 mt-1"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <AlertaGlobal enPanel />
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
