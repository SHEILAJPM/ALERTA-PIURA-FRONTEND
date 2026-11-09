import { useState } from "react";
import { useAuth } from "../contexto/AuthContext";
import { exigirSesion } from "../utilidades/plataforma";
import { CampoLogin, CampoOlvidePassword, CampoRegistro } from "./AuthModal";

const PESTAÑAS = [
  { id: "login", texto: "Iniciar sesión" },
  { id: "registro", texto: "Registrarse" },
];

// Primera pantalla de la app Android: sin sesión no se entra. Reusa los
// mismos formularios del modal (AuthModal) para que el login, el 2FA, la
// consulta de DNI y la recuperación de contraseña funcionen igual que en la web.
function PantallaAcceso() {
  const { sesionExpirada } = useAuth();
  const [modo, setModo] = useState("login");
  const [enPaso2FA, setEnPaso2FA] = useState(false);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--color-brand-chrome)" }}
    >
      <div className="flex flex-col items-center text-center mb-6">
        <img src="/images/logo.svg" alt="" width={72} height={72} className="w-18 h-18" />
        <h1 className="mt-3 text-2xl font-bold text-white">Río Piura Alerta</h1>
        <p className="mt-1 text-sm text-white/75 max-w-xs">
          Alertas de inundación del río Piura en tiempo real. Ingresa para continuar.
        </p>
      </div>

      <section
        aria-label="Acceso"
        className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {modo === "olvide-password" ? (
          <>
            <h2 className="text-lg font-bold mb-4">Recuperar contraseña</h2>
            <CampoOlvidePassword onVolver={() => setModo("login")} />
          </>
        ) : (
          <>
            {!enPaso2FA && (
              <div
                role="tablist"
                className="grid grid-cols-2 gap-1 rounded-xl p-1 mb-5"
                style={{ backgroundColor: "var(--color-bg)" }}
              >
                {PESTAÑAS.map((p) => {
                  const activa = modo === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={activa}
                      onClick={() => setModo(p.id)}
                      className="rounded-lg py-2 text-sm font-semibold transition"
                      style={
                        activa
                          ? { backgroundColor: "var(--color-primary)", color: "#fff" }
                          : { color: "var(--color-text-muted)" }
                      }
                    >
                      {p.texto}
                    </button>
                  );
                })}
              </div>
            )}

            {sesionExpirada && modo === "login" && (
              <p
                className="text-sm mb-3 rounded-lg px-3 py-2"
                style={{ backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-prealerta)" }}
              >
                Tu sesión expiró. Vuelve a iniciar sesión para continuar.
              </p>
            )}

            {modo === "login" ? (
              <CampoLogin onOlvideContrasena={() => setModo("olvide-password")} onPaso2FA={setEnPaso2FA} />
            ) : (
              <CampoRegistro />
            )}
          </>
        )}
      </section>
    </main>
  );
}

// Envuelve todo lo que va dentro del router: en la app, sin sesión solo se ve
// la pantalla de acceso; al cerrar sesión (o si expira) se vuelve a ella.
function PuertaSesion({ children }) {
  const { usuario } = useAuth();
  if (exigirSesion && !usuario) return <PantallaAcceso />;
  return children;
}

export default PuertaSesion;
