import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CloudRain,
  Droplets,
  House,
  LifeBuoy,
  MapPin,
  MessageCircle,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { subirFoto } from "../utilidades/cloudinary";
import { useAuth } from "../contexto/AuthContext";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useDictado } from "../ganchos/useDictado";
import { CalificacionIADetalle } from "./CalificacionIA";
import { CheckAnimado } from "./Animados";

// Agrega lo dictado al final de lo que ya hay, con la primera letra en
// mayúscula si empieza una oración.
function unirFrase(actual, frase) {
  const base = actual.trimEnd();
  if (!base) return frase.charAt(0).toUpperCase() + frase.slice(1);
  const nuevaOracion = /[.!?]$/.test(base);
  return `${base} ${nuevaOracion ? frase.charAt(0).toUpperCase() + frase.slice(1) : frase}`;
}

const inputStyle = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
};

// Tipo de reporte: se guarda como `categoria` (mismos valores que
// CATEGORIAS_REPORTE en el backend) y además escribe su nombre al inicio de la
// descripción, que la persona ve y puede editar.
const TIPOS = [
  { id: "calle_inundada", texto: "Calle inundada", icono: Waves },
  { id: "desborde", texto: "Desborde del río", icono: TriangleAlert },
  { id: "lluvia", texto: "Lluvia intensa", icono: CloudRain },
  { id: "dano_vivienda", texto: "Daño en vivienda", icono: House },
  { id: "personas_riesgo", texto: "Personas en riesgo", icono: LifeBuoy },
  // Después de las lluvias: posibles criaderos del zancudo del dengue.
  { id: "agua_estancada", texto: "Agua estancada", icono: Droplets },
  { id: "otro", texto: "Otra situación", icono: MessageCircle },
];

const PASOS = ["Qué pasa", "Ubicación", "Foto", "Confirmar"];

function quitarPrefijoTipo(texto) {
  for (const t of TIPOS) {
    if (texto.startsWith(`${t.texto}: `)) return texto.slice(t.texto.length + 2);
  }
  return texto;
}

function ReportForm({ onEnviar, enviando }) {
  const { usuario, abrirModal } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [foto, setFoto] = useState(null); // { url, previsualizacion }
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [errorLocal, setErrorLocal] = useState(null);
  const [avisoEncolado, setAvisoEncolado] = useState(false);
  const [avisoArchivado, setAvisoArchivado] = useState(false);
  const [calificacion, setCalificacion] = useState(null);
  const [paso, setPaso] = useState(0);
  // Hacia dónde se movió el último cambio de paso, para animar la entrada
  // del paso nuevo desde ese lado.
  const [direccion, setDireccion] = useState("adelante");
  const [tipo, setTipo] = useState(null);
  const dictado = useDictado((frase) => {
    setDescripcion((actual) => unirFrase(actual, frase));
    setAvisoEncolado(false);
    setAvisoArchivado(false);
    setCalificacion(null);
  });

  function obtenerUbicacion() {
    if (!navigator.geolocation) {
      setErrorLocal("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacion({ lon: pos.coords.longitude, lat: pos.coords.latitude }),
      () => setErrorLocal("No se pudo obtener tu ubicación.")
    );
  }

  async function manejarSeleccionFoto(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const previsualizacion = URL.createObjectURL(archivo);
    setFoto({ url: null, previsualizacion });
    setSubiendoFoto(true);
    setErrorLocal(null);

    try {
      const url = await subirFoto(archivo);
      setFoto({ url, previsualizacion });
    } catch (err) {
      setErrorLocal(err.message);
      setFoto(null);
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    dictado.detener();
    if (!descripcion.trim()) {
      setErrorLocal("Describe brevemente lo que estás reportando.");
      return;
    }
    if (!foto?.url) {
      setErrorLocal("Toma o adjunta una foto de lo que estás reportando.");
      return;
    }
    if (subiendoFoto) {
      setErrorLocal("Espera a que termine de subir la foto.");
      return;
    }
    try {
      const resultado = await onEnviar({
        descripcion: descripcion.trim(),
        foto_url: foto.url,
        categoria: tipo ?? undefined,
        ...(ubicacion ?? {}),
      });
      setDescripcion("");
      setFoto(null);
      setUbicacion(null);
      setErrorLocal(null);
      setPaso(0);
      setTipo(null);
      setAvisoEncolado(resultado?.encolado === true);
      setAvisoArchivado(resultado?.archivado === true);
      setCalificacion(resultado?.calificacion ?? null);
    } catch (err) {
      setErrorLocal(err.message);
    }
  }

  function elegirTipo(t) {
    setTipo(t.id);
    setDescripcion((actual) => `${t.texto}: ${quitarPrefijoTipo(actual).trimStart()}`);
    setAvisoEncolado(false);
    setAvisoArchivado(false);
    setCalificacion(null);
  }

  const puedeAvanzar = paso === 0 ? descripcion.trim().length > 0 : paso === 2 ? Boolean(foto?.url) : true;

  function avanzar() {
    if (paso === 0 && !descripcion.trim()) {
      setErrorLocal("Describe brevemente lo que estás reportando.");
      return;
    }
    if (paso === 2 && !foto?.url) {
      setErrorLocal(
        subiendoFoto
          ? "Espera a que termine de subir la foto."
          : "Toma o adjunta una foto de lo que estás reportando."
      );
      return;
    }
    dictado.detener();
    setErrorLocal(null);
    setDireccion("adelante");
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  }

  function retroceder() {
    setErrorLocal(null);
    setDireccion("atras");
    setPaso((p) => Math.max(p - 1, 0));
  }

  const claseDireccion = direccion === "atras" ? "pa-paso-atras" : "pa-paso-adelante";

  const tituloPaso = ["¿Qué está pasando?", "¿Dónde está pasando?", "Agrega una foto", "Revisa y envía"][
    paso
  ];

  return (
    <form
      onSubmit={(e) => {
        if (paso < PASOS.length - 1) {
          e.preventDefault();
          avanzar();
          return;
        }
        manejarSubmit(e);
      }}
      className="rounded-3xl border p-5 sm:p-6 h-fit flex flex-col gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Barra de progreso por pasos */}
      <div>
        <div className="flex items-center justify-between text-[12px] font-bold mb-2">
          <span style={{ color: "var(--color-primary)" }}>
            Paso {paso + 1} de {PASOS.length}
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>{PASOS[paso]}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
          {PASOS.map((p, i) => (
            <span
              key={p}
              className="h-1.5 rounded-full transition-colors duration-300"
              style={{
                background:
                  i <= paso
                    ? "linear-gradient(90deg, var(--color-sol), var(--color-sol-claro))"
                    : "var(--color-surface-alt)",
              }}
            />
          ))}
        </div>
      </div>

      <h3 className="font-display text-[22px] leading-tight" style={{ color: "var(--color-title)" }}>
        {tituloPaso}
      </h3>

      {paso === 0 && (
        <div key="paso-0" className={`${claseDireccion} flex flex-col gap-3`}>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo de situación">
            {TIPOS.map((t) => {
              const Icono = t.icono;
              const activo = tipo === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => elegirTipo(t)}
                  className={`pa-tocable flex flex-col items-start gap-2 rounded-2xl border p-3.5 min-h-[88px] text-left ${
                    t.id === "otro" ? "col-span-2" : ""
                  }`}
                  style={
                    activo
                      ? {
                          backgroundColor: "var(--color-activo)",
                          borderColor: "var(--color-activo)",
                          color: "#ffffff",
                          boxShadow: "0 10px 22px rgba(13,46,87,0.22)",
                        }
                      : {
                          backgroundColor: "var(--color-surface-alt)",
                          borderColor: "transparent",
                          color: "var(--color-title)",
                        }
                  }
                >
                  <Icono size={22} strokeWidth={1.75} aria-hidden="true" />
                  <span className="text-[13.5px] font-bold leading-tight">{t.texto}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <label htmlFor="reporte-descripcion" className="sr-only">
              Descripción
            </label>
            <textarea
              id="reporte-descripcion"
              placeholder={
                dictado.soportado
                  ? "Cuéntanos qué ves. Escribe o toca el micrófono para dictar"
                  : "Cuéntanos qué ves"
              }
              value={
                dictado.escuchando && dictado.parcial ? unirFrase(descripcion, dictado.parcial) : descripcion
              }
              onChange={(e) => {
                setDescripcion(e.target.value);
                setAvisoEncolado(false);
                setAvisoArchivado(false);
                setCalificacion(null);
              }}
              readOnly={dictado.escuchando}
              rows={3}
              className={`w-full rounded-2xl border px-4 py-3 text-[15px] ${dictado.soportado ? "pr-14" : ""}`}
              style={inputStyle}
            />
            {dictado.soportado && (
              <button
                type="button"
                onClick={dictado.escuchando ? dictado.detener : dictado.iniciar}
                aria-label={dictado.escuchando ? "Detener dictado" : "Dictar por voz"}
                aria-pressed={dictado.escuchando}
                className={`absolute right-2 top-2 w-11 h-11 rounded-full flex items-center justify-center text-lg ${
                  dictado.escuchando ? "animate-pulse text-white" : ""
                }`}
                style={
                  dictado.escuchando
                    ? { backgroundColor: "var(--color-alerta)" }
                    : { backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary)" }
                }
              >
                <Icon name={dictado.escuchando ? "bi-mic-fill" : "bi-mic"} aria-hidden="true" />
              </button>
            )}
          </div>
          {dictado.escuchando && (
            <p className="text-xs -mt-1" style={{ color: "var(--color-alerta)" }} role="status">
              Escuchando... habla y toca el micrófono otra vez para terminar.
            </p>
          )}
          {dictado.error && (
            <p className="text-xs -mt-1" style={{ color: "var(--color-alerta)" }}>
              {dictado.error}
            </p>
          )}

          {usuario ? (
            <div className="flex items-center gap-2">
              <Avatar nombre={usuario.nombre} size={28} />
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Publicando como <strong style={{ color: "var(--color-text)" }}>{usuario.nombre}</strong>
              </p>
            </div>
          ) : (
            // Sin sesión no se escribe un nombre a mano (cualquiera podría
            // firmar como otra persona): el reporte sale como "Anónimo".
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Se publicará como <strong style={{ color: "var(--color-text)" }}>Anónimo</strong>.{" "}
              <button
                type="button"
                onClick={() => abrirModal("login")}
                className="font-bold underline"
                style={{ color: "var(--color-primary)" }}
              >
                Inicia sesión
              </button>{" "}
              para que aparezca tu nombre.
            </p>
          )}
        </div>
      )}

      {paso === 1 && (
        <div key="paso-1" className={`${claseDireccion} flex flex-col gap-3`}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Con tu ubicación, Defensa Civil y tus vecinos saben exactamente dónde mirar. Es opcional.
          </p>
          <button
            type="button"
            onClick={obtenerUbicacion}
            className="pa-tocable flex items-center gap-4 rounded-2xl border p-4 text-left"
            style={
              ubicacion
                ? { backgroundColor: "var(--color-normal-soft)", borderColor: "transparent" }
                : { backgroundColor: "var(--color-surface-alt)", borderColor: "transparent" }
            }
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: ubicacion ? "var(--color-normal)" : "var(--color-primary)",
                color: "#ffffff",
              }}
            >
              {ubicacion ? <Check size={22} aria-hidden="true" /> : <MapPin size={22} aria-hidden="true" />}
            </span>
            <span>
              <span className="block font-bold" style={{ color: "var(--color-title)" }}>
                {ubicacion ? "Ubicación adjunta" : "Compartir mi ubicación"}
              </span>
              <span className="block text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {ubicacion
                  ? `${ubicacion.lat.toFixed(4)}, ${ubicacion.lon.toFixed(4)}`
                  : "Usamos el GPS de tu teléfono"}
              </span>
            </span>
          </button>
        </div>
      )}

      {paso === 2 && (
        <div key="paso-2" className={`${claseDireccion} flex flex-col gap-3`}>
          {foto?.previsualizacion ? (
            <div className="relative">
              <img
                src={foto.previsualizacion}
                alt="Previsualización"
                className="w-full max-h-64 object-cover rounded-2xl"
              />
              {subiendoFoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl text-white text-sm font-semibold">
                  Subiendo foto...
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Una foto clara ayuda a que la IA y los moderadores confirmen tu reporte más rápido.
            </p>
          )}
          <label
            className="pa-tocable cursor-pointer flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed min-h-[64px] font-bold"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
          >
            <Camera size={20} aria-hidden="true" /> {foto ? "Cambiar foto" : "Tomar o adjuntar foto"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={manejarSeleccionFoto}
              className="hidden"
            />
          </label>
        </div>
      )}

      {paso === 3 && (
        <div key="paso-3" className={`${claseDireccion} flex flex-col gap-3`}>
          <div className="flex gap-3 rounded-2xl p-3" style={{ backgroundColor: "var(--color-surface-alt)" }}>
            {foto?.previsualizacion && (
              <img
                src={foto.previsualizacion}
                alt=""
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="min-w-0 text-sm">
              <p className="font-semibold break-words" style={{ color: "var(--color-title)" }}>
                {descripcion}
              </p>
              <p className="mt-1.5 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                <MapPin size={13} aria-hidden="true" />
                {ubicacion ? "Con ubicación" : "Sin ubicación"}
                {` · ${usuario ? usuario.nombre : "Anónimo"}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {avisoEncolado && (
        <p
          className="text-sm rounded-2xl px-4 py-3 flex items-start gap-2"
          style={{ backgroundColor: "var(--color-prealerta-soft)", color: "var(--color-prealerta)" }}
        >
          <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" className="mt-0.5" />
          Sin conexión: tu reporte quedó guardado y se enviará solo apenas vuelva internet.
        </p>
      )}

      {avisoArchivado && (
        <p
          className="text-sm rounded-2xl px-4 py-3 flex items-start gap-2"
          style={{ backgroundColor: "var(--color-alerta-soft)", color: "var(--color-alerta)" }}
        >
          <Icon name="bi-robot" aria-hidden="true" className="mt-0.5" />
          Tu foto o descripción no parecen estar relacionadas con una inundación, así que no se publicó. Si
          crees que es un error, vuelve a intentarlo con una foto más clara.
        </p>
      )}

      {calificacion && (
        <div role="status">
          {calificacion.veredicto === "apto" && (
            <div className="flex items-center gap-3 mb-3">
              <CheckAnimado tamano={48} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-normal)" }}>
                ¡Publicado! La IA revisó tu foto y tu descripción:
              </p>
            </div>
          )}
          {calificacion.veredicto === "revisar" && (
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-prealerta)" }}>
              Recibido. Un moderador la revisará antes de publicarla:
            </p>
          )}
          <CalificacionIADetalle {...calificacion} />
        </div>
      )}

      {errorLocal && (
        <p className="text-sm" role="alert" style={{ color: "var(--color-alerta)" }}>
          {errorLocal}
        </p>
      )}

      <div className="flex gap-2">
        {paso > 0 && (
          <button
            type="button"
            onClick={retroceder}
            aria-label="Paso anterior"
            className="w-13 min-h-[52px] rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-title)" }}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}
        {paso < PASOS.length - 1 ? (
          <button
            type="button"
            onClick={avanzar}
            aria-disabled={!puedeAvanzar}
            className={`btn-dorado pa-tocable flex-1 min-h-[52px] rounded-full font-extrabold flex items-center justify-center gap-2 ${
              puedeAvanzar ? "" : "opacity-60"
            }`}
          >
            {paso === 1 && !ubicacion ? "Omitir y seguir" : "Siguiente"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={enviando || subiendoFoto}
            className="btn-dorado pa-tocable flex-1 min-h-[52px] rounded-full font-extrabold disabled:opacity-60"
          >
            {enviando ? "La IA está revisando tu publicación..." : "Enviar reporte"}
          </button>
        )}
      </div>
    </form>
  );
}

export default ReportForm;
