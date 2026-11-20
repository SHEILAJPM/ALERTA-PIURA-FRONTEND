import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RIO_PIURA, PUENTES_PIURA } from "../../datos/piuraGeo";
import { useTheme } from "../../contexto/ThemeContext";
import { CAUCE } from "../../utilidades/motorRio";

// Piura y Castilla en 3D para el Laboratorio de simulación.
// REAL (OpenStreetMap, ODbL): trazado del río, puentes, contorno de ~10 000
// edificios, calles y áreas verdes (public/datos/piura-ciudad.json).
// ESTIMADO: la altura de los edificios (OSM casi no la registra en Piura) y
// el relieve. El agua sube según el motor conceptual L0: NO es un mapa de
// inundación ni indica qué zonas reales se inundarían.
//
// Unidades: 1 unidad de escena = 20 m. Terreno, agua y edificios exagerados x2,5 en
// altura, por igual, para que se lean.

const ESCALA = 1 / 20;
// Misma exageración para terreno, agua y edificios: así la profundidad del
// agua se lee en proporción a las casas (1 m de agua = un tercio de una casa).
const EXAG_TERRENO = 2.5;
const EXAG_EDIFICIO = 2.5;
const ANCHO_M = 8400;
const LARGO_M = 9600;
// Mismo cauce que el motor de simulación, para que agua y orillas coincidan.
const MEDIO_CAUCE = CAUCE.ancho / 2; // m
const FIN_RIBERA = 85; // m
const URL_CIUDAD = "/datos/piura-ciudad.json";

// ---------- Geometría del río (en metros) ----------
const largos = [0];
for (let i = 1; i < RIO_PIURA.length; i++) {
  const [ax, az] = RIO_PIURA[i - 1];
  const [bx, bz] = RIO_PIURA[i];
  largos.push(largos[i - 1] + Math.hypot(bx - ax, bz - az));
}
const LARGO_RIO = largos[largos.length - 1];

// Distancia al río y posición a lo largo de él (0 = norte, aguas arriba; 1 = sur).
function cercaniaRio(x, z) {
  let mejor = { d: Infinity, f: 0 };
  for (let i = 0; i < RIO_PIURA.length - 1; i++) {
    const [ax, az] = RIO_PIURA[i];
    const [bx, bz] = RIO_PIURA[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const L2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
    const d = Math.hypot(x - (ax + t * dx), z - (az + t * dz));
    if (d < mejor.d) mejor = { d, f: (largos[i] + t * Math.sqrt(L2)) / LARGO_RIO };
  }
  return mejor;
}

function ruido(x, z) {
  return Math.sin(x * 0.0021 + 1.3) * Math.cos(z * 0.0017) * 0.5 + Math.sin((x + z) * 0.0009) * 0.5;
}

const cotaLecho = (f) => 4 * (1 - f); // el norte está unos metros más alto

// Relieve estimado: cauce, ribera y una planicie casi plana, como la de Piura
// (sube unos 3,5 m en el primer kilómetro). Así, cuando el agua pasa la ribera
// se mete por las calles de las orillas, con las casas asomando del agua.
function cotaTerreno(x, z, d, f) {
  let local;
  if (d < MEDIO_CAUCE) local = 0.3 * (d / MEDIO_CAUCE) ** 2;
  else if (d < FIN_RIBERA)
    local = 0.3 + (CAUCE.ribera - 0.3) * ((d - MEDIO_CAUCE) / (FIN_RIBERA - MEDIO_CAUCE));
  else local = CAUCE.ribera + 3.5 * Math.min(1, (d - FIN_RIBERA) / 1000) ** 0.7 + ruido(x, z) * 0.15;
  return cotaLecho(f) + local;
}
const sueloEn = (x, z) => {
  const { d, f } = cercaniaRio(x, z);
  return cotaTerreno(x, z, d, f);
};

// Nivel del agua (m sobre el lecho) en la posición f, interpolando entre los
// centros de los tramos. Los tramos son conceptuales: el BAJO, donde se
// acumula toda la crecida, se ubica en el centro de Piura (puentes Sánchez
// Cerro, Colgante y Bolognesi) y sigue hacia el sur; ALTO y MEDIO, aguas arriba.
const CENTROS_TRAMO = [0.12, 0.3, 0.5];
function nivelEn(f, niveles) {
  const c = CENTROS_TRAMO;
  if (f <= c[0]) return niveles[0];
  if (f >= c[2]) return niveles[2];
  const k = f < c[1] ? 0 : 1;
  return niveles[k] + (niveles[k + 1] - niveles[k]) * ((f - c[k]) / (c[k + 1] - c[k]));
}

function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function generador(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// "alta" en computadoras; "liviana" en celulares o equipos modestos.
function calidadSugerida() {
  if (typeof window === "undefined") return "liviana";
  const nucleos = navigator.hardwareConcurrency || 8;
  const memoria = navigator.deviceMemory || 8;
  return window.innerWidth < 768 || nucleos <= 4 || memoria <= 4 ? "liviana" : "alta";
}

// ---------- Paletas ----------
function paleta(oscuro) {
  return oscuro
    ? {
        cielo: "#0a1624",
        nublado: "#1b2533",
        arena: "#3b3326",
        arenaOsc: "#2c271d",
        ribera: "#2a3a26",
        lecho: "#2d2a24",
        verde: "#2f4a2c",
        calles: ["#6b6f76", "#5b5f66", "#4d4a43"],
        paredes: [
          ["#6b6257", "#5f574d", "#746a5e", "#585148"],
          ["#4f6070", "#5a6878"],
          ["#6d6650", "#62604f"],
          ["#d8d2c4"],
          ["#4a4a4a", "#55524c"],
        ],
        techo: "#7a7266",
        aguaClara: "#3d6b6a",
        aguaTurbia: "#7a5a32",
        espuma: "#e9dcc2",
      }
    : {
        cielo: "#e8f1fb",
        nublado: "#b9c1ca",
        arena: "#e3d3ad",
        arenaOsc: "#cfb98f",
        ribera: "#9db27a",
        lecho: "#a8946b",
        verde: "#8fb36a",
        calles: ["#6f737a", "#878a90", "#b3a78e"],
        paredes: [
          ["#efe2c8", "#e7d3b0", "#f4ebdc", "#d9c09a", "#e9d8bc", "#f1e3cc"],
          ["#c9d6e3", "#d8e1ea", "#bccbd8"],
          ["#e8dcae", "#dcd2a4"],
          ["#fbf7ee"],
          ["#c7c3bb", "#b9b4aa"],
        ],
        techo: "#d8d2c6",
        aguaClara: "#6f8f78",
        aguaTurbia: "#a07a46",
        espuma: "#fff6e4",
      };
}

function etiqueta(texto, { color = "#0d2e57", fondo = "rgba(255,255,255,0.88)", tamano = 34 } = {}) {
  const lienzo = document.createElement("canvas");
  const ctx = lienzo.getContext("2d");
  const fuente = `800 ${tamano}px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.font = fuente;
  const ancho = Math.ceil(ctx.measureText(texto).width) + 28;
  lienzo.width = ancho;
  lienzo.height = tamano + 22;
  ctx.font = fuente;
  ctx.fillStyle = fondo;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0, 0, ancho, lienzo.height, lienzo.height / 2);
  else ctx.rect(0, 0, ancho, lienzo.height);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(texto, 14, lienzo.height / 2 + 1);
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: textura, depthTest: false, transparent: true })
  );
  sprite.renderOrder = 10;
  const alto = 7;
  sprite.scale.set((alto * ancho) / lienzo.height, alto, 1);
  return sprite;
}

function texturaFlujo(color) {
  const lienzo = document.createElement("canvas");
  lienzo.width = 64;
  lienzo.height = 256;
  const ctx = lienzo.getContext("2d");
  const azar = generador(7);
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  for (let i = 0; i < 80; i++) {
    const x = azar() * 64;
    const y = azar() * 256;
    const largo = 12 + azar() * 40;
    const grad = ctx.createLinearGradient(0, y, 0, y + largo);
    grad.addColorStop(0, `rgba(${rgb},0)`);
    grad.addColorStop(0.5, `rgba(${rgb},${0.35 + azar() * 0.45})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, 1.5 + azar() * 2, largo);
  }
  const t = new THREE.CanvasTexture(lienzo);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- Ciudad real: edificios extruidos en una sola geometría ----------
function geometriaEdificios(edificios, colores) {
  const pos = [];
  const nor = [];
  const col = [];
  const cTecho = new THREE.Color(colores.techo);
  const c = new THREE.Color();
  edificios.forEach((e, n) => {
    const [altura, tipo] = e;
    let pts = [];
    for (let i = 2; i < e.length; i += 2) pts.push([e[i], e[i + 1]]);
    // Sentido antihorario (visto desde arriba) para que las normales miren afuera.
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[(i + 1) % pts.length];
      s += x1 * z2 - x2 * z1;
    }
    if (s > 0) pts = pts.reverse();
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const y0 = sueloEn(cx, cz) * ESCALA * EXAG_TERRENO;
    const y1 = y0 + altura * ESCALA * EXAG_EDIFICIO;
    const tonos = colores.paredes[tipo] ?? colores.paredes[0];
    c.set(tonos[Math.floor(hash(n + 1) * tonos.length)]);
    // Paredes
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[(i + 1) % pts.length];
      const dx = bx - ax;
      const dz = bz - az;
      const L = Math.hypot(dx, dz) || 1;
      const nx = dz / L;
      const nz = -dx / L;
      const A = [ax * ESCALA, y0, az * ESCALA];
      const B = [bx * ESCALA, y0, bz * ESCALA];
      const Ct = [bx * ESCALA, y1, bz * ESCALA];
      const D = [ax * ESCALA, y1, az * ESCALA];
      for (const v of [A, B, Ct, A, Ct, D]) {
        pos.push(...v);
        nor.push(nx, 0, nz);
        col.push(c.r, c.g, c.b);
      }
    }
    // Techo plano (los techos de Piura son casi todos azoteas)
    const contorno = pts.map(([x, z]) => new THREE.Vector2(x, z));
    const tris = THREE.ShapeUtils.triangulateShape(contorno, []);
    for (const tri of tris) {
      for (const k of [tri[0], tri[2], tri[1]]) {
        pos.push(pts[k][0] * ESCALA, y1, pts[k][1] * ESCALA);
        nor.push(0, 1, 0);
        col.push(cTecho.r, cTecho.g, cTecho.b);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// Calles como cintas apoyadas en el terreno; ancho según la importancia.
const ANCHO_CALLE = { 1: 16, 2: 11, 3: 6 };
function geometriaCalles(calles, colores) {
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  for (const calle of calles) {
    const clase = calle[0];
    const medio = ANCHO_CALLE[clase] / 2;
    c.set(colores.calles[clase - 1]);
    for (let i = 1; i + 3 < calle.length; i += 2) {
      const ax = calle[i];
      const az = calle[i + 1];
      const bx = calle[i + 2];
      const bz = calle[i + 3];
      const dx = bx - ax;
      const dz = bz - az;
      const L = Math.hypot(dx, dz);
      if (L < 0.5) continue;
      const nx = (-dz / L) * medio;
      const nz = (dx / L) * medio;
      const ya = (sueloEn(ax, az) + 0.45) * ESCALA * EXAG_TERRENO;
      const yb = (sueloEn(bx, bz) + 0.45) * ESCALA * EXAG_TERRENO;
      const v = [
        [(ax + nx) * ESCALA, ya, (az + nz) * ESCALA],
        [(ax - nx) * ESCALA, ya, (az - nz) * ESCALA],
        [(bx - nx) * ESCALA, yb, (bz - nz) * ESCALA],
        [(bx + nx) * ESCALA, yb, (bz + nz) * ESCALA],
      ];
      for (const k of [0, 1, 2, 0, 2, 3]) {
        pos.push(...v[k]);
        col.push(c.r, c.g, c.b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function geometriaVerdes(verdes) {
  const pos = [];
  for (const v of verdes) {
    const pts = [];
    for (let i = 0; i < v.length; i += 2) pts.push([v[i], v[i + 1]]);
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const y = (sueloEn(cx, cz) + 0.35) * ESCALA * EXAG_TERRENO;
    const tris = THREE.ShapeUtils.triangulateShape(
      pts.map(([x, z]) => new THREE.Vector2(x, z)),
      []
    );
    for (const tri of tris) for (const k of tri) pos.push(pts[k][0] * ESCALA, y, pts[k][1] * ESCALA);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// En calidad liviana: todo el centro con detalle y la periferia simplificada.
function filtrarCiudad(ciudad, calidad) {
  if (calidad === "alta") return ciudad;
  const CENTRO = [150, 0];
  const lejos = (x, z, r) => Math.hypot(x - CENTRO[0], z - CENTRO[1]) > r;
  const edificios = ciudad.edificios.filter((e) => {
    if (!lejos(e[2], e[3], 1600)) return true;
    let a = 0;
    for (let i = 2; i + 3 < e.length; i += 2) a += e[i] * e[i + 3] - e[i + 2] * e[i + 1];
    return Math.abs(a) / 2 > 350; // fuera del centro, solo los edificios grandes
  });
  const calles = ciudad.calles.filter((c) => c[0] <= 2 || !lejos(c[1], c[2], 1300));
  return { ...ciudad, edificios, calles, rotulos: ciudad.rotulos.slice(0, 6) };
}

function construirEscena(contenedor, { oscuro, reducirMovimiento, ciudad, calidad }) {
  const alta = calidad === "alta";
  const colores = paleta(oscuro);
  const renderer = new THREE.WebGLRenderer({
    antialias: alta,
    powerPreference: alta ? "high-performance" : "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, alta ? 1.75 : 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const cielo = new THREE.Color(colores.cielo);
  const nublado = new THREE.Color(colores.nublado);
  escena.background = cielo.clone();
  escena.fog = new THREE.Fog(cielo.clone(), 260, 760);

  const camara = new THREE.PerspectiveCamera(42, 1, 1, 3000);
  camara.position.set(-95, 78, 125);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.set(8, 0, -6);
  controles.enableDamping = true;
  controles.maxPolarAngle = 1.32;
  controles.minDistance = 25;
  controles.maxDistance = 650;
  controles.autoRotate = !reducirMovimiento;
  controles.autoRotateSpeed = 0.3;
  controles.addEventListener("start", () => (controles.autoRotate = false));

  const hemi = new THREE.HemisphereLight(
    oscuro ? "#6f86a8" : "#fff6e0",
    oscuro ? "#1a2230" : "#c8b48a",
    oscuro ? 0.75 : 1.05
  );
  escena.add(hemi);
  const sol = new THREE.DirectionalLight(oscuro ? "#9fb7e0" : "#fff1d0", oscuro ? 0.8 : 1.45);
  sol.position.set(-220, 320, 160);
  escena.add(sol);
  const intensidadSol = sol.intensity;

  const desechables = [];
  const registrar = (cosa) => {
    desechables.push(cosa);
    return cosa;
  };

  // ----- Terreno -----
  const segX = alta ? 210 : 120;
  const segZ = alta ? 240 : 137;
  const geoTerreno = registrar(new THREE.PlaneGeometry(ANCHO_M * ESCALA, LARGO_M * ESCALA, segX, segZ));
  geoTerreno.rotateX(-Math.PI / 2);
  const pos = geoTerreno.attributes.position;
  const n = pos.count;
  const info = { d: new Float32Array(n), f: new Float32Array(n), suelo: new Float32Array(n) };
  const coloresT = new Float32Array(n * 3);
  const cArena = new THREE.Color(colores.arena);
  const cArenaOsc = new THREE.Color(colores.arenaOsc);
  const cRibera = new THREE.Color(colores.ribera);
  const cLecho = new THREE.Color(colores.lecho);
  const tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i) / ESCALA;
    const z = pos.getZ(i) / ESCALA;
    const { d, f } = cercaniaRio(x, z);
    const suelo = cotaTerreno(x, z, d, f);
    info.d[i] = d;
    info.f[i] = f;
    info.suelo[i] = suelo;
    pos.setY(i, suelo * ESCALA * EXAG_TERRENO);
    if (d < MEDIO_CAUCE) tmp.copy(cLecho);
    else if (d < 220) tmp.copy(cRibera).lerp(cArena, Math.max(0, (d - FIN_RIBERA) / 135));
    else tmp.copy(cArena).lerp(cArenaOsc, ((ruido(x * 3, z * 3) + 1) / 2) * 0.45);
    coloresT.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geoTerreno.setAttribute("color", new THREE.BufferAttribute(coloresT, 3));
  geoTerreno.computeVertexNormals();
  escena.add(new THREE.Mesh(geoTerreno, registrar(new THREE.MeshLambertMaterial({ vertexColors: true }))));

  // Alrededores: franjas que rodean el terreno, para que el corte se pierda
  // en la neblina (sin pasar por encima del cauce).
  const matAlrededor = registrar(new THREE.MeshLambertMaterial({ color: cArena }));
  const medioAncho = (ANCHO_M * ESCALA) / 2;
  const medioLargo = (LARGO_M * ESCALA) / 2;
  const LEJOS = 1600;
  const yBorde = (CAUCE.ribera + 6.5) * ESCALA * EXAG_TERRENO;
  for (const [ancho, largo, x, z] of [
    [LEJOS * 2, LEJOS - medioLargo, 0, -(medioLargo + LEJOS) / 2],
    [LEJOS * 2, LEJOS - medioLargo, 0, (medioLargo + LEJOS) / 2],
    [LEJOS - medioAncho, medioLargo * 2, -(medioAncho + LEJOS) / 2, 0],
    [LEJOS - medioAncho, medioLargo * 2, (medioAncho + LEJOS) / 2, 0],
  ]) {
    const franja = new THREE.Mesh(registrar(new THREE.PlaneGeometry(ancho, largo)), matAlrededor);
    franja.rotation.x = -Math.PI / 2;
    franja.position.set(x, yBorde, z);
    escena.add(franja);
  }

  // ----- Ciudad real (si cargó) -----
  if (ciudad) {
    const datos = filtrarCiudad(ciudad, calidad);
    const matSobreSuelo = (opciones) =>
      registrar(
        new THREE.MeshLambertMaterial({
          side: THREE.DoubleSide,
          ...opciones,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
        })
      );
    escena.add(
      new THREE.Mesh(registrar(geometriaVerdes(datos.verdes)), matSobreSuelo({ color: colores.verde }))
    );
    escena.add(
      new THREE.Mesh(registrar(geometriaCalles(datos.calles, colores)), matSobreSuelo({ vertexColors: true }))
    );
    escena.add(
      new THREE.Mesh(
        registrar(geometriaEdificios(datos.edificios, colores)),
        registrar(new THREE.MeshLambertMaterial({ vertexColors: true }))
      )
    );
    for (const [nombre, x, z] of datos.rotulos.filter(([r]) => !/^Auxiliar/i.test(r))) {
      const r = etiqueta(nombre, { tamano: 24, color: "#ffffff", fondo: "rgba(13,46,87,0.78)" });
      r.scale.multiplyScalar(0.45);
      r.position.set(x * ESCALA, (sueloEn(x, z) * EXAG_TERRENO + 30) * ESCALA, z * ESCALA);
      escena.add(r);
    }
  }

  // Escudo de Piura sobre la Plaza de Armas.
  const yPlaza = sueloEn(0, 0) * ESCALA * EXAG_TERRENO;
  new THREE.TextureLoader().load(
    "/images/escudo-piura.png",
    (textura) => {
      textura.colorSpace = THREE.SRGBColorSpace;
      registrar(textura);
      const escudo = new THREE.Sprite(
        registrar(new THREE.SpriteMaterial({ map: textura, transparent: true }))
      );
      const alto = 9;
      escudo.scale.set((alto * textura.image.width) / textura.image.height, alto, 1);
      escudo.position.set(0, yPlaza + 9, 0);
      escena.add(escudo);
    },
    undefined,
    () => {}
  );
  const rPlaza = etiqueta("Plaza de Armas", { tamano: 26 });
  rPlaza.scale.multiplyScalar(0.6);
  rPlaza.position.set(0, yPlaza + 16, 0);
  escena.add(rPlaza);

  // ----- Agua: lámina que cubre todo punto más bajo que la superficie -----
  const geoAgua = registrar(new THREE.PlaneGeometry(ANCHO_M * ESCALA, LARGO_M * ESCALA, segX, segZ));
  geoAgua.rotateX(-Math.PI / 2);
  const cClara = new THREE.Color(colores.aguaClara);
  const cTurbia = new THREE.Color(colores.aguaTurbia);
  const matAgua = registrar(
    new THREE.MeshPhongMaterial({
      color: cClara.clone(),
      transparent: true,
      opacity: 0.86,
      shininess: 60,
      specular: new THREE.Color(oscuro ? "#3b4d66" : "#fff2d8"),
    })
  );
  escena.add(new THREE.Mesh(geoAgua, matAgua));

  function actualizarAgua(niveles) {
    const p = geoAgua.attributes.position;
    for (let i = 0; i < n; i++) {
      const superficie = cotaLecho(info.f[i]) + nivelEn(info.f[i], niveles);
      const mojado = info.d[i] < 1300 && superficie > info.suelo[i] + 0.04;
      p.setY(i, (mojado ? superficie : info.suelo[i] - 1.5) * ESCALA * EXAG_TERRENO);
    }
    p.needsUpdate = true;
    geoAgua.computeVertexNormals();
    // Más crecida = agua más cargada de sedimento (marrón), como el río Piura.
    const turbidez = Math.min(1, Math.max(0, (Math.max(...niveles) - 1) / (CAUCE.ribera - 1)));
    matAgua.color.copy(cClara).lerp(cTurbia, turbidez);
  }

  // ----- Corriente: cinta con vetas que avanzan aguas abajo -----
  const puntosCinta = [];
  for (let i = 0; i < RIO_PIURA.length - 1; i++) {
    const [ax, az] = RIO_PIURA[i];
    const [bx, bz] = RIO_PIURA[i + 1];
    const pasos = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 40));
    for (let s = 0; s < pasos; s++)
      puntosCinta.push([ax + ((bx - ax) * s) / pasos, az + ((bz - az) * s) / pasos]);
  }
  puntosCinta.push(RIO_PIURA[RIO_PIURA.length - 1]);
  const geoCinta = registrar(new THREE.BufferGeometry());
  const vCinta = new Float32Array(puntosCinta.length * 2 * 3);
  const uvCinta = new Float32Array(puntosCinta.length * 2 * 2);
  const idx = [];
  let recorrido = 0;
  const fCinta = puntosCinta.map(([x, z]) => cercaniaRio(x, z).f);
  puntosCinta.forEach(([x, z], i) => {
    const [px, pz] = puntosCinta[Math.min(i + 1, puntosCinta.length - 1)];
    const [qx, qz] = puntosCinta[Math.max(i - 1, 0)];
    const dx = px - qx;
    const dz = pz - qz;
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L;
    const nz = dx / L;
    if (i > 0) recorrido += Math.hypot(x - puntosCinta[i - 1][0], z - puntosCinta[i - 1][1]);
    for (let lado = 0; lado < 2; lado++) {
      const sgn = lado ? 1 : -1;
      vCinta.set([(x + nx * sgn * 45) * ESCALA, 0, (z + nz * sgn * 45) * ESCALA], (i * 2 + lado) * 3);
      uvCinta.set([lado, recorrido / 600], (i * 2 + lado) * 2);
    }
    if (i < puntosCinta.length - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  geoCinta.setAttribute("position", new THREE.BufferAttribute(vCinta, 3));
  geoCinta.setAttribute("uv", new THREE.BufferAttribute(uvCinta, 2));
  geoCinta.setIndex(idx);
  const texCinta = registrar(texturaFlujo(colores.espuma));
  const matCinta = registrar(
    new THREE.MeshBasicMaterial({ map: texCinta, transparent: true, opacity: 0.6, depthWrite: false })
  );
  const cinta = new THREE.Mesh(geoCinta, matCinta);
  cinta.renderOrder = 2;
  escena.add(cinta);

  function actualizarCinta(niveles) {
    const p = geoCinta.attributes.position;
    for (let i = 0; i < puntosCinta.length; i++) {
      const y = (cotaLecho(fCinta[i]) + nivelEn(fCinta[i], niveles) + 0.05) * ESCALA * EXAG_TERRENO;
      p.setY(i * 2, y);
      p.setY(i * 2 + 1, y);
    }
    p.needsUpdate = true;
  }

  // ----- Puentes reales -----
  const matPuente = registrar(new THREE.MeshLambertMaterial({ color: oscuro ? "#8a8f98" : "#a3a8b0" }));
  PUENTES_PIURA.forEach((p, numero) => {
    const { f } = cercaniaRio(p.x, p.z);
    const y = (cotaLecho(f) + CAUCE.ribera + 1.5) * ESCALA * EXAG_TERRENO;
    const puente = new THREE.Mesh(
      registrar(new THREE.BoxGeometry(Math.max(p.largo, 140) * ESCALA, 0.5, (p.peatonal ? 6 : 18) * ESCALA)),
      matPuente
    );
    puente.position.set(p.x * ESCALA, y, p.z * ESCALA);
    puente.rotation.y = -p.angulo;
    escena.add(puente);
    const rotulo = etiqueta(p.nombre, { tamano: 26 });
    rotulo.scale.multiplyScalar(0.5);
    const lado = numero % 2 ? 1 : -1;
    rotulo.position.set((p.x + lado * 330) * ESCALA, y + 5, p.z * ESCALA);
    escena.add(rotulo);
  });

  for (const [texto, x, z] of [
    ["PIURA", -1500, -200],
    ["CASTILLA", 1500, -200],
  ]) {
    const r = etiqueta(texto, { tamano: 40 });
    r.position.set(x * ESCALA, 34, z * ESCALA);
    escena.add(r);
  }
  [
    ["ALTO", CENTROS_TRAMO[0]],
    ["MEDIO", CENTROS_TRAMO[1]],
    ["BAJO", CENTROS_TRAMO[2]],
  ].forEach(([texto, f]) => {
    const objetivo = f * LARGO_RIO;
    let i = 1;
    while (i < largos.length - 1 && largos[i] < objetivo) i++;
    const [x, z] = RIO_PIURA[i];
    const r = etiqueta(`Tramo ${texto} · SIM`, {
      color: "#ffffff",
      fondo: "rgba(107,79,187,0.92)",
      tamano: 28,
    });
    r.scale.multiplyScalar(0.7);
    r.position.set((x + 380) * ESCALA, 22, z * ESCALA);
    escena.add(r);
  });

  // ----- Lluvia: trazos verticales finos (dos vértices por gota) -----
  const MAX_GOTAS = alta ? 3000 : 1200;
  const LARGO_GOTA = 1.6;
  const geoLluvia = registrar(new THREE.BufferGeometry());
  const gotas = new Float32Array(MAX_GOTAS * 2 * 3);
  const azarLluvia = generador(99);
  for (let i = 0; i < MAX_GOTAS; i++) {
    const x = (azarLluvia() - 0.5) * 300;
    const y = azarLluvia() * 120;
    const z = (azarLluvia() - 0.5) * 320;
    gotas.set([x, y, z, x, y + LARGO_GOTA, z], i * 6);
  }
  geoLluvia.setAttribute("position", new THREE.BufferAttribute(gotas, 3));
  const lluviaPuntos = new THREE.LineSegments(
    geoLluvia,
    registrar(
      new THREE.LineBasicMaterial({
        color: oscuro ? "#9cc4ff" : "#6f8aa3",
        transparent: true,
        opacity: 0.55,
      })
    )
  );
  escena.add(lluviaPuntos);

  // ----- Estado animable -----
  const estado = { niveles: [0, 0, 0], lluvia: 0, velocidadFlujo: 0.05, nubes: 0 };
  actualizarAgua(estado.niveles);
  actualizarCinta(estado.niveles);

  function ajustarTamano() {
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  ajustarTamano();
  const observadorTamano = new ResizeObserver(ajustarTamano);
  observadorTamano.observe(contenedor);

  let visible = true;
  const observadorVista = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  observadorVista.observe(contenedor);

  const reloj = new THREE.Clock();
  let cuadro;
  function animar() {
    cuadro = requestAnimationFrame(animar);
    const dt = Math.min(reloj.getDelta(), 0.1);
    if (!visible || document.hidden) return;
    if (!reducirMovimiento) texCinta.offset.y -= dt * estado.velocidadFlujo;
    // Cielo que se nubla y luz que baja mientras llueve.
    const objetivoNubes = Math.min(1, estado.lluvia / 60);
    estado.nubes += (objetivoNubes - estado.nubes) * Math.min(1, dt * 1.5);
    escena.background.copy(cielo).lerp(nublado, estado.nubes * 0.85);
    escena.fog.color.copy(escena.background);
    escena.fog.near = 260 - estado.nubes * 120;
    sol.intensity = intensidadSol * (1 - estado.nubes * 0.45);
    const cuantas = Math.round(Math.min(1, estado.lluvia / 80) * MAX_GOTAS);
    lluviaPuntos.visible = cuantas > 0;
    if (cuantas > 0) {
      geoLluvia.setDrawRange(0, cuantas * 2);
      const p = geoLluvia.attributes.position;
      const caida = reducirMovimiento ? 0 : dt * 85;
      for (let i = 0; i < cuantas; i++) {
        let y = p.getY(i * 2) - caida;
        if (y < 0) y += 120;
        p.setY(i * 2, y);
        p.setY(i * 2 + 1, y + LARGO_GOTA);
      }
      p.needsUpdate = true;
    }
    controles.update();
    renderer.render(escena, camara);
  }
  animar();

  return {
    actualizar({ niveles, lluvia, caudal }) {
      const cambio = niveles.some((h, i) => Math.abs(h - estado.niveles[i]) > 0.004);
      estado.niveles = niveles;
      estado.lluvia = lluvia;
      estado.velocidadFlujo = 0.04 + Math.min(0.5, (caudal ?? 0) / 900);
      if (cambio) {
        actualizarAgua(niveles);
        actualizarCinta(niveles);
      }
    },
    destruir() {
      cancelAnimationFrame(cuadro);
      observadorTamano.disconnect();
      observadorVista.disconnect();
      controles.dispose();
      escena.traverse((o) => {
        if (o.isSprite) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
      for (const c of desechables) c.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function webglDisponible() {
  try {
    const c = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

// niveles: [ALTO, MEDIO, BAJO] en m sobre el lecho; lluvia en mm/h; caudal del
// tramo bajo en m3/s (marca la velocidad de la corriente).
const NOMBRE_TRAMO = ["ALTO", "MEDIO", "BAJO"];

function CiudadPiura3D({ niveles, lluvia = 0, caudal = 0 }) {
  const contenedorRef = useRef(null);
  const escenaRef = useRef(null);
  const ultimoEstado = useRef({ niveles, lluvia, caudal });
  const { theme } = useTheme();
  const [error, setError] = useState(() => (webglDisponible() ? null : "sin-webgl"));
  const [ciudad, setCiudad] = useState(null); // null = cargando; false = no se pudo
  const [calidad, setCalidad] = useState(calidadSugerida);

  useEffect(() => {
    if (error) return undefined;
    let cancelado = false;
    fetch(URL_CIUDAD)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((datos) => !cancelado && setCiudad(datos))
      .catch(() => !cancelado && setCiudad(false));
    return () => {
      cancelado = true;
    };
  }, [error]);

  useEffect(() => {
    if (error || ciudad === null || !contenedorRef.current) return undefined;
    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      escenaRef.current = construirEscena(contenedorRef.current, {
        oscuro: theme === "dark",
        reducirMovimiento: reducir,
        ciudad: ciudad || null,
        calidad,
      });
      escenaRef.current.actualizar(ultimoEstado.current);
    } catch {
      queueMicrotask(() => setError("fallo"));
      return undefined;
    }
    return () => {
      escenaRef.current?.destruir();
      escenaRef.current = null;
    };
  }, [theme, error, ciudad, calidad]);

  // Guarda el último estado (para aplicarlo si la escena se reconstruye al
  // cambiar tema o calidad) y lo pasa a la escena actual.
  useEffect(() => {
    ultimoEstado.current = { niveles, lluvia, caudal };
    escenaRef.current?.actualizar(ultimoEstado.current);
  }, [niveles, lluvia, caudal]);

  if (error) {
    return (
      <div
        className="rounded-3xl p-6 text-sm text-center"
        style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}
      >
        Este dispositivo no puede mostrar la vista 3D. Los gráficos y tarjetas de abajo muestran la misma
        simulación.
      </div>
    );
  }

  return (
    <figure className="flex flex-col gap-2">
      <div
        ref={contenedorRef}
        className="relative isolate w-full h-[min(64vh,600px)] min-h-[340px] rounded-[24px] overflow-hidden touch-none"
        style={{ backgroundColor: "var(--color-surface-alt)" }}
        role="img"
        aria-label="Vista 3D de Piura y Castilla con el río Piura, sus puentes, calles y edificios. El agua sube según la simulación del escenario elegido."
      >
        <span
          className="absolute top-3 left-3 z-10 text-[11px] font-extrabold tracking-wider px-2.5 py-1 rounded-full pointer-events-none"
          style={{ backgroundColor: "var(--color-demo)", color: "#ffffff" }}
        >
          SIMULACIÓN · NO ES UN MAPA DE INUNDACIÓN
        </span>
        <button
          type="button"
          onClick={() => setCalidad((c) => (c === "alta" ? "liviana" : "alta"))}
          className="absolute bottom-3 left-3 z-10 min-h-[36px] px-3 rounded-full text-[11px] font-bold"
          style={{ backgroundColor: "var(--color-glass-fuerte)", color: "var(--color-title)" }}
          title="Cambia el nivel de detalle de la ciudad"
        >
          {calidad === "alta" ? "Detalle: alto" : "Detalle: liviano"}
        </button>
        {(() => {
          const excesos = niveles.map((h) => h - CAUCE.ribera);
          const mayor = Math.max(...excesos);
          if (!(mayor > 0.02)) return null;
          const tramos = NOMBRE_TRAMO.filter((_, i) => excesos[i] > 0.02);
          return (
            <span
              role="status"
              className="absolute top-12 left-3 z-10 max-w-[calc(100%-24px)] text-xs font-bold px-3 py-1.5 rounded-2xl pointer-events-none"
              style={{ backgroundColor: "var(--color-glass-fuerte)", color: "var(--color-demo)" }}
            >
              Desborde simulado en {tramos.length > 1 ? "los tramos" : "el tramo"}{" "}
              {new Intl.ListFormat("es", { type: "conjunction" }).format(tramos)}: el agua pasa la ribera por{" "}
              {mayor.toLocaleString("es-PE", { maximumFractionDigits: 1 })} m
            </span>
          );
        })()}
        {ciudad === null && (
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cargando la ciudad…
          </span>
        )}
      </div>
      <figcaption className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {ciudad === false
          ? "No se pudo cargar la ciudad; se muestra solo el río. "
          : "Río, puentes, calles y contorno de los edificios reales (© colaboradores de OpenStreetMap, ODbL); la altura de los edificios y el relieve son estimados. "}
        Arrastra para girar y pellizca o usa la rueda para acercar.
      </figcaption>
    </figure>
  );
}

export default CiudadPiura3D;
