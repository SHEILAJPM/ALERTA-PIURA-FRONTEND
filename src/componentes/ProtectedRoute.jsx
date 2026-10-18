import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";

// Envuelve rutas que requieren sesión y, opcionalmente, un rol específico
// (ej. <Route element={<ProtectedRoute roles={["administrador"]} />}>).
// Sin sesión -> manda a "/" y abre el modal de login; con sesión pero rol
// no permitido -> manda a "/" sin más (no filtra qué rutas existen).
function ProtectedRoute({ roles }) {
  const { usuario, abrirModal } = useAuth();

  // abrirModal actualiza el AuthContext: no puede llamarse durante el render
  // de este componente, tiene que ir en un efecto.
  useEffect(() => {
    if (!usuario) abrirModal("login");
  }, [usuario, abrirModal]);

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
