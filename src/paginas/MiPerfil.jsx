import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { useResource } from "../ganchos/useResource";
import { useSensores } from "../ganchos/useSensores";
import {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  reenviarVerificacionCorreo,
} from "../utilidades/api";
import Avatar from "../componentes/Avatar";
import Icon from "../componentes/Icon";
import Skeleton from "../componentes/Skeleton";
import ErrorBanner from "../componentes/ErrorBanner";

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-bg)",
  color: "var(--color-text)",
};

const ROL_LABEL = {
  ciudadano: "Ciudadano",
  operario: "Operador técnico",
  defensa_civil: "Defensa Civil / COER",
  administrador: "Administrador",
};

function Tarjeta({ titulo, children }) {
  return (
    <section
      className="rounded-2xl border p-5 sm:p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h3 className="font-bold mb-4">{titulo}</h3>
      {children}
    </section>
  );
}

function Aviso({ tipo, children }) {
  const colores = tipo === "exito" ? { color: "var(--color-normal)" } : { color: "var(--color-alerta)" };
  return (
    <p className="text-sm flex items-center gap-1.5" style={colores}>
      <Icon
        name={tipo === "exito" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function AvisoCorreoNoVerificado() {
  const [estado, setEstado] = useState("inicial"); // inicial | enviando | enviado | error
  const [error, setError] = useState(null);

  async function reenviar() {
    setEstado("enviando");
    setError(null);
    try {
      await reenviarVerificacionCorreo();
      setEstado("enviado");
    } catch (err) {
      setError(err.message);
      setEstado("error");
    }
  }

  return (
    <div
      className="rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3"
      style={{ backgroundColor: "var(--color-prealerta-soft)", borderColor: "var(--color-prealerta)" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--color-prealerta)" }}>
          <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" className="mr-1.5" />
          Todavía no confirmaste tu correo.
        </p>
        {estado === "enviado" && (
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            Te mandamos un nuevo enlace, revisa tu bandeja (y spam).
          </p>
        )}
        {error && (
          <p className="text-xs mt-1" style={{ color: "var(--color-alerta)" }}>
            {error}
          </p>
        )}
      </div>
      {estado !== "enviado" && (
        <button
          type="button"
          onClick={reenviar}
          disabled={estado === "enviando"}
          className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--color-prealerta)" }}
        >
          {estado === "enviando" ? "Enviando..." : "Reenviar correo"}
        </button>
      )}
    </div>
  );
}

function FormularioDatos({ perfil, onGuardado }) {
  const { data: sensores } = useSensores();
  const [form, setForm] = useState({
    nombre: perfil.nombre ?? "",
    telefono: perfil.telefono ?? "",
    direccion: perfil.direccion ?? "",
    recibirSMS: perfil.recibir_alertas_sms ?? false,
    sensorInteresId: perfil.sensor_interes_id ?? "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  function actualizar(campo) {
    return (e) => {
      setForm((prev) => ({ ...prev, [campo]: e.target.value }));
      setExito(false);
    };
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(false);
    try {
      const telefono = form.telefono.trim() || undefined;
      const activaSMS = Boolean(telefono) && form.recibirSMS;
      const actualizado = await actualizarPerfil({
        nombre: form.nombre.trim() || undefined,
        telefono,
        direccion: form.direccion.trim() || undefined,
        recibir_alertas_sms: telefono ? form.recibirSMS : undefined,
        sensor_interes_id: activaSMS ? form.sensorInteresId || null : undefined,
      });
      onGuardado(actualizado);
      setExito(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Nombre</span>
        <input
          type="text"
          value={form.nombre}
          onChange={actualizar("nombre")}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Teléfono</span>
        <input
          type="tel"
          value={form.telefono}
          onChange={actualizar("telefono")}
          placeholder="No registrado"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>
      {form.telefono.trim() && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.recibirSMS}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, recibirSMS: e.target.checked }));
              setExito(false);
            }}
          />
          <span>Avisarme por SMS ante alertas del río</span>
        </label>
      )}
      {form.telefono.trim() && form.recibirSMS && sensores && sensores.length > 1 && (
        <label className="block text-sm">
          <span className="font-medium">Sensor que me interesa</span>
          <select
            value={form.sensorInteresId}
            onChange={actualizar("sensorInteresId")}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          >
            <option value="">Todos los sensores</option>
            {sensores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.codigo})
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block text-sm">
        <span className="font-medium">Dirección</span>
        <input
          type="text"
          value={form.direccion}
          onChange={actualizar("direccion")}
          placeholder="No registrada"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      {error && <Aviso tipo="error">{error}</Aviso>}
      {exito && <Aviso tipo="exito">Datos actualizados.</Aviso>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {enviando ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function FormularioPassword() {
  const [form, setForm] = useState({ passwordActual: "", passwordNueva: "", confirmar: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  function actualizar(campo) {
    return (e) => {
      setForm((prev) => ({ ...prev, [campo]: e.target.value }));
      setExito(false);
    };
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    if (form.passwordNueva !== form.confirmar) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(false);
    try {
      await cambiarPassword({ passwordActual: form.passwordActual, passwordNueva: form.passwordNueva });
      setForm({ passwordActual: "", passwordNueva: "", confirmar: "" });
      setExito(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Contraseña actual</span>
        <input
          type="password"
          value={form.passwordActual}
          onChange={actualizar("passwordActual")}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Contraseña nueva</span>
        <input
          type="password"
          value={form.passwordNueva}
          onChange={actualizar("passwordNueva")}
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Confirmar contraseña nueva</span>
        <input
          type="password"
          value={form.confirmar}
          onChange={actualizar("confirmar")}
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={inputStyle}
        />
      </label>

      {error && <Aviso tipo="error">{error}</Aviso>}
      {exito && <Aviso tipo="exito">Contraseña actualizada.</Aviso>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {enviando ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

function MiPerfil() {
  const { actualizarUsuario } = useAuth();
  const { data: perfil, loading, error, setData, recargar } = useResource(obtenerPerfil, []);

  function manejarGuardado(actualizado) {
    setData(actualizado);
    actualizarUsuario(actualizado);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="mb-6">
        <p
          className="font-semibold text-sm uppercase tracking-wide"
          style={{ color: "var(--color-primary)" }}
        >
          Mi cuenta
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">Mi perfil</h2>
      </section>

      {error && <ErrorBanner message={`No se pudo cargar tu perfil: ${error}`} onRetry={recargar} />}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        perfil && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-4 rounded-2xl border p-5 sm:p-6"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Avatar nombre={perfil.nombre} size={56} />
              <div className="min-w-0">
                <p className="font-bold text-lg truncate">{perfil.nombre}</p>
                <p className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                  {perfil.correo}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {ROL_LABEL[perfil.rol] ?? perfil.rol} · miembro desde{" "}
                  {new Date(perfil.creado_en).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {perfil.dni && <> · DNI {perfil.dni}</>}
                </p>
              </div>
            </div>

            {!perfil.correo_verificado && <AvisoCorreoNoVerificado />}

            <Tarjeta titulo="Mis reportes">
              <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                Revisa el historial de lo que reportaste, incluido lo que se archivó.
              </p>
              <Link
                to="/mis-reportes"
                className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ver mis reportes
              </Link>
            </Tarjeta>

            <Tarjeta titulo="Seguro contra inundaciones">
              <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                Revisa el estado de tu cobertura o contrata un nuevo periodo.
              </p>
              <Link
                to="/mi-poliza"
                className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ver mi póliza
              </Link>
            </Tarjeta>

            <Tarjeta titulo="Datos de contacto">
              <FormularioDatos perfil={perfil} onGuardado={manejarGuardado} />
            </Tarjeta>

            <Tarjeta titulo="Contraseña">
              <FormularioPassword />
            </Tarjeta>
          </div>
        )
      )}
    </main>
  );
}

export default MiPerfil;
