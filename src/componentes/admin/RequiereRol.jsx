import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexto/AuthContext";

// Igual que ProtectedRoute pero para una sección dentro de /admin que ya
// pasó la verificación de sesión: si el rol no alcanza, no se revela la
// página, simplemente vuelve a la sección por defecto del panel.
function RequiereRol({ roles, children }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario?.rol)) {
    return <Navigate to="/admin/reportes" replace />;
  }
  return children;
}

export default RequiereRol;
