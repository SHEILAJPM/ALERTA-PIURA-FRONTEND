import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { restablecerPassword } from "../utilidades/api";
import { useAuth } from "../contexto/AuthContext";
import Icon from "../componentes/Icon";

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { abrirModal } = useAuth();
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (passwordNueva !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await restablecerPassword({ token, passwordNueva });
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <Icon
          name="bi-exclamation-triangle-fill"
          className="text-4xl"
          style={{ color: "var(--color-alerta)" }}
          aria-hidden="true"
        />
        <p className="mt-4 font-semibold">Enlace incompleto</p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Abre este formulario desde el enlace que te mandamos por correo.
        </p>
      </main>
    );
  }

  if (listo) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <Icon
          name="bi-check-circle-fill"
          className="text-4xl"
          style={{ color: "var(--color-normal)" }}
          aria-hidden="true"
        />
        <p className="mt-4 font-semibold">Contraseña actualizada</p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <button
          type="button"
          onClick={() => {
            navigate("/");
            abrirModal("login");
          }}
          className="mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Iniciar sesión
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold text-center">Elige una nueva contraseña</h2>
      <form onSubmit={manejarSubmit} className="space-y-3 mt-6">
        <label className="block text-sm">
          <span className="font-medium">Contraseña nueva</span>
          <input
            type="password"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Confirmar contraseña</span>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>

        {error && (
          <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg py-2.5 font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {enviando ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </main>
  );
}

export default RestablecerPassword;
