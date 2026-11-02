// Sensor que se muestra si el usuario no eligió otro. Debe coincidir con
// SENSOR_POR_DEFECTO del backend (ver lecturas.routes.js) y con el que crea
// db/seed.js; si se renombra, Home.jsx y Despacho.jsx caen al primero
// disponible en vez de quedarse pegados a un código que ya no existe.
export const SENSOR_POR_DEFECTO = "RIO-PIURA-01";
