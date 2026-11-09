import { Capacitor } from "@capacitor/core";

// true dentro de la app Android (Capacitor), false en el navegador.
export const esAppNativa = Capacitor.isNativePlatform();

// En la app hay que iniciar sesión o registrarse antes de entrar. La web
// sigue abierta a cualquiera (el estado del río es información pública);
// VITE_EXIGIR_SESION=true fuerza el mismo comportamiento en el navegador,
// útil para probar la pantalla de acceso sin compilar el APK.
export const exigirSesion = esAppNativa || import.meta.env.VITE_EXIGIR_SESION === "true";
