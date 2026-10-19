// Círculo con las iniciales: sin fotos de perfil (no hay subida de avatar),
// pero cada persona mantiene siempre el mismo color, así se reconoce de un
// vistazo quién publicó en el feed.
const COLORES = ["#0a2f52", "#2f9e44", "#b8862e", "#7048e8", "#c2255c", "#1971c2", "#e8590c", "#0c8599"];

function iniciales(nombre) {
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function colorPara(nombre) {
  let hash = 0;
  for (const caracter of nombre ?? "") hash = (hash * 31 + caracter.charCodeAt(0)) | 0;
  return COLORES[Math.abs(hash) % COLORES.length];
}

function Avatar({ nombre, size = 36 }) {
  return (
    <span
      aria-hidden="true"
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        backgroundColor: colorPara(nombre),
      }}
    >
      {iniciales(nombre)}
    </span>
  );
}

export default Avatar;
