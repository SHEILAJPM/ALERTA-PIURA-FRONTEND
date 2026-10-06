import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { useModalA11y } from "../ganchos/useModalA11y";
import { ROLES_PANEL_ADMIN } from "../constantes/roles";
import { olvidarPassword } from "../utilidades/api";

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

// Segundo paso del login para roles operativos (ver ROLES_CON_2FA en
// src/rutas/auth.routes.js): el código llega por correo, referencia solo
// identifica qué código, no lo reemplaza.
function CampoCodigo2FA({ referencia, onExito }) {
  const { confirmar2FA } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await confirmar2FA(referencia, codigo);
      navigate("/admin");
      onExito?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-3">
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Te mandamos un código de 6 dígitos por correo. Escríbelo acá para terminar de ingresar.
      </p>
      <input
        type="text"
        inputMode="numeric"
        placeholder="000000"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        pattern="\d{6}"
        maxLength={6}
        className="w-full rounded-lg border px-3 py-2 text-sm text-center tracking-[0.5em] font-mono-data"
        style={inputStyle}
      />
      {error && (
        <p className="text-sm" style={{ color: "var(--color-alerta)" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando || codigo.length !== 6}
        className="w-full rounded-lg py-2.5 font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {enviando ? "Verificando..." : "Verificar código"}
      </button>
    </form>
  );
}

function CampoLogin({ onExito, onOlvideContrasena, onPaso2FA }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [referencia2FA, setReferencia2FA] = useState(null);

  async function manejarSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const resultado = await login(correo, password);
      if (resultado?.requiere_2fa) {
        setReferencia2FA(resultado.referencia);
        onPaso2FA?.(true);
        return;
      }
      // Cuentas operativas (admin/operario/defensa civil) van directo al
      // panel: no tiene sentido dejarlas en la pantalla pública tras el login.
      if (resultado && ROLES_PANEL_ADMIN.includes(resultado.rol)) {
        navigate("/admin");
      }
      onExito?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (referencia2FA) {
    return <CampoCodigo2FA referencia={referencia2FA} onExito={onExito} />;
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-3">
      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={inputStyle}
      />
      <button
        type="button"
        onClick={onOlvideContrasena}
        className="text-xs font-semibold text-right block"
        style={{ color: "var(--color-primary)" }}
      >
        ¿Olvidaste tu contraseña?
      </button>
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
        {enviando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

function CampoOlvidePassword({ onVolver }) {
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  async function manejarSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await olvidarPassword(correo);
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "var(--color-text)" }}>
          Si <strong>{correo}</strong> tiene una cuenta, te llegará un enlace para elegir una nueva
          contraseña. Revisa tu bandeja de entrada (y spam).
        </p>
        <button
          type="button"
          onClick={onVolver}
          className="w-full rounded-lg py-2.5 font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-3">
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Escribe tu correo y te mandamos un enlace para elegir una nueva contraseña.
      </p>
      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={inputStyle}
      />
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
        {enviando ? "Enviando..." : "Mandar enlace"}
      </button>
      <button
        type="button"
        onClick={onVolver}
        className="w-full text-sm font-medium text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Volver a iniciar sesión
      </button>
    </form>
  );
}

function CampoRegistro({ onExito }) {
  const { registro } = useAuth();
  const [form, setForm] = useState({ nombre: "", correo: "", password: "" });
  const [datosOpcionales, setDatosOpcionales] = useState({
    dni: "",
    telefono: "",
    direccion: "",
    recibirSMS: false,
  });
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo, setter) {
    return (e) => setter((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const telefono = datosOpcionales.telefono.trim() || undefined;
      await registro({
        ...form,
        dni: datosOpcionales.dni.trim() || undefined,
        telefono,
        direccion: datosOpcionales.direccion.trim() || undefined,
        recibir_alertas_sms: telefono ? datosOpcionales.recibirSMS : undefined,
      });
      onExito?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Nombre"
        value={form.nombre}
        onChange={actualizar("nombre", setForm)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={inputStyle}
      />
      <input
        type="email"
        placeholder="Correo"
        value={form.correo}
        onChange={actualizar("correo", setForm)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Contraseña (mínimo 8 caracteres)"
        value={form.password}
        onChange={actualizar("password", setForm)}
        required
        minLength={8}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={inputStyle}
      />

      <button
        type="button"
        onClick={() => setMostrarOpcionales((v) => !v)}
        className="text-xs font-semibold"
        style={{ color: "var(--color-primary)" }}
      >
        {mostrarOpcionales ? "− Ocultar" : "+ Agregar"} DNI / teléfono / dirección (opcional)
      </button>

      {mostrarOpcionales && (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="DNI (8 dígitos)"
            value={datosOpcionales.dni}
            onChange={actualizar("dni", setDatosOpcionales)}
            pattern="\d{8}"
            title="8 dígitos"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={datosOpcionales.telefono}
            onChange={actualizar("telefono", setDatosOpcionales)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
          {datosOpcionales.telefono.trim() && (
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <input
                type="checkbox"
                checked={datosOpcionales.recibirSMS}
                onChange={(e) => setDatosOpcionales((prev) => ({ ...prev, recibirSMS: e.target.checked }))}
              />
              Avisarme por SMS ante alertas del río
            </label>
          )}
          <input
            type="text"
            placeholder="Dirección"
            value={datosOpcionales.direccion}
            onChange={actualizar("direccion", setDatosOpcionales)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
      )}

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
        {enviando ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}

function AuthModal() {
  const { modal, cerrarModal, abrirModal, sesionExpirada } = useAuth();
  if (!modal) return null;
  return (
    <DialogoAuth
      modal={modal}
      cerrarModal={cerrarModal}
      abrirModal={abrirModal}
      sesionExpirada={sesionExpirada}
    />
  );
}

const TITULOS = {
  login: "Iniciar sesión",
  registro: "Crear cuenta",
  "olvide-password": "Recuperar contraseña",
};

function DialogoAuth({ modal, cerrarModal, abrirModal, sesionExpirada }) {
  const contenedorRef = useModalA11y(cerrarModal);
  const esLogin = modal === "login";
  const esOlvidePassword = modal === "olvide-password";
  // En el paso de código (ver CampoCodigo2FA), no tiene sentido ofrecer
  // "Regístrate": abandonaría un login a medias por una cuenta nueva.
  const [enPaso2FA, setEnPaso2FA] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={cerrarModal}
    >
      <div
        ref={contenedorRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-titulo"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border p-6 outline-none"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="auth-modal-titulo" className="text-lg font-bold">
            {TITULOS[modal]}
          </h3>
          <button
            type="button"
            onClick={cerrarModal}
            aria-label="Cerrar"
            className="text-xl leading-none"
            style={{ color: "var(--color-text-muted)" }}
          >
            ×
          </button>
        </div>

        {sesionExpirada && esLogin && (
          <p
            className="text-sm mb-3 rounded-lg px-3 py-2"
            style={{ backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-prealerta)" }}
          >
            Tu sesión expiró. Volvé a iniciar sesión para continuar.
          </p>
        )}

        {esOlvidePassword ? (
          <CampoOlvidePassword onVolver={() => abrirModal("login")} />
        ) : esLogin ? (
          <CampoLogin
            onExito={cerrarModal}
            onOlvideContrasena={() => abrirModal("olvide-password")}
            onPaso2FA={setEnPaso2FA}
          />
        ) : (
          <CampoRegistro onExito={cerrarModal} />
        )}

        {!esOlvidePassword && !enPaso2FA && (
          <p className="text-sm text-center mt-4" style={{ color: "var(--color-text-muted)" }}>
            {esLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              onClick={() => abrirModal(esLogin ? "registro" : "login")}
              className="font-semibold"
              style={{ color: "var(--color-primary)" }}
            >
              {esLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
