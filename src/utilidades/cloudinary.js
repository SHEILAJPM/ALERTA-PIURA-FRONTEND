// Subida directa del navegador a Cloudinary con un "upload preset" sin firma:
// la foto nunca pasa por nuestro backend (que solo guarda la URL resultante,
// ver reporteSchema.foto_url), así no hay que manejar archivos ni almacenamiento
// propio. Crear el preset en Cloudinary > Settings > Upload > Upload presets,
// modo "Unsigned", y poner su nombre y el cloud name en el .env del frontend.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const TAMANO_MAXIMO_MB = 10;
const LADO_MAXIMO_PX = 1600;

// Las fotos de celular pesan varios MB: se achican antes de subir, que en una
// emergencia con datos móviles lentos marca la diferencia entre subir o no.
async function comprimir(archivo) {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && archivo.size < 1024 * 1024) return archivo;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ?? archivo;
  } catch {
    // Formato que el navegador no puede decodificar (ej. HEIC en algunos
    // navegadores): se sube el original y que Cloudinary lo convierta.
    return archivo;
  }
}

export async function subirFoto(archivo) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "La subida de fotos no está configurada (faltan VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET)."
    );
  }
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo tiene que ser una imagen.");
  }

  const comprimido = await comprimir(archivo);
  if (comprimido.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
    throw new Error(`La foto pesa demasiado (máximo ${TAMANO_MAXIMO_MB} MB).`);
  }

  const formulario = new FormData();
  formulario.append("file", comprimido);
  formulario.append("upload_preset", UPLOAD_PRESET);

  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formulario,
    });
  } catch {
    throw new Error("No se pudo subir la foto: sin conexión.");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.secure_url) {
    throw new Error(body.error?.message ?? "No se pudo subir la foto, intenta de nuevo.");
  }
  return body.secure_url;
}
