import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.js';

// ---------------------------------------------------------------------------
// Materials + small helpers
// ---------------------------------------------------------------------------
const material = (color, roughness = .9, metalness = .04) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const skin = material('#a9775c', .92, .01);
const glove = material('#3f4439', .95, .01);
const boot = material('#171c1e', .82, .16);
const pants = material('#4b4f3b', .96, .01);
const jacket = material('#3d4737', .95, .01);
const jacketDark = material('#2d352b', .96, .01);
const vest = material('#252c28', .92, .04);
const strap = material('#1c211e', .9, .05);
const metal = material('#5a6467', .36, .72);
const darkMetal = material('#262c2d', .42, .66);
const wood = material('#6a4c32', .86, .01);
const canvas = material('#8b8060', .96, .01);
const brass = material('#b58a4a', .35, .78);

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function capsule(radius, length, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Name plates + team markers
// ---------------------------------------------------------------------------
function makeNameTexture() {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 512;
  canvasEl.height = 96;
  const texture = new THREE.CanvasTexture(canvasEl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return { canvasEl, texture };
}

function makeLabel(text, color) {
  const { canvasEl, texture } = makeNameTexture();
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthWrite: false, depthTest: true,
  }));
  sprite.userData.canvas = canvasEl;
  sprite.userData.color = color;
  sprite.scale.set(3.4, .64, 1);
  sprite.position.y = 2.18;
  setAvatarLabelText(sprite, text, color);
  return sprite;
}

export function setAvatarLabelText(sprite, text, color) {
  if (!sprite?.userData?.canvas) return;
  const canvasEl = sprite.userData.canvas;
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.font = '600 28px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(5,9,11,.85)';
  ctx.strokeText(text, canvasEl.width / 2, 48);
  ctx.fillStyle = color;
  ctx.fillText(text, canvasEl.width / 2, 48);
  sprite.material.map.needsUpdate = true;
  sprite.userData.color = color;
}

function makeMarker() {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 64;
  canvasEl.height = 64;
  const ctx = canvasEl.getContext('2d');
  ctx.translate(32, 32);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-13, -13, 26, 26);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(6,10,12,.9)';
  ctx.strokeRect(-13, -13, 26, 26);
  const texture = new THREE.CanvasTexture(canvasEl);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false,
  }));
  sprite.scale.set(.42, .42, 1);
  sprite.position.y = 2.48;
  sprite.renderOrder = 999;
  sprite.visible = false;
  return sprite;
}

// ---------------------------------------------------------------------------
// Survivor model
// ---------------------------------------------------------------------------
export function createSurvivor({ name = 'SURVIVOR', accent = '#d5f55a', isLocal = false } = {}) {
  const root = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.5, 28),
    new THREE.MeshBasicMaterial({ color: '#0c1214', transparent: true, opacity: .34, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .015;
  root.add(shadow);

  const rig = new THREE.Group();
  root.add(rig);

  // Hips / torso -------------------------------------------------------------
  const hips = box(.38, .2, .24, pants, 0, .97, 0);
  const torso = capsule(.225, .4, jacket, 0, 1.26, 0);
  torso.scale.set(1, 1, .74);
  const chest = box(.34, .34, .2, jacketDark, 0, 1.38, .03);
  chest.rotation.x = -.04;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.14, .035, 8, 20), jacketDark);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.55;

  const belt = box(.39, .075, .25, strap, 0, 1.02, 0);
  const buckle = box(.07, .055, .03, metal, 0, 1.02, .13);
  rig.add(hips, torso, chest, collar, belt, buckle);

  // Armor / chest rig --------------------------------------------------------
  const armor = box(.38, .4, .1, vest, 0, 1.3, .16);
  const rigFront = box(.3, .17, .06, strap, 0, 1.2, .225);
  const pouchA = box(.09, .12, .08, jacketDark, -.1, 1.2, .255);
  const pouchB = box(.09, .12, .08, jacketDark, .02, 1.2, .255);
  const pouchC = box(.07, .09, .07, jacketDark, .13, 1.2, .25);
  const shoulderA = box(.13, .08, .18, vest, -.25, 1.48, 0);
  const shoulderB = box(.13, .08, .18, vest, .25, 1.48, 0);
  rig.add(armor, rigFront, pouchA, pouchB, pouchC, shoulderA, shoulderB);

  const radioPouch = box(.08, .13, .06, jacketDark, .19, 1.35, .2);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.008, .012, .3, 6), darkMetal);
  antenna.position.set(.2, 1.55, .18);
  antenna.rotation.z = -.12;
  rig.add(radioPouch, antenna);

  // Patch / armband in squad color ------------------------------------------
  const patch = box(.1, .1, .025, new THREE.MeshStandardMaterial({ color: accent, roughness: .75 }), -.24, 1.4, .09);
  patch.rotation.z = .2;
  rig.add(patch);

  // Legs ---------------------------------------------------------------------
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-.14, .94, 0);
  rightLeg.position.set(.14, .94, 0);
  const leftLimb = capsule(.105, .6, pants, 0, -.4, 0);
  const rightLimb = capsule(.105, .6, pants, 0, -.4, 0);
  leftLimb.scale.z = .9;
  rightLimb.scale.z = .9;
  const leftKnee = box(.17, .12, .17, jacketDark, 0, -.39, .08);
  const rightKnee = box(.17, .12, .17, jacketDark, 0, -.39, .08);
  const leftBoot = box(.18, .17, .32, boot, 0, -.875, .06);
  const rightBoot = box(.18, .17, .32, boot, 0, -.875, .06);
  leftLeg.add(leftLimb, leftKnee, leftBoot);
  rightLeg.add(rightLimb, rightKnee, rightBoot);
  rig.add(leftLeg, rightLeg);

  // Arms ---------------------------------------------------------------------
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-.29, 1.47, 0);
  rightArm.position.set(.29, 1.47, 0);
  const leftSleeve = capsule(.082, .4, jacket, 0, -.28, 0);
  const rightSleeve = capsule(.082, .4, jacket, 0, -.28, 0);
  const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), glove);
  const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(.085, 10, 8), glove);
  leftGlove.position.y = -.55;
  rightGlove.position.y = -.55;
  leftGlove.scale.set(.85, 1.1, .85);
  rightGlove.scale.set(.85, 1.1, .85);
  leftArm.rotation.z = -.08;
  rightArm.rotation.z = .08;
  leftArm.add(leftSleeve, leftGlove);
  rightArm.add(rightSleeve, rightGlove);
  rig.add(leftArm, rightArm);

  // Neck + head --------------------------------------------------------------
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.075, .09, .12, 10), skin);
  neck.position.y = 1.56;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 18, 14), skin);
  head.position.y = 1.71;
  head.scale.set(.92, 1.06, .94);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(.105, 14, 10), skin);
  jaw.position.set(0, 1.64, .04);
  jaw.scale.set(.9, .75, .85);
  const mask = new THREE.Mesh(new THREE.SphereGeometry(.112, 14, 10), material('#2a302c', .96));
  mask.position.set(0, 1.64, .07);
  mask.scale.set(.92, .7, .72);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), material('#15191a', .5));
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), material('#15191a', .5));
  leftEye.position.set(-.048, 1.73, .125);
  rightEye.position.set(.048, 1.73, .125);

  const hat = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.135, .15, .16, 16), material('#66705c', .98));
  crown.position.y = 1.85;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .035, 20), material('#596351', .98));
  brim.position.y = 1.79;
  const band = new THREE.Mesh(new THREE.TorusGeometry(.142, .018, 6, 18), strap);
  band.rotation.x = Math.PI / 2;
  band.position.y = 1.8;
  hat.add(crown, brim, band);
  rig.add(neck, head, jaw, mask, leftEye, rightEye, hat);

  // Backpack ----------------------------------------------------------------
  const pack = new THREE.Group();
  const packBody = box(.32, .44, .2, material('#5b644b', .98), 0, 0, 0);
  const packTop = box(.3, .12, .18, material('#4a5340', .98), 0, .24, .01);
  const packPocket = box(.24, .18, .07, material('#46503c', .98), 0, -.06, .13);
  const packBottle = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .16, 10), material('#71807a', .8));
  packBottle.position.set(.18, -.02, .1);
  const packStrapA = box(.045, .36, .035, strap, -.14, .03, .12);
  const packStrapB = box(.045, .36, .035, strap, .14, .03, .12);
  pack.add(packBody, packTop, packPocket, packBottle, packStrapA, packStrapB);
  pack.position.set(0, 1.32, -.2);
  pack.rotation.x = -.06;
  rig.add(pack);

  // Slung rifle --------------------------------------------------------------
  const sling = new THREE.Group();
  const slingBody = box(.08, .08, .62, darkMetal, 0, 0, 0);
  const slingStock = box(.075, .11, .24, wood, 0, -.01, .34);
  const slingBarrel = new THREE.Mesh(new THREE.CylinderGeometry(.016, .019, .62, 8), metal);
  slingBarrel.rotation.x = Math.PI / 2;
  slingBarrel.position.z = -.58;
  const slingMag = box(.06, .17, .1, wood, 0, -.12, -.06);
  slingMag.rotation.x = .25;
  sling.add(slingBody, slingStock, slingBarrel, slingMag);
  sling.position.set(.12, 1.25, -.3);
  sling.rotation.set(.08, .13, -.7);
  rig.add(sling);

  // Tags ---------------------------------------------------------------------
  const label = makeLabel(name, isLocal ? '#d5f55a' : '#f4f3ee');
  const marker = makeMarker();
  root.add(label, marker);

  root.userData = {
    parts: { rig, leftLeg, rightLeg, leftArm, rightArm, torso, chest, head, label, marker, patch, pack },
    label,
    marker,
    walkPhase: Math.random() * Math.PI * 2,
    currentSpeed: 0,
  };
  return root;
}

// ---------------------------------------------------------------------------
// Infected
// ---------------------------------------------------------------------------
const zombieSkin = material('#7c8a6b', .97, 0);
const zombieSkinDark = material('#5d684f', .98, 0);
const zombieWound = material('#5a2f2b', .9, 0);
const zombieShirt = material('#4a4c3c', .99, 0);
const zombieShirtTorn = material('#5c5f49', .98, 0);
const zombiePants = material('#3a3d35', .98, 0);
const zombieBoot = material('#23261f', .94, .03);
const zombieBone = material('#b9b39b', .9, 0);
const zombieBelt = material('#2b2c26', .95, .04);
const zombieMouth = material('#2a1b19', .9, 0);
const zombieHair = material('#2f3026', .99, 0);
const zombiePlateLight = material('#4b4d40', .94, .05);
const zombiePlateHeavy = material('#3c443d', .94, .05);
const zombieEye = new THREE.MeshBasicMaterial({ color: '#d9e88a' });
const zombieEyeHot = new THREE.MeshBasicMaterial({ color: '#ff7a4d' });

function makeZombieBar() {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 64;
  canvasEl.height = 8;
  const texture = new THREE.CanvasTexture(canvasEl);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthWrite: false, depthTest: false,
  }));
  sprite.scale.set(1.15, .145, 1);
  sprite.position.y = 2.08;
  sprite.renderOrder = 998;
  return sprite;
}

function drawZombieBar(sprite, ratio) {
  if (!sprite) return;
  const canvasEl = sprite.userData.canvas;
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, 64, 8);
  ctx.fillStyle = 'rgba(7,11,12,.82)';
  ctx.fillRect(0, 0, 64, 8);
  ctx.fillStyle = ratio > .55 ? '#a9c46a' : ratio > .25 ? '#e0a84e' : '#d95c48';
  ctx.fillRect(1, 1, 62 * Math.max(0, Math.min(1, ratio)), 6);
  sprite.material.map.needsUpdate = true;
}

export function createZombie({ tier = 1, name = 'INFECTED' } = {}) {
  const root = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.48, 20),
    new THREE.MeshBasicMaterial({ color: '#0c1214', transparent: true, opacity: .32, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .015;
  root.add(shadow);

  const rig = new THREE.Group();
  root.add(rig);

  const scale = tier >= 3 ? 1.09 : tier === 2 ? 1.04 : 1;
  const shirtMat = tier >= 3 ? material('#4c4438', .98, .02) : zombieShirt;

  // Hunched torso -----------------------------------------------------------------
  const hips = box(.34, .19, .23, zombiePants, 0, .94, 0);
  const torso = capsule(.205, .34, shirtMat, 0, 1.2, .03);
  torso.scale.set(1, 1, .76);
  torso.rotation.x = .17;
  const chest = box(.3, .3, .19, zombieShirtTorn, 0, 1.3, .08);
  chest.rotation.x = .18;

  // Torn shirt openings + exposed ribs
  const tearA = box(.1, .15, .03, zombieSkinDark, -.08, 1.27, .18);
  tearA.rotation.z = .3;
  const tearB = box(.07, .1, .03, zombieSkinDark, .1, 1.34, .18);
  tearB.rotation.z = -.4;
  const ribA = box(.13, .018, .02, zombieBone, -.02, 1.29, .2);
  const ribB = box(.11, .018, .02, zombieBone, -.01, 1.24, .2);
  const wound = box(.11, .07, .03, zombieWound, .11, 1.18, .17);

  // Armor scraps for higher tiers
  if (tier >= 2) {
    const plate = box(.3, .22, .07, tier >= 3 ? zombiePlateHeavy : zombiePlateLight, 0, 1.3, .19);
    plate.rotation.x = .12;
    rig.add(plate);
  }

  const belt = box(.35, .06, .24, zombieBelt, 0, 1.0, 0);
  rig.add(hips, torso, chest, tearA, tearB, ribA, ribB, wound, belt);

  // Legs ---------------------------------------------------------------------------
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-.13, .9, 0);
  rightLeg.position.set(.13, .9, 0);
  const leftLimb = capsule(.1, .56, zombiePants, 0, -.36, 0);
  const rightLimb = capsule(.1, .56, zombiePants, 0, -.36, 0);
  const leftBoot = box(.17, .15, .3, zombieBoot, 0, -.8, .06);
  const rightBoot = box(.17, .15, .3, zombieBoot, 0, -.8, .06);
  leftLeg.add(leftLimb, leftBoot);
  rightLeg.add(rightLimb, rightBoot);
  rig.add(leftLeg, rightLeg);

  // Arms hanging forward --------------------------------------------------------------
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-.27, 1.41, .02);
  rightArm.position.set(.27, 1.41, .02);
  const leftSleeve = capsule(.078, .3, shirtMat, 0, -.24, -.02);
  const rightSleeve = capsule(.078, .3, shirtMat, 0, -.24, -.02);
  const leftForearm = capsule(.066, .26, zombieSkin, 0, -.53, -.04);
  const rightForearm = capsule(.066, .26, zombieSkin, 0, -.53, -.04);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(.075, 9, 7), zombieSkinDark);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(.075, 9, 7), zombieSkinDark);
  leftHand.position.set(0, -.72, -.05);
  rightHand.position.set(0, -.72, -.05);
  leftHand.scale.set(.85, 1.15, .7);
  rightHand.scale.set(.85, 1.15, .7);
  leftArm.rotation.x = -.95;
  rightArm.rotation.x = -1.05;
  leftArm.rotation.z = .12;
  rightArm.rotation.z = -.1;
  leftArm.userData.restX = -.95;
  rightArm.userData.restX = -1.05;
  leftArm.userData.swingScale = .42;
  rightArm.userData.swingScale = .42;
  leftArm.add(leftSleeve, leftForearm, leftHand);
  rightArm.add(rightSleeve, rightForearm, rightHand);
  rig.add(leftArm, rightArm);

  // Neck + head ----------------------------------------------------------------------
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.07, .085, .13, 9), zombieSkinDark);
  neck.position.set(0, 1.54, .06);
  neck.rotation.x = .2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 12), zombieSkin);
  head.position.set(0, 1.68, .11);
  head.scale.set(.9, 1.02, .94);
  head.rotation.x = .16;
  const jaw = box(.13, .08, .12, zombieSkinDark, 0, 1.58, .2);
  jaw.rotation.x = .18;
  const mouth = box(.09, .035, .03, zombieMouth, 0, 1.615, .255);
  const eyeMat = tier >= 3 ? zombieEyeHot : zombieEye;
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(.016, 7, 5), eyeMat);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(.016, 7, 5), eyeMat);
  leftEye.position.set(-.046, 1.71, .235);
  rightEye.position.set(.046, 1.71, .237);
  const browA = box(.055, .018, .02, zombieWound, -.05, 1.737, .236);
  browA.rotation.z = .24;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.142, 12, 8, 0, Math.PI * 2, 0, Math.PI * .46), zombieHair);
  hair.position.set(0, 1.71, .1);
  hair.scale.set(.94, .8, .98);
  const scratch = box(.015, .12, .02, zombieWound, .1, 1.68, .2);
  scratch.rotation.z = .5;
  rig.add(neck, head, jaw, mouth, leftEye, rightEye, browA, hair, scratch);

  const healthBar = makeZombieBar();
  healthBar.userData.canvas = healthBar.material.map.image;
  drawZombieBar(healthBar, 1);
  healthBar.visible = false;
  root.add(healthBar);

  rig.scale.setScalar(scale);
  let lastDrawnRatio = 1;
  root.userData = {
    parts: { rig, leftLeg, rightLeg, leftArm, rightArm, torso, chest, head },
    tier,
    name,
    healthBar,
    walkPhase: Math.random() * Math.PI * 2,
    currentSpeed: 0,
    setHealth(ratio) {
      const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 1));
      if (Math.abs(clamped - lastDrawnRatio) > .01) {
        lastDrawnRatio = clamped;
        drawZombieBar(healthBar, clamped);
      }
      healthBar.visible = clamped < .999;
    },
  };
  return root;
}

// ---------------------------------------------------------------------------
// Weapon view models
// ---------------------------------------------------------------------------
function weaponMat(color, roughness = .4, metalness = .6) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMuzzle(model, x, y, z, kind = 'rifle') {
  const muzzle = new THREE.Mesh(
    new THREE.ConeGeometry(kind === 'pistol' ? .09 : .12, kind === 'pistol' ? .2 : .3, 10),
    new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: .95 }),
  );
  muzzle.position.set(x, y, z);
  muzzle.rotation.x = -Math.PI / 2;
  muzzle.visible = false;
  const light = new THREE.PointLight('#ffcf7a', 0, 2.4, 2);
  light.position.set(x, y, z);
  model.add(muzzle, light);
  model.userData.muzzle = muzzle;
  model.userData.muzzleLight = light;
}

function addHands(model, positions, gloveMat) {
  positions.forEach(([x, y, z, sx = .85, sy = .72, sz = 1.2]) => {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), gloveMat);
    hand.scale.set(sx, sy, sz);
    hand.position.set(x, y, z);
    hand.castShadow = true;
    model.add(hand);
  });
}

function buildAK() {
  const model = new THREE.Group();
  const steel = weaponMat('#2b3132', .34, .72);
  const woodMat = weaponMat('#5d432b', .74, .02);
  const poly = weaponMat('#1b2122', .82, .06);
  const accent = weaponMat('#4d5137', .8, .04);
  const receiver = box(.16, .15, .44, steel, 0, .01, -.18);
  const dustCover = box(.15, .07, .34, steel, 0, .11, -.22);
  const stock = box(.13, .14, .42, woodMat, 0, -.015, .24);
  const grip = box(.11, .24, .13, poly, 0, -.17, .02);
  grip.rotation.x = -.18;
  const handguard = box(.15, .13, .35, woodMat, 0, .01, -.56);
  const gasTube = box(.07, .05, .34, steel, 0, .1, -.54);
  const mag = box(.11, .27, .16, accent, 0, -.2, -.2);
  mag.rotation.x = .34;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .6, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .02, -.93);
  const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .1, 10), darkMetal);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.set(0, .02, -1.24);
  const frontSight = box(.045, .1, .07, steel, 0, .11, -1.08);
  const rearSight = box(.06, .04, .08, steel, 0, .15, -.35);
  const slingLoop = new THREE.Mesh(new THREE.TorusGeometry(.035, .01, 6, 10), darkMetal);
  slingLoop.rotation.y = Math.PI / 2;
  slingLoop.position.set(.1, -.06, -.4);
  model.add(receiver, dustCover, stock, grip, handguard, gasTube, mag, barrel, muzzleBrake, frontSight, rearSight, slingLoop);
  addHands(model, [[-.12, -.1, -.5], [.04, -.2, .02]]);
  model.userData.magazine = mag;
  addMuzzle(model, 0, .02, -1.32);
  model.position.set(.38, -.32, -.5);
  model.rotation.set(-.04, -.07, -.03);
  return model;
}

function buildM4() {
  const model = new THREE.Group();
  const steel = weaponMat('#31383a', .3, .76);
  const poly = weaponMat('#1c2325', .84, .05);
  const tan = weaponMat('#6f6954', .82, .02);
  const receiver = box(.15, .14, .42, steel, 0, .01, -.14);
  const rail = box(.1, .04, .55, steel, 0, .1, -.36);
  const stock = box(.11, .13, .34, poly, 0, 0, .3);
  const stockPad = box(.12, .15, .06, poly, 0, 0, .48);
  const grip = box(.1, .22, .12, poly, 0, -.16, .03);
  grip.rotation.x = -.2;
  const handguard = box(.13, .12, .42, tan, 0, .01, -.55);
  const mag = box(.1, .25, .15, steel, 0, -.19, -.16);
  mag.rotation.x = .12;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .026, .5, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .01, -1.05);
  const optic = box(.08, .09, .16, darkMetal, 0, .16, -.3);
  const opticGlass = new THREE.Mesh(new THREE.CircleGeometry(.03, 12), new THREE.MeshBasicMaterial({ color: '#9fe3ff' }));
  opticGlass.position.set(0, .16, -.22);
  const frontSight = box(.03, .09, .06, steel, 0, .14, -.8);
  model.add(receiver, rail, stock, stockPad, grip, handguard, mag, barrel, optic, opticGlass, frontSight);
  addHands(model, [[-.12, -.09, -.5], [.04, -.2, .03]]);
  model.userData.magazine = mag;
  addMuzzle(model, 0, .01, -1.33);
  model.position.set(.38, -.32, -.5);
  model.rotation.set(-.04, -.07, -.03);
  return model;
}

function buildMosin() {
  const model = new THREE.Group();
  const steel = weaponMat('#2d3436', .32, .7);
  const woodMat = weaponMat('#6a4a2d', .8, .01);
  const stock = box(.13, .16, 1.05, woodMat, 0, -.02, .3);
  const butt = box(.14, .21, .32, woodMat, 0, -.04, .82);
  const receiver = box(.12, .13, .35, steel, 0, .08, -.4);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .2, 8), steel);
  bolt.rotation.z = Math.PI / 2;
  bolt.position.set(.12, .1, -.36);
  const boltHandle = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), steel);
  boltHandle.position.set(.24, .1, -.32);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .028, 1.0, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .09, -.88);
  const frontSight = box(.03, .11, .06, steel, 0, .17, -.55);
  const rearSight = box(.05, .035, .08, steel, 0, .17, -.3);
  const scopeMount = box(.09, .05, .3, darkMetal, 0, .18, -.4);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .32, 12), darkMetal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, .24, -.4);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.036, 12), new THREE.MeshBasicMaterial({ color: '#8ecae6' }));
  lens.position.set(0, .24, -.24);
  model.add(stock, butt, receiver, bolt, boltHandle, barrel, frontSight, rearSight, scopeMount, scope, lens);
  addHands(model, [[-.1, -.06, -.46], [.05, -.12, .1]]);
  addMuzzle(model, 0, .09, -1.4);
  model.position.set(.36, -.32, -.54);
  model.rotation.set(-.03, -.06, -.02);
  return model;
}

function buildMP5() {
  const model = new THREE.Group();
  const steel = weaponMat('#2b3234', .32, .72);
  const poly = weaponMat('#1a2021', .84, .04);
  const receiver = box(.13, .14, .42, steel, 0, .01, -.16);
  const handguard = box(.12, .11, .3, poly, 0, .01, -.5);
  const stock = box(.06, .08, .34, steel, 0, 0, .28);
  const stockEnd = box(.14, .15, .05, poly, 0, 0, .47);
  const grip = box(.1, .22, .12, poly, 0, -.16, .02);
  grip.rotation.x = -.18;
  const mag = box(.08, .28, .12, steel, 0, -.2, -.18);
  mag.rotation.x = .16;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .024, .28, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .01, -.88);
  const frontSight = new THREE.Mesh(new THREE.TorusGeometry(.045, .01, 6, 12), steel);
  frontSight.position.set(0, .09, -.76);
  const rearRing = new THREE.Mesh(new THREE.TorusGeometry(.04, .01, 6, 12), steel);
  rearRing.position.set(0, .1, -.3);
  model.add(receiver, handguard, stock, stockEnd, grip, mag, barrel, frontSight, rearRing);
  addHands(model, [[-.1, -.08, -.46], [.04, -.19, .02]]);
  model.userData.magazine = mag;
  addMuzzle(model, 0, .01, -.98, 'pistol');
  model.position.set(.37, -.32, -.48);
  model.rotation.set(-.05, -.08, -.03);
  return model;
}

function buildMakarov() {
  const model = new THREE.Group();
  const steel = weaponMat('#394144', .32, .74);
  const poly = weaponMat('#1c2223', .84, .04);
  const slide = box(.14, .1, .42, steel, 0, .06, -.2);
  const slideTop = box(.12, .025, .38, darkMetal, 0, .125, -.2);
  const frame = box(.15, .1, .32, poly, 0, -.03, -.1);
  const grip = box(.12, .24, .14, poly, 0, -.16, .05);
  grip.rotation.x = -.18;
  const magBase = box(.1, .04, .1, steel, 0, -.3, .06);
  const trigger = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 6, 10, Math.PI), steel);
  trigger.rotation.x = Math.PI / 2;
  trigger.position.set(0, -.08, -.12);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.018, .02, .12, 8), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .06, -.46);
  const frontSight = box(.02, .045, .04, steel, 0, .15, -.35);
  const rearSight = box(.04, .03, .04, steel, 0, .15, -.08);
  model.add(slide, slideTop, frame, grip, magBase, trigger, barrel, frontSight, rearSight);
  addHands(model, [[.08, -.19, .04, .82, .8, 1.05]], glove);
  model.userData.magazine = magBase;
  addMuzzle(model, 0, .06, -.54, 'pistol');
  model.position.set(.33, -.31, -.46);
  model.rotation.set(-.06, -.09, -.03);
  return model;
}

function buildGlock17() {
  const model = new THREE.Group();
  const steel = weaponMat('#2f3638', .3, .74);
  const poly = weaponMat('#1d2223', .88, .03);
  const slide = box(.13, .09, .42, steel, 0, .07, -.2);
  const slideTop = box(.11, .022, .38, darkMetal, 0, .122, -.2);
  const frame = box(.14, .075, .32, poly, 0, -.01, -.08);
  const grip = box(.11, .25, .14, poly, 0, -.17, .06);
  grip.rotation.x = -.21;
  const magBase = box(.1, .045, .11, steel, 0, -.31, .08);
  const trigger = new THREE.Mesh(new THREE.TorusGeometry(.045, .011, 6, 10, Math.PI), steel);
  trigger.rotation.x = Math.PI / 2;
  trigger.position.set(0, -.1, -.11);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.017, .019, .1, 8), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .07, -.44);
  const frontSight = box(.018, .04, .035, steel, 0, .155, -.35);
  const rearSight = box(.045, .03, .045, steel, 0, .155, -.05);
  for (let i = 0; i < 4; i += 1) {
    addBox(model, .005, .035, .022, darkMetal, .066, .07, -.31 + i * .045);
  }
  model.add(slide, slideTop, frame, grip, magBase, trigger, barrel, frontSight, rearSight);
  addHands(model, [[.08, -.2, .05, .82, .8, 1.05]]);
  model.userData.magazine = magBase;
  addMuzzle(model, 0, .07, -.5, 'pistol');
  model.position.set(.33, -.31, -.46);
  model.rotation.set(-.06, -.09, -.03);
  return model;
}

function buildM1911() {
  const model = new THREE.Group();
  const steel = weaponMat('#3a4143', .34, .72);
  const dark = weaponMat('#202728', .8, .16);
  const woodGrip = weaponMat('#5a3f2a', .78, .02);
  const slide = box(.14, .1, .46, steel, 0, .07, -.22);
  const slideTop = box(.12, .025, .42, darkMetal, 0, .13, -.22);
  const frame = box(.145, .085, .34, dark, 0, -.01, -.08);
  const grip = box(.12, .25, .15, woodGrip, 0, -.17, .06);
  grip.rotation.x = -.19;
  for (let i = 0; i < 4; i += 1) addBox(model, .006, .1, .02, darkMetal, .066, .07, -.38 + i * .055);
  const hammer = box(.045, .08, .05, steel, 0, .13, .08).rotation.x = -.5;
  const trigger = new THREE.Mesh(new THREE.TorusGeometry(.05, .012, 6, 10, Math.PI), steel);
  trigger.rotation.x = Math.PI / 2;
  trigger.position.set(0, -.09, -.12);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .022, .1, 8), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .07, -.5);
  const frontSight = box(.02, .045, .035, steel, 0, .16, -.42);
  const rearSight = box(.05, .03, .045, steel, 0, .16, -.07);
  model.add(slide, slideTop, frame, grip, hammer, trigger, barrel, frontSight, rearSight);
  addHands(model, [[.08, -.2, .05, .82, .8, 1.05]]);
  model.userData.magazine = grip;
  addMuzzle(model, 0, .07, -.57, 'pistol');
  model.position.set(.33, -.31, -.46);
  model.rotation.set(-.06, -.09, -.03);
  return model;
}

function buildSKS() {
  const model = new THREE.Group();
  const steel = weaponMat('#2c3435', .33, .72);
  const woodMat = weaponMat('#6b4b2d', .8, .02);
  const stock = box(.13, .15, .95, woodMat, 0, -.02, .34);
  const butt = box(.14, .2, .28, woodMat, 0, -.035, .96);
  const receiver = box(.13, .12, .34, steel, 0, .08, -.24);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .18, 8), steel);
  bolt.rotation.z = Math.PI / 2;
  bolt.position.set(.09, .14, -.2);
  const mag = box(.1, .2, .16, steel, 0, -.12, -.18);
  mag.rotation.x = .2;
  const handguard = box(.12, .1, .42, woodMat, 0, .04, -.58);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .026, .85, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .08, -.96);
  const frontSight = box(.03, .12, .06, steel, 0, .16, -.86);
  const rearSight = box(.05, .04, .08, steel, 0, .15, -.3);
  const bayonetLug = box(.05, .06, .25, darkMetal, 0, .02, -1.3);
  model.add(stock, butt, receiver, bolt, mag, handguard, barrel, frontSight, rearSight, bayonetLug);
  addHands(model, [[-.1, -.07, -.5], [.05, -.11, .12]]);
  addMuzzle(model, 0, .08, -1.4);
  model.position.set(.36, -.32, -.54);
  model.rotation.set(-.03, -.06, -.02);
  return model;
}

function buildM14() {
  const model = new THREE.Group();
  const steel = weaponMat('#30383a', .32, .74);
  const woodMat = weaponMat('#66503a', .82, .02);
  const stock = box(.14, .16, 1.0, woodMat, 0, -.03, .32);
  const butt = box(.15, .21, .3, woodMat, 0, -.05, .94);
  const receiver = box(.14, .13, .48, steel, 0, .06, -.18);
  const handguard = box(.13, .12, .46, woodMat, 0, .02, -.62);
  const mag = box(.12, .28, .18, steel, 0, -.2, -.16);
  mag.rotation.x = .12;
  const grip = box(.1, .22, .13, woodMat, 0, -.18, .08);
  grip.rotation.x = -.18;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .027, 1.0, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .06, -1.1);
  const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .14, 10), darkMetal);
  flashHider.rotation.x = Math.PI / 2;
  flashHider.position.set(0, .06, -1.65);
  const rearSight = box(.06, .05, .1, steel, 0, .16, -.32);
  const frontSight = box(.035, .12, .06, steel, 0, .16, -.96);
  const scopeMount = box(.08, .05, .34, darkMetal, 0, .18, -.28);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(.042, .042, .3, 12), darkMetal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, .24, -.28);
  model.add(stock, butt, receiver, handguard, mag, grip, barrel, flashHider, rearSight, frontSight, scopeMount, scope);
  addHands(model, [[-.1, -.08, -.56], [.05, -.17, .06]]);
  addMuzzle(model, 0, .06, -1.74);
  model.position.set(.36, -.32, -.55);
  model.rotation.set(-.03, -.06, -.02);
  return model;
}

function buildSVD() {
  const model = new THREE.Group();
  const steel = weaponMat('#2d3537', .3, .76);
  const woodMat = weaponMat('#6d4a2d', .8, .02);
  const stock = box(.13, .17, .85, woodMat, 0, -.02, .38);
  const cheek = box(.12, .06, .3, woodMat, 0, .09, .42);
  const butt = box(.14, .21, .26, woodMat, 0, -.04, .89);
  const receiver = box(.13, .13, .46, steel, 0, .06, -.2);
  const handguard = box(.12, .11, .42, woodMat, 0, .02, -.62);
  const mag = box(.11, .24, .18, darkMetal, 0, -.17, -.22);
  mag.rotation.x = .22;
  const grip = box(.1, .22, .13, woodMat, 0, -.19, .06);
  grip.rotation.x = -.18;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.018, .025, 1.1, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .07, -1.18);
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .16, 8), steel);
  brake.rotation.x = Math.PI / 2;
  brake.position.set(0, .07, -1.8);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .42, 12), darkMetal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, .27, -.42);
  const scopeBell = new THREE.Mesh(new THREE.CylinderGeometry(.065, .05, .16, 12), darkMetal);
  scopeBell.rotation.x = Math.PI / 2;
  scopeBell.position.set(0, .27, -.66);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.042, 12), new THREE.MeshBasicMaterial({ color: '#88c9d8' }));
  lens.position.set(0, .27, -.75);
  const mountA = box(.07, .1, .08, darkMetal, 0, .18, -.3);
  const mountB = box(.07, .1, .08, darkMetal, 0, .18, -.54);
  const rearSight = box(.05, .045, .08, steel, 0, .16, -.05);
  model.add(stock, cheek, butt, receiver, handguard, mag, grip, barrel, brake, scope, scopeBell, lens, mountA, mountB, rearSight);
  addHands(model, [[-.1, -.08, -.56], [.05, -.16, .08]]);
  addMuzzle(model, 0, .07, -1.9);
  model.position.set(.36, -.32, -.55);
  model.rotation.set(-.03, -.06, -.02);
  return model;
}

function buildM24() {
  const model = new THREE.Group();
  const steel = weaponMat('#2b3234', .3, .78);
  const stockMat = weaponMat('#4d5748', .9, .02);
  const stock = box(.13, .16, 1.05, stockMat, 0, -.03, .32);
  const butt = box(.14, .2, .28, stockMat, 0, -.04, .95);
  const receiver = box(.13, .13, .44, steel, 0, .06, -.18);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .22, 8), steel);
  bolt.rotation.z = Math.PI / 2;
  bolt.position.set(.12, .1, -.18);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), steel);
  handle.position.set(.24, .1, -.13);
  const mag = box(.1, .16, .16, darkMetal, 0, -.13, -.24);
  const grip = box(.1, .22, .13, stockMat, 0, -.18, .05);
  grip.rotation.x = -.18;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.017, .026, 1.25, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .07, -1.25);
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .18, 8), darkMetal);
  brake.rotation.x = Math.PI / 2;
  brake.position.set(0, .07, -1.95);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .5, 12), darkMetal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, .28, -.44);
  const scopeBell = new THREE.Mesh(new THREE.CylinderGeometry(.07, .05, .18, 12), darkMetal);
  scopeBell.rotation.x = Math.PI / 2;
  scopeBell.position.set(0, .28, -.74);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.048, 12), new THREE.MeshBasicMaterial({ color: '#9fe0e8' }));
  lens.position.set(0, .28, -.84);
  const mountA = box(.08, .11, .09, darkMetal, 0, .18, -.3);
  const mountB = box(.08, .11, .09, darkMetal, 0, .18, -.58);
  const bipodA = box(.035, .35, .035, darkMetal, -.12, -.05, -1.6);
  bipodA.rotation.z = -.55;
  const bipodB = box(.035, .35, .035, darkMetal, .12, -.05, -1.6);
  bipodB.rotation.z = .55;
  model.add(stock, butt, receiver, bolt, handle, mag, grip, barrel, brake, scope, scopeBell, lens, mountA, mountB, bipodA, bipodB);
  addHands(model, [[-.1, -.08, -.58], [.05, -.16, .08]]);
  addMuzzle(model, 0, .07, -2.05);
  model.position.set(.36, -.32, -.55);
  model.rotation.set(-.03, -.06, -.02);
  return model;
}

function buildUMP45() {
  const model = new THREE.Group();
  const steel = weaponMat('#2f3637', .34, .7);
  const poly = weaponMat('#23292a', .86, .04);
  const receiver = box(.15, .15, .46, poly, 0, .01, -.15);
  const rail = box(.1, .035, .5, steel, 0, .1, -.32);
  const stock = box(.07, .09, .34, steel, 0, .01, .3);
  const stockEnd = box(.14, .15, .06, poly, 0, .01, .49);
  const grip = box(.11, .23, .13, poly, 0, -.17, .02);
  grip.rotation.x = -.18;
  const mag = box(.11, .3, .15, poly, 0, -.21, -.18);
  mag.rotation.x = .08;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.022, .028, .3, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .02, -.98);
  const shroud = box(.1, .1, .24, steel, 0, .02, -.78);
  const frontSight = box(.03, .09, .05, steel, 0, .13, -.88);
  const rearSight = box(.05, .04, .06, steel, 0, .14, -.24);
  const foregrip = box(.06, .18, .08, poly, 0, -.13, -.55);
  foregrip.rotation.x = -.2;
  model.add(receiver, rail, stock, stockEnd, grip, mag, barrel, shroud, frontSight, rearSight, foregrip);
  addHands(model, [[-.1, -.09, -.5], [.04, -.2, .03]]);
  model.userData.magazine = mag;
  addMuzzle(model, 0, .02, -1.1, 'pistol');
  model.position.set(.37, -.32, -.48);
  model.rotation.set(-.05, -.08, -.03);
  return model;
}

function buildPP19() {
  const model = new THREE.Group();
  const steel = weaponMat('#2c3335', .33, .72);
  const poly = weaponMat('#202627', .86, .04);
  const receiver = box(.14, .14, .44, steel, 0, .01, -.16);
  const dust = box(.13, .06, .34, steel, 0, .1, -.2);
  const stock = box(.06, .08, .44, steel, 0, .02, .35);
  const stockEnd = box(.13, .14, .05, poly, 0, .02, .58);
  const handguard = box(.12, .11, .34, poly, 0, .01, -.55);
  const grip = box(.1, .22, .13, poly, 0, -.16, .02);
  grip.rotation.x = -.18;
  const mag = box(.1, .28, .15, poly, 0, -.19, -.18);
  mag.rotation.x = .16;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.02, .024, .4, 10), steel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, .01, -.94);
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .12, 8), darkMetal);
  brake.rotation.x = Math.PI / 2;
  brake.position.set(0, .01, -1.16);
  const frontSight = box(.03, .1, .05, steel, 0, .12, -.86);
  const rearSight = box(.05, .04, .07, steel, 0, .14, -.28);
  const sideRail = box(.03, .05, .32, darkMetal, .08, .06, -.28);
  model.add(receiver, dust, stock, stockEnd, handguard, grip, mag, barrel, brake, frontSight, rearSight, sideRail);
  addHands(model, [[-.1, -.08, -.5], [.04, -.19, .02]]);
  model.userData.magazine = mag;
  addMuzzle(model, 0, .01, -1.24, 'pistol');
  model.position.set(.37, -.32, -.48);
  model.rotation.set(-.05, -.08, -.03);
  return model;
}

function buildThrowable(kind = 'frag') {
  const model = new THREE.Group();
  const shell = kind === 'smoke' ? material('#647b7a', .78, .12) : material('#29302d', .78, .12);
  const band = kind === 'smoke' ? material('#c8d8d6', .7, .1) : material('#6f7b53', .7, .1);
  const body = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), shell);
  body.scale.set(.9, 1.1, .9);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.115, .018, 6, 16), band);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .02;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .08, 10), metal);
  cap.position.y = .16;
  const lever = box(.035, .13, .045, metal, .1, .2, .01);
  const pin = new THREE.Mesh(new THREE.TorusGeometry(.035, .009, 6, 10), metal);
  pin.position.set(-.11, .18, .01);
  pin.rotation.x = Math.PI / 2;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), glove);
  hand.scale.set(.9, .95, .9);
  hand.position.set(0, -.19, .02);
  model.add(body, ring, cap, lever, pin, hand);
  addMuzzle(model, 0, .22, 0, 'pistol');
  model.position.set(.35, -.33, -.46);
  model.rotation.set(-.05, -.08, -.04);
  return model;
}

export function buildWeaponModel(modelId = 'ak74') {
  switch (modelId) {
    case 'm4a1': return buildM4();
    case 'mosin': return buildMosin();
    case 'mp5': return buildMP5();
    case 'makarov': return buildMakarov();
    case 'glock17': return buildGlock17();
    case 'm1911': return buildM1911();
    case 'sks': return buildSKS();
    case 'm14': return buildM14();
    case 'svd': return buildSVD();
    case 'm24': return buildM24();
    case 'ump45': return buildUMP45();
    case 'pp19': return buildPP19();
    case 'frag': return buildThrowable('frag');
    case 'smoke': return buildThrowable('smoke');
    case 'ak74':
    default: return buildAK();
  }
}

export function makeShell() {
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .06, 6), brass);
  shell.castShadow = false;
  return shell;
}
