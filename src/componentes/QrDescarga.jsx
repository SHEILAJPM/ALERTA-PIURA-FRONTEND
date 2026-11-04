import { useEffect, useState } from "react";
import Icon from "./Icon";

// QR que apunta a esta misma página: desde la PC se escanea con el celular y
// se abre directo la página de instalación, sin tipear la URL. Se genera en
// el navegador (sin servicios externos) y la librería se carga recién acá
// para no sumar peso al resto de la app.
function QrDescarga() {
  const [imagen, setImagen] = useState(null);
  const url = `${window.location.origin}/app`;

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
      className="hidden sm:flex items-center gap-5 rounded-2xl border p-5 mb-10"
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
          ¿Estás en la computadora?
        </p>
        <p className="text-sm mt-1 max-w-md" style={{ color: "var(--color-text-muted)" }}>
          Escanea este código con la cámara de tu celular para abrir esta página ahí e instalar la app en
          segundos.
        </p>
        <p className="text-xs mt-2 font-mono break-all" style={{ color: "var(--color-text-muted)" }}>
          {url}
        </p>
      </div>
    </div>
  );
}

export default QrDescarga;
