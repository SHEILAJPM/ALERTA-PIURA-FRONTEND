// Roles con acceso al panel operativo (/admin). El registro público siempre
// crea 'ciudadano'; estos se asignan a mano (ver db/seed.js del backend).
export const ROLES_PANEL_ADMIN = ["administrador", "operario", "defensa_civil"];

// Subconjuntos por sección del panel (ver AdminLayout.jsx): controlan qué
// grupo del menú lateral ve cada rol y protegen las páginas más sensibles
// (ej. gestión de usuarios) incluso si alguien navega directo a la URL.
export const ROLES_ADMINISTRADOR = ["administrador"];
export const ROLES_OPERADOR_TECNICO = ["administrador", "operario"];
export const ROLES_DEFENSA_CIVIL = ["administrador", "defensa_civil"];
