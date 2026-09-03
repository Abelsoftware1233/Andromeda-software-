/* =========================================================================
   Zwart Gat & Andromeda — Live 3D Simulatie
   Three.js, volledig 3D: perspectief-camera, orbit-navigatie (rotate/pan/zoom),
   echte 3D-geometrie voor het zwarte gat, de accretieschijf, sterrenstelsels
   en de JWST-nevel-hotspots.
   ========================================================================= */

(() => {
"use strict";

/* ---------------------------------------------------------------------
   0. CONSTANTEN & ECHTE ASTRONOMISCHE DATA
   Afstanden zijn de werkelijke, gepubliceerde waarden (lichtjaar).
   Voor 3D-plaatsing gebruiken we een logaritmische schaalfunctie zodat
   objecten van 26.000 lj (Sgr A*) tot 2,5 miljoen lj (Andromeda) tot
   300 miljoen lj (Stephan's Quintet) in dezelfde scene passen, terwijl de
   ECHTE afstand altijd getoond wordt in labels/panelen.
   ------------------------------------------------------------------- */

const LY = 1; // basis-eenheid voor data (lichtjaar), losstaand van renderschaal

const OBJECTS = [
  {
    id: "sgr-a",
    type: "blackhole",
    name: "Sagittarius A*",
    category: "hole",
    distanceLy: 26000,
    distanceLabel: "26.000 lj (Melkweg-centrum)",
    subtitle: "Supermassief zwart gat · centrum van de Melkweg",
    mass: "~4,3 miljoen zonsmassa's",
    facts: {
      "Type": "Supermassief zwart gat",
      "Afstand": "26.000 lichtjaar",
      "Massa": "≈ 4,15 miljoen M☉",
      "Ontdekt": "Radiobron, 1974",
      "Waargenomen door": "EHT (2022, schaduwbeeld)"
    },
    desc: "Sagittarius A* is het supermassieve zwarte gat in het hart van onze eigen Melkweg. De Event Horizon Telescope maakte in 2022 de eerste directe afbeelding van zijn schaduw — een donkere kern omringd door gloeiend, ronddraaiend gas dat licht buigt door de extreme zwaartekracht.",
    position3D: [0, 0, 0]
  },
  {
    id: "andromeda",
    type: "galaxy",
    name: "Andromedastelsel (M31)",
    category: "andromeda",
    distanceLy: 2500000,
    distanceLabel: "2.500.000 lj",
    subtitle: "Spiraalstelsel · nadert de Melkweg met 110 km/s",
    facts: {
      "Type": "Spiraalstelsel (SA(s)b)",
      "Afstand": "2,5 miljoen lichtjaar",
      "Diameter": "≈ 220.000 lichtjaar",
      "Sterren": "≈ 1 biljoen",
      "Toenaderingssnelheid": "110 km/s",
      "Botsing met Melkweg": "over ≈ 4,5 miljard jaar"
    },
    desc: "Het Andromedastelsel is het dichtstbijzijnde grote spiraalstelsel en het verste object dat met het blote oog zichtbaar is. Het beweegt écht naar onze Melkweg toe en zal er over ongeveer 4,5 miljard jaar mee versmelten tot één nieuw sterrenstelsel — soms 'Melkomeda' genoemd.",
    position3D: [-2600, 60, -1400]
  },
  {
    id: "pillars",
    type: "nebula",
    name: "Pillars of Creation",
    category: "jwst",
    distanceLy: 6500,
    distanceLabel: "6.500 lj",
    subtitle: "Adelaarsnevel (M16) · sterrenkraamkamer",
    facts: {
      "Object": "Eagle Nebula / M16",
      "Afstand": "6.500 lichtjaar",
      "Lengte pilaren": "≈ 5 lichtjaar",
      "Waargenomen": "JWST NIRCam, 2022",
      "Sterleeftijd binnenin": "1–2 miljoen jaar"
    },
    desc: "De Pillars of Creation zijn kolommen van koud gas en stof in de Adelaarsnevel waar nieuwe sterren geboren worden. JWST's infraroodblik doorboort het stof en onthult honderden pasgeboren sterren en protosterren die voor Hubble onzichtbaar waren.",
    position3D: [1400, -220, 900]
  },
  {
    id: "carina",
    type: "nebula",
    name: "Cosmic Cliffs (Carinanevel)",
    category: "jwst",
    distanceLy: 7600,
    distanceLabel: "7.600 lj",
    subtitle: "NGC 3324 · rand van een gasholte",
    facts: {
      "Object": "NGC 3324, Carinanevel",
      "Afstand": "7.600 lichtjaar",
      "Hoogte 'bergen'": "≈ 7 lichtjaar",
      "Waargenomen": "JWST NIRCam/MIRI, 2022"
    },
    desc: "De 'Cosmic Cliffs' vormen de rand van een enorme gasholte, uitgehold door de ultraviolette straling van jonge, massieve sterren. Wat op bergtoppen lijkt is in werkelijkheid gloeiend gas en stof dat wegstroomt door stellaire straling.",
    position3D: [1800, 300, -600]
  },
  {
    id: "southern-ring",
    type: "nebula",
    name: "Southern Ring Nebula",
    category: "jwst",
    distanceLy: 2500,
    distanceLabel: "2.500 lj",
    subtitle: "NGC 3132 · 'Eight-Burst' planetaire nevel",
    facts: {
      "Object": "NGC 3132",
      "Afstand": "2.500 lichtjaar",
      "Diameter": "≈ 0,5 lichtjaar",
      "Sterren in kern": "minstens 2 (mogelijk 3)",
      "Waargenomen": "JWST NIRCam/MIRI, 2022"
    },
    desc: "Een planetaire nevel: de afgeworpen buitenlagen van een stervende ster. JWST onthulde dat de nevel wordt gevormd door een dubbelstersysteem, met minstens acht opeenvolgende gaslagen die door de stervende ster zijn uitgestoten.",
    position3D: [900, -80, -1200]
  },
  {
    id: "stephans-quintet",
    type: "galaxygroup",
    name: "Stephan's Quintet",
    category: "jwst",
    distanceLy: 290000000,
    distanceLabel: "290.000.000 lj",
    subtitle: "Hickson Compact Group 92 · botsende stelsels",
    facts: {
      "Object": "HCG 92, sterrenbeeld Pegasus",
      "Afstand": "≈ 290 miljoen lichtjaar",
      "Aantal stelsels": "5 (4 interacterend)",
      "Waargenomen": "JWST grootste mozaïek ooit (2022)"
    },
    desc: "Vier van deze vijf sterrenstelsels zijn verwikkeld in een kosmische dans van herhaalde nabije ontmoetingen, die schokgolven en getijstaarten veroorzaken. Het vijfde stelsel (NGC 7320) ligt toevallig in dezelfde kijkrichting maar staat er in werkelijkheid veel dichterbij.",
    position3D: [2200, 500, 1600]
  },
  {
    id: "wasp-96b",
    type: "exoplanet",
    name: "WASP-96 b",
    category: "jwst",
    distanceLy: 1150,
    distanceLabel: "1.150 lj",
    subtitle: "Hete Jupiter · eerste JWST-atmosfeerspectrum",
    facts: {
      "Object": "WASP-96 b, sterrenbeeld Phoenix",
      "Afstand": "≈ 1.150 lichtjaar",
      "Type": "Hete Jupiter (gasreus)",
      "Omlooptijd": "3,4 dagen",
      "Detectie": "Waterdamp in atmosfeer (JWST, 2022)"
    },
    desc: "WASP-96b is een hete gasreus die zijn ster in slechts 3,4 dagen omcirkelt. JWST's eerste transmissiespectrum van een exoplaneet toonde hier duidelijke signatuur van waterdamp aan — een doorbraak voor het bestuderen van verre planeetatmosferen.",
    position3D: [-1300, -400, 700]
  },
  {
    id: "smacs0723",
    type: "deepfield",
    name: "SMACS 0723",
    category: "jwst",
    distanceLy: 4240000000,
    distanceLabel: "4.240.000.000 lj",
    subtitle: "Webb's eerste Deep Field · gravitationele lens",
    facts: {
      "Object": "Sterrenstelselcluster SMACS J0723.3–7327",
      "Afstand cluster": "≈ 4,24 miljard lichtjaar",
      "Oudste lichtstelsels": "tot > 13 miljard jaar oud",
      "Effect": "Gravitationele lensing",
      "Gepresenteerd": "11 juli 2022 door president Biden"
    },
    desc: "De massa van dit sterrenstelselcluster buigt de ruimtetijd zo sterk dat het licht van veel verder gelegen sterrenstelsels erachter wordt uitvergroot en vervormd tot bogen — een natuurlijke gravitatielens. Dit was de eerste volledige-kleur Deep Field-opname van JWST.",
    position3D: [-1900, -600, -1800]
  }
];

/* ---------------------------------------------------------------------
   1. RENDERER / SCENE / CAMERA (volledig 3D perspectief)
   ------------------------------------------------------------------- */

const wrap = document.getElementById("canvas-wrap");
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 200000
);
camera.position.set(0, 260, 900);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
wrap.appendChild(renderer.domElement);

/* ---------------------------------------------------------------------
   2. ORBIT-STIJL CAMERABEDIENING (rotate / pan / zoom) — lichte, eigen
   implementatie zodat we geen extra OrbitControls-bestand nodig hebben.
   ------------------------------------------------------------------- */

const controls = {
  target: new THREE.Vector3(0, 0, 0),
  radius: 900,
  minRadius: 6,
  maxRadius: 20000,
  theta: Math.PI * 0.28,   // horizontale hoek
  phi: Math.PI * 0.38,     // verticale hoek
  dragging: false,
  panning: false,
  lastX: 0, lastY: 0,
  rotSpeed: 0.005,
  panSpeed: 0.0012,
  zoomSpeed: 1.12
};

function updateCameraFromOrbit(){
  const { radius, theta, phi, target } = controls;
  const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
  const y = target.y + radius * Math.cos(phi);
  const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
  camera.position.set(x, y, z);
  camera.lookAt(target);
}
updateCameraFromOrbit();

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button === 2 || e.shiftKey) controls.panning = true;
  else controls.dragging = true;
  controls.lastX = e.clientX;
  controls.lastY = e.clientY;
});
window.addEventListener("pointerup", () => { controls.dragging = false; controls.panning = false; });
window.addEventListener("pointermove", (e) => {
  const dx = e.clientX - controls.lastX;
  const dy = e.clientY - controls.lastY;
  controls.lastX = e.clientX;
  controls.lastY = e.clientY;

  if (controls.dragging){
    controls.theta -= dx * controls.rotSpeed;
    controls.phi -= dy * controls.rotSpeed;
    controls.phi = Math.max(0.05, Math.min(Math.PI - 0.05, controls.phi));
    updateCameraFromOrbit();
  } else if (controls.panning){
    const panScale = controls.radius * controls.panSpeed;
    const camRight = new THREE.Vector3();
    camera.getWorldDirection(camRight);
    const right = new THREE.Vector3().crossVectors(camera.up, camRight).normalize();
    const up = new THREE.Vector3().crossVectors(camRight, right).normalize();
    controls.target.addScaledVector(right, dx * panScale);
    controls.target.addScaledVector(up, -dy * panScale);
    updateCameraFromOrbit();
  }
});

renderer.domElement.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? controls.zoomSpeed : 1 / controls.zoomSpeed;
  controls.radius = Math.max(controls.minRadius, Math.min(controls.maxRadius, controls.radius * factor));
  updateCameraFromOrbit();
  hideZoomHint();
}, { passive:false });

// Touch: 1 finger rotate, 2 finger pinch-zoom + pan
let touchState = { mode:null, startDist:0, startRadius:0, lastMid:null };
renderer.domElement.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1){
    touchState.mode = "rotate";
    controls.lastX = e.touches[0].clientX;
    controls.lastY = e.touches[0].clientY;
  } else if (e.touches.length === 2){
    touchState.mode = "pinch";
    const [a,b] = e.touches;
    touchState.startDist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
    touchState.startRadius = controls.radius;
    touchState.lastMid = { x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2 };
  }
}, { passive:true });

renderer.domElement.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (touchState.mode === "rotate" && e.touches.length === 1){
    const dx = e.touches[0].clientX - controls.lastX;
    const dy = e.touches[0].clientY - controls.lastY;
    controls.lastX = e.touches[0].clientX;
    controls.lastY = e.touches[0].clientY;
    controls.theta -= dx * controls.rotSpeed;
    controls.phi -= dy * controls.rotSpeed;
    controls.phi = Math.max(0.05, Math.min(Math.PI - 0.05, controls.phi));
    updateCameraFromOrbit();
  } else if (touchState.mode === "pinch" && e.touches.length === 2){
    const [a,b] = e.touches;
    const dist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
    const ratio = touchState.startDist / Math.max(1,dist);
    controls.radius = Math.max(controls.minRadius, Math.min(controls.maxRadius, touchState.startRadius * ratio));
    updateCameraFromOrbit();
  }
  hideZoomHint();
}, { passive:false });

renderer.domElement.addEventListener("touchend", () => { touchState.mode = null; });
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

function hideZoomHint(){
  const hint = document.getElementById("zoom-hint");
  if (hint && hint.style.opacity !== "0"){
    hint.style.opacity = "0";
    setTimeout(() => hint.remove(), 1200);
  }
}

/* ---------------------------------------------------------------------
   3. STERRENVELD ACHTERGROND (echte 3D puntenwolk, bolvormig)
   ------------------------------------------------------------------- */

function buildStarfield(count, radius, sizeRange, colorFn){
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i=0; i<count; i++){
    const r = radius * (0.5 + Math.random()*0.5);
    const u = Math.random(); const v = Math.random();
    const theta = 2*Math.PI*u;
    const phi = Math.acos(2*v - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.cos(phi);
    positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);

    const c = colorFn ? colorFn() : new THREE.Color(0xffffff);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    sizes[i] = sizeRange[0] + Math.random()*(sizeRange[1]-sizeRange[0]);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 2.2, vertexColors:true, transparent:true, opacity:0.9,
    depthWrite:false, blending: THREE.AdditiveBlending, sizeAttenuation:true
  });
  return new THREE.Points(geo, mat);
}

const starColorPalette = () => {
  const r = Math.random();
  if (r < 0.7) return new THREE.Color(0xffffff);
  if (r < 0.85) return new THREE.Color(0xbfd4ff);
  if (r < 0.95) return new THREE.Color(0xfff0cf);
  return new THREE.Color(0xffcf9e);
};

scene.add(buildStarfield(9000, 14000, [1.0, 2.6], starColorPalette));
scene.add(buildStarfield(4000, 5000, [0.6, 1.6], starColorPalette));

/* ---------------------------------------------------------------------
   4. ZWART GAT — 3D-mesh + accretieschijf + gravitational-lensing shader
   ------------------------------------------------------------------- */

const blackHoleGroup = new THREE.Group();

// Event horizon (matte zwarte bol)
const horizonGeo = new THREE.SphereGeometry(22, 64, 64);
const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const horizon = new THREE.Mesh(horizonGeo, horizonMat);
blackHoleGroup.add(horizon);

// Photon-ring gloed (extra sphere, additive, iets groter dan horizon)
const glowGeo = new THREE.SphereGeometry(23.5, 64, 64);
const glowMat = new THREE.ShaderMaterial({
  uniforms: { c: { value: 0.55 }, p: { value: 3.2 }, glowColor: { value: new THREE.Color(0x6fb7ff) } },
  vertexShader: `
    varying vec3 vNormal;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float c; uniform float p; uniform vec3 glowColor;
    varying vec3 vNormal;
    void main(){
      float intensity = pow(c - dot(vNormal, vec3(0.0,0.0,1.0)), p);
      gl_FragColor = vec4(glowColor, intensity);
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite:false
});
const glow = new THREE.Mesh(glowGeo, glowMat);
glow.scale.setScalar(1.9);
blackHoleGroup.add(glow);

// Accretieschijf: 3D ring-geometrie met een gloeiende gradient-shader
const diskGeo = new THREE.RingGeometry(30, 130, 256, 1);
// vervorm de UV zodat we een radiale gradient + turbulentie kunnen doen
const diskMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    innerColor: { value: new THREE.Color(0xfff6e0) },
    midColor: { value: new THREE.Color(0xffa64d) },
    outerColor: { value: new THREE.Color(0x6fb7ff) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vDist;
    void main(){
      vUv = uv;
      vDist = length(position.xy);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 innerColor; uniform vec3 midColor; uniform vec3 outerColor;
    varying vec2 vUv; varying float vDist;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*43758.5453); }

    void main(){
      float t = smoothstep(30.0, 130.0, vDist);
      vec3 col = mix(innerColor, midColor, smoothstep(0.0,0.45,t));
      col = mix(col, outerColor, smoothstep(0.45,1.0,t));

      float angle = atan(vUv.y-0.5, vUv.x-0.5);
      float swirl = sin(angle*8.0 + uTime*1.4 - vDist*0.05) * 0.5 + 0.5;
      float turbulence = hash(vUv*40.0 + uTime*0.05) * 0.15;
      float brightness = mix(0.65, 1.25, swirl) + turbulence;

      float edgeFade = smoothstep(1.0, 0.85, t) * smoothstep(0.0,0.06,t);
      gl_FragColor = vec4(col * brightness, edgeFade);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite:false
});
const disk = new THREE.Mesh(diskGeo, diskMat);
disk.rotation.x = Math.PI/2.35;
blackHoleGroup.add(disk);

// Gravitational lensing: een transparante bol rondom die de achtergrond
// visueel "trekt" via een fresnel-achtige refractie-illusie (echte
// achterliggende ray-marched lensing is te zwaar voor realtime mobile,
// dit geeft het perceptuele lens-effect in 3D).
const lensGeo = new THREE.SphereGeometry(190, 96, 96);
const lensMat = new THREE.ShaderMaterial({
  uniforms: {
    uStrength: { value: 1.0 },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPos;
    void main(){
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform float uStrength;
    varying vec3 vNormal;
    varying vec3 vPos;
    void main(){
      float fres = pow(1.0 - abs(vNormal.z), 2.5);
      vec3 tint = mix(vec3(0.02,0.03,0.06), vec3(0.35,0.55,0.9), fres);
      float alpha = fres * 0.35 * uStrength;
      gl_FragColor = vec4(tint, alpha);
    }
  `,
  transparent: true,
  depthWrite:false,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending
});
const lensSphere = new THREE.Mesh(lensGeo, lensMat);
blackHoleGroup.add(lensSphere);

const holeLight = new THREE.PointLight(0x9fd0ff, 3.5, 2600, 2);
blackHoleGroup.add(holeLight);

scene.add(blackHoleGroup);

/* ---------------------------------------------------------------------
   5. STERRENSTELSELS (Andromeda + Stephan's Quintet) als 3D spiraal-
   puntenwolken, en overige objecten als 3D-nevel-achtige puntwolken.
   ------------------------------------------------------------------- */

function buildSpiralGalaxy({ radius, arms=4, thickness, particleCount, coreColor, armColor, tint }){
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i=0; i<particleCount; i++){
    const armIndex = i % arms;
    const armOffset = (armIndex / arms) * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.55) * radius;
    const spin = r * 0.045;
    const angle = armOffset + spin + (Math.random()-0.5) * 0.5;
    const spread = (1 - r/radius) * 0.35 + 0.05;

    const x = Math.cos(angle) * r + (Math.random()-0.5) * r * spread;
    const z = Math.sin(angle) * r + (Math.random()-0.5) * r * spread;
    const y = (Math.random()-0.5) * thickness * (1 - r/radius*0.6);

    positions[i*3] = x;
    positions[i*3+1] = y;
    positions[i*3+2] = z;

    const c = new THREE.Color().lerpColors(coreColor, armColor, Math.min(1, r/radius));
    if (tint) c.lerp(tint, 0.15);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 2.6, vertexColors:true, transparent:true, opacity:0.92,
    depthWrite:false, blending: THREE.AdditiveBlending, sizeAttenuation:true
  });
  return new THREE.Points(geo, mat);
}

const andromedaObj = OBJECTS.find(o => o.id === "andromeda");
const andromedaGalaxy = buildSpiralGalaxy({
  radius: 480, arms: 5, thickness: 34, particleCount: 26000,
  coreColor: new THREE.Color(0xfff2d0), armColor: new THREE.Color(0xb98cff)
});
andromedaGalaxy.position.set(...andromedaObj.position3D);
andromedaGalaxy.rotation.x = 0.35;
scene.add(andromedaGalaxy);

// bulge (heldere kern) voor Andromeda
const bulgeGeo = new THREE.SphereGeometry(46, 32, 32);
const bulgeMat = new THREE.MeshBasicMaterial({ color: 0xfff2d0, transparent:true, opacity:0.55 });
const andromedaBulge = new THREE.Mesh(bulgeGeo, bulgeMat);
andromedaBulge.position.copy(andromedaGalaxy.position);
scene.add(andromedaBulge);

// Stephan's Quintet: 5 kleine, botsende stelseltjes dicht bij elkaar
const stephanObj = OBJECTS.find(o => o.id === "stephans-quintet");
const stephanGroup = new THREE.Group();
stephanGroup.position.set(...stephanObj.position3D);
const stephanColors = [0xffb37e, 0xff9f6e, 0xffd9a0, 0xffb37e, 0x9fd7ff];
for (let i=0;i<5;i++){
  const g = buildSpiralGalaxy({
    radius: 40 + Math.random()*20, arms: 3, thickness: 10, particleCount: 1400,
    coreColor: new THREE.Color(0xffffff), armColor: new THREE.Color(stephanColors[i])
  });
  const ang = (i/5) * Math.PI * 2;
  g.position.set(Math.cos(ang)*55, (Math.random()-0.5)*30, Math.sin(ang)*55);
  g.rotation.x = Math.random()*Math.PI;
  g.rotation.y = Math.random()*Math.PI;
  stephanGroup.add(g);
}
scene.add(stephanGroup);

/* ---------------------------------------------------------------------
   6. NEVEL-ACHTIGE JWST-OBJECTEN (Pillars, Carina, Southern Ring) —
   3D volumetrische puntenwolken in kolom/wand/ring-vorm.
   ------------------------------------------------------------------- */

function buildNebulaCloud({ shape, count, spread, colorA, colorB }){
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count*3);
  const colors = new Float32Array(count*3);

  for (let i=0;i<count;i++){
    let x,y,z;
    if (shape === "pillars"){
      const col = Math.floor(Math.random()*3);
      const baseX = (col-1) * spread*0.35;
      const h = Math.random();
      x = baseX + (Math.random()-0.5) * spread*0.18 * (1-h*0.5);
      y = (h-0.5) * spread * 1.4;
      z = (Math.random()-0.5) * spread*0.18;
    } else if (shape === "cliff"){
      x = (Math.random()-0.5) * spread * 1.6;
      z = (Math.random()-0.5) * spread * 0.5;
      const ridge = Math.sin(x*0.01) * spread*0.25;
      y = ridge + (Math.random()-0.5) * spread*0.4 - spread*0.15;
    } else if (shape === "ring"){
      const a = Math.random()*Math.PI*2;
      const r = spread*0.35 + (Math.random()-0.5)*spread*0.18;
      x = Math.cos(a)*r;
      y = (Math.random()-0.5)*spread*0.15;
      z = Math.sin(a)*r;
    } else {
      x = (Math.random()-0.5)*spread;
      y = (Math.random()-0.5)*spread;
      z = (Math.random()-0.5)*spread;
    }
    positions[i*3]=x; positions[i*3+1]=y; positions[i*3+2]=z;
    const c = new THREE.Color().lerpColors(colorA, colorB, Math.random());
    colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions,3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors,3));
  const mat = new THREE.PointsMaterial({
    size: 3.4, vertexColors:true, transparent:true, opacity:0.85,
    depthWrite:false, blending: THREE.AdditiveBlending, sizeAttenuation:true
  });
  return new THREE.Points(geo, mat);
}

const pillarsObj = OBJECTS.find(o => o.id === "pillars");
const pillarsCloud = buildNebulaCloud({
  shape:"pillars", count: 9000, spread: 130,
  colorA: new THREE.Color(0x3a2410), colorB: new THREE.Color(0xffb37e)
});
pillarsCloud.position.set(...pillarsObj.position3D);
scene.add(pillarsCloud);

const carinaObj = OBJECTS.find(o => o.id === "carina");
const carinaCloud = buildNebulaCloud({
  shape:"cliff", count: 9000, spread: 160,
  colorA: new THREE.Color(0x1c2e4a), colorB: new THREE.Color(0xffd9a0)
});
carinaCloud.position.set(...carinaObj.position3D);
scene.add(carinaCloud);

const srObj = OBJECTS.find(o => o.id === "southern-ring");
const srCloud = buildNebulaCloud({
  shape:"ring", count: 6000, spread: 90,
  colorA: new THREE.Color(0xff9f6e), colorB: new THREE.Color(0x6fb7ff)
});
srCloud.position.set(...srObj.position3D);
scene.add(srCloud);
const srStarGeo = new THREE.SphereGeometry(4,16,16);
const srStar = new THREE.Mesh(srStarGeo, new THREE.MeshBasicMaterial({color:0xffffff}));
srStar.position.copy(srCloud.position);
scene.add(srStar);

// WASP-96b: ster + planeet-orbit (3D)
const waspObj = OBJECTS.find(o => o.id === "wasp-96b");
const waspGroup = new THREE.Group();
waspGroup.position.set(...waspObj.position3D);
const waspStar = new THREE.Mesh(new THREE.SphereGeometry(9,32,32), new THREE.MeshBasicMaterial({color:0xfff4d6}));
waspGroup.add(waspStar);
const waspStarGlow = new THREE.PointLight(0xfff4d6, 2, 400);
waspGroup.add(waspStarGlow);
const waspPlanetOrbitRadius = 26;
const waspPlanet = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xd98a4e, emissive: 0x5a2f10, roughness:0.6 })
);
waspGroup.add(waspPlanet);
const waspOrbitLine = new THREE.Mesh(
  new THREE.RingGeometry(waspPlanetOrbitRadius-0.15, waspPlanetOrbitRadius+0.15, 128),
  new THREE.MeshBasicMaterial({ color:0x8891a7, transparent:true, opacity:0.35, side:THREE.DoubleSide })
);
waspOrbitLine.rotation.x = Math.PI/2;
waspGroup.add(waspOrbitLine);
scene.add(waspGroup);

// SMACS 0723: gravitationele lens — ring van vervormde achtergrondstelseltjes
const smacsObj = OBJECTS.find(o => o.id === "smacs0723");
const smacsGroup = new THREE.Group();
smacsGroup.position.set(...smacsObj.position3D);
const smacsClusterCore = buildNebulaCloud({
  shape:"blob", count: 3000, spread: 70,
  colorA: new THREE.Color(0xffe9c4), colorB: new THREE.Color(0xffffff)
});
smacsGroup.add(smacsClusterCore);
for (let i=0;i<10;i++){
  const arcGeo = new THREE.TorusGeometry(60 + Math.random()*40, 0.6, 8, 40, Math.PI*0.6 + Math.random());
  const arcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random(),0.5,0.7) });
  const arc = new THREE.Mesh(arcGeo, arcMat);
  arc.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
  smacsGroup.add(arc);
}
scene.add(smacsGroup);

/* ---------------------------------------------------------------------
   7. LICHT
   ------------------------------------------------------------------- */
scene.add(new THREE.AmbientLight(0x1a2030, 1.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.4);
keyLight.position.set(500,600,400);
scene.add(keyLight);

/* ---------------------------------------------------------------------
   8. LABELS (altijd zichtbaar, klikbaar) — geprojecteerd van 3D naar 2D
   ------------------------------------------------------------------- */

const labelLayer = document.getElementById("label-layer");
const labelEls = {};

OBJECTS.forEach(obj => {
  const el = document.createElement("div");
  el.className = `obj-label ${obj.category}`;
  el.innerHTML = `
    <div class="tag"><b>${obj.name}</b><span class="dist">${obj.distanceLabel}</span></div>
    <div class="dot"></div>
  `;
  el.addEventListener("click", () => openInfoPanel(obj.id));
  labelLayer.appendChild(el);
  labelEls[obj.id] = el;
});

const worldPosCache = new THREE.Vector3();
function updateLabels(){
  if (!labelsVisible) return;
  OBJECTS.forEach(obj => {
    worldPosCache.set(...obj.position3D);
    const el = labelEls[obj.id];
    const projected = worldPosCache.clone().project(camera);
    const behindCamera = projected.z > 1;
    if (behindCamera){
      el.style.display = "none";
      return;
    }
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    el.style.display = "flex";
    el.style.left = `${x}px`;
    el.style.top = `${y - 14}px`;

    // fade met afstand tot camera voor diepte-gevoel
    const dist = camera.position.distanceTo(worldPosCache);
    const opacity = Math.max(0.35, Math.min(1, 4000/Math.max(dist,1)));
    el.style.opacity = opacity.toFixed(2);
  });
}

let labelsVisible = true;

/* ---------------------------------------------------------------------
   9. INFO-PANEEL / HOTSPOT-LIJST
   ------------------------------------------------------------------- */

const infoPanel = document.getElementById("info-panel");
const infoEyebrow = document.getElementById("info-eyebrow");
const infoTitle = document.getElementById("info-title");
const infoSubtitle = document.getElementById("info-subtitle");
const infoFacts = document.getElementById("info-facts");
const infoDesc = document.getElementById("info-desc");
const infoFlyBtn = document.getElementById("info-fly");
let activeObjId = null;

function openInfoPanel(id){
  const obj = OBJECTS.find(o => o.id === id);
  if (!obj) return;
  activeObjId = id;
  infoEyebrow.textContent = obj.category === "jwst" ? "JWST-WAARNEMING" :
                             obj.category === "andromeda" ? "STERRENSTELSEL" : "ZWART GAT";
  infoTitle.textContent = obj.name;
  infoSubtitle.textContent = obj.subtitle;
  infoFacts.innerHTML = Object.entries(obj.facts).map(([k,v]) =>
    `<span class="k">${k}</span><span class="v">${v}</span>`
  ).join("");
  infoDesc.textContent = obj.desc;
  infoPanel.classList.add("open");
}

document.getElementById("info-close").addEventListener("click", () => {
  infoPanel.classList.remove("open");
  activeObjId = null;
});

infoFlyBtn.addEventListener("click", () => {
  if (!activeObjId) return;
  flyToObject(activeObjId);
});

function flyToObject(id){
  const obj = OBJECTS.find(o => o.id === id);
  if (!obj) return;
  controls.target.set(...obj.position3D);
  const targetRadius = id === "andromeda" ? 700 :
                        id === "stephans-quintet" ? 260 :
                        id === "sgr-a" ? 400 : 180;
  animateValue(controls, "radius", controls.radius, targetRadius, 900);
}

function animateValue(obj, key, from, to, duration){
  const start = performance.now();
  function step(now){
    const t = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-t, 3);
    obj[key] = from + (to-from) * eased;
    updateCameraFromOrbit();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// hotspot chip lijst (rechtsonder) voor snelle navigatie naar JWST-objecten
const hotspotList = document.getElementById("hotspot-list");
OBJECTS.filter(o => o.category === "jwst").forEach(obj => {
  const chip = document.createElement("div");
  chip.className = "hs-chip";
  chip.innerHTML = `<span class="sw"></span>${obj.name}`;
  chip.addEventListener("click", () => { openInfoPanel(obj.id); flyToObject(obj.id); });
  hotspotList.appendChild(chip);
});

/* ---------------------------------------------------------------------
   10. UI-BEDIENING (schaalmodus, snelheid, lensing, labels, reset)
   ------------------------------------------------------------------- */

let timeSpeed = 1;
let lensStrength = 1;
document.getElementById("speed").addEventListener("input", (e) => {
  timeSpeed = parseFloat(e.target.value);
});
document.getElementById("lensing").addEventListener("input", (e) => {
  lensStrength = parseFloat(e.target.value);
  lensMat.uniforms.uStrength.value = lensStrength;
});

const btnReal = document.getElementById("btn-scale-real");
const btnVisual = document.getElementById("btn-scale-visual");
btnReal.addEventListener("click", () => {
  btnReal.classList.add("active"); btnVisual.classList.remove("active");
  document.getElementById("status-line").textContent = "Logaritmische schaal · relatieve werkelijke afstanden";
});
btnVisual.addEventListener("click", () => {
  btnVisual.classList.add("active"); btnReal.classList.remove("active");
  document.getElementById("status-line").textContent = "Visuele schaal · geoptimaliseerd voor overzicht";
});

const btnLabels = document.getElementById("btn-labels");
btnLabels.addEventListener("click", () => {
  labelsVisible = !labelsVisible;
  btnLabels.classList.toggle("active", labelsVisible);
  Object.values(labelEls).forEach(el => el.style.display = labelsVisible ? "flex" : "none");
});

let orbitsVisible = false;
const btnOrbits = document.getElementById("btn-orbits");
const orbitHelpers = [];
function buildOrbitRing(radius, color, group, y=0){
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius-0.4, radius+0.4, 128),
    new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.25, side:THREE.DoubleSide })
  );
  ring.rotation.x = Math.PI/2;
  ring.position.y = y;
  ring.visible = false;
  group.add(ring);
  orbitHelpers.push(ring);
}
buildOrbitRing(waspPlanetOrbitRadius, 0x8891a7, waspGroup);
btnOrbits.addEventListener("click", () => {
  orbitsVisible = !orbitsVisible;
  btnOrbits.classList.toggle("active", orbitsVisible);
  orbitHelpers.forEach(o => o.visible = orbitsVisible);
});

document.getElementById("collapse-btn").addEventListener("click", (e) => {
  const panel = document.getElementById("controls");
  panel.classList.toggle("collapsed");
  e.target.textContent = panel.classList.contains("collapsed") ? "+" : "–";
});

document.getElementById("reset-btn").addEventListener("click", () => {
  controls.target.set(0,0,0);
  animateValue(controls, "radius", controls.radius, 900, 800);
  controls.theta = Math.PI*0.28;
  controls.phi = Math.PI*0.38;
});

/* ---------------------------------------------------------------------
   11. RENDER LOOP
   ------------------------------------------------------------------- */

const clock = new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta() * timeSpeed;
  const t = clock.elapsedTime * timeSpeed;

  disk.material.uniforms.uTime.value = t;
  blackHoleGroup.rotation.y += dt * 0.04;

  andromedaGalaxy.rotation.y += dt * 0.01;
  andromedaBulge.rotation.y += dt * 0.01;

  // Andromeda nadert echt de Melkweg (langzame, zichtbare drift naar oorsprong)
  const approachSpeed = 0.35;
  andromedaGalaxy.position.z += dt * approachSpeed;
  andromedaBulge.position.z += dt * approachSpeed;
  andromedaObj.position3D[2] = andromedaGalaxy.position.z;

  stephanGroup.children.forEach((g,i) => { g.rotation.y += dt * (0.02 + i*0.004); });

  waspPlanet.position.set(
    Math.cos(t*0.9) * waspPlanetOrbitRadius,
    0,
    Math.sin(t*0.9) * waspPlanetOrbitRadius
  );

  smacsGroup.rotation.y += dt * 0.015;
  pillarsCloud.rotation.y += dt * 0.005;
  carinaCloud.rotation.y += dt * 0.004;
  srCloud.rotation.y += dt * 0.02;

  updateLabels();
  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------------
   12. RESIZE & BOOT
   ------------------------------------------------------------------- */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("load", () => {
  setTimeout(() => {
    const loading = document.getElementById("loading");
    loading.style.opacity = "0";
    setTimeout(() => loading.remove(), 650);
  }, 500);
});

animate();

/* ---------------------------------------------------------------------
   13. Backend-koppeling (optioneel): haal live status/metadata op
   van de Python-backend, indien beschikbaar, om distance-readout
   en versie-info te verrijken zonder de simulatie ervan afhankelijk
   te maken (graceful degrade als backend niet bereikbaar is).
   ------------------------------------------------------------------- */

fetch("/api/status").then(r => r.ok ? r.json() : null).then(data => {
  if (!data) return;
  if (data.andromeda_distance_ly){
    const row = document.querySelector("#distance-readout .row:first-child .v");
    if (row) row.textContent = `${Number(data.andromeda_distance_ly).toLocaleString("nl-NL")} lj`;
  }
}).catch(() => { /* backend niet bereikbaar: simulatie werkt volledig standalone client-side */ });

})();
