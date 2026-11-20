import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RIO_PIURA, PUENTES_PIURA } from "../../datos/piuraGeo";
import { useTheme } from "../../contexto/ThemeContext";

// Ciudad de Piura en 3D, ESTILIZADA, para el Laboratorio de simulación.
// Real: el trazado del río Piura y sus puentes (OpenStreetMap). Inventado: el
// relieve, las manzanas y los edificios. El agua sube según el motor
// conceptual L0: NO indica qué zonas reales se inundarían.
//
// Unidades: 1 unidad de escena = 20 m. Alturas del terreno y del agua
// exageradas x6 para que se lean; los edificios, x2,5.

const ESCALA = 1 / 20;
const EXAG_TERRENO = 6;
const EXAG_EDIFICIO = 2.5;
const ANCHO_M = 8400;
const LARGO_M = 9600;
const SEG_X = 210;
const SEG_Z = 240;
const MEDIO_CAUCE = 55; // m
const FIN_RIBERA = 85; // m

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

// Ruido suave determinista para que el terreno no sea plano.
function ruido(x, z) {
  return Math.sin(x * 0.0021 + 1.3) * Math.cos(z * 0.0017) * 0.5 + Math.sin((x + z) * 0.0009) * 0.5;
}

const cotaLecho = (f) => 4 * (1 - f); // el norte está unos metros más alto

function cotaTerreno(x, z, d, f) {
  let local;
  if (d < MEDIO_CAUCE) local = 0.3 * (d / MEDIO_CAUCE) ** 2;
  else if (d < FIN_RIBERA) local = 0.3 + 3.1 * ((d - MEDIO_CAUCE) / (FIN_RIBERA - MEDIO_CAUCE));
  // Sube rápido lejos del cauce: un desborde ocupa la franja ribereña, no barrios enteros.
  else local = 3.4 + 7 * Math.min(1, (d - FIN_RIBERA) / 900) ** 0.6 + ruido(x, z) * 0.35;
  return cotaLecho(f) + local;
}

// Nivel del agua (m sobre el lecho) en la posición f, interpolando entre los
// centros de los tramos ALTO (1/6), MEDIO (1/2) y BAJO (5/6).
function nivelEn(f, niveles) {
  const c = [1 / 6, 1 / 2, 5 / 6];
  if (f <= c[0]) return niveles[0];
  if (f >= c[2]) return niveles[2];
  const k = f < c[1] ? 0 : 1;
  return niveles[k] + (niveles[k + 1] - niveles[k]) * ((f - c[k]) / (c[k + 1] - c[k]));
}

// Números pseudoaleatorios con semilla: la ciudad sale igual en cada visita.
function generador(semilla) {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function etiqueta(texto, { color = "#0d2e57", fondo = "rgba(255,255,255,0.85)", tamano = 34 } = {}) {
  const lienzo = document.createElement("canvas");
  const ctx = lienzo.getContext("2d");
  ctx.font = `800 ${tamano}px "Plus Jakarta Sans", system-ui, sans-serif`;
  const ancho = Math.ceil(ctx.measureText(texto).width) + 28;
  lienzo.width = ancho;
  lienzo.height = tamano + 22;
  ctx.font = `800 ${tamano}px "Plus Jakarta Sans", system-ui, sans-serif`;
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

function texturaFlujo() {
  const lienzo = document.createElement("canvas");
  lienzo.width = 64;
  lienzo.height = 256;
  const ctx = lienzo.getContext("2d");
  const azar = generador(7);
  for (let i = 0; i < 70; i++) {
    const x = azar() * 64;
    const y = azar() * 256;
    const largo = 12 + azar() * 40;
    const grad = ctx.createLinearGradient(0, y, 0, y + largo);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, `rgba(255,255,255,${0.35 + azar() * 0.4})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, 1.5 + azar() * 1.5, largo);
  }
  const t = new THREE.CanvasTexture(lienzo);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function construirEscena(contenedor, { oscuro, reducirMovimiento }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const colorCielo = new THREE.Color(oscuro ? "#0a1624" : "#eaf2fb");
  escena.background = colorCielo;
  escena.fog = new THREE.Fog(colorCielo, 320, 820);

  const camara = new THREE.PerspectiveCamera(42, 1, 1, 3000);
  camara.position.set(-170, 150, 210);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.set(30, 0, 0);
  controles.enableDamping = true;
  controles.maxPolarAngle = 1.32;
  controles.minDistance = 50;
  controles.maxDistance = 720;
  controles.autoRotate = !reducirMovimiento;
  controles.autoRotateSpeed = 0.35;
  controles.addEventListener("start", () => (controles.autoRotate = false));

  escena.add(
    new THREE.HemisphereLight(
      oscuro ? "#6f86a8" : "#fff6e0",
      oscuro ? "#1a2230" : "#c8b48a",
      oscuro ? 0.7 : 1.0
    )
  );
  const sol = new THREE.DirectionalLight(oscuro ? "#9fb7e0" : "#fff1d0", oscuro ? 0.8 : 1.5);
  sol.position.set(-220, 320, 160);
  escena.add(sol);

  const desechables = [];
  const registrar = (...cosas) => {
    desechables.push(...cosas);
    return cosas[0];
  };

  // ----- Terreno -----
  const geoTerreno = registrar(new THREE.PlaneGeometry(ANCHO_M * ESCALA, LARGO_M * ESCALA, SEG_X, SEG_Z));
  geoTerreno.rotateX(-Math.PI / 2);
  const pos = geoTerreno.attributes.position;
  const n = pos.count;
  const info = { d: new Float32Array(n), f: new Float32Array(n), suelo: new Float32Array(n) };
  const colores = new Float32Array(n * 3);
  const cArena = new THREE.Color(oscuro ? "#3b3326" : "#e3d3ad");
  const cArenaOsc = new THREE.Color(oscuro ? "#2c271d" : "#cbb48a");
  const cRibera = new THREE.Color(oscuro ? "#2a3a26" : "#9db27a");
  const cLecho = new THREE.Color(oscuro ? "#2d2a24" : "#a8946b");
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
    else if (d < 260) tmp.copy(cRibera).lerp(cArena, Math.max(0, (d - FIN_RIBERA) / 175));
    else tmp.copy(cArena).lerp(cArenaOsc, ((ruido(x * 3, z * 3) + 1) / 2) * 0.5);
    colores.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geoTerreno.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  geoTerreno.computeVertexNormals();
  escena.add(new THREE.Mesh(geoTerreno, registrar(new THREE.MeshLambertMaterial({ vertexColors: true }))));
  // Alrededores: cuatro franjas que rodean el terreno (sin pasar por encima del
  // cauce) a la altura aproximada de sus bordes, para que el corte se pierda
  // en la neblina en vez de verse como una losa.
  const matAlrededor = registrar(new THREE.MeshLambertMaterial({ color: cArena }));
  const medioAncho = (ANCHO_M * ESCALA) / 2;
  const medioLargo = (LARGO_M * ESCALA) / 2;
  const LEJOS = 1600;
  const yBorde = 10.5 * ESCALA * EXAG_TERRENO;
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

  // ----- Agua: lámina que cubre todo punto más bajo que la superficie -----
  const geoAgua = registrar(new THREE.PlaneGeometry(ANCHO_M * ESCALA, LARGO_M * ESCALA, SEG_X, SEG_Z));
  geoAgua.rotateX(-Math.PI / 2);
  const matAgua = registrar(
    new THREE.MeshPhongMaterial({
      color: oscuro ? "#2f7be0" : "#2b86d9",
      transparent: true,
      opacity: 0.82,
      shininess: 90,
      specular: new THREE.Color("#cfe6ff"),
    })
  );
  const agua = new THREE.Mesh(geoAgua, matAgua);
  escena.add(agua);

  function actualizarAgua(niveles) {
    const p = geoAgua.attributes.position;
    for (let i = 0; i < n; i++) {
      const superficie = cotaLecho(info.f[i]) + nivelEn(info.f[i], niveles);
      // Solo se inunda lo cercano al cauce: evita "charcos" en hondonadas lejanas.
      const mojado = info.d[i] < 700 && superficie > info.suelo[i] + 0.04;
      p.setY(i, (mojado ? superficie : info.suelo[i] - 1.5) * ESCALA * EXAG_TERRENO);
    }
    p.needsUpdate = true;
    geoAgua.computeVertexNormals();
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
  const texCinta = registrar(texturaFlujo());
  const matCinta = registrar(
    new THREE.MeshBasicMaterial({ map: texCinta, transparent: true, opacity: 0.55, depthWrite: false })
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

  // ----- Ciudad estilizada (edificios genéricos, no las manzanas reales) -----
  const azar = generador(20251119);
  const lotes = [];
  for (let x = -ANCHO_M / 2 + 150; x < ANCHO_M / 2 - 150; x += 95) {
    for (let z = -LARGO_M / 2 + 150; z < LARGO_M / 2 - 150; z += 95) {
      if (Math.abs(x) < 75 && Math.abs(z) < 75) continue; // Plaza de Armas
      const { d, f } = cercaniaRio(x, z);
      if (d < 150) continue; // malecón y riberas sin construir
      const oeste = x < cercaniaRioX(z);
      const centro = Math.hypot((x - 200) / (oeste ? 3600 : 2400), z / 4200);
      const prob = Math.max(0, 1 - centro) * (oeste ? 0.95 : 0.8);
      if (azar() > prob) continue;
      const cuantos = 1 + Math.floor(azar() * 3);
      for (let k = 0; k < cuantos; k++) {
        const bx = x + (azar() - 0.5) * 60;
        const bz = z + (azar() - 0.5) * 60;
        const cerca = Math.max(0, 1 - Math.hypot(bx, bz) / 1800);
        const pisos = 1 + Math.floor(azar() ** 2 * (2 + 5 * cerca));
        lotes.push({
          x: bx,
          z: bz,
          w: 16 + azar() * 26,
          p: 14 + azar() * 24,
          alto: pisos * 3.2,
          suelo: cotaTerreno(bx, bz, d, f),
        });
      }
    }
  }
  const PALETA = oscuro
    ? ["#5b5145", "#6a5d4c", "#4f4a44", "#6b6156", "#5d5a55", "#70634f"]
    : ["#efe4cf", "#e2cfae", "#f6efe3", "#d7bd96", "#eadbc0", "#c9ae86", "#f1e6d6", "#dcc39f"];
  const geoCaja = registrar(new THREE.BoxGeometry(1, 1, 1));
  geoCaja.translate(0, 0.5, 0);
  const edificios = new THREE.InstancedMesh(
    geoCaja,
    registrar(new THREE.MeshLambertMaterial()),
    lotes.length
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const v = new THREE.Vector3();
  lotes.forEach((l, i) => {
    v.set(l.x * ESCALA, l.suelo * ESCALA * EXAG_TERRENO, l.z * ESCALA);
    s.set(l.w * ESCALA, l.alto * ESCALA * EXAG_EDIFICIO, l.p * ESCALA);
    m.compose(v, q, s);
    edificios.setMatrixAt(i, m);
    edificios.setColorAt(i, tmp.set(PALETA[Math.floor(azar() * PALETA.length)]));
  });
  escena.add(edificios);

  // ----- Plaza de Armas, Catedral y escudo -----
  const sueloPlaza = cotaTerreno(0, 0, cercaniaRio(0, 0).d, cercaniaRio(0, 0).f) * ESCALA * EXAG_TERRENO;
  const plaza = new THREE.Mesh(
    registrar(new THREE.BoxGeometry(130 * ESCALA, 0.3, 130 * ESCALA)),
    registrar(new THREE.MeshLambertMaterial({ color: oscuro ? "#2f4a2c" : "#8fb36a" }))
  );
  plaza.position.set(0, sueloPlaza + 0.15, 0);
  escena.add(plaza);
  const matCatedral = registrar(new THREE.MeshLambertMaterial({ color: oscuro ? "#cfc6b4" : "#fbf6ec" }));
  const cuerpo = new THREE.Mesh(
    registrar(new THREE.BoxGeometry(26 * ESCALA, 16 * ESCALA * 2.5, 48 * ESCALA)),
    matCatedral
  );
  cuerpo.position.set(95 * ESCALA, sueloPlaza + (16 * ESCALA * 2.5) / 2, 0);
  escena.add(cuerpo);
  for (const dz of [-20, 20]) {
    const torre = new THREE.Mesh(
      registrar(new THREE.BoxGeometry(9 * ESCALA, 30 * ESCALA * 2.5, 9 * ESCALA)),
      matCatedral
    );
    torre.position.set(84 * ESCALA, sueloPlaza + (30 * ESCALA * 2.5) / 2, dz * ESCALA);
    escena.add(torre);
    const cupula = new THREE.Mesh(
      registrar(new THREE.ConeGeometry(6 * ESCALA, 8 * ESCALA * 2.5, 8)),
      registrar(new THREE.MeshLambertMaterial({ color: "#f2b705" }))
    );
    cupula.position.set(84 * ESCALA, sueloPlaza + 30 * ESCALA * 2.5 + (8 * ESCALA * 2.5) / 2, dz * ESCALA);
    escena.add(cupula);
  }
  // Escudo de Piura en la plaza, si el archivo está en public/images/.
  new THREE.TextureLoader().load(
    "/images/escudo-piura.png",
    (textura) => {
      textura.colorSpace = THREE.SRGBColorSpace;
      registrar(textura);
      const material = registrar(new THREE.SpriteMaterial({ map: textura, transparent: true }));
      const escudo = new THREE.Sprite(material);
      const alto = 16;
      escudo.scale.set((alto * textura.image.width) / textura.image.height, alto, 1);
      escudo.position.set(0, sueloPlaza + 14, 0);
      escena.add(escudo);
    },
    undefined,
    () => {} // sin escudo: la escena sigue igual
  );

  // ----- Puentes reales -----
  const matPuente = registrar(new THREE.MeshLambertMaterial({ color: oscuro ? "#8a8f98" : "#9aa0a8" }));
  PUENTES_PIURA.forEach((p, numero) => {
    const { f } = cercaniaRio(p.x, p.z);
    const y = (cotaLecho(f) + 4.2) * ESCALA * EXAG_TERRENO;
    const puente = new THREE.Mesh(
      registrar(new THREE.BoxGeometry(Math.max(p.largo, 140) * ESCALA, 0.5, (p.peatonal ? 6 : 18) * ESCALA)),
      matPuente
    );
    puente.position.set(p.x * ESCALA, y, p.z * ESCALA);
    puente.rotation.y = -p.angulo;
    escena.add(puente);
    const rotulo = etiqueta(p.nombre.replace(/^Puente /, ""), { tamano: 26 });
    rotulo.scale.multiplyScalar(0.5);
    const lado = numero % 2 ? 1 : -1;
    rotulo.position.set((p.x + lado * 420) * ESCALA, y + 4, p.z * ESCALA);
    escena.add(rotulo);
  });

  // ----- Rótulos -----
  for (const [texto, x, z] of [
    ["PIURA", -1700, -300],
    ["CASTILLA", 2400, -300],
  ]) {
    const r = etiqueta(texto, { tamano: 40 });
    r.position.set(x * ESCALA, 32, z * ESCALA);
    escena.add(r);
  }
  const rPlaza = etiqueta("Plaza de Armas", { tamano: 26 });
  rPlaza.scale.multiplyScalar(0.7);
  rPlaza.position.set(0, sueloPlaza + 26, 0);
  escena.add(rPlaza);
  [
    ["ALTO", 1 / 6],
    ["MEDIO", 1 / 2],
    ["BAJO", 5 / 6],
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
    r.scale.multiplyScalar(0.75);
    r.position.set((x + 260) * ESCALA, 20, z * ESCALA);
    escena.add(r);
  });

  // ----- Lluvia -----
  const MAX_GOTAS = 2600;
  const geoLluvia = registrar(new THREE.BufferGeometry());
  const gotas = new Float32Array(MAX_GOTAS * 3);
  const azarLluvia = generador(99);
  for (let i = 0; i < MAX_GOTAS; i++) {
    gotas.set([(azarLluvia() - 0.5) * 420, azarLluvia() * 140, (azarLluvia() - 0.5) * 480], i * 3);
  }
  geoLluvia.setAttribute("position", new THREE.BufferAttribute(gotas, 3));
  const lluviaPuntos = new THREE.Points(
    geoLluvia,
    registrar(
      new THREE.PointsMaterial({
        color: oscuro ? "#9cc4ff" : "#4f7fb8",
        size: 1.1,
        transparent: true,
        opacity: 0.6,
      })
    )
  );
  escena.add(lluviaPuntos);

  // ----- Estado animable -----
  const estado = { niveles: [0, 0, 0], lluvia: 0, velocidadFlujo: 0.05 };
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

  // No dibuja si la vista está fuera de pantalla o la pestaña oculta.
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
    const cuantas = Math.round(Math.min(1, estado.lluvia / 80) * MAX_GOTAS);
    lluviaPuntos.visible = cuantas > 0;
    if (cuantas > 0) {
      geoLluvia.setDrawRange(0, cuantas);
      const p = geoLluvia.attributes.position;
      const caida = reducirMovimiento ? 0 : dt * 90;
      for (let i = 0; i < cuantas; i++) {
        let y = p.getY(i) - caida;
        if (y < 0) y += 140;
        p.setY(i, y);
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

// x del río a la altura z (para saber qué orilla es Piura y cuál Castilla).
function cercaniaRioX(z) {
  for (let i = 0; i < RIO_PIURA.length - 1; i++) {
    const [ax, az] = RIO_PIURA[i];
    const [bx, bz] = RIO_PIURA[i + 1];
    if ((z >= az && z <= bz) || (z >= bz && z <= az)) return ax + ((bx - ax) * (z - az)) / (bz - az || 1);
  }
  return z < RIO_PIURA[0][1] ? RIO_PIURA[0][0] : RIO_PIURA[RIO_PIURA.length - 1][0];
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
function CiudadPiura3D({ niveles, lluvia = 0, caudal = 0 }) {
  const contenedorRef = useRef(null);
  const escenaRef = useRef(null);
  const { theme } = useTheme();
  const [error, setError] = useState(() => (webglDisponible() ? null : "sin-webgl"));

  useEffect(() => {
    if (error || !contenedorRef.current) return undefined;
    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      escenaRef.current = construirEscena(contenedorRef.current, {
        oscuro: theme === "dark",
        reducirMovimiento: reducir,
      });
    } catch {
      // WebGL presente pero falló al crear el contexto (GPU bloqueada, etc.).
      queueMicrotask(() => setError("fallo"));
      return undefined;
    }
    return () => {
      escenaRef.current?.destruir();
      escenaRef.current = null;
    };
  }, [theme, error]);

  useEffect(() => {
    escenaRef.current?.actualizar({ niveles, lluvia, caudal });
  }, [niveles, lluvia, caudal, theme]);

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
        className="relative w-full h-[min(62vh,560px)] min-h-[340px] rounded-[24px] overflow-hidden touch-none"
        role="img"
        aria-label="Vista 3D estilizada de Piura y Castilla con el río Piura. El agua sube según la simulación del escenario elegido."
      >
        <span
          className="absolute top-3 left-3 z-10 text-[11px] font-extrabold tracking-wider px-2.5 py-1 rounded-full pointer-events-none"
          style={{ backgroundColor: "var(--color-demo)", color: "#ffffff" }}
        >
          SIMULACIÓN · NO ES UN MAPA DE INUNDACIÓN
        </span>
      </div>
      <figcaption className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Ciudad estilizada: el trazado del río y los puentes son reales (© colaboradores de OpenStreetMap); el
        relieve y los edificios son inventados. Arrastra para girar y pellizca o usa la rueda para acercar.
      </figcaption>
    </figure>
  );
}

export default CiudadPiura3D;
