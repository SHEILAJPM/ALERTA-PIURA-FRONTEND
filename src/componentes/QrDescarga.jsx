import { useEffect, useState } from "react";
import Icon from "./Icon";

// QR para pasar del proyector o la PC al celular sin tipear la URL (por
// defecto, el APK de la app Android: escanearlo ya lo descarga). Se genera en
// el navegador (sin servicios externos) y la librería se carga recién acá
// para no sumar peso al resto de la app.
function QrDescarga({ url, titulo, texto }) {
  const [imagen, setImagen] = useState(null);

  useEffect(() => {
    let vigente = true;
    import("qrcode")
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(url, {
          width: 220,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#0f172a", light: "#ffffff" },
        })
      )
      .then((dataUrl) => vigente && setImagen(dataUrl))
      .catch(() => vigente && setImagen(null));
    return () => {
      vigente = false;
    };
  }, [url]);

  if (!imagen) return null;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border p-5 mb-10"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <img
        src={imagen}
        alt={`Código QR para abrir ${url}`}
        width={140}
        height={140}
        className="w-35 h-35 rounded-xl bg-white p-1.5 shrink-0"
      />
      <div>
        <p className="font-bold flex items-center gap-2">
          <Icon name="bi-qr-code" aria-hidden="true" style={{ color: "var(--color-primary)" }} />
          {titulo}
        </p>
        <p className="text-sm mt-1 max-w-md" style={{ color: "var(--color-text-muted)" }}>
          {texto}
        </p>
        <p className="text-xs mt-2 font-mono break-all" style={{ color: "var(--color-text-muted)" }}>
          {url}
        </p>
      </div>
    </div>
  );
}

export default QrDescarga;
