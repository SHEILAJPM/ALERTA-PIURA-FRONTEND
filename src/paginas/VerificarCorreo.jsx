import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verificarCorreo } from "../utilidades/api";
import Icon from "../componentes/Icon";

function VerificarCorreo() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [estado, setEstado] = useState(token ? "verificando" : "sin-token");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    verificarCorreo(token)
      .then(() => setEstado("listo"))
      .catch((err) => {
        setError(err.message);
        setEstado("error");
      });
  }, [token]);

  if (estado === "sin-token") {
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
          Abre este enlace desde el correo que te mandamos al registrarte.
        </p>
      </main>
    );
  }

  if (estado === "verificando") {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Verificando tu correo...
        </p>
      </main>
    );
  }

  if (estado === "error") {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <Icon
          name="bi-exclamation-triangle-fill"
          className="text-4xl"
          style={{ color: "var(--color-alerta)" }}
          aria-hidden="true"
        />
        <p className="mt-4 font-semibold">No se pudo verificar tu correo</p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          {error} — puedes pedir un nuevo enlace desde tu perfil.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <Icon
        name="bi-check-circle-fill"
        className="text-4xl"
        style={{ color: "var(--color-normal)" }}
        aria-hidden="true"
      />
      <p className="mt-4 font-semibold">¡Correo verificado!</p>
      <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
        Ya quedó confirmada tu cuenta de Piura Alerta.
      </p>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Ir al inicio
      </button>
    </main>
  );
}

export default VerificarCorreo;
