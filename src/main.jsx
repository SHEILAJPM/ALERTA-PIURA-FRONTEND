import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

// ThemeProvider y WebSocketProvider se montan dentro de App.jsx (junto con el
// router), no acá, para no abrir dos conexiones WebSocket duplicadas.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
