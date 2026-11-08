import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.js';
import {
  WORLD_HALF, POIS, ROADS, TRACKS, LOOT_ZONES,
  BASE_HOUSES, TOWN_BUILDINGS, RESOURCE_NODES, RESOURCE_TYPES,
} from './world-data.js';

const Y_AXIS = new THREE.Vector3(0, 1, 0);
let scene;
let colliders;
let cameraBoxes;
let map;
let MATS;
let rng;
let animated = [];
let surfaces = [];
let smokePuffs = [];
let smokeTexture = null;
let resourceMeshes = new Map();
let baseRecords = new Map();
let pondWater = null;

function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randomRange = (min, max) => min + rng() * (max - min);

// ---------------------------------------------------------------------------
// Procedural textures (no external assets)
// ---------------------------------------------------------------------------
function makeCanvas(size, paint, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  paint(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function speckle(ctx, size, count, colors, minR = .5, maxR = 2.2) {
  for (let i = 0; i < count; i += 1) {
    ctx.fillStyle = colors[(rng() * colors.length) | 0];
    const r = randomRange(minR, maxR);
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function buildTextures() {
  return {
    grass: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#b8b9a8';
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 1600, ['#a4a894', '#c6c5b2', '#9ba08a', '#d0cdb8'], .4, 1.5);
    }, 110, 110),
    asphalt: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#525856';
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 900, ['#454b49', '#626866', '#3c4240', '#747a76'], .4, 1.4);
      ctx.strokeStyle = 'rgba(35,38,37,.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i += 1) {
        ctx.beginPath();
        ctx.moveTo(rng() * s, 0);
        ctx.lineTo(rng() * s, s);
        ctx.stroke();
      }
    }, 2, 26),
    dirt: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#68573f';
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 1000, ['#5b4a35', '#7a674b', '#4e3f2e', '#897452'], .5, 2);
    }, 3, 22),
    concrete: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#96968b';
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 700, ['#8a8a7f', '#a3a397', '#7f8075'], .5, 1.8);
      ctx.strokeStyle = 'rgba(70,70,64,.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(rng() * s, rng() * s);
        ctx.lineTo(rng() * s, rng() * s);
        ctx.stroke();
      }
    }, 3, 3),
    brick: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#7f5140';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#9c8c76';
      for (let y = 0; y < s; y += 16) {
        ctx.fillRect(0, y, s, 2);
        const off = (y / 16) % 2 ? 16 : 0;
        for (let x = -32; x < s; x += 32) ctx.fillRect(x + off, y, 2, 16);
      }
      speckle(ctx, s, 400, ['#744636', '#8d5b47', '#6b4033'], .4, 1.5);
    }, 2, 1),
    wood: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#6e543a';
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 16) {
        ctx.fillStyle = x % 32 ? '#695034' : '#785d40';
        ctx.fillRect(x, 0, 14, s);
        ctx.fillStyle = 'rgba(45,33,22,.5)';
        ctx.fillRect(x + 14, 0, 2, s);
      }
      speckle(ctx, s, 400, ['#5e472f', '#82684a', '#4c3927'], .4, 1.8);
    }, 2, 2),
    roof: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#4b4a43';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 16) {
        ctx.fillStyle = 'rgba(24,24,21,.55)';
        ctx.fillRect(0, y, s, 3);
        const off = (y / 16) % 2 ? 13 : 0;
        for (let x = -26; x < s; x += 26) ctx.fillRect(x + off, y, 2, 16);
      }
      speckle(ctx, s, 350, ['#55544b', '#414039', '#626157'], .4, 1.4);
    }, 4, 2),
    metal: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#8a908e';
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 8) {
        ctx.fillStyle = x % 16 ? '#7b817f' : '#989e9b';
        ctx.fillRect(x, 0, 4, s);
      }
      speckle(ctx, s, 300, ['#777d7a', '#9ba19e', '#686e6b'], .4, 1.2);
    }, 3, 1),
    rust: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#7a5b43';
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 900, ['#8f6746', '#5f4634', '#a8784f', '#4e3a2d'], .6, 3);
    }, 2, 2),
    canvas: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#a3a18c';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(100,99,85,.35)';
      for (let x = 0; x < s; x += 4) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke();
      }
      for (let y = 0; y < s; y += 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
      }
      speckle(ctx, s, 300, ['#95937f', '#b0ad98', '#87856f'], .4, 1.2);
    }, 2, 2),
    sandbag: makeCanvas(128, (ctx, s) => {
      ctx.fillStyle = '#9d8b67';
      ctx.fillRect(0, 0, s, s);
      speckle(ctx, s, 800, ['#8c7b59', '#ac9973', '#7b6b4d'], .5, 2);
      ctx.strokeStyle = 'rgba(90,77,55,.35)';
      for (let y = 14; y < s; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + 2); ctx.stroke();
      }
    }, 1, 1),
  };
}

function makeMaterials() {
  const tex = buildTextures();
  return {
    grass: new THREE.MeshStandardMaterial({ vertexColors: true, map: tex.grass, roughness: 1, metalness: 0 }),
    asphalt: new THREE.MeshStandardMaterial({ map: tex.asphalt, roughness: .97, metalness: .01 }),
    dirt: new THREE.MeshStandardMaterial({ map: tex.dirt, roughness: 1, metalness: 0 }),
    concrete: new THREE.MeshStandardMaterial({ map: tex.concrete, roughness: .94, metalness: .03 }),
    brick: new THREE.MeshStandardMaterial({ map: tex.brick, roughness: .95, metalness: .01 }),
    wood: new THREE.MeshStandardMaterial({ map: tex.wood, roughness: .9, metalness: .01 }),
    woodDark: new THREE.MeshStandardMaterial({ map: tex.wood, color: '#8c7d67', roughness: .93 }),
    roof: new THREE.MeshStandardMaterial({ map: tex.roof, roughness: .92, metalness: .03 }),
    metal: new THREE.MeshStandardMaterial({ map: tex.metal, roughness: .58, metalness: .52 }),
    metalDark: new THREE.MeshStandardMaterial({ color: '#3c4445', roughness: .52, metalness: .62 }),
    rust: new THREE.MeshStandardMaterial({ map: tex.rust, roughness: .94, metalness: .14 }),
    canvas: new THREE.MeshStandardMaterial({ map: tex.canvas, color: '#727a5d', roughness: .98 }),
    canvasLight: new THREE.MeshStandardMaterial({ map: tex.canvas, color: '#a89c7b', roughness: .98 }),
    sandbag: new THREE.MeshStandardMaterial({ map: tex.sandbag, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: '#142126', roughness: .16, metalness: .82, transparent: true, opacity: .78 }),
    glassWarm: new THREE.MeshStandardMaterial({ color: '#6d5b3a', emissive: '#c08b3b', emissiveIntensity: .28, roughness: .22, metalness: .6 }),
    black: new THREE.MeshStandardMaterial({ color: '#14191a', roughness: .85 }),
    white: new THREE.MeshStandardMaterial({ color: '#d8d5c9', roughness: .85 }),
    red: new THREE.MeshStandardMaterial({ color: '#8f3c35', roughness: .86 }),
    yellow: new THREE.MeshStandardMaterial({ color: '#c7a23c', roughness: .8 }),
    green: new THREE.MeshStandardMaterial({ color: '#46563c', roughness: .9 }),
    blue: new THREE.MeshStandardMaterial({ color: '#34525f', roughness: .88 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#ffe7ad', emissive: '#ffd27a', emissiveIntensity: 2.6, roughness: .4 }),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function addBox(parent, w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, segments, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCollider(cx, cz, w, d, rotation = 0, minY = 0, maxY = 4) {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const hx = (w / 2) * c + (d / 2) * s;
  const hz = (w / 2) * s + (d / 2) * c;
  colliders.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, minY, maxY });
  cameraBoxes.push(new THREE.Box3(
    new THREE.Vector3(cx - hx, minY, cz - hz),
    new THREE.Vector3(cx + hx, maxY, cz + hz),
  ));
}

function addLocalCollider(lx, lz, w, d, rotation, ox, oz, maxY = 4, minY = 0) {
  const p = new THREE.Vector3(lx, 0, lz).applyAxisAngle(Y_AXIS, rotation);
  addCollider(ox + p.x, oz + p.z, w, d, rotation, minY, maxY);
}

function addSurface(cx, cz, w, d, rotation = 0, y = 0) {
  const c = Math.abs(Math.cos(rotation));
  const s = Math.abs(Math.sin(rotation));
  const hx = (w / 2) * c + (d / 2) * s;
  const hz = (w / 2) * s + (d / 2) * c;
  surfaces.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, y });
}

function registerBuilding(x, z, w, d, rotation, kind, color) {
  map.buildings.push({ x, z, w, d, rotation, kind, color });
}

function pointSegmentDistance(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const l2 = dx * dx + dz * dz;
  if (!l2) return Math.hypot(px - x1, pz - z1);
  let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
}

function nearRoad(x, z, extra = 4) {
  return ROADS.some((road) => pointSegmentDistance(x, z, road.x1, road.z1, road.x2, road.z2) < road.width / 2 + extra);
}

function nearBuilding(x, z, extra = 2) {
  return map.buildings.some((b) => Math.abs(x - b.x) < b.w / 2 + extra && Math.abs(z - b.z) < b.d / 2 + extra);
}

function makeTextTexture(title, subtitle = '', fg = '#e8e5d8', bg = '#232c2c', accent = '#c7a23c') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 48px "DM Mono", monospace';
  ctx.fillText(title, canvas.width / 2, subtitle ? 62 : 82);
  if (subtitle) {
    ctx.fillStyle = accent;
    ctx.font = '500 24px "DM Mono", monospace';
    ctx.fillText(subtitle, canvas.width / 2, 112);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeSign(title, subtitle, width, height, fg, bg, accent) {
  const material = new THREE.MeshBasicMaterial({
    map: makeTextTexture(title, subtitle, fg, bg, accent),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.castShadow = false;
  return mesh;
}

// ---------------------------------------------------------------------------
// Terrain, roads, rail
// ---------------------------------------------------------------------------
function buildGround() {
  const geometry = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 96, 96);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = [];
  const grass = new THREE.Color('#5c6645');
  const dry = new THREE.Color('#777b50');
  const dark = new THREE.Color('#48543b');
  const soil = new THREE.Color('#6a5b42');
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const n = Math.sin(x * .013) * Math.cos(z * .011) + Math.sin(x * .031 + z * .017) * .5 + Math.sin(z * .047 - x * .023) * .26;
    const n2 = Math.sin(x * .071 + z * .043) * .5 + .5;
    color.copy(grass).lerp(n > .35 ? dry : dark, Math.min(1, Math.abs(n) * .55));
    if (n2 > .82) color.lerp(soil, .4);
    const edge = Math.max(Math.abs(x), Math.abs(z)) / WORLD_HALF;
    if (edge > .82) color.lerp(dark, (edge - .82) * 2.4);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(geometry, MATS.grass);
  ground.receiveShadow = true;
  scene.add(ground);
}

function buildRoad(road) {
  const dx = road.x2 - road.x1;
  const dz = road.z2 - road.z1;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const group = new THREE.Group();
  group.position.set((road.x1 + road.x2) / 2, 0, (road.z1 + road.z2) / 2);
  group.rotation.y = angle;

  const surface = addBox(group, road.width, .08, length, road.kind === 'dirt' ? MATS.dirt : MATS.asphalt, 0, .01, 0);
  surface.receiveShadow = true;

  if (road.kind !== 'dirt') {
    const sidewalkWidth = road.kind === 'highway' ? 1.8 : 1.25;
    addBox(group, sidewalkWidth, .14, length, MATS.concrete, -(road.width / 2 + sidewalkWidth / 2), .02, 0);
    addBox(group, sidewalkWidth, .14, length, MATS.concrete, road.width / 2 + sidewalkWidth / 2, .02, 0);
  }

  if (road.kind === 'highway') {
    const dashCount = Math.ceil(length / 9);
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, .015, 3.4), MATS.white, dashCount);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < dashCount; i += 1) {
      matrix.makeTranslation(0, .065, -length / 2 + 4 + i * 9);
      dash.setMatrixAt(i, matrix);
    }
    dash.receiveShadow = true;
    group.add(dash);
  }

  scene.add(group);
}

function buildTracks() {
  const trackLength = 940;
  for (const track of TRACKS) {
    const group = new THREE.Group();
    group.position.set(0, 0, track.z);

    const ballast = addBox(group, trackLength, .16, 8, MATS.concrete, 0, .04, 0);
    ballast.material = MATS.rust;
    ballast.receiveShadow = true;

    const sleeperCount = Math.floor(trackLength / 1.35);
    const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.65, .12, .28), MATS.woodDark, sleeperCount);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < sleeperCount; i += 1) {
      matrix.makeTranslation(-trackLength / 2 + i * 1.35, .15, 0);
      sleepers.setMatrixAt(i, matrix);
    }
    sleepers.receiveShadow = true;
    group.add(sleepers);

    for (const offset of [-1.25, 1.25]) {
      const rail = addBox(group, trackLength, .12, .13, MATS.metalDark, 0, .26, offset);
      rail.receiveShadow = true;
    }

    // Trackside signal near the station.
    if (track.id === 'track-passenger') {
      const signal = new THREE.Group();
      addCylinder(signal, .09, .12, 3.4, 8, MATS.metalDark, 0, 1.7, 0);
      addBox(signal, .38, .95, .3, MATS.black, 0, 3.35, 0);
      addCylinder(signal, .1, .1, .06, 12, MATS.red, 0, 3.55, .16).rotation.x = Math.PI / 2;
      signal.position.set(82, 0, .55);
      group.add(signal);
    }

    scene.add(group);
  }
}

// ---------------------------------------------------------------------------
// Windows, doors, buildings
// ---------------------------------------------------------------------------
function addWindow(group, x, y, z, w, h, side, warm = false) {
  const glass = warm ? MATS.glassWarm : MATS.glass;
  if (side === 'z+') {
    addBox(group, w, h, .04, glass, x, y, z);
    addBox(group, w + .1, .06, .1, MATS.woodDark, x, y + h / 2, z + .02);
    addBox(group, w + .1, .06, .1, MATS.woodDark, x, y - h / 2, z + .02);
    addBox(group, .06, h, .1, MATS.woodDark, x - w / 2, y, z + .02);
    addBox(group, .06, h, .1, MATS.woodDark, x + w / 2, y, z + .02);
  } else if (side === 'z-') {
    addBox(group, w, h, .04, glass, x, y, z);
    addBox(group, w + .1, .06, .1, MATS.woodDark, x, y + h / 2, z - .02);
    addBox(group, w + .1, .06, .1, MATS.woodDark, x, y - h / 2, z - .02);
    addBox(group, .06, h, .1, MATS.woodDark, x - w / 2, y, z - .02);
    addBox(group, .06, h, .1, MATS.woodDark, x + w / 2, y, z - .02);
  } else if (side === 'x+') {
    addBox(group, .04, h, w, glass, x, y, z);
    addBox(group, .1, .06, w + .1, MATS.woodDark, x + .02, y + h / 2, z);
    addBox(group, .1, .06, w + .1, MATS.woodDark, x + .02, y - h / 2, z);
    addBox(group, .1, h, .06, MATS.woodDark, x + .02, y, z - w / 2);
    addBox(group, .1, h, .06, MATS.woodDark, x + .02, y, z + w / 2);
  } else {
    addBox(group, .04, h, w, glass, x, y, z);
    addBox(group, .1, .06, w + .1, MATS.woodDark, x - .02, y + h / 2, z);
    addBox(group, .1, .06, w + .1, MATS.woodDark, x - .02, y - h / 2, z);
    addBox(group, .1, h, .06, MATS.woodDark, x - .02, y, z - w / 2);
    addBox(group, .1, h, .06, MATS.woodDark, x - .02, y, z + w / 2);
  }
}

function createHouse(options) {
  const {
    x, z, rotation = 0, w = 9, d = 11, h = 3.3,
    wall = 'brick', roofRise = 2.4, doorWidth = 1.5,
    doors = ['front'], flatRoof = false, sign = null,
    interior = true, kind = 'house', tower = false, wallMaterial = null,
    roofMaterial = null, awning = false,
  } = options;

  const group = new THREE.Group();
  const wallMat = wallMaterial || MATS[wall] || MATS.brick;
  const roofMat = roofMaterial || MATS.roof;
  const localColliders = [];
  const wallHeight = h;

  const addWall = (lx, lz, ww, dd, height = wallHeight, mat = wallMat, y = height / 2) => {
    addBox(group, ww, height, dd, mat, lx, y, lz);
    localColliders.push({ lx, lz, w: ww, d: dd, minY: y - height / 2, maxY: y + height / 2 });
  };

  // Floor + trim
  addBox(group, w - .35, .12, d - .35, MATS.concrete, 0, .06, 0);
  addBox(group, w + .22, .28, .2, MATS.concrete, 0, .14, d / 2 + .05);
  addBox(group, w + .22, .28, .2, MATS.concrete, 0, .14, -d / 2 - .05);

  // Walls with doorway gaps
  const frontDoor = doors.includes('front');
  const backDoor = doors.includes('back');
  const halfGap = doorWidth / 2;
  const segWidth = (w - doorWidth) / 2;
  const segCenter = (w + doorWidth) / 4;

  if (frontDoor) {
    addWall(-segCenter, d / 2, segWidth, .25);
    addWall(segCenter, d / 2, segWidth, .25);
    addBox(group, doorWidth, h - 2.2, .25, wallMat, 0, 2.2 + (h - 2.2) / 2, d / 2);
    localColliders.push({ lx: 0, lz: d / 2, w: doorWidth, d: .25, minY: 2.2, maxY: h });
    const leaf = addBox(group, doorWidth * .92, 2.12, .07, MATS.woodDark, -doorWidth * .46, 1.06, d / 2 + .3);
    leaf.rotation.y = -1.05;
  } else {
    addWall(0, d / 2, w, .25);
  }

  if (backDoor) {
    addWall(-segCenter, -d / 2, segWidth, .25);
    addWall(segCenter, -d / 2, segWidth, .25);
    addBox(group, doorWidth, h - 2.2, .25, wallMat, 0, 2.2 + (h - 2.2) / 2, -d / 2);
    localColliders.push({ lx: 0, lz: -d / 2, w: doorWidth, d: .25, minY: 2.2, maxY: h });
    const leaf = addBox(group, doorWidth * .92, 2.12, .07, MATS.woodDark, doorWidth * .46, 1.06, -d / 2 - .3);
    leaf.rotation.y = 1.05;
  } else {
    addWall(0, -d / 2, w, .25);
  }

  addWall(-w / 2, 0, .25, d);
  addWall(w / 2, 0, .25, d);

  // Windows
  addWindow(group, -w / 3.1, 1.85, d / 2 + .02, 1.15, 1.15, 'z+', rng() < .3);
  addWindow(group, w / 3.1, 1.85, d / 2 + .02, 1.15, 1.15, 'z+', rng() < .3);
  addWindow(group, -w / 3.1, 1.85, -d / 2 - .02, 1.15, 1.15, 'z-');
  addWindow(group, w / 3.1, 1.85, -d / 2 - .02, 1.15, 1.15, 'z-');
  addWindow(group, -w / 2 - .02, 1.85, 0, 1.0, 1.1, 'x-');
  addWindow(group, w / 2 + .02, 1.85, 0, 1.0, 1.1, 'x+');

  // Weathered architectural trim: corner posts, window lintels, and a chimney
  // give the town houses a stronger silhouette at street distance.
  const trimMat = wall === 'wood' ? MATS.woodDark : MATS.concrete;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) addBox(group, .1, h + .16, .1, trimMat, sx * (w / 2 - .08), h / 2, sz * (d / 2 - .08));
  }
  addBox(group, w * .34, .08, .1, trimMat, 0, 2.48, d / 2 + .04);
  if (!flatRoof && !tower && kind !== 'church') {
    const chimney = addBox(group, .36, .72, .36, MATS.brick, w * .28, h + roofRise * .62, -d * .18);
    chimney.rotation.y = .08;
    addBox(group, .48, .08, .46, MATS.concrete, w * .28, h + roofRise * .62 + .38, -d * .18);
  }

  if (awning) {
    addBox(group, w * .55, .12, 2.1, MATS.metalDark, 0, 2.95, d / 2 + 1.0);
    addBox(group, .1, 2.7, .1, MATS.metalDark, -w * .26, 1.5, d / 2 + 1.9);
    addBox(group, .1, 2.7, .1, MATS.metalDark, w * .26, 1.5, d / 2 + 1.9);
  }

  // Roof
  if (flatRoof) {
    addBox(group, w + .55, .25, d + .55, roofMat, 0, h + .12, 0);
    addBox(group, w + .3, .35, .18, wallMat, 0, h + .42, d / 2 + .18);
    addBox(group, w + .3, .35, .18, wallMat, 0, h + .42, -d / 2 - .18);
    addBox(group, .18, .35, d + .3, wallMat, -w / 2 - .15, h + .42, 0);
    addBox(group, .18, .35, d + .3, wallMat, w / 2 + .15, h + .42, 0);
  } else {
    const rise = roofRise;
    const slope = Math.hypot(d / 2, rise) + .45;
    const angle = Math.atan2(rise, d / 2);
    const front = addBox(group, w + .9, .17, slope, roofMat, 0, h + rise / 2, d / 4);
    front.rotation.x = angle;
    const back = addBox(group, w + .9, .17, slope, roofMat, 0, h + rise / 2, -d / 4);
    back.rotation.x = -angle;
    addBox(group, w + 1.0, .13, .22, roofMat, 0, h + rise + .04, 0);

    const triangle = new THREE.Shape();
    triangle.moveTo(-w / 2, 0);
    triangle.lineTo(w / 2, 0);
    triangle.lineTo(0, rise);
    triangle.closePath();
    const triGeo = new THREE.ShapeGeometry(triangle);
    const gableFront = new THREE.Mesh(triGeo, wallMat);
    gableFront.position.set(0, h, d / 2 - .01);
    gableFront.castShadow = true;
    const gableBack = new THREE.Mesh(triGeo, wallMat);
    gableBack.position.set(0, h, -d / 2 + .01);
    gableBack.rotation.y = Math.PI;
    gableBack.castShadow = true;
    group.add(gableFront, gableBack);
    addBox(group, .55, 1.7, .55, MATS.brick, w / 3.2, h + rise * .7, -d / 5);
  }

  // Front details
  if (sign) {
    const plate = makeSign(sign.title, sign.subtitle || '', sign.width || 3.4, sign.height || 1.0, sign.fg, sign.bg, sign.accent);
    plate.position.set(0, h - .55, d / 2 + .07);
    group.add(plate);
  }

  // Interior clutter
  if (interior) {
    if (kind === 'barn') {
      for (let i = 0; i < 5; i += 1) {
        const bale = addCylinder(group, .5, .5, 1.1, 12, MATS.yellow, -w / 3 + (i % 3) * 1.2, .65, -d / 5 + Math.floor(i / 3) * 1.1);
        bale.rotation.z = Math.PI / 2;
      }
      addBox(group, 3.5, .25, 1.2, MATS.woodDark, w / 4, 1.8, -d / 3);
      addBox(group, .12, 1.8, .12, MATS.woodDark, w / 4 - 1.6, .9, -d / 3);
      addBox(group, .12, 1.8, .12, MATS.woodDark, w / 4 + 1.6, .9, -d / 3);
    } else if (kind === 'station') {
      for (let i = -2; i <= 2; i += 1) {
        addBox(group, 1.7, .1, .42, MATS.woodDark, i * 2.6, .62, 0);
        addBox(group, .1, .55, .35, MATS.metalDark, i * 2.6 - .65, .32, 0);
        addBox(group, .1, .55, .35, MATS.metalDark, i * 2.6 + .65, .32, 0);
      }
      addBox(group, 5.8, 1.1, .5, MATS.woodDark, 0, .55, -d / 2 + .55);
      addBox(group, 4.6, .08, .65, MATS.concrete, 0, 1.16, -d / 2 + .55);
      addBox(group, 2.4, 1.5, .08, MATS.black, 0, 2.5, -d / 2 + .08);
    } else if (kind === 'store') {
      for (let i = -2; i <= 2; i += 1) {
        addBox(group, 1.4, .08, .5, MATS.metalDark, 0, .6 + (i + 2) * .65, -d / 2 + .5);
        addBox(group, 1.4, .08, .5, MATS.metalDark, 0, .6 + (i + 2) * .65, -d / 2 + .5).position.x = 0;
      }
    } else {
      const table = addBox(group, 1.5, .08, .9, MATS.woodDark, w / 5, .75, 0);
      table.castShadow = true;
      [[-.55, -.3], [.55, -.3], [-.55, .3], [.55, .3]].forEach(([ox, oz]) => {
        addBox(group, .09, .72, .09, MATS.woodDark, w / 5 + ox, .38, oz);
      });
      addBox(group, .9, .25, 1.9, MATS.woodDark, -w / 2 + 1.0, .26, 0);
      addBox(group, .8, .12, 1.7, MATS.canvasLight, -w / 2 + 1.0, .43, 0);
      addBox(group, .45, 1.7, 1.5, MATS.woodDark, w / 2 - .75, 1.0, -d / 3);
      addBox(group, 1.15, .02, 1.6, MATS.red, 0, .13, 1.2);
    }
  }

  if (tower) {
    const towerX = -w / 2 + 2.1;
    const towerZ = d / 2 + 2.1;
    addBox(group, 4.2, 11, 4.2, wallMat, towerX, 5.5, towerZ);
    addBox(group, 4.7, .4, 4.7, MATS.concrete, towerX, 11.2, towerZ);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(3.1, 4.5, 4), roofMat);
    spire.position.set(towerX, 13.55, towerZ);
    spire.rotation.y = Math.PI / 4;
    spire.castShadow = true;
    group.add(spire);
    addBox(group, .12, 2.0, .12, MATS.metalDark, towerX, 16.6, towerZ);
    addBox(group, .8, .12, .12, MATS.metalDark, towerX, 17.0, towerZ);
    addWindow(group, towerX, 8.5, towerZ + 2.12, 1.2, 1.6, 'z+', true);
    addWindow(group, towerX, 8.5, towerZ - 2.12, 1.2, 1.6, 'z-', true);
    localColliders.push({ lx: towerX, lz: towerZ, w: 4.2, d: 4.2, minY: 0, maxY: 11 });
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(group);

  for (const c of localColliders) {
    addLocalCollider(c.lx, c.lz, c.w, c.d, rotation, x, z, c.maxY ?? h, c.minY ?? 0);
  }

  registerBuilding(x, z, w, d, rotation, kind);
  addSurface(x, z, w - .4, d - .4, rotation, .12);
  return group;
}

// ---------------------------------------------------------------------------
// Claimable shelters, stash chests, harvest nodes
// ---------------------------------------------------------------------------
function localToWorld(x, z, rotation, lx, lz) {
  return {
    x: x + lx * Math.cos(rotation) + lz * Math.sin(rotation),
    z: z - lx * Math.sin(rotation) + lz * Math.cos(rotation),
  };
}

function createChest(x, z, rotation = 0, baseId = null) {
  const group = new THREE.Group();
  const body = addBox(group, .95, .5, .62, MATS.woodDark, 0, .27, 0);
  body.castShadow = true;
  const lid = addBox(group, .98, .17, .64, MATS.wood, 0, .57, 0);
  lid.rotation.x = -.03;
  addBox(group, 1.0, .075, .66, MATS.metalDark, 0, .47, 0);
  addBox(group, .09, .19, .06, MATS.metal, 0, .46, .33);
  const lock = addBox(group, .15, .17, .06, MATS.brass, 0, .38, .35);
  lock.material = new THREE.MeshStandardMaterial({ color: '#b58a4a', emissive: '#6b4a1d', emissiveIntensity: .25, roughness: .42, metalness: .72 });
  addBox(group, .06, .06, .05, MATS.metalDark, -.08, .58, .35);
  addBox(group, .06, .06, .05, MATS.metalDark, .08, .58, .35);
  group.position.set(x, .12, z);
  group.rotation.y = rotation;
  group.userData = { baseId, kind: 'chest' };
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  return group;
}

function makeBaseSign(x, z, rotation, title, subtitle, accent) {
  const sign = makeSign(title, subtitle, 3.8, 1.05, '#f3f0e3', '#222c2c', accent);
  const p = localToWorld(x, z, rotation, 0, 0);
  sign.position.set(p.x, 2.42, p.z);
  sign.rotation.y = rotation;
  sign.userData.baseSign = true;
  scene.add(sign);
  return sign;
}

function buildBaseHouses() {
  for (const base of BASE_HOUSES) {
    createHouse({
      x: base.x, z: base.z, rotation: base.rotation,
      w: base.w, d: base.d, h: base.h, wall: base.wall, roofRise: base.roofRise,
      kind: 'base', interior: true, doorWidth: 1.5, doors: ['front', 'back'],
    });

    // Chest hugs the back wall, clear of the default table/shelf clutter.
    const chestLocal = [base.w / 2 - 1.45, -base.d / 2 + 1.25];
    const chestPos = localToWorld(base.x, base.z, base.rotation, chestLocal[0], chestLocal[1]);
    const chest = createChest(chestPos.x, chestPos.z, base.rotation + Math.PI * .08, base.id);

    const sign = makeBaseSign(base.x, base.z, base.rotation, base.name, 'UNCLAIMED SHELTER', '#d5f55a');
    const flagPos = localToWorld(base.x, base.z, base.rotation, -base.w / 2 - .55, base.d / 2 + 1.15);
    const pole = new THREE.Group();
    addCylinder(pole, .05, .07, 5.2, 8, MATS.metalDark, 0, 2.6, 0);
    const flagMat = new THREE.MeshStandardMaterial({ color: '#d5f55a', roughness: .78, side: THREE.DoubleSide });
    const flag = addBox(pole, 1.5, .78, .03, flagMat, .78, 4.75, 0);
    flag.userData.claimFlag = true;
    pole.position.set(flagPos.x, 0, flagPos.z);
    scene.add(pole);

    const ringPos = localToWorld(base.x, base.z, base.rotation, 0, base.d / 2 + 1.1);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.55, 2.85, 40),
      new THREE.MeshBasicMaterial({ color: '#d5f55a', transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ringPos.x, .07, ringPos.z);
    scene.add(ring);

    const record = {
      ...base,
      chestWorld: { x: chestPos.x, z: chestPos.z },
      chest,
      sign,
      flag,
      ring,
      claimed: false,
      ownerName: null,
      color: '#d5f55a',
      phase: rng() * Math.PI * 2,
    };
    baseRecords.set(base.id, record);

    if (flag) {
      animated.push((time) => {
        if (!record.claimed) return;
        flag.rotation.y = Math.sin(time * 1.4 + record.phase) * .16;
      });
    }
    animated.push((time) => {
      const pulse = .5 + .5 * Math.sin(time * 1.8 + record.phase);
      ring.material.opacity = record.claimed ? .1 + pulse * .07 : .13 + pulse * .14;
      ring.scale.setScalar(1 + pulse * .04);
    });
  }
}

function buildTownBaseMarkers() {
  for (const base of TOWN_BUILDINGS) {
    const chestLocal = [base.w / 2 - 1.45, -base.d / 2 + 1.25];
    const chestPos = localToWorld(base.x, base.z, base.rotation, chestLocal[0], chestLocal[1]);
    const chest = createChest(chestPos.x, chestPos.z, base.rotation + Math.PI * .08, base.id);
    const sign = makeBaseSign(base.x, base.z, base.rotation, base.name, 'UNCLAIMED TOWN BUILDING', '#7bdff2');
    const flagPos = localToWorld(base.x, base.z, base.rotation, -base.w / 2 - .55, base.d / 2 + 1.15);
    const pole = new THREE.Group();
    addCylinder(pole, .05, .07, 4.6, 8, MATS.metalDark, 0, 2.3, 0);
    const flagMat = new THREE.MeshStandardMaterial({ color: '#7bdff2', roughness: .78, side: THREE.DoubleSide });
    const flag = addBox(pole, 1.35, .7, .03, flagMat, .7, 4.1, 0);
    flag.userData.claimFlag = true;
    pole.position.set(flagPos.x, 0, flagPos.z);
    scene.add(pole);

    const ringPos = localToWorld(base.x, base.z, base.rotation, 0, base.d / 2 + 1.1);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.55, 2.85, 40),
      new THREE.MeshBasicMaterial({ color: '#7bdff2', transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ringPos.x, .07, ringPos.z);
    scene.add(ring);

    const record = {
      ...base,
      chestWorld: { x: chestPos.x, z: chestPos.z },
      chest,
      sign,
      flag,
      ring,
      claimed: false,
      ownerName: null,
      color: '#7bdff2',
      phase: rng() * Math.PI * 2,
    };
    baseRecords.set(base.id, record);

    animated.push((time) => {
      if (record.claimed) flag.rotation.y = Math.sin(time * 1.4 + record.phase) * .16;
      const pulse = .5 + .5 * Math.sin(time * 1.8 + record.phase);
      ring.material.opacity = record.claimed ? .1 + pulse * .07 : .13 + pulse * .14;
      ring.scale.setScalar(1 + pulse * .04);
    });
  }
}

function setBaseClaim(baseId, ownerName = null, color = '#d5f55a') {
  const record = baseRecords.get(baseId);
  if (!record) return;
  record.claimed = Boolean(ownerName);
  record.ownerName = ownerName || null;
  record.color = color || '#d5f55a';
  if (record.flag) record.flag.material.color.set(record.color);
  if (record.ring) record.ring.material.color.set(record.color);
  if (record.sign) {
    const oldMap = record.sign.material.map;
    record.sign.material.map = makeTextTexture(
      record.name,
      ownerName ? `CLAIMED / ${ownerName}` : 'UNCLAIMED SHELTER',
      '#f3f0e3', '#222c2c', record.color,
    );
    record.sign.material.needsUpdate = true;
    oldMap?.dispose();
  }
}

function createResourceNode(node) {
  const group = new THREE.Group();
  const type = RESOURCE_TYPES[node.kind] || RESOURCE_TYPES.wood;
  const accent = new THREE.MeshStandardMaterial({ color: type.color, roughness: .85, metalness: .04 });

  if (node.kind === 'wood') {
    addCylinder(group, .34, .42, .62, 9, MATS.woodDark, 0, .3, 0);
    const logA = addCylinder(group, .18, .2, 1.4, 8, MATS.wood, -.35, .24, .3);
    logA.rotation.z = Math.PI / 2;
    const logB = addCylinder(group, .15, .17, 1.2, 8, MATS.woodDark, .34, .2, -.25);
    logB.rotation.z = Math.PI / 2;
    logB.rotation.y = .4;
    addBox(group, .06, .62, .06, MATS.metalDark, .1, .65, -.2).rotation.z = -.4;
    const head = addBox(group, .28, .1, .16, MATS.metal, .32, .9, -.2);
    head.rotation.z = -.4;
  } else if (node.kind === 'scrap') {
    const barrel = addCylinder(group, .36, .38, .9, 10, MATS.rust, -.25, .45, .1);
    barrel.rotation.z = .08;
    addBox(group, 1.15, .16, .8, MATS.metalDark, .25, .14, -.25).rotation.set(.08, .2, -.1);
    addBox(group, .8, .52, .08, MATS.rust, .1, .45, -.42).rotation.z = -.28;
    addCylinder(group, .09, .11, .8, 7, MATS.metal, .5, .35, .25).rotation.z = .7;
    addTire(group, -.48, .16, -.35);
  } else if (node.kind === 'stone') {
    for (let i = 0; i < 4; i += 1) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(.34 + rng() * .32, 0), i === 0 ? accent : MATS.rock || accent);
      rock.position.set(randomRange(-.55, .55), .22 + rng() * .2, randomRange(-.55, .55));
      rock.rotation.set(rng() * .6, rng() * Math.PI, rng() * .6);
      rock.scale.set(1, .72 + rng() * .35, 1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);
    }
  } else {
    addBox(group, 1.05, .58, .78, MATS.woodDark, 0, .32, 0);
    addBox(group, 1.11, .12, .84, MATS.wood, 0, .62, 0);
    const cloth = addBox(group, .96, .1, .72, MATS.canvasLight, 0, .7, 0);
    cloth.rotation.z = .04;
    addBox(group, .5, .24, .5, accent, .1, .82, .04).rotation.y = .4;
    addBox(group, .1, .38, .12, MATS.metalDark, -.42, .8, .18);
  }

  group.position.set(node.x, 0, node.z);
  group.rotation.y = node.rotation || 0;
  group.userData = { resourceId: node.id, kind: node.kind };
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.resourceId = node.id;
    }
  });
  scene.add(group);
  resourceMeshes.set(node.id, group);
  map.props.push({ x: node.x, z: node.z, w: 2.3, d: 2.3, rotation: 0, kind: 'resource' });
  return group;
}

function buildResourceNodes() {
  for (const node of RESOURCE_NODES) createResourceNode(node);
}

function setResourceState(nodeId, remaining, maxUses = 1) {
  const mesh = resourceMeshes.get(nodeId);
  if (!mesh) return;
  mesh.visible = remaining > 0;
  if (remaining > 0 && maxUses > 0) {
    const scale = .78 + (remaining / maxUses) * .28;
    mesh.scale.setScalar(scale);
  }
}

// ---------------------------------------------------------------------------
// Extra scenery: woodland outposts, pond and sky
// ---------------------------------------------------------------------------
function buildOutposts() {
  createHouse({ x: 40, z: 165, w: 9, d: 8, h: 3.0, wall: 'wood', kind: 'house', rotation: .1, roofRise: 2.3 });
  createHouse({ x: -60, z: -250, w: 10, d: 8.5, h: 3.1, wall: 'brick', kind: 'house', rotation: -.3, roofRise: 2.1 });
  createHouse({ x: 250, z: -110, w: 8.5, d: 8, h: 2.9, wall: 'wood', kind: 'house', rotation: .8, roofRise: 2.2 });
  createHouse({ x: 390, z: 40, w: 9.5, d: 8.5, h: 3.1, wall: 'brick', kind: 'house', rotation: 1.9, roofRise: 2.0 });
  createHouse({ x: -400, z: -100, w: 9, d: 8, h: 2.9, wall: 'wood', kind: 'house', rotation: 1.2, roofRise: 2.4 });
  createHouse({ x: 180, z: 330, w: 11, d: 9, h: 3.3, wall: 'brick', kind: 'house', rotation: -.6, roofRise: 2.1 });

  addCrate(scene, 46, .5, 171, .9, .2);
  addBarrel(scene, -56, .55, -245, '#5c5845');
  addBarrel(scene, 256, .55, -114, '#6a4c3b');
  addPineStack(-402, -92);
  addPineStack(186, 338);
  addWell(-52, -242);
}

function addPineStack(x, z) {
  for (let i = 0; i < 9; i += 1) {
    const log = addCylinder(scene, .13, .16, 1.25, 7, MATS.woodDark, x + (i % 3) * .34, .18 + Math.floor(i / 3) * .28, z);
    log.rotation.z = Math.PI / 2;
  }
}

function buildPond() {
  const center = { x: -330, z: 60 };
  const radius = 24;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshStandardMaterial({
      color: '#30484a', roughness: .16, metalness: .42,
      transparent: true, opacity: .86, depthWrite: false,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(center.x, .055, center.z);
  water.receiveShadow = true;
  scene.add(water);
  pondWater = water;

  const shore = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + 2.8, 64),
    new THREE.MeshStandardMaterial({ color: '#665d47', roughness: 1 }),
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(center.x, .035, center.z);
  shore.receiveShadow = true;
  scene.add(shore);

  for (let i = 0; i < 64; i += 1) {
    const angle = (i / 64) * Math.PI * 2 + rng() * .06;
    const r = radius + randomRange(-.4, 2.3);
    const x = center.x + Math.cos(angle) * r;
    const z = center.z + Math.sin(angle) * r;
    if (i % 2) {
      const reed = addCylinder(scene, .025, .045, randomRange(.5, 1.35), 5, MATS.green, x, .35, z);
      reed.rotation.z = randomRange(-.18, .18);
    } else if (i % 5 === 0) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(randomRange(.2, .55), 0), MATS.rock || MATS.concrete);
      rock.position.set(x, .18, z);
      rock.scale.y = .6;
      rock.castShadow = true;
      scene.add(rock);
    }
  }

  // Small jetty reaching into the water.
  const dock = new THREE.Group();
  for (let i = 0; i < 7; i += 1) {
    addBox(dock, .48, .1, 1.3, MATS.woodDark, 0, .13, -i * 1.15);
  }
  for (const z of [-.3, -3.6, -6.9]) {
    addCylinder(dock, .09, .09, 1.5, 7, MATS.woodDark, -.55, .55, z);
    addCylinder(dock, .09, .09, 1.5, 7, MATS.woodDark, .55, .55, z);
  }
  dock.position.set(center.x + radius - 1.5, 0, center.z);
  dock.rotation.y = .32;
  scene.add(dock);

  map.props.push({ x: center.x, z: center.z, w: radius * 2, d: radius * 2, rotation: 0, kind: 'water' });
  animated.push((time) => {
    if (!pondWater) return;
    pondWater.position.y = .055 + Math.sin(time * .7) * .008;
  });
}

function buildSky() {
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color('#6f91a6') },
      middle: { value: new THREE.Color('#b9c6c2') },
      horizon: { value: new THREE.Color('#d6d3bd') },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vWorldPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 middle;
      uniform vec3 horizon;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 color = mix(horizon, middle, smoothstep(-0.04, 0.24, h));
        color = mix(color, top, smoothstep(0.18, 0.78, h));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(780, 32, 18), skyMaterial);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);
}

function createWarehouse(x, z, rotation = 0) {
  const group = new THREE.Group();
  const w = 27;
  const d = 18;
  const h = 7;
  const localColliders = [];
  const addWall = (lx, lz, ww, dd, height = h, y = height / 2) => {
    addBox(group, ww, height, dd, MATS.metal, lx, y, lz);
    localColliders.push({ lx, lz, w: ww, d: dd, minY: y - height / 2, maxY: y + height / 2 });
  };

  addBox(group, w - .4, .14, d - .4, MATS.concrete, 0, .07, 0);
  addWall(0, -d / 2, w, .3);
  addWall(-w / 2, 0, .3, d);
  addWall(w / 2, 0, .3, d);
  const opening = 10;
  const seg = (w - opening) / 2;
  addWall(-(w + opening) / 4, d / 2, seg, .3);
  addWall((w + opening) / 4, d / 2, seg, .3);
  addBox(group, opening, 1.4, .3, MATS.metal, 0, h - .7, d / 2);
  localColliders.push({ lx: 0, lz: d / 2, w: opening, d: .3, minY: h - 1.4, maxY: h });

  // Roof + skylights
  addBox(group, w + .8, .26, d + .8, MATS.metalDark, 0, h + .13, 0);
  for (let i = -2; i <= 2; i += 1) {
    addBox(group, 3.8, .08, 1.4, MATS.glass, i * 4.6, h + .28, -2.5);
  }
  addBox(group, w + .9, .5, .2, MATS.metalDark, 0, h - .1, d / 2 + .2);

  // Sliding door, pushed open
  const door = addBox(group, 7.5, 5.2, .16, MATS.rust, -opening / 2 - 1.8, 2.6, d / 2 + .22);
  door.rotation.y = .12;
  addBox(group, 7.8, .14, .2, MATS.metalDark, -opening / 2 - 1.8, 5.25, d / 2 + .22).rotation.y = .12;

  // Racks and shelves
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const rx = side * (w / 4 + i * 2.5);
      const rz = -d / 4;
      addBox(group, .18, 4.3, .18, MATS.metalDark, rx - 1.4, 2.15, rz - 2.6);
      addBox(group, .18, 4.3, .18, MATS.metalDark, rx + 1.4, 2.15, rz - 2.6);
      addBox(group, .18, 4.3, .18, MATS.metalDark, rx - 1.4, 2.15, rz + 2.6);
      addBox(group, .18, 4.3, .18, MATS.metalDark, rx + 1.4, 2.15, rz + 2.6);
      for (let s = 0; s < 3; s += 1) addBox(group, 3.1, .1, 5.4, MATS.metalDark, rx, .8 + s * 1.35, rz);
      addCrate(group, rx, .65, rz - 1.7, .8);
      addCrate(group, rx + .2, 2.0, rz + 1.4, .65);
      addBarrel(group, rx - .8, 1.95, rz + .2);
    }
  }

  addBox(group, 8, 1.2, 6, MATS.concrete, 8, .6, -d / 2 + 4);
  const sign = makeSign('ZAVOD', 'WAREHOUSE 04', 5.4, 1.5, '#e7e4d6', '#2d3434', '#c7a23c');
  sign.position.set(0, h - .9, d / 2 + .2);
  group.add(sign);

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  for (const c of localColliders) addLocalCollider(c.lx, c.lz, c.w, c.d, rotation, x, z, c.maxY, c.minY);
  registerBuilding(x, z, w, d, rotation, 'warehouse');
  addSurface(x, z, w - .5, d - .5, rotation, .14);
  return group;
}

function createContainer(x, z, rotation = 0, y = 0, color = '#6b4a3f', length = 12) {
  const group = new THREE.Group();
  const material = MATS.metal.clone();
  material.color.set(color);
  const body = addBox(group, length, 2.6, 2.55, material, 0, 1.3, 0);
  body.castShadow = true;
  for (let i = -2; i <= 2; i += 1) addBox(group, .12, 2.4, 2.62, material, i * (length / 6), 1.3, 0);
  addBox(group, length, .12, 2.62, MATS.metalDark, 0, .1, 0);
  addBox(group, length, .12, 2.62, MATS.metalDark, 0, 2.5, 0);
  addBox(group, .18, 2.4, 2.62, MATS.metalDark, -length / 2, 1.3, 0);
  addBox(group, .18, 2.4, 2.62, MATS.metalDark, length / 2, 1.3, 0);
  for (const ox of [-length / 2 + .18]) {
    addBox(group, .08, 2.2, .12, MATS.metalDark, ox, 1.3, .8);
    addBox(group, .08, 2.2, .12, MATS.metalDark, ox, 1.3, -.8);
    addBox(group, .06, .5, .14, MATS.metalDark, ox + .08, 1.7, 1.05);
  }
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  addCollider(x, z, length, 2.6, rotation, y, y + 2.6);
  registerBuilding(x, z, length, 2.6, rotation, 'container', color);
  return group;
}

function createRidgeTent(x, z, rotation = 0, opts = {}) {
  const { width = 4.8, depth = 4.2, height = 2.5, material = MATS.canvas, color } = opts;
  const group = new THREE.Group();
  const tentMat = color ? material.clone() : material;
  if (color) tentMat.color.set(color);
  const slope = Math.hypot(height, width / 2);
  const angle = Math.atan2(height, width / 2);
  const left = addBox(group, slope, .08, depth, tentMat, -width / 4, height / 2, 0);
  left.rotation.z = -angle;
  const right = addBox(group, slope, .08, depth, tentMat, width / 4, height / 2, 0);
  right.rotation.z = angle;
  addBox(group, .07, height, .07, MATS.metalDark, 0, height / 2, depth / 2);
  addBox(group, .07, height, .07, MATS.metalDark, 0, height / 2, -depth / 2);
  const back = new THREE.Shape();
  back.moveTo(-width / 2, 0);
  back.lineTo(width / 2, 0);
  back.lineTo(0, height);
  back.closePath();
  const backMesh = new THREE.Mesh(new THREE.ShapeGeometry(back), tentMat);
  backMesh.position.set(0, 0, -depth / 2);
  group.add(backMesh);
  const flap = addBox(group, width * .72, height * .8, .06, tentMat, 0, height * .42, depth / 2 - .03);
  flap.rotation.x = -.12;
  addBox(group, width + .5, .06, .18, MATS.concrete, 0, .04, depth / 2 + .2);
  for (const ox of [-width / 2 - .2, width / 2 + .2]) {
    addBox(group, .05, .08, depth + .4, MATS.metalDark, ox, .05, 0);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  addCollider(x, z, width, depth, rotation, 0, height);
  registerBuilding(x, z, width, depth, rotation, 'tent');
  return group;
}

function createWatchtower(x, z, rotation = 0) {
  const group = new THREE.Group();
  const height = 6.2;
  for (const ox of [-1.7, 1.7]) {
    for (const oz of [-1.7, 1.7]) {
      addBox(group, .22, height, .22, MATS.woodDark, ox, height / 2, oz);
      addCollider(x + ox, z + oz, .5, .5, 0, 0, height);
    }
  }
  addBox(group, 4.2, .18, 4.2, MATS.woodDark, 0, height, 0);
  addBox(group, 4.2, .55, .18, MATS.woodDark, 0, height + .55, 2.0);
  addBox(group, 4.2, .55, .18, MATS.woodDark, 0, height + .55, -2.0);
  addBox(group, .18, .55, 4.2, MATS.woodDark, 2.0, height + .55, 0);
  addBox(group, .18, .55, 4.2, MATS.woodDark, -2.0, height + .55, 0);
  addBox(group, 4.8, .18, 4.8, MATS.roof, 0, height + 2.4, 0);
  for (const ox of [-1.8, 1.8]) for (const oz of [-1.8, 1.8]) addBox(group, .12, 2.3, .12, MATS.woodDark, ox, height + 1.2, oz);
  for (let i = 0; i < 10; i += 1) addBox(group, .55, .06, .08, MATS.metalDark, -2.35, .6 + i * .58, 1.55);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  registerBuilding(x, z, 4.8, 4.8, rotation, 'tower');
  return group;
}

function createSandbagWall(x, z, rotation = 0, length = 7) {
  const group = new THREE.Group();
  const rows = 3;
  const count = Math.ceil(length / 1.15);
  for (let r = 0; r < rows; r += 1) {
    for (let i = 0; i < count; i += 1) {
      const bag = addBox(group, 1.1, .38, .6, MATS.sandbag, -length / 2 + .55 + i * 1.15 + (r % 2 ? .3 : 0), .22 + r * .34, 0);
      bag.rotation.y = randomRange(-.1, .1);
    }
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  addCollider(x, z, length + .5, 1.0, rotation, 0, 1.3);
  map.props.push({ x, z, w: length, d: 1, rotation, kind: 'sandbag' });
  return group;
}

// ---------------------------------------------------------------------------
// Props, vehicles, light
// ---------------------------------------------------------------------------
function addCrate(parent, x, y, z, scale = 1, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  addBox(group, scale, scale, scale, MATS.wood, 0, 0, 0);
  for (const side of [-1, 1]) {
    addBox(group, scale * .08, scale * .9, scale * .08, MATS.woodDark, side * scale * .42, 0, scale * .42);
    addBox(group, scale * .08, scale * .9, scale * .08, MATS.woodDark, side * scale * .42, 0, -scale * .42);
    addBox(group, scale * .9, scale * .08, scale * .08, MATS.woodDark, 0, side * scale * .42, scale * .42);
    addBox(group, scale * .9, scale * .08, scale * .08, MATS.woodDark, 0, side * scale * .42, -scale * .42);
  }
  parent.add(group);
  return group;
}

function addBarrel(parent, x, y, z, color = '#5e5545') {
  const mat = MATS.rust.clone();
  mat.color.set(color);
  const barrel = addCylinder(parent, .42, .42, 1.1, 14, mat, x, y, z);
  addCylinder(parent, .435, .435, .06, 14, MATS.metalDark, x, y + .3, z);
  addCylinder(parent, .435, .435, .06, 14, MATS.metalDark, x, y - .3, z);
  return barrel;
}

function addPallet(parent, x, y, z, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  for (let i = 0; i < 3; i += 1) addBox(group, 1.1, .1, .18, MATS.woodDark, 0, 0, -.36 + i * .36);
  for (let i = 0; i < 3; i += 1) addBox(group, .16, .1, 1.0, MATS.woodDark, -.38 + i * .38, .08, 0);
  parent.add(group);
  return group;
}

function addTire(parent, x, y, z) {
  const tire = new THREE.Mesh(new THREE.TorusGeometry(.34, .14, 8, 16), MATS.black);
  tire.rotation.x = Math.PI / 2;
  tire.position.set(x, y, z);
  tire.castShadow = true;
  parent.add(tire);
  return tire;
}

function addBench(parent, x, z, rotation = 0, y = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  addBox(group, 1.8, .1, .5, MATS.woodDark, 0, .55, 0);
  addBox(group, 1.8, .45, .09, MATS.woodDark, 0, .84, -.22);
  addBox(group, .1, .55, .4, MATS.metalDark, -.72, .28, 0);
  addBox(group, .1, .55, .4, MATS.metalDark, .72, .28, 0);
  parent.add(group);
  return group;
}

function addStreetLamp(x, z, rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  addCylinder(group, .09, .14, 5.2, 8, MATS.metalDark, 0, 2.6, 0);
  addBox(group, 1.5, .1, .12, MATS.metalDark, .6, 5.15, 0);
  addBox(group, .55, .18, .34, MATS.metalDark, 1.25, 5.0, 0);
  addBox(group, .44, .05, .27, MATS.lamp, 1.25, 4.9, 0);
  scene.add(group);
  return group;
}

function addPowerLines() {
  const poleMat = MATS.woodDark;
  const topPoints = [];
  const positions = [];
  for (let z = -300; z <= 420; z += 42) positions.push({ x: 9, z });
  for (const p of positions) {
    const pole = new THREE.Group();
    pole.position.set(p.x, 0, p.z);
    addCylinder(pole, .12, .18, 7.2, 8, poleMat, 0, 3.6, 0);
    addBox(pole, 2.1, .12, .12, poleMat, 0, 6.85, 0);
    addBox(pole, .12, .36, .4, MATS.glass, -.85, 6.9, 0);
    addBox(pole, .12, .36, .4, MATS.glass, .85, 6.9, 0);
    scene.add(pole);
    if (topPoints.length) {
      const prev = topPoints[topPoints.length - 1];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(prev.x - .85, 6.9, prev.z),
        new THREE.Vector3((prev.x + p.x) / 2, 6.0, (prev.z + p.z) / 2),
        new THREE.Vector3(p.x - .85, 6.9, p.z),
      ]);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(12)),
        new THREE.LineBasicMaterial({ color: '#1a2020', transparent: true, opacity: .7 }),
      );
      scene.add(line);
      const curve2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(prev.x + .85, 6.9, prev.z),
        new THREE.Vector3((prev.x + p.x) / 2, 6.0, (prev.z + p.z) / 2),
        new THREE.Vector3(p.x + .85, 6.9, p.z),
      ]);
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve2.getPoints(12)),
        new THREE.LineBasicMaterial({ color: '#1a2020', transparent: true, opacity: .7 }),
      ));
    }
    topPoints.push(p);
  }
}

function createVehicle(x, z, rotation = 0, type = 'car', color = '#55534a') {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: .28 });
  const paintRust = new THREE.MeshStandardMaterial({ color: '#76533b', roughness: .94, metalness: .08 });
  let w = 1.9;
  let d = 4.2;
  const wheelMat = MATS.black;

  if (type === 'truck') {
    w = 2.35;
    d = 6.0;
    addBox(group, w, .85, d, paint, 0, .95, 0);
    addBox(group, w, 1.5, 2.0, paint, 0, 1.45, 1.85);
    addBox(group, w - .15, .8, 2.6, paintRust, 0, 1.5, -.9);
    addBox(group, 2.0, .08, 1.8, MATS.glass, 0, 1.75, 2.83).rotation.x = -.16;
    for (const ox of [-1.05, 1.05]) {
      for (const oz of [-2.0, 1.8]) {
        const wheel = addCylinder(group, .54, .54, .3, 14, wheelMat, ox, .56, oz);
        wheel.rotation.z = Math.PI / 2;
      }
    }
  } else if (type === 'tractor') {
    w = 1.45;
    d = 3.4;
    addBox(group, w, .65, d, paint, 0, .9, 0);
    addBox(group, w - .15, 1.35, 1.0, paint, 0, 1.75, -.5);
    addBox(group, .08, 1.2, .08, MATS.metalDark, -.35, 2.1, 1.25);
    for (const ox of [-.85, .85]) {
      const wheel = addCylinder(group, .82, .82, .4, 16, wheelMat, ox, .8, -1.0);
      wheel.rotation.z = Math.PI / 2;
      const front = addCylinder(group, .44, .44, .28, 12, wheelMat, ox, .46, 1.15);
      front.rotation.z = Math.PI / 2;
    }
  } else {
    addBox(group, w, .62, d, paintRust, 0, .65, 0);
    addBox(group, w - .12, .62, 2.15, paint, 0, 1.26, -.2);
    addBox(group, w - .5, .52, 1.8, MATS.glass, 0, 1.32, -.18);
    addBox(group, w, .32, .8, paintRust, 0, .62, 1.9);
    addBox(group, w, .32, .6, paintRust, 0, .62, -1.85);
    for (const ox of [-.96, .96]) {
      for (const oz of [-1.35, 1.35]) {
        const wheel = addCylinder(group, .37, .37, .24, 12, wheelMat, ox, .38, oz);
        wheel.rotation.z = Math.PI / 2;
      }
    }
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  addCollider(x, z, w, d, rotation, 0, type === 'truck' ? 2.4 : 1.7);
  map.props.push({ x, z, w, d, rotation, kind: 'vehicle' });
  return group;
}

function createCampfire() {
  const group = new THREE.Group();
  for (let i = 0; i < 9; i += 1) {
    const angle = (i / 9) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(.16, 0), MATS.concrete);
    stone.position.set(Math.cos(angle) * .8, .12, Math.sin(angle) * .8);
    stone.rotation.set(rng() * 2, rng() * 2, rng() * 2);
    stone.castShadow = true;
    group.add(stone);
  }
  for (let i = 0; i < 4; i += 1) {
    const log = addCylinder(group, .08, .1, 1.1, 8, MATS.woodDark, 0, .2, 0);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 4) * Math.PI;
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.32, 1.0, 10), new THREE.MeshBasicMaterial({ color: '#ffb45e', transparent: true, opacity: .88 }));
  flame.position.y = .72;
  group.add(flame);
  const light = new THREE.PointLight('#ff9d4d', 4.5, 15, 2);
  light.position.y = 1.1;
  group.add(light);
  scene.add(group);
  animated.push((time) => {
    flame.scale.y = .85 + Math.sin(time * 11) * .12 + Math.sin(time * 19) * .06;
    flame.scale.x = .9 + Math.sin(time * 13) * .1;
    light.intensity = 3.9 + Math.sin(time * 15) * .7 + Math.sin(time * 27) * .3;
  });
  return group;
}

// ---------------------------------------------------------------------------
// Smoke
// ---------------------------------------------------------------------------
function getSmokeTexture() {
  if (smokeTexture) return smokeTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,255,.9)');
  gradient.addColorStop(.45, 'rgba(255,255,255,.4)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  smokeTexture = new THREE.CanvasTexture(canvas);
  return smokeTexture;
}

function addSmokeColumn(x, y, z, count = 10, scale = 1, color = '#454b49') {
  const texture = getSmokeTexture();
  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, color, transparent: true, opacity: 0, depthWrite: false,
    }));
    const baseScale = scale * randomRange(.8, 1.5);
    sprite.scale.setScalar(baseScale);
    sprite.position.set(x, y, z);
    scene.add(sprite);
    smokePuffs.push({
      sprite, x, y, z,
      phase: rng(),
      speed: randomRange(.035, .07) / scale,
      driftX: randomRange(-.7, .7),
      driftZ: randomRange(-.7, .7),
      baseScale,
      rise: 9 * scale,
    });
  }
}

function updateSmoke(delta) {
  for (const puff of smokePuffs) {
    puff.phase = (puff.phase + delta * puff.speed) % 1;
    const t = puff.phase;
    puff.sprite.position.set(
      puff.x + puff.driftX * t * 7,
      puff.y + t * puff.rise,
      puff.z + puff.driftZ * t * 7,
    );
    puff.sprite.material.opacity = Math.sin(Math.PI * t) * .3;
    puff.sprite.scale.setScalar(puff.baseScale * (1 + t * 2.8));
  }
}

// ---------------------------------------------------------------------------
// Trains + station
// ---------------------------------------------------------------------------
function createTrainCar(x, z, kind = 'passenger') {
  const group = new THREE.Group();
  const length = 18;
  const width = 2.8;
  const bodyMat = MATS.metal.clone();
  bodyMat.color.set(kind === 'freight' ? '#5d4c42' : kind === 'locomotive' ? '#4e5b57' : '#596a6b');
  const oldPaint = new THREE.MeshStandardMaterial({ color: '#8a5c45', roughness: .92, metalness: .16 });

  if (kind === 'locomotive') {
    addBox(group, length - 1, 2.0, width, bodyMat, 0, 2.0, 0);
    addBox(group, 5.4, 2.7, width + .08, bodyMat, 4.2, 2.8, 0);
    addBox(group, 5.6, .18, width + .2, MATS.roof, 4.2, 4.22, 0);
    addBox(group, 2.4, .42, width + .16, oldPaint, -5.4, 2.2, 0);
    addBox(group, 3.6, .5, width + .1, MATS.metalDark, -8.4, 1.7, 0);
    const chimney = addCylinder(group, .32, .42, 1.2, 10, MATS.metalDark, -3.2, 4.2, 0);
    chimney.castShadow = true;
    addBox(group, .8, .8, 1.0, MATS.lamp, -9.0, 2.35, 0);
    addBox(group, .25, 1.0, 2.6, MATS.metalDark, -9.2, 1.3, 0);
    for (let i = 0; i < 6; i += 1) {
      for (const oz of [-1.05, 1.05]) {
        const wheel = addCylinder(group, .44, .44, .24, 14, MATS.black, -6.8 + i * 2.7, .64, oz);
        wheel.rotation.x = Math.PI / 2;
      }
    }
    addBox(group, length - 2, .5, width - .4, MATS.metalDark, 0, .95, 0);
    addSmokeColumn(x - 3.2, 4.9, z, 12, 1.2, '#3c4240');
  } else if (kind === 'freight') {
    addBox(group, length - 1, 2.7, width, bodyMat, 0, 2.2, 0);
    addBox(group, length - .6, .22, width + .15, MATS.metalDark, 0, 3.65, 0);
    for (let i = -4; i <= 4; i += 1) {
      addBox(group, .18, 2.5, width + .06, MATS.metalDark, i * 1.9, 2.2, 0);
    }
    addBox(group, 4.0, 2.1, .08, oldPaint, 2.5, 2.1, width / 2 + .02);
    addBox(group, .25, 2.3, .14, MATS.metalDark, .4, 2.1, width / 2 + .08);
    for (let i = 0; i < 4; i += 1) {
      for (const oz of [-1.05, 1.05]) {
        const wheel = addCylinder(group, .42, .42, .24, 14, MATS.black, -5.7 + i * 3.8, .62, oz);
        wheel.rotation.x = Math.PI / 2;
      }
    }
    addBox(group, length - 2, .5, width - .4, MATS.metalDark, 0, .9, 0);
  } else {
    addBox(group, length - 1, 2.5, width, bodyMat, 0, 2.15, 0);
    addBox(group, length - .4, .35, width + .12, MATS.roof, 0, 3.62, 0);
    const stripe = addBox(group, length - 1, .17, width + .06, oldPaint, 0, 1.35, 0);
    stripe.castShadow = false;
    for (let i = -3; i <= 3; i += 1) {
      addBox(group, 1.25, .82, .06, MATS.glass, i * 2.2, 2.45, width / 2 + .02);
      addBox(group, 1.25, .82, .06, MATS.glass, i * 2.2, 2.45, -width / 2 - .02);
    }
    for (const ox of [-6.4, 6.4]) {
      addBox(group, 1.0, 2.0, .08, MATS.metalDark, ox, 1.95, width / 2 + .03);
      addBox(group, .9, 1.0, .06, MATS.glass, ox, 2.55, width / 2 + .07);
    }
    for (let i = 0; i < 4; i += 1) {
      for (const oz of [-1.05, 1.05]) {
        const wheel = addCylinder(group, .42, .42, .24, 14, MATS.black, -5.7 + i * 3.8, .62, oz);
        wheel.rotation.x = Math.PI / 2;
      }
    }
    addBox(group, length - 2, .5, width - .4, MATS.metalDark, 0, .9, 0);
  }

  for (const ox of [-length / 2 + .4, length / 2 - .4]) {
    addBox(group, .5, .35, .4, MATS.metalDark, ox, .9, 0);
  }

  group.position.set(x, 0, z);
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  addCollider(x, z, length - .5, width + .2, 0, 0, 4.2);
  map.props.push({ x, z, w: length - .5, d: width + .2, rotation: 0, kind: 'train' });
  return group;
}

function buildTrainStation() {
  const platform = addBox(scene, 140, .36, 12, MATS.concrete, 0, .18, -328);
  platform.receiveShadow = true;
  addSurface(0, -328, 140, 12, 0, .36);
  addBox(scene, 140, .02, .28, MATS.yellow, 0, .375, -333.5);
  addBox(scene, 140, .02, .18, MATS.white, 0, .375, -332.9);
  for (let i = -3; i <= 3; i += 1) addBox(scene, 1.1, .02, .9, MATS.yellow, i * 9, .377, -333.0);

  // Canopy
  addBox(scene, 126, .22, 11.5, MATS.metalDark, 0, 5.7, -328);
  addBox(scene, 126, .15, .25, MATS.metal, 0, 5.95, -322.5);
  for (const x of [-58, -29, 0, 29, 58]) {
    addCylinder(scene, .11, .14, 5.7, 8, MATS.metalDark, x, 2.85, -323.2);
    addBox(scene, .8, .12, .8, MATS.metalDark, x, .43, -323.2);
  }
  for (const x of [-48, -24, 0, 24, 48]) addBox(scene, .9, .07, .34, MATS.lamp, x, 5.52, -328);

  // Station hall
  const hall = createHouse({
    x: 0, z: -308, w: 44, d: 16, h: 5.4, wall: 'brick', roofRise: 2.9,
    doorWidth: 3.4, doors: ['front', 'back'], kind: 'station', sign: null,
    awning: false, interior: true,
  });
  const frontSign = makeSign('YAROSLAV', 'TRAIN STATION', 8.5, 2.2, '#e9e6d6', '#273231', '#c7a23c');
  frontSign.position.set(0, 4.55, 8.08);
  hall.add(frontSign);
  const backSign = makeSign('YAROSLAV', 'TRAIN STATION', 8.5, 2.2, '#e9e6d6', '#273231', '#c7a23c');
  backSign.position.set(0, 4.55, -8.08);
  backSign.rotation.y = Math.PI;
  hall.add(backSign);

  const clock = new THREE.Group();
  const face = addCylinder(clock, .62, .62, .1, 24, MATS.white, 0, 0, 0);
  face.rotation.x = Math.PI / 2;
  addBox(clock, .06, .42, .03, MATS.black, 0, .2, .08);
  addBox(clock, .3, .06, .03, MATS.black, .12, 0, .08);
  clock.position.set(0, 3.6, 8.09);
  hall.add(clock);

  // Platform signage + furniture
  const platformSign = makeSign('YAROSLAV', 'TRAIN STATION', 7.4, 1.9, '#e9e6d6', '#273231', '#c7a23c');
  platformSign.position.set(0, 4.05, -334.4);
  scene.add(platformSign);
  addCylinder(scene, .07, .09, 3.2, 8, MATS.metalDark, -3.3, 1.6, -334.4);
  addCylinder(scene, .07, .09, 3.2, 8, MATS.metalDark, 3.3, 1.6, -334.4);
  addBench(scene, -38, -326.2, Math.PI, .36);
  addBench(scene, 12, -326.2, Math.PI, .36);
  addBench(scene, 50, -326.2, Math.PI, .36);
  addCrate(scene, -62, .86, -329.5, 1.0, .2);
  addCrate(scene, -60.5, 1.76, -329.2, .8, -.3);
  addCrate(scene, 64, .81, -327.2, .9, .4);
  addBarrel(scene, 56, .91, -331, '#4b5344');
  addBarrel(scene, 54.8, .91, -329.8, '#6a4f3d');
  addTire(scene, -66, .52, -325.5);
  addPallet(scene, 26, .42, -330.2);
  addCrate(scene, 26, .81, -330.2, .9, .15);

  const cart = new THREE.Group();
  addBox(cart, .1, 1.2, .1, MATS.metalDark, -.6, .6, -.8);
  addBox(cart, .1, 1.2, .1, MATS.metalDark, .6, .6, -.8);
  addBox(cart, .9, .08, 2.0, MATS.metalDark, 0, 1.2, 0);
  for (const oz of [-.8, .8]) {
    const w1 = addCylinder(cart, .16, .16, .08, 10, MATS.black, -.62, .2, oz);
    w1.rotation.z = Math.PI / 2;
    const w2 = addCylinder(cart, .16, .16, .08, 10, MATS.black, .62, .2, oz);
    w2.rotation.z = Math.PI / 2;
  }
  addCrate(cart, 0, 1.45, -.4, .55);
  addCrate(cart, 0, 1.45, .5, .5);
  cart.position.set(-20, .36, -327);
  scene.add(cart);

  // Trains
  createTrainCar(-118, -338, 'locomotive');
  for (const x of [-100, -80, -60, -40, -20]) createTrainCar(x, -338, 'passenger');
  createTrainCar(112, -350, 'locomotive');
  for (const x of [132, 152, 172, 192, 212]) createTrainCar(x, -350, 'freight');

  // Freight yard clutter
  addCrate(scene, 108, .6, -330, 1.2, .1);
  addCrate(scene, 110, .6, -331.2, 1.0, -.2);
  addCrate(scene, 108.6, 1.8, -330.6, .9, .3);
  addBarrel(scene, 140, .55, -330.5, '#4f5b58');
  addBarrel(scene, 142, .55, -331.5, '#6d4e3b');
  addPallet(scene, 168, .06, -330.4, .2);
  addCrate(scene, 168, .7, -330.4, 1.1, .1);
}

// ---------------------------------------------------------------------------
// Districts
// ---------------------------------------------------------------------------
function addFenceLine(x1, z1, x2, z2, height = 2.1, material = MATS.metalDark) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  const group = new THREE.Group();
  group.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
  group.rotation.y = angle;
  const posts = Math.max(2, Math.ceil(length / 3));
  for (let i = 0; i <= posts; i += 1) {
    addBox(group, .09, height, .09, material, 0, height / 2, -length / 2 + (i / posts) * length);
  }
  for (const y of [.45, .95, 1.5, height - .08]) {
    addBox(group, .045, .045, length, material, 0, y, 0);
  }
  scene.add(group);
  addCollider((x1 + x2) / 2, (z1 + z2) / 2, .45, length, angle, 0, height);
  map.props.push({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, w: .45, d: length, rotation: angle, kind: 'fence' });
  return group;
}

function addBarrier(x, z, rotation = 0) {
  const group = new THREE.Group();
  const barrier = addBox(group, 3.2, 1.0, .65, MATS.concrete, 0, .5, 0);
  barrier.castShadow = true;
  for (let i = -2; i <= 2; i += 1) {
    addBox(group, .42, .2, .68, i % 2 ? MATS.red : MATS.white, i * .6, .72, 0);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
  addCollider(x, z, 3.2, .65, rotation, 0, 1.0);
  map.props.push({ x, z, w: 3.2, d: .65, rotation, kind: 'barrier' });
  return group;
}

function addWell(x, z) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 1.0, 18), MATS.concrete);
  ring.position.y = .5;
  ring.castShadow = true;
  ring.receiveShadow = true;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .06, 18), new THREE.MeshStandardMaterial({ color: '#1a2c30', roughness: .2, metalness: .4 }));
  water.position.y = .62;
  group.add(ring, water);
  for (const ox of [-1.0, 1.0]) addBox(group, .12, 2.3, .12, MATS.woodDark, ox, 1.15, 0);
  addBox(group, 2.5, .14, 1.2, MATS.woodDark, 0, 2.25, 0);
  addBox(group, .1, .5, .1, MATS.metalDark, 0, 2.0, 0);
  group.position.set(x, 0, z);
  scene.add(group);
  addCollider(x, z, 2.5, 2.5, 0, 0, 2.4);
  map.props.push({ x, z, w: 2.5, d: 2.5, rotation: 0, kind: 'well' });
  return group;
}

function buildCamp() {
  createRidgeTent(-14, 10, 0, { color: '#77785a' });
  createRidgeTent(14, 10, Math.PI, { color: '#6e7357' });
  createRidgeTent(-14, -10, 0, { color: '#6b7158' });
  createRidgeTent(14, -10, Math.PI, { color: '#7a7b5f' });
  createCampfire();
  addSmokeColumn(0, 1.4, 0, 8, .75, '#4a504c');

  // Flagpole
  const pole = new THREE.Group();
  addCylinder(pole, .05, .07, 6, 8, MATS.metalDark, 0, 3, 0);
  addBox(pole, 1.6, .8, .02, MATS.red, .84, 5.5, 0);
  pole.position.set(-2, 0, 7);
  scene.add(pole);

  const sign = makeSign('SURVIVOR CAMP', 'SAFE ZONE / DAY 01', 4.6, 1.3, '#e9e6d6', '#26302c', '#d5f55a');
  sign.position.set(-3, 2.2, -15);
  scene.add(sign);
  addCylinder(scene, .05, .07, 2.1, 8, MATS.woodDark, -5.2, 1.05, -15);
  addCylinder(scene, .05, .07, 2.1, 8, MATS.woodDark, -.8, 1.05, -15);

  addBench(scene, 3, -6, .2);
  addBench(scene, -3, 7, Math.PI);
  addCrate(scene, -4, .5, -7, 1.0, .2);
  addCrate(scene, -3.2, 1.5, -6.7, .8, -.4);
  addCrate(scene, 9, .55, 1, 1.1, .3);
  addBarrel(scene, -7, .55, 3, '#58614c');
  addBarrel(scene, 11, .55, -2, '#6d4c39');
  addPallet(scene, 8, .06, -8, .2);
  addCrate(scene, 8, .7, -8, .9, .1);
  addTire(scene, 5, .16, 5);
  createVehicle(24, -18, -.35, 'truck', '#5d5a4b');
  createVehicle(-25, 20, .8, 'car', '#4b4f43');
  addStreetLamp(-8, 14, Math.PI);
}

function buildTown() {
  createHouse({ x: 80, z: 35, w: 10, d: 9, h: 3.3, wall: 'brick', kind: 'house', rotation: 0 });
  createHouse({ x: 105, z: 33, w: 9, d: 9, h: 3.1, wall: 'wood', kind: 'house', rotation: 0, roofRise: 2.1 });
  createHouse({ x: 132, z: 34, w: 10, d: 9, h: 3.5, wall: 'brick', kind: 'house', rotation: 0 });
  createHouse({
    x: 180, z: 35, w: 16, d: 11, h: 3.8, wall: 'concrete', flatRoof: true, kind: 'store',
    doorWidth: 2.0, interior: true, awning: true, rotation: 0,
    sign: { title: 'NOVO SELO', subtitle: 'GROCERY', width: 5.4, height: 1.5, fg: '#e9e6d6', bg: '#323b36', accent: '#c7a23c' },
  });
  createHouse({
    x: 214, z: 35, w: 12, d: 10, h: 3.5, wall: 'concrete', flatRoof: true, kind: 'clinic',
    doorWidth: 1.7, rotation: 0,
    sign: { title: 'CLINIC', subtitle: 'MEDICAL AID', width: 3.8, height: 1.1, fg: '#f0eee2', bg: '#43534c', accent: '#9fd5b0' },
  });
  createHouse({ x: 250, z: 33, w: 10, d: 9, h: 3.2, wall: 'wood', kind: 'house', rotation: 0 });

  createHouse({ x: 85, z: 92, w: 10, d: 9, h: 3.3, wall: 'brick', kind: 'house', rotation: Math.PI });
  createHouse({ x: 115, z: 93, w: 9, d: 9, h: 3.2, wall: 'wood', kind: 'house', rotation: Math.PI });
  createHouse({
    x: 168, z: 94, w: 14, d: 10, h: 3.6, wall: 'wood', flatRoof: true, kind: 'store', rotation: Math.PI,
    sign: { title: 'BAR', subtitle: 'OPEN LATE', width: 2.6, height: .9, fg: '#f7d9a0', bg: '#3a2f28', accent: '#d59456' },
  });
  createHouse({ x: 220, z: 92, w: 10, d: 9, h: 3.3, wall: 'brick', kind: 'house', rotation: Math.PI });
  createHouse({ x: 255, z: 92, w: 10, d: 9, h: 3.1, wall: 'wood', kind: 'house', rotation: Math.PI });
  createHouse({
    x: 205, z: 112, w: 14, d: 22, h: 6.2, wall: 'brick', roofRise: 4.4, kind: 'church', rotation: Math.PI,
    tower: true, doorWidth: 2.2, doors: ['front', 'back'],
  });

  // Street furniture + businesses
  for (const x of [60, 100, 140, 180, 220, 260, 300]) {
    addStreetLamp(x, 49, -Math.PI / 2);
    addStreetLamp(x + 10, 71, Math.PI / 2);
  }
  addBench(scene, 70, 68, Math.PI);
  addBench(scene, 120, 52, 0);
  addBench(scene, 190, 68, Math.PI);
  addBench(scene, 240, 52, 0);
  addCrate(scene, 174, .5, 44, 1.0, .2);
  addCrate(scene, 175.3, .5, 45, .9, -.3);
  addBarrel(scene, 187, .55, 43, '#5b5444');
  addBarrel(scene, 188.2, .55, 44, '#6a4c3b');
  createVehicle(96, 55, Math.PI / 2, 'car', '#59625e');
  createVehicle(230, 65, -Math.PI / 2, 'car', '#665b4e');
  createVehicle(285, 57, Math.PI / 2, 'truck', '#4f5b53');
  addBarrier(62, 60, Math.PI / 2);
  addBarrier(280, 60, Math.PI / 2);

  const townSign = makeSign('NOVO SELO', 'POP. 214 / NO SERVICES', 5.2, 1.5, '#e9e6d6', '#2a3430', '#c7a23c');
  townSign.position.set(45, 3.0, 51);
  scene.add(townSign);
  addCylinder(scene, .06, .08, 2.5, 8, MATS.woodDark, 42.6, 1.25, 51);
  addCylinder(scene, .06, .08, 2.5, 8, MATS.woodDark, 47.4, 1.25, 51);

  // Small market stalls near the main street
  for (const x of [138, 146]) {
    const stall = new THREE.Group();
    addBox(stall, 3.0, .1, 2.0, MATS.woodDark, 0, .9, 0);
    for (const ox of [-1.3, 1.3]) for (const oz of [-.8, .8]) addBox(stall, .1, .9, .1, MATS.woodDark, ox, .45, oz);
    addBox(stall, 3.4, .08, 2.5, MATS.canvasLight, 0, 2.1, 0);
    stall.position.set(x, 0, 52);
    stall.rotation.y = .06;
    scene.add(stall);
  }
}

function buildMilitary() {
  // Perimeter fence with a single gate facing the access road.
  addFenceLine(-335, -275, -185, -275);
  addFenceLine(-335, -185, -268, -185);
  addFenceLine(-252, -185, -185, -185);
  addFenceLine(-335, -275, -335, -185);
  addFenceLine(-185, -275, -185, -185);

  createRidgeTent(-310, -260, 0, { color: '#666b4d' });
  createRidgeTent(-282, -262, 0, { color: '#6d7054' });
  createRidgeTent(-250, -260, 0, { color: '#656a4c' });
  createRidgeTent(-218, -260, 0, { color: '#71745a' });
  createRidgeTent(-320, -218, Math.PI / 2, { color: '#6b7052' });
  createRidgeTent(-195, -250, Math.PI / 2, { color: '#62684a' });

  createHouse({
    x: -260, z: -204, w: 13, d: 8, h: 3.1, wall: 'concrete', flatRoof: true,
    kind: 'bunker', doors: ['front', 'back'], roofRise: 0,
  });

  createWatchtower(-330, -270);
  createWatchtower(-190, -270);
  createWatchtower(-330, -190);
  createWatchtower(-190, -190);

  createSandbagWall(-243, -182, Math.PI / 2, 7);
  createSandbagWall(-277, -182, Math.PI / 2, 7);
  createSandbagWall(-260, -226, 0, 9);
  createSandbagWall(-300, -204, 0, 8);

  // Ammo dump and vehicle pool.
  createContainer(-324, -208, Math.PI / 2, 0, '#4d5a45', 10);
  createContainer(-312, -208, Math.PI / 2, 0, '#5c5140', 10);
  addCrate(scene, -240, .5, -205, 1.1, .2);
  addCrate(scene, -238.5, .5, -206.8, .9, -.3);
  addCrate(scene, -239, 1.5, -205.8, .8, .5);
  addBarrel(scene, -230, .55, -204, '#5a5d47');
  addBarrel(scene, -231.3, .55, -205.2, '#635043');
  addPallet(scene, -222, .06, -202, .2);
  addTire(scene, -234, .16, -210);
  createVehicle(-224, -192, Math.PI / 2, 'truck', '#4d5548');
  createVehicle(-212, -192, Math.PI / 2, 'truck', '#5b5a4c');
  createVehicle(-300, -192, -.2, 'car', '#454d44');

  const sign = makeSign('MILITARY CAMP', 'RESTRICTED AREA / KOS', 5.4, 1.4, '#e8e3d2', '#333a35', '#a63b30');
  sign.position.set(-260, 3.0, -183);
  scene.add(sign);
  addCylinder(scene, .07, .09, 2.6, 8, MATS.metalDark, -264, 1.3, -182.4);
  addCylinder(scene, .07, .09, 2.6, 8, MATS.metalDark, -256, 1.3, -182.4);
  addSmokeColumn(-260, 1.4, -206, 5, .55, '#4b4f4a');
}

function buildCheckpoint() {
  createSandbagWall(-13, -152, Math.PI / 2, 8);
  createSandbagWall(13, -152, Math.PI / 2, 8);
  createSandbagWall(-9, -178, 0, 6);
  createWatchtower(-17, -172);
  addBarrier(-2.6, -178, .25);
  addBarrier(3.2, -176, -.15);
  addBarrier(-2.5, -124, Math.PI - .18);

  createHouse({
    x: 20, z: -168, w: 5.2, d: 4.4, h: 2.7, wall: 'concrete', flatRoof: true,
    kind: 'hut', doors: ['front'], doorWidth: 1.2, roofRise: 0, interior: false,
  });
  createRidgeTent(-22, -138, Math.PI / 2, { width: 3.6, depth: 3.4, height: 2.1, color: '#6d7356' });

  addCrate(scene, 18, .5, -164, .9, .3);
  addBarrel(scene, 23, .55, -163, '#5d5a45');
  addTire(scene, -14, .16, -165);
  addStreetLamp(-8, -184, Math.PI);
  addStreetLamp(8, -122, 0);
  createVehicle(18, -146, Math.PI / 2, 'car', '#59605a');
  createVehicle(-19, -128, -.4, 'truck', '#535a4c');

  const sign = makeSign('CHECKPOINT', 'STOP / IDENTIFICATION REQUIRED', 4.4, 1.2, '#efeadd', '#303833', '#c7a23c');
  sign.position.set(0, 2.7, -116);
  scene.add(sign);
  addCylinder(scene, .06, .08, 2.3, 8, MATS.metalDark, -1.9, 1.15, -115.6);
  addCylinder(scene, .06, .08, 2.3, 8, MATS.metalDark, 1.9, 1.15, -115.6);
  addBarrier(-20, -148, 0);
  addBarrier(20, -148, 0);
}

function buildIndustrial() {
  createWarehouse(-270, 195, 0);
  createWarehouse(-200, 252, Math.PI);

  // Shipping containers, some stacked, around the yard.
  createContainer(-318, 196, Math.PI / 2, 0, '#7a4a3a', 12);
  createContainer(-318, 196, Math.PI / 2, 2.62, '#3f5a60', 12);
  createContainer(-306, 205, .12, 0, '#5b5f43', 12);
  createContainer(-274, 178, -.06, 0, '#6a5a45', 10);
  createContainer(-232, 184, .08, 0, '#4a5a63', 12);
  createContainer(-186, 194, Math.PI / 2, 0, '#75604a', 10);
  createContainer(-182, 262, 1.55, 0, '#5b4c3f', 12);
  createContainer(-196, 276, .1, 0, '#46585a', 10);
  createContainer(-230, 286, .04, 0, '#6c5a3f', 12);

  // Fuel farm
  for (const [x, z] of [[-338, 284], [-325, 289], [-338, 268]]) {
    const tank = new THREE.Group();
    const body = addCylinder(tank, 3.2, 3.4, 7.5, 20, MATS.rust, 0, 3.75, 0);
    body.castShadow = true;
    addCylinder(tank, 3.24, 3.24, .16, 20, MATS.metalDark, 0, 1.2, 0);
    addCylinder(tank, 3.24, 3.24, .16, 20, MATS.metalDark, 0, 6.2, 0);
    addBox(tank, .2, 7.5, .2, MATS.metalDark, 2.3, 3.75, 0);
    for (let i = 0; i < 5; i += 1) addBox(tank, .5, .05, .08, MATS.metalDark, -2.35, 1.0 + i * 1.1, 1.0);
    tank.position.set(x, 0, z);
    tank.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    scene.add(tank);
    addCollider(x, z, 6.8, 6.8, 0, 0, 7.6);
    registerBuilding(x, z, 6.8, 6.8, 0, 'tank');
  }
  addFenceLine(-348, 258, -348, 300);
  addFenceLine(-348, 300, -310, 300);

  // Scrap piles and machinery
  const scrap = new THREE.Group();
  for (let i = 0; i < 18; i += 1) {
    const piece = addBox(scrap, randomRange(.6, 2.4), randomRange(.2, .7), randomRange(.6, 2.2), i % 3 ? MATS.rust : MATS.metalDark,
      randomRange(-4, 4), randomRange(.2, 2.4), randomRange(-3, 3));
    piece.rotation.set(randomRange(-.4, .4), randomRange(0, Math.PI), randomRange(-.4, .4));
  }
  scrap.position.set(-188, 0, 220);
  scene.add(scrap);
  addCollider(-188, 220, 9, 7, 0, 0, 2.6);

  createVehicle(-250, 278, .4, 'truck', '#4d564f');
  createVehicle(-226, 240, Math.PI / 2, 'truck', '#5a5344');
  createVehicle(-316, 250, -.3, 'car', '#4c5150');
  addCrate(scene, -292, .5, 198, 1.1, .2);
  addCrate(scene, -290.5, .5, 199.5, .9, -.3);
  addCrate(scene, -292, 1.5, 198.2, .8, .5);
  addBarrel(scene, -288, .55, 202, '#5a5d47');
  addBarrel(scene, -289.3, .55, 203.2, '#635043');
  addPallet(scene, -260, .06, 288, .2);
  addTire(scene, -246, .16, 282);
  addSmokeColumn(-222, 7.4, 252, 9, .9, '#4a4c48');

  const sign = makeSign('ZAVOD WORKS', 'HEAVY INDUSTRY / NO ENTRY', 5.6, 1.5, '#e9e4d5', '#2d3434', '#b8743a');
  sign.position.set(-244, 3.4, 208);
  scene.add(sign);
  addCylinder(scene, .07, .1, 2.8, 8, MATS.metalDark, -248, 1.4, 207.4);
  addCylinder(scene, .07, .1, 2.8, 8, MATS.metalDark, -240, 1.4, 207.4);
}

function buildFarm() {
  createHouse({
    x: 232, z: 236, w: 18, d: 24, h: 5.2, wall: 'wood', kind: 'barn',
    roofRise: 4.6, doorWidth: 4.4, doors: ['front', 'back'], rotation: 0,
  });
  createHouse({
    x: 292, z: 198, w: 10, d: 9, h: 3.2, wall: 'wood', kind: 'house',
    roofRise: 2.2, rotation: 0,
  });

  // Silo
  const silo = new THREE.Group();
  addCylinder(silo, 3.1, 3.3, 13, 20, MATS.concrete, 0, 6.5, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.15, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MATS.metal);
  dome.position.y = 13;
  dome.castShadow = true;
  silo.add(dome);
  for (let y = 1.8; y < 13; y += 1.9) addCylinder(silo, 3.18, 3.18, .14, 20, MATS.metalDark, 0, y, 0);
  addBox(silo, .1, 10, .1, MATS.metalDark, 0, 9.5, 3.15);
  silo.position.set(315, 0, 235);
  scene.add(silo);
  addCollider(315, 235, 6.6, 6.6, 0, 0, 14);
  registerBuilding(315, 235, 6.6, 6.6, 0, 'silo');

  // Crop rows
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = 240 + col * 11;
      const z = 258 + row * 4.4;
      const crop = addBox(scene, 8.5, .55, .8, row % 2 ? MATS.yellow : MATS.green, x, .3, z);
      crop.rotation.y = .04;
    }
  }
  addFenceLine(228, 256, 254, 256, 1.2, MATS.woodDark);
  addFenceLine(282, 256, 328, 256, 1.2, MATS.woodDark);
  addFenceLine(228, 256, 228, 296, 1.2, MATS.woodDark);
  addFenceLine(328, 256, 328, 296, 1.2, MATS.woodDark);

  createVehicle(256, 276, .3, 'tractor', '#8a6a34');
  createVehicle(276, 202, Math.PI / 2, 'truck', '#56604d');
  for (const [x, z] of [[244, 218], [247, 220], [313, 262], [310, 264]]) {
    const bale = addCylinder(scene, .75, .75, 1.5, 14, MATS.yellow, x, .75, z);
    bale.rotation.z = Math.PI / 2;
  }
  addCrate(scene, 286, .5, 214, 1.0, .3);
  addBarrel(scene, 302, .55, 212, '#5b6048');
  addWell(278, 244);

  const sign = makeSign('ZELENO FARM', 'GRAIN / LIVESTOCK', 4.6, 1.2, '#e9e4d5', '#3a3d33', '#c7a23c');
  sign.position.set(260, 2.6, 248);
  scene.add(sign);
  addCylinder(scene, .06, .08, 2.2, 8, MATS.woodDark, 258, 1.1, 247.6);
  addCylinder(scene, .06, .08, 2.2, 8, MATS.woodDark, 262, 1.1, 247.6);
}

function buildVillage() {
  createHouse({
    x: 320, z: -270, w: 9, d: 9, h: 3.2, wall: 'wood', kind: 'house',
    roofRise: 2.3, rotation: 0, interior: false,
  });
  createHouse({
    x: 350, z: -282, w: 9.5, d: 8.5, h: 3.1, wall: 'brick', kind: 'house',
    roofRise: 2.2, rotation: 0, interior: false,
  });
  createHouse({
    x: 372, z: -252, w: 8.5, d: 8, h: 3.0, wall: 'wood', kind: 'house',
    roofRise: 2.1, rotation: 0, interior: false,
  });
  createHouse({
    x: 334, z: -234, w: 9, d: 8, h: 3.0, wall: 'brick', kind: 'house',
    roofRise: 2.0, rotation: 0, interior: false,
  });
  addWell(345, -255);

  // Garden plots and village clutter.
  for (const [x, z, rot] of [[310, -284, .1], [370, -270, 0], [330, -258, 1.4]]) {
    const plot = new THREE.Group();
    addBox(plot, 4.5, .16, 2.4, MATS.dirt, 0, .08, 0);
    for (let i = 0; i < 4; i += 1) addBox(plot, 3.9, .18, .28, MATS.green, 0, .2, -1 + i * .65);
    plot.position.set(x, 0, z);
    plot.rotation.y = rot;
    scene.add(plot);
  }
  addCrate(scene, 314, .5, -258, .9, .3);
  addBarrel(scene, 356, .55, -272, '#5c5845');
  addBarrel(scene, 357.2, .55, -273.2, '#6a4b3a');
  addTire(scene, 342, .16, -276);
  addBench(scene, 348, -246, Math.PI);
  addStreetLamp(338, -264, 0);
  createVehicle(362, -258, Math.PI / 2, 'car', '#56604f');
  createVehicle(324, -246, -.6, 'truck', '#5b5548');
  addBarrier(350, -230, 0);

  const sign = makeSign('KAMENKA', 'VILLAGE / POP. 46', 4.2, 1.1, '#e9e4d5', '#333a35', '#c7a23c');
  sign.position.set(345, 2.5, -226);
  scene.add(sign);
  addCylinder(scene, .06, .08, 2.1, 8, MATS.woodDark, 343.4, 1.05, -225.6);
  addCylinder(scene, .06, .08, 2.1, 8, MATS.woodDark, 346.6, 1.05, -225.6);
}

function createHelicopterWreck(x, z, rotation = 0) {
  const group = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 4.2, 6, 10), MATS.rust);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.position.set(0, 1.45, 0);
  fuselage.castShadow = true;
  group.add(fuselage);
  const cabin = addBox(group, 2.0, 1.7, 2.6, MATS.metalDark, 1.7, 1.7, 0);
  cabin.rotation.z = -.12;
  addBox(group, 1.5, .9, 1.8, MATS.glass, 2.35, 2.1, 0).rotation.z = -.12;
  addBox(group, .3, .3, 8.5, MATS.metal, -3.7, 1.45, 0);
  const tailRotor = addBox(group, .12, 2.2, .25, MATS.metalDark, -6.6, 1.8, 0);
  tailRotor.rotation.z = .3;
  for (let i = 0; i < 5; i += 1) {
    const blade = addBox(group, .28, .12, 4.8, MATS.metalDark, 0, 2.8 + i * .01, 0);
    blade.rotation.y = i * 1.2;
  }
  addCylinder(group, .1, .14, 2.2, 8, MATS.metalDark, 0, 3.3, 0);
  addBox(group, 1.8, .45, 1.9, MATS.metalDark, -.4, 2.9, .9).rotation.x = .2;
  for (const [ox, oz] of [[-1.6, 1.5], [1.4, 1.4], [-1.5, -1.5], [1.3, -1.5]]) {
    addCylinder(group, .07, .07, 1.3, 6, MATS.metalDark, ox, .25, oz);
    addBox(group, .9, .1, .3, MATS.metalDark, ox, .08, oz).rotation.y = .3;
  }
  group.position.set(x, 0, z);
  group.rotation.set(0, rotation, .06);
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  addCollider(x, z, 11, 4.5, rotation, 0, 3.2);
  registerBuilding(x, z, 11, 4.5, rotation, 'wreck');
  return group;
}

function buildCrashSite() {
  createHelicopterWreck(-158, 342, .72);
  addSmokeColumn(-158, 2.2, 342, 12, 1.15, '#3f4441');

  // Scattered debris trail.
  for (let i = 0; i < 22; i += 1) {
    const angle = rng() * Math.PI * 2;
    const dist = 3 + rng() * 13;
    const piece = addBox(scene,
      randomRange(.3, 1.4), randomRange(.08, .35), randomRange(.3, 1.2),
      i % 4 ? MATS.rust : MATS.metalDark,
      -152 + Math.cos(angle) * dist, randomRange(.06, .5), 347 + Math.sin(angle) * dist);
    piece.rotation.set(randomRange(-.4, .4), rng() * Math.PI, randomRange(-.4, .4));
  }
  for (let i = 0; i < 8; i += 1) {
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(1.6 + rng() * 1.4, 2.1 + rng() * 1.5, .16, 14), MATS.dirt);
    crater.position.set(-142 + randomRange(-14, 14), .02, 352 + randomRange(-12, 12));
    crater.receiveShadow = true;
    scene.add(crater);
  }
  addCrate(scene, -136, .5, 352, .9, .4);
  addCrate(scene, -137.3, .5, 353.2, .8, -.2);
  addBarrel(scene, -148, .55, 366, '#5a4c3d');
  addPallet(scene, -130, .06, 344, .3);
  addTire(scene, -164, .16, 356);
  createVehicle(-125, 348, 1.2, 'truck', '#4f5548');
  const sign = makeSign('CRASH SITE', 'UNKNOWN AIRCRAFT / HAZARD', 4.2, 1.2, '#eadfcf', '#352f2a', '#b8743a');
  sign.position.set(-140, 2.6, 332);
  scene.add(sign);
  addCylinder(scene, .06, .08, 2.2, 8, MATS.metalDark, -142, 1.1, 331.6);
  addCylinder(scene, .06, .08, 2.2, 8, MATS.metalDark, -138, 1.1, 331.6);
}

function buildCabin() {
  createHouse({
    x: 408, z: 138, w: 8.5, d: 8, h: 3.0, wall: 'wood', kind: 'house',
    roofRise: 2.4, rotation: 0, interior: true,
  });
  const shed = new THREE.Group();
  addBox(shed, 3.2, 2.2, 2.6, MATS.woodDark, 0, 1.1, 0);
  addBox(shed, 3.8, .16, 3.2, MATS.roof, 0, 2.3, 0);
  shed.position.set(418, 0, 130);
  shed.rotation.y = -.3;
  scene.add(shed);
  addCollider(418, 130, 3.8, 3.2, -.3, 0, 2.4);

  // Firewood, porch and trail markers.
  for (let i = 0; i < 14; i += 1) {
    const log = addCylinder(scene, .14, .16, 1.3, 7, MATS.woodDark, 404.4 + (i % 2) * .32, .2 + Math.floor(i / 2) * .26, 133.2);
    log.rotation.z = Math.PI / 2;
  }
  addBox(scene, 5.0, .14, 1.7, MATS.woodDark, 408, .1, 133);
  addBench(scene, 401, 140, Math.PI / 2);
  addCrate(scene, 414, .5, 143, .8, .2);
  createVehicle(396, 144, .5, 'truck', '#4e5a4b');
  addSmokeColumn(408, 3.4, 138, 4, .45, '#4d514c');
  addStreetLamp(397, 133, 0);
}

// ---------------------------------------------------------------------------
// Nature
// ---------------------------------------------------------------------------
function natureClear(x, z, clearance = 4) {
  if (nearRoad(x, z, clearance)) return false;
  if (nearBuilding(x, z, clearance)) return false;
  for (const poi of POIS) {
    if (Math.hypot(x - poi.x, z - poi.z) < poi.radius * .82) return false;
  }
  for (const zone of LOOT_ZONES) {
    for (const [sx, sz] of zone.spots) {
      if (Math.hypot(x - sx, z - sz) < 6) return false;
    }
  }
  for (const track of TRACKS) {
    if (Math.abs(z - track.z) < 8) return false;
  }
  for (const prop of map.props) {
    if (Math.abs(x - prop.x) < Math.max(prop.w, prop.d) / 2 + clearance && Math.abs(z - prop.z) < Math.max(prop.w, prop.d) / 2 + clearance) return false;
  }
  return true;
}

function pickSpots(count, minDistance, clearance = 4) {
  const spots = [];
  let attempts = 0;
  while (spots.length < count && attempts < count * 40) {
    attempts += 1;
    const x = randomRange(-WORLD_HALF + 14, WORLD_HALF - 14);
    const z = randomRange(-WORLD_HALF + 14, WORLD_HALF - 14);
    if (!natureClear(x, z, clearance)) continue;
    if (spots.some((p) => Math.hypot(p.x - x, p.z - z) < minDistance)) continue;
    spots.push({ x, z, scale: randomRange(.72, 1.32), rotation: rng() * Math.PI * 2 });
  }
  return spots;
}

function buildNature() {
  const pines = pickSpots(560, 5.2, 5);
  const broadleaf = pickSpots(230, 6.0, 5);
  const rocks = pickSpots(150, 4.0, 3);
  const bushes = pickSpots(280, 2.6, 2);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const trunkMat = new THREE.MeshStandardMaterial({ color: '#57462f', roughness: 1, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .96, flatShading: true });

  // Pines: trunk, lower canopy, upper canopy.
  const pineTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .34, 2.8, 5), trunkMat, pines.length);
  const pineLower = new THREE.InstancedMesh(new THREE.ConeGeometry(2.05, 5.6, 7), leafMat, pines.length);
  const pineUpper = new THREE.InstancedMesh(new THREE.ConeGeometry(1.35, 4.2, 7), leafMat, pines.length);
  pines.forEach((p, i) => {
    const s = p.scale;
    dummy.position.set(p.x, 1.35 * s, p.z);
    dummy.rotation.set(0, p.rotation, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    pineTrunks.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 3.4 * s;
    dummy.updateMatrix();
    pineLower.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 5.9 * s;
    dummy.updateMatrix();
    pineUpper.setMatrixAt(i, dummy.matrix);
    color.setHSL(.24 + rng() * .045, .28 + rng() * .16, .17 + rng() * .08);
    pineLower.setColorAt(i, color);
    color.offsetHSL(0, 0, .03);
    pineUpper.setColorAt(i, color);
  });
  for (const mesh of [pineTrunks, pineLower, pineUpper]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Broadleaf trees: trunk plus two irregular canopy blobs.
  const leafTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.2, .42, 3.4, 5), trunkMat, broadleaf.length);
  const leafCrown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.35, 1), leafMat, broadleaf.length);
  const leafCrown2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.55, 1), leafMat, broadleaf.length);
  broadleaf.forEach((p, i) => {
    const s = p.scale;
    dummy.position.set(p.x, 1.8 * s, p.z);
    dummy.rotation.set(0, p.rotation, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    leafTrunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x + Math.cos(p.rotation) * .5, 4.4 * s, p.z + Math.sin(p.rotation) * .5);
    dummy.scale.set(s * 1.1, s * .85, s * 1.1);
    dummy.updateMatrix();
    leafCrown.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p.x - Math.cos(p.rotation) * 1.1, 5.1 * s, p.z - Math.sin(p.rotation) * 1.1);
    dummy.scale.set(s * .8, s * .7, s * .8);
    dummy.updateMatrix();
    leafCrown2.setMatrixAt(i, dummy.matrix);
    color.setHSL(.21 + rng() * .06, .32 + rng() * .14, .22 + rng() * .09);
    leafCrown.setColorAt(i, color);
    color.offsetHSL(.01, 0, .03);
    leafCrown2.setColorAt(i, color);
  });
  for (const mesh of [leafTrunks, leafCrown, leafCrown2]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Rocks
  const rockMat = new THREE.MeshStandardMaterial({ color: '#6d6f66', roughness: .98, flatShading: true });
  const rockMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMat, rocks.length);
  rocks.forEach((p, i) => {
    const s = p.scale * randomRange(.7, 1.7);
    dummy.position.set(p.x, s * .38, p.z);
    dummy.rotation.set(rng() * .5, p.rotation, rng() * .5);
    dummy.scale.set(s, s * randomRange(.5, .9), s);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(i, dummy.matrix);
    color.setHSL(.14, .04 + rng() * .05, .32 + rng() * .14);
    rockMesh.setColorAt(i, color);
    if (s > 1.1) {
      addCollider(p.x, p.z, s * 1.5, s * 1.5, 0, 0, s);
      map.props.push({ x: p.x, z: p.z, w: s * 1.6, d: s * 1.6, rotation: 0, kind: 'rock' });
    }
  });
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  scene.add(rockMesh);

  // Bushes
  const bushMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
  const bushMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.85, 0), bushMat, bushes.length);
  bushes.forEach((p, i) => {
    const s = p.scale * randomRange(.7, 1.2);
    dummy.position.set(p.x, s * .45, p.z);
    dummy.rotation.set(0, p.rotation, 0);
    dummy.scale.set(s * 1.25, s * .8, s * 1.15);
    dummy.updateMatrix();
    bushMesh.setMatrixAt(i, dummy.matrix);
    color.setHSL(.22 + rng() * .06, .26 + rng() * .12, .2 + rng() * .07);
    bushMesh.setColorAt(i, color);
  });
  bushMesh.castShadow = true;
  bushMesh.receiveShadow = true;
  scene.add(bushMesh);

  // Colliders and minimap entries for the larger trees.
  for (const p of pines) {
    addCollider(p.x, p.z, .9 * p.scale, .9 * p.scale, 0, 0, 5 * p.scale);
    map.props.push({ x: p.x, z: p.z, w: 1.2 * p.scale, d: 1.2 * p.scale, rotation: 0, kind: 'tree' });
  }
  for (const p of broadleaf) {
    addCollider(p.x, p.z, 1.1 * p.scale, 1.1 * p.scale, 0, 0, 4.5 * p.scale);
    map.props.push({ x: p.x, z: p.z, w: 1.6 * p.scale, d: 1.6 * p.scale, rotation: 0, kind: 'tree' });
  }
}

function buildHills() {
  const mat = new THREE.MeshStandardMaterial({ color: '#46523b', roughness: 1, flatShading: true });
  const positions = [
    [-460, -430, 70, 26], [-390, -465, 90, 30], [-160, -470, 80, 24], [120, -468, 110, 32],
    [420, -440, 85, 27], [475, -210, 95, 24], [480, 140, 90, 28], [450, 390, 100, 30],
    [140, 475, 95, 26], [-160, 470, 85, 23], [-430, 450, 92, 29], [-478, 160, 88, 25],
  ];
  for (const [x, z, radius, height] of positions) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    hill.position.set(x, -height * .35, z);
    hill.scale.set(1, height / radius, .8);
    hill.receiveShadow = true;
    scene.add(hill);
  }
}

// ---------------------------------------------------------------------------
// World lifecycle
// ---------------------------------------------------------------------------
export function createWorld(sceneRef) {
  scene = sceneRef;
  colliders = [];
  cameraBoxes = [];
  surfaces = [];
  animated = [];
  smokePuffs = [];
  smokeTexture = null;
  resourceMeshes = new Map();
  baseRecords = new Map();
  pondWater = null;
  rng = mulberry32(0x5eed1a7e);
  MATS = makeMaterials();
  map = {
    buildings: [],
    props: [],
    pois: POIS,
    lootZones: LOOT_ZONES,
    roads: ROADS,
    tracks: TRACKS,
    half: WORLD_HALF,
  };

  buildSky();
  buildGround();
  for (const road of ROADS) buildRoad(road);
  buildTracks();
  buildTrainStation();
  buildCamp();
  buildTown();
  buildTownBaseMarkers();
  buildMilitary();
  buildCheckpoint();
  buildIndustrial();
  buildFarm();
  buildVillage();
  buildCrashSite();
  buildCabin();
  buildBaseHouses();
  buildOutposts();
  buildResourceNodes();
  buildPond();
  buildNature();
  buildHills();
  addPowerLines();

  return {
    colliders,
    cameraBoxes,
    surfaces,
    map,
    baseHouses: [...baseRecords.values()].map((record) => ({
      id: record.id,
      name: record.name,
      short: record.short,
      x: record.x,
      z: record.z,
      rotation: record.rotation,
      w: record.w,
      d: record.d,
      claimRadius: record.claimRadius,
      chestWorld: { ...record.chestWorld },
      claimed: record.claimed,
      ownerName: record.ownerName,
    })),
    resourceNodes: RESOURCE_NODES.map((node) => ({ ...node, type: node.kind })),
    setBaseClaim,
    setResourceState,
    update(delta, time) {
      updateSmoke(delta);
      for (const fn of animated) fn(time);
    },
  };
}









