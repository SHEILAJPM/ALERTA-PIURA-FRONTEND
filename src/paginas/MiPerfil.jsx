import { useState } from "react";
import { InterruptorModoOscuro } from "../componentes/ThemeToggle";
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
      className="rounded-3xl border p-5 sm:p-6"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <h3 className="font-display text-lg mb-4">{titulo}</h3>
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

// Registro VOLUNTARIO de apoyo para evacuar (ODS 10.2 / 11.5). Solo lo ve
// Defensa Civil en la consola de Despacho, y solo si esta persona envía un
// SOS: así sabe a quién priorizar. Guardar sin marcar nada lo borra.
const TIPOS_APOYO = [
  { id: "adulto_mayor", texto: "Adulto mayor" },
  { id: "movilidad_reducida", texto: "Movilidad reducida o silla de ruedas" },
  { id: "discapacidad_visual", texto: "Discapacidad visual" },
  { id: "discapacidad_auditiva", texto: "Discapacidad auditiva" },
  { id: "gestante", texto: "Gestante" },
  { id: "ninos_pequenos", texto: "Vivo con niños pequeños" },
  { id: "enfermedad_cronica", texto: "Enfermedad crónica o dependo de medicinas" },
];

function FormularioApoyo({ perfil, onGuardado }) {
  const registrado = perfil.apoyo_evacuacion ?? [];
  const [elegidos, setElegidos] = useState(registrado);
  const [acepta, setAcepta] = useState(registrado.length > 0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  function alternar(id) {
    setElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setExito(null);
  }

  async function guardar(e) {
    e.preventDefault();
    if (elegidos.length > 0 && !acepta) {
      setError("Marca la casilla de consentimiento para guardar.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const actualizado = await actualizarPerfil({ apoyo_evacuacion: elegidos });
      onGuardado(actualizado);
      setExito(
        elegidos.length > 0
          ? "Guardado. Si pides SOS, Defensa Civil te verá como prioridad."
          : "Registro borrado."
      );
      if (elegidos.length === 0) setAcepta(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Si tú o alguien de tu casa necesita ayuda para evacuar, márcalo. Es opcional. Solo lo ve Defensa Civil
        cuando envías un SOS, para atenderte primero. Puedes borrarlo cuando quieras.
      </p>
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <legend className="sr-only">Tipo de apoyo que necesitas</legend>
        {TIPOS_APOYO.map((t) => (
          <label
            key={t.id}
            className="flex items-center gap-3 min-h-[48px] rounded-2xl px-3.5 cursor-pointer text-sm font-semibold"
            style={{
              backgroundColor: elegidos.includes(t.id)
                ? "var(--color-primary-soft)"
                : "var(--color-surface-alt)",
              color: elegidos.includes(t.id) ? "var(--color-primary)" : "var(--color-text)",
            }}
          >
            <input
              type="checkbox"
              checked={elegidos.includes(t.id)}
              onChange={() => alternar(t.id)}
              className="w-5 h-5 shrink-0 accent-[var(--color-primary)]"
            />
            {t.texto}
          </label>
        ))}
      </fieldset>
      {elegidos.length > 0 && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => {
              setAcepta(e.target.checked);
              setError(null);
            }}
            className="w-5 h-5 mt-0.5 shrink-0 accent-[var(--color-primary)]"
          />
          <span>
            Acepto que Piura Alerta guarde esta información y la muestre a Defensa Civil solo si envío un SOS.
          </span>
        </label>
      )}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {exito && <Aviso tipo="exito">{exito}</Aviso>}
      <button
        type="submit"
        disabled={enviando}
        className="btn-dorado pa-tocable inline-flex items-center min-h-[44px] rounded-full px-5 text-sm font-extrabold disabled:opacity-60"
      >
        {enviando
          ? "Guardando..."
          : elegidos.length === 0 && registrado.length > 0
            ? "Borrar mi registro"
            : "Guardar"}
      </button>
    </form>
  );
}

// Sexo y año de nacimiento: opcionales, solo para estadísticas agregadas del
// panel ODS (desglose por sexo y edad que recomienda el Marco de Sendai).
function FormularioSobreTi({ perfil, onGuardado }) {
  const [sexo, setSexo] = useState(perfil.sexo ?? "");
  const [anio, setAnio] = useState(perfil.anio_nacimiento ? String(perfil.anio_nacimiento) : "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const anioActual = new Date().getFullYear();

  async function guardar(e) {
    e.preventDefault();
    const anioNumero = anio.trim() ? Number(anio) : null;
    if (
      anioNumero !== null &&
      (!Number.isInteger(anioNumero) || anioNumero < 1900 || anioNumero > anioActual)
    ) {
      setError(`Escribe un año entre 1900 y ${anioActual}.`);
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(false);
    try {
      const actualizado = await actualizarPerfil({ sexo: sexo || null, anio_nacimiento: anioNumero });
      onGuardado(actualizado);
      setExito(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Es opcional. Solo se usa para contar, sin nombres, cuántas mujeres y adultos mayores usan la app, y
        así mejorar la ayuda para ellos. Nunca se muestra a nadie.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium">Sexo</span>
          <select
            value={sexo}
            onChange={(e) => {
              setSexo(e.target.value);
              setExito(false);
            }}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm min-h-[44px]"
            style={inputStyle}
          >
            <option value="">Sin indicar</option>
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
            <option value="otro">Otro</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Año de nacimiento</span>
          <input
            type="number"
            inputMode="numeric"
            min={1900}
            max={anioActual}
            placeholder="Ej.: 1980"
            value={anio}
            onChange={(e) => {
              setAnio(e.target.value);
              setExito(false);
            }}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm min-h-[44px]"
            style={inputStyle}
          />
        </label>
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {exito && <Aviso tipo="exito">Guardado.</Aviso>}
      <button
        type="submit"
        disabled={enviando}
        className="btn-dorado pa-tocable inline-flex items-center min-h-[44px] rounded-full px-5 text-sm font-extrabold disabled:opacity-60"
      >
        {enviando ? "Guardando..." : "Guardar"}
      </button>
    </form>
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
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-8">
      <section className="pa-entra mb-6">
        <p
          className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-primary)" }}
        >
          Mi cuenta
        </p>
        <h1 className="text-[34px] md:text-[40px] leading-[1.08] mt-1">Perfil y ajustes</h1>
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
            <div className="pa-hero pa-entra flex items-center gap-4 p-5 sm:p-6">
              <Avatar nombre={perfil.nombre} size={56} />
              <div className="min-w-0">
                <p className="font-display font-extrabold text-xl truncate">{perfil.nombre}</p>
                <p className="text-sm truncate text-white/80">{perfil.correo}</p>
                <p className="text-xs mt-1 text-white/70">
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
                className="btn-dorado pa-tocable inline-flex items-center min-h-[44px] rounded-full px-5 text-sm font-extrabold"
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
                className="btn-dorado pa-tocable inline-flex items-center min-h-[44px] rounded-full px-5 text-sm font-extrabold"
              >
                Ver mi póliza
              </Link>
            </Tarjeta>

            <section className="flex flex-col gap-2" aria-labelledby="ajustes-titulo">
              <p
                id="ajustes-titulo"
                className="px-4 text-[11px] font-extrabold tracking-[0.12em] uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Ajustes
              </p>
              <div
                className="rounded-3xl border overflow-hidden divide-y divide-[var(--color-border)]"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <InterruptorModoOscuro />
              </div>
            </section>

            <Tarjeta titulo="Apoyo en una evacuación">
              <FormularioApoyo perfil={perfil} onGuardado={manejarGuardado} />
            </Tarjeta>

            <Tarjeta titulo="Sobre ti (opcional)">
              <FormularioSobreTi perfil={perfil} onGuardado={manejarGuardado} />
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
