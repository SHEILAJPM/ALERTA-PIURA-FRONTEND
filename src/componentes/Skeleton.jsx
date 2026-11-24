// Bloque de carga con brillo (shimmer) en gris muy claro; se apaga con
// "reducir movimiento" (ver .pa-skeleton en index.css).
function Skeleton({ className = "", style }) {
  return <div aria-hidden="true" className={`pa-skeleton rounded-xl ${className}`} style={style} />;
}

export default Skeleton;
