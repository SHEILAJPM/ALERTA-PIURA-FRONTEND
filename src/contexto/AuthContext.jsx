import { createContext, useContext, useEffect, useState } from "react";
import { registrarUsuario, iniciarSesion, verificarCodigo2FA } from "../utilidades/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "piura-alerta-auth";
const EVENTO_SESION_EXPIRADA = "piura-alerta:sesion-expirada";
const EVENTO_SESION_CAMBIO = "piura-alerta:sesion-cambio";

// utilidades/api.js vive fuera de React (lo usan hooks y llamadas sueltas), así que
// no puede leer/actualizar este contexto directo. Dispara un evento del DOM
// cuando un 401 llega con token adjunto (sesión que se creía válida y ya no
// lo es); el AuthProvider más abajo lo escucha para cerrar sesión y avisar.
export function dispararSesionExpirada() {
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
}

// Mismo motivo: WebSocketContext.jsx necesita re-mandar el token cada vez que
// cambia la sesión (login/logout/cambio de cuenta), no solo al abrir el
// socket, para que el servidor sepa a qué rol tratarlo (ver
// transmitirRestringido en el backend).
export function dispararSesionCambio() {
  window.dispatchEvent(new Event(EVENTO_SESION_CAMBIO));
}

function leerSesionGuardada() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionGuardada);
  // null = cerrado; "login" | "registro" = modal abierto en ese modo.
  const [modal, setModal] = useState(null);
  const [sesionExpirada, setSesionExpirada] = useState(false);

  useEffect(() => {
    if (sesion) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    dispararSesionCambio();
  }, [sesion]);

  useEffect(() => {
    function manejarSesionExpirada() {
      setSesion(null);
      setSesionExpirada(true);
      setModal("login");
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, manejarSesionExpirada);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, manejarSesionExpirada);
  }, []);

  // Roles operativos no vuelven con { token, usuario } directo (ver
  // src/rutas/auth.routes.js): en ese caso se devuelve la respuesta cruda
  // ({ requiere_2fa, referencia }) para que CampoLogin muestre el segundo
  // paso, en vez de abrir sesión con datos a medias.
  async function login(correo, password) {
    const respuesta = await iniciarSesion({ correo, password });
    if (respuesta.requiere_2fa) return respuesta;
    setSesion({ token: respuesta.token, usuario: respuesta.usuario });
    setModal(null);
    return respuesta.usuario;
  }

  async function confirmar2FA(referencia, codigo) {
    const { token, usuario } = await verificarCodigo2FA({ referencia, codigo });
    setSesion({ token, usuario });
    setModal(null);
    return usuario;
  }

  async function registro(datos) {
    const { token, usuario } = await registrarUsuario(datos);
    setSesion({ token, usuario });
    setModal(null);
  }

  function logout() {
    setSesion(null);
  }

  // Tras editar el perfil (nombre/teléfono/dirección) hay que refrescar la
  // copia en memoria/localStorage, si no el navbar y otras vistas siguen
  // mostrando el nombre viejo hasta el próximo login.
  function actualizarUsuario(usuarioActualizado) {
    setSesion((actual) => (actual ? { ...actual, usuario: usuarioActualizado } : actual));
  }

  return (
    <AuthContext.Provider
      value={{
        usuario: sesion?.usuario ?? null,
        token: sesion?.token ?? null,
        login,
        confirmar2FA,
        registro,
        logout,
        actualizarUsuario,
        modal,
        abrirModal: (modo = "login") => setModal(modo),
        cerrarModal: () => {
          setModal(null);
          setSesionExpirada(false);
        },
        sesionExpirada,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

// Fuera de React (ej. utilidades/api.js), para adjuntar el token sin pasar por props.
export function obtenerTokenGuardado() {
  return leerSesionGuardada()?.token ?? null;
}
