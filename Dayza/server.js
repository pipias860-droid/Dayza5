import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASE_HOUSES, CLAN_COLORS, ITEM_TEMPLATES, LOOT_TABLES, LOOT_ZONES, TOWN_BUILDINGS,
  PLAYER_MAX_HEALTH, RESOURCE_NODES, RESOURCE_TYPES, WORLD_HALF, ZOMBIE_ZONES,
} from './public/world-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const WORLD_LIMIT = WORLD_HALF - 6;

const players = new Map();
const clients = new Map();
const loot = new Map();
const airdrops = new Map();
const clans = new Map();
const bases = new Map();
const resources = new Map();
const zombies = new Map();
let lootSequence = 1;
let airdropSequence = 1;
let clanSequence = 1;
let zombieSequence = 1;
const CHEST_CAPACITY = 12;
const AIRDROP_INTERVAL = 5 * 60 * 1000;
const AIRDROP_FLIGHT_TIME = 12 * 1000;
const AIRDROP_LIFETIME = 15 * 60 * 1000;
const AIRDROP_LOCATIONS = [
  { name: 'NOVO SELO', x: 180, z: 65 },
  { name: 'YAROSLAV STATION', x: -8, z: -318 },
  { name: 'MILITARY CAMP', x: -260, z: -220 },
  { name: 'ZAVOD WORKS', x: -245, z: 235 },
  { name: 'ZELENO FARM', x: 275, z: 220 },
  { name: 'KAMENKA', x: 350, z: -252 },
];
const CHEST_REACH = 4.5;
const NODE_REACH = 4.5;
const ZOMBIE_TICK_MS = 120;

const colors = ['#ff6b6b', '#ffd166', '#7bdff2', '#b8f2e6', '#cdb4db', '#f7aef8'];
const spawnPoints = [
  { x: -7, z: -6 }, { x: 7, z: -6 }, { x: -7, z: 7 }, { x: 7, z: 7 },
  { x: 0, z: 11 }, { x: 13, z: 0 }, { x: -13, z: 0 }, { x: 0, z: -12 },
];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function makePlayer(id) {
  const spawn = spawnPoints[players.size % spawnPoints.length];
  return {
    id,
    name: `SURVIVOR-${String(players.size + 1).padStart(2, '0')}`,
    x: spawn.x,
    y: 0,
    z: spawn.z,
    rotation: 0,
    color: colors[players.size % colors.length],
    clanId: null,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    lastDamageAt: 0,
    dead: false,
    baseId: null,
  };
}

function cleanNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function cleanText(value, maxLength = 18) {
  return String(value || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, maxLength);
}

function send(client, type, payload = {}) {
  if (!client.socket.destroyed) sendFrame(client.socket, JSON.stringify({ type, ...payload }));
}

function sendToPlayer(playerId, type, payload = {}) {
  const client = clients.get(playerId);
  if (client) send(client, type, payload);
}

function broadcast(type, payload = {}, exceptId = null) {
  clients.forEach((client, id) => {
    if (id !== exceptId) send(client, type, payload);
  });
}

function sendFrame(socket, message) {
  const payload = Buffer.from(message);
  let header;

  if (payload.length < 126) {
    header = Buffer.from([0x81, payload.length]);
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }

  socket.write(Buffer.concat([header, payload]));
}

function closeFrame(socket) {
  if (!socket.destroyed) socket.end(Buffer.from([0x88, 0x00]));
}

// ---------------------------------------------------------------------------
// World loot
// ---------------------------------------------------------------------------
function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function spawnLoot(zoneId, tier, x, z) {
  const table = LOOT_TABLES[tier] || LOOT_TABLES[1];
  const entry = weightedPick(table);
  const template = ITEM_TEMPLATES[entry.id];
  if (!template) return null;
  const item = {
    id: `loot-${lootSequence++}`,
    itemId: entry.id,
    quantity: randomInt(entry.min ?? 1, entry.max ?? 1),
    x: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, x + (Math.random() - .5) * .8)),
    z: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, z + (Math.random() - .5) * .8)),
    zoneId,
    tier,
    spawnedAt: Date.now(),
  };
  loot.set(item.id, item);
  return item;
}

function lootSnapshot() {
  return [...loot.values()];
}

function fillInitialLoot() {
  for (const zone of LOOT_ZONES) {
    const chance = zone.tier === 3 ? .82 : zone.tier === 2 ? .7 : .58;
    for (const [x, z] of zone.spots) {
      if (Math.random() > chance) continue;
      spawnLoot(zone.id, zone.tier, x, z);
    }
  }
}

function respawnLoot() {
  const now = Date.now();
  for (const item of [...loot.values()]) {
    if (now - item.spawnedAt > 20 * 60 * 1000) {
      loot.delete(item.id);
      broadcast('lootRemoved', { id: item.id, reason: 'decay' });
    }
  }

  for (const zone of LOOT_ZONES) {
    for (const [x, z] of zone.spots) {
      const occupied = [...loot.values()].some((item) => Math.hypot(item.x - x, item.z - z) < 2.4);
      if (occupied) continue;
      const chance = zone.tier === 3 ? .4 : zone.tier === 2 ? .3 : .22;
      if (Math.random() > chance) continue;
      const item = spawnLoot(zone.id, zone.tier, x, z);
      if (item) broadcast('lootSpawned', { loot: item });
    }
  }
}

function airdropSnapshot() {
  return [...airdrops.values()].map((drop) => ({ ...drop }));
}

function spawnAirdrop() {
  const location = AIRDROP_LOCATIONS[Math.floor(Math.random() * AIRDROP_LOCATIONS.length)];
  const now = Date.now();
  const airdrop = {
    id: `airdrop-${airdropSequence++}`,
    name: location.name,
    x: location.x + (Math.random() - .5) * 18,
    z: location.z + (Math.random() - .5) * 18,
    y: 34,
    state: 'incoming',
    spawnedAt: now,
    landAt: now + AIRDROP_FLIGHT_TIME,
    expiresAt: now + AIRDROP_LIFETIME,
  };
  airdrops.set(airdrop.id, airdrop);
  broadcast('airdropIncoming', { airdrop: { ...airdrop } });
}

function landAirdrop(airdrop) {
  airdrop.state = 'landed';
  airdrop.y = 0;
  const dropSpots = [[-2.4, -1.2], [2.2, -.8], [-1.4, 2.1], [1.8, 2.2]];
  for (const [offsetX, offsetZ] of dropSpots) {
    const item = spawnLoot('airdrop', 3, airdrop.x + offsetX, airdrop.z + offsetZ);
    if (item) broadcast('lootSpawned', { loot: item });
  }
  broadcast('airdropLanded', { airdrop: { ...airdrop } });
}

function updateAirdrops(now) {
  for (const airdrop of [...airdrops.values()]) {
    if (airdrop.state === 'incoming') {
      const progress = Math.min(1, Math.max(0, (now - airdrop.spawnedAt) / AIRDROP_FLIGHT_TIME));
      airdrop.y = 34 - progress * 34;
      if (now >= airdrop.landAt) landAirdrop(airdrop);
    }
    if (now >= airdrop.expiresAt) {
      airdrops.delete(airdrop.id);
      broadcast('airdropRemoved', { id: airdrop.id });
    }
  }
}

// ---------------------------------------------------------------------------
// Claimable shelters + stash chests
// ---------------------------------------------------------------------------
function baseChestWorld(base) {
  const lx = base.w / 2 - 1.45;
  const lz = -base.d / 2 + 1.25;
  return {
    x: base.x + lx * Math.cos(base.rotation) + lz * Math.sin(base.rotation),
    z: base.z - lx * Math.sin(base.rotation) + lz * Math.cos(base.rotation),
  };
}

function baseSummary(base) {
  return {
    id: base.id,
    name: base.name,
    short: base.short,
    x: base.x,
    z: base.z,
    rotation: base.rotation,
    w: base.w,
    d: base.d,
    claimRadius: base.claimRadius,
    claimedBy: base.claimedBy,
    ownerName: base.ownerName,
    ownerClanId: base.ownerClanId,
    chestWorld: baseChestWorld(base),
  };
}

function baseSnapshot() {
  return [...bases.values()].map(baseSummary);
}

function attackBaseSummary(base) {
  return {
    ...baseSummary(base),
    baseId: base.id,
    items: base.chest.map((entry) => ({ ...entry })),
    capacity: CHEST_CAPACITY,
  };
}

function canAccessBase(player, base) {
  if (!player || !base) return false;
  if (base.claimedBy === player.id) return true;
  return Boolean(base.ownerClanId && player.clanId && base.ownerClanId === player.clanId);
}

function baseForPlayer(player) {
  if (!player?.baseId) return null;
  return bases.get(player.baseId) || null;
}

function releaseBase(base, reason) {
  if (!base?.claimedBy) return;
  const previousOwner = players.get(base.claimedBy);
  const previousName = base.ownerName;
  base.claimedBy = null;
  base.ownerName = null;
  base.ownerClanId = null;
  if (previousOwner) previousOwner.baseId = null;
  broadcast('baseState', { bases: baseSnapshot() });
  if (previousOwner) sendClanNotice(previousOwner.id, `${base.name} is no longer your shelter${reason ? ` (${reason})` : ''}.`);
  if (previousName) broadcast('baseNotice', { text: `${previousName} abandoned ${base.name}.` });
}

function handleBaseMessage(client, message) {
  const player = players.get(client.id);
  if (!player || player.dead) return;

  if (message.type === 'baseClaim') {
    const base = bases.get(message.baseId);
    if (!base) return;
    if (base.claimedBy === client.id) {
      sendToPlayer(client.id, 'baseNotice', { text: `${base.name} is already your shelter.` });
      return;
    }
    if (base.claimedBy) {
      sendToPlayer(client.id, 'baseNotice', { text: `${base.name} is already claimed by ${base.ownerName}.` });
      return;
    }
    if (Math.hypot(player.x - base.x, player.z - base.z) > base.claimRadius + 7) {
      sendToPlayer(client.id, 'baseNotice', { text: 'Move closer to the shelter to claim it.' });
      return;
    }
    for (const other of bases.values()) {
      if (other.claimedBy === client.id) {
        other.claimedBy = null;
        other.ownerName = null;
        other.ownerClanId = null;
      }
    }
    base.claimedBy = client.id;
    base.ownerName = player.name;
    base.ownerClanId = player.clanId;
    player.baseId = base.id;
    broadcast('baseState', { bases: baseSnapshot() });
    sendToPlayer(client.id, 'baseClaimed', { base: baseSummary(base) });
    broadcast('baseNotice', { text: `${player.name} claimed ${base.name}.` });
    return;
  }

  if (message.type === 'baseRelease') {
    const base = bases.get(message.baseId);
    if (!base || base.claimedBy !== client.id) return;
    releaseBase(base, 'released');
    return;
  }

  if (message.type === 'chestOpen') {
    const base = bases.get(message.baseId);
    if (!base) return;
    if (!canAccessBase(player, base)) {
      sendToPlayer(client.id, 'chestNotice', { text: 'This stash belongs to another survivor.' });
      return;
    }
    if (Math.hypot(player.x - base.x, player.z - base.z) > base.claimRadius + 7) return;
    sendToPlayer(client.id, 'chestState', attackBaseSummary(base));
    return;
  }

  if (message.type === 'chestStore') {
    const base = bases.get(message.baseId);
    if (!base || !canAccessBase(player, base)) return;
    if (Math.hypot(player.x - base.x, player.z - base.z) > base.claimRadius + 7) return;
    const template = ITEM_TEMPLATES[message.itemId];
    if (!template) return;
    const maxStack = template.maxStack || 1;
    const quantity = Math.max(1, Math.min(maxStack, Math.floor(cleanNumber(message.quantity, 1))));
    let remaining = quantity;
    for (const entry of base.chest) {
      if (entry.itemId !== message.itemId || entry.quantity >= maxStack) continue;
      const moved = Math.min(maxStack - entry.quantity, remaining);
      entry.quantity += moved;
      remaining -= moved;
      if (remaining <= 0) break;
    }
    while (remaining > 0 && base.chest.length < CHEST_CAPACITY) {
      const moved = Math.min(maxStack, remaining);
      base.chest.push({ itemId: message.itemId, quantity: moved });
      remaining -= moved;
    }
    const stored = quantity - remaining;
    if (stored > 0) {
      sendToPlayer(client.id, 'chestStored', { itemId: message.itemId, quantity: stored });
    } else {
      sendToPlayer(client.id, 'chestNotice', { text: 'The stash is full.' });
    }
    sendToPlayer(client.id, 'chestState', attackBaseSummary(base));
    return;
  }

  if (message.type === 'chestTake') {
    const base = bases.get(message.baseId);
    if (!base || !canAccessBase(player, base)) return;
    if (Math.hypot(player.x - base.x, player.z - base.z) > base.claimRadius + 7) return;
    const index = Math.floor(cleanNumber(message.index, -1));
    if (index < 0 || index >= base.chest.length) return;
    const [entry] = base.chest.splice(index, 1);
    sendToPlayer(client.id, 'chestTaken', { item: entry });
    sendToPlayer(client.id, 'chestState', attackBaseSummary(base));
  }
}

function initBases() {
  for (const base of [...BASE_HOUSES, ...TOWN_BUILDINGS]) {
    bases.set(base.id, {
      ...base,
      claimedBy: null,
      ownerName: null,
      ownerClanId: null,
      chest: [],
    });
  }
}

// ---------------------------------------------------------------------------
// Harvestable resource nodes
// ---------------------------------------------------------------------------
function initResources() {
  for (const node of RESOURCE_NODES) {
    const type = RESOURCE_TYPES[node.kind] || RESOURCE_TYPES.wood;
    resources.set(node.id, {
      id: node.id,
      kind: node.kind,
      remaining: type.maxUses,
      maxUses: type.maxUses,
      respawnAt: 0,
      lastHarvestAt: 0,
    });
  }
}

function resourceSnapshot() {
  return [...resources.values()].map((node) => ({
    id: node.id, remaining: node.remaining, maxUses: node.maxUses,
  }));
}

function handleResourceMessage(client, message) {
  const player = players.get(client.id);
  if (!player || player.dead || message.type !== 'resourceHarvest') return;
  const node = resources.get(message.nodeId);
  if (!node || node.remaining <= 0) return;
  const now = Date.now();
  if (now - node.lastHarvestAt < 500) return;
  const type = RESOURCE_TYPES[node.kind] || RESOURCE_TYPES.wood;
  const worldNode = RESOURCE_NODES.find((entry) => entry.id === node.id);
  if (!worldNode || Math.hypot(player.x - worldNode.x, player.z - worldNode.z) > NODE_REACH) return;

  node.lastHarvestAt = now;
  node.remaining -= 1;
  if (node.remaining <= 0) node.respawnAt = now + type.respawn;

  const items = [];
  for (const drop of type.yields) {
    const quantity = randomInt(drop.min, drop.max);
    if (quantity > 0) items.push({ itemId: drop.id, quantity });
  }
  sendToPlayer(client.id, 'resourceHarvested', {
    nodeId: node.id,
    kind: node.kind,
    label: type.label,
    items,
    remaining: node.remaining,
  });
  broadcast('resourceState', {
    id: node.id,
    remaining: node.remaining,
    maxUses: node.maxUses,
  });
}

function updateResources(now) {
  for (const node of resources.values()) {
    if (node.remaining > 0 || !node.respawnAt || now < node.respawnAt) continue;
    node.remaining = node.maxUses;
    node.respawnAt = 0;
    broadcast('resourceState', {
      id: node.id,
      remaining: node.remaining,
      maxUses: node.maxUses,
    });
  }
}

// ---------------------------------------------------------------------------
// Infected population
// ---------------------------------------------------------------------------
const ZOMBIE_HEALTH = [0, 55, 90, 140];
const ZOMBIE_SPEED = [0, 1.35, 1.7, 2.05];
const ZOMBIE_CHASE_SPEED = [0, 3.0, 3.45, 3.9];
const ZOMBIE_DAMAGE = [0, 7, 11, 16];
const ZOMBIE_NAMES = ['WALKER', 'INFECTED', 'BRUTE'];

function resetZombie(zombie, now = Date.now()) {
  const zone = ZOMBIE_ZONES.find((entry) => entry.id === zombie.zoneId) || ZOMBIE_ZONES[0];
  zombie.health = ZOMBIE_HEALTH[zombie.tier];
  zombie.maxHealth = zombie.health;
  zombie.x = zombie.spawnX;
  zombie.z = zombie.spawnZ;
  zombie.rotation = Math.random() * Math.PI * 2;
  zombie.state = 'wander';
  zombie.targetId = null;
  zombie.wanderX = zombie.spawnX;
  zombie.wanderZ = zombie.spawnZ;
  zombie.wanderUntil = now + randomInt(4000, 11000);
  zombie.lastAttackAt = 0;
  zombie.dead = false;
  zombie.respawnAt = 0;
  zombie.zone = zone;
}

function spawnZombie(zone, index) {
  const spot = zone.spots[index % zone.spots.length];
  const tier = Math.max(1, Math.min(3, zone.tier));
  const zombie = {
    id: `walker-${zombieSequence++}`,
    zoneId: zone.id,
    tier,
    name: ZOMBIE_NAMES[tier - 1],
    spawnX: spot[0],
    spawnZ: spot[1],
    x: spot[0],
    z: spot[1],
    rotation: Math.random() * Math.PI * 2,
    health: ZOMBIE_HEALTH[tier],
    maxHealth: ZOMBIE_HEALTH[tier],
    state: 'wander',
    targetId: null,
    wanderX: spot[0],
    wanderZ: spot[1],
    wanderUntil: 0,
    lastAttackAt: 0,
    dead: false,
    respawnAt: 0,
  };
  zombies.set(zombie.id, zombie);
  resetZombie(zombie);
  return zombie;
}

function initZombies() {
  for (const zone of ZOMBIE_ZONES) {
    for (let i = 0; i < zone.count; i += 1) spawnZombie(zone, i);
  }
  for (const zombie of zombies.values()) {
    zombie.dead = false;
    zombie.health = zombie.maxHealth;
  }
}

function zombieSnapshot() {
  const list = [];
  for (const zombie of zombies.values()) {
    if (zombie.dead) continue;
    list.push({
      id: zombie.id,
      tier: zombie.tier,
      name: zombie.name,
      x: zombie.x,
      z: zombie.z,
      rotation: zombie.rotation,
      state: zombie.state,
      health: zombie.health,
      maxHealth: zombie.maxHealth,
    });
  }
  return list;
}

function enterZombieTarget(zombie, player) {
  zombie.targetId = player.id;
  zombie.state = 'chase';
}

function damageZombie(zombie, amount, playerId) {
  if (!zombie || zombie.dead) return;
  zombie.health = Math.max(0, zombie.health - amount);
  sendToPlayer(playerId, 'zombieHit', {
    id: zombie.id,
    health: zombie.health,
    maxHealth: zombie.maxHealth,
  });
  if (zombie.health > 0) return;

  zombie.dead = true;
  zombie.respawnAt = Date.now() + randomInt(24_000, 38_000);
  zombie.targetId = null;
  broadcast('zombieKilled', {
    id: zombie.id,
    by: playerId,
    tier: zombie.tier,
    x: zombie.x,
    z: zombie.z,
  });
  if (Math.random() < .82) {
    const item = spawnLoot('infected', zombie.tier, zombie.x, zombie.z);
    if (item) broadcast('lootSpawned', { loot: item });
  }
  sendToPlayer(playerId, 'killNotice', { tier: zombie.tier, name: zombie.name });
}

function findZombieHit(origin, target) {
  const ax = origin.x;
  const az = origin.z;
  const bx = target.x;
  const bz = target.z;
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq < .0001) return null;
  let best = null;
  let bestT = Infinity;
  for (const zombie of zombies.values()) {
    if (zombie.dead) continue;
    const t = Math.max(0, Math.min(1, ((zombie.x - ax) * dx + (zombie.z - az) * dz) / lengthSq));
    if (t < .02 || t > 1) continue;
    const closestX = ax + dx * t;
    const closestZ = az + dz * t;
    if (Math.hypot(zombie.x - closestX, zombie.z - closestZ) > .95) continue;
    if (t < bestT) { bestT = t; best = zombie; }
  }
  return best;
}

function damagePlayer(playerId, amount, sourceZombieId) {
  const player = players.get(playerId);
  if (!player || player.dead) return;
  player.health = Math.max(0, player.health - amount);
  player.lastDamageAt = Date.now();
  sendToPlayer(playerId, 'playerHealth', {
    health: player.health,
    maxHealth: player.maxHealth,
    source: sourceZombieId,
    attacker: sourceZombieId ? 'INFECTED' : null,
  });
  if (player.health > 0) return;

  player.dead = true;
  player.deathAt = Date.now();
  for (const zombie of zombies.values()) {
    if (zombie.targetId === playerId) zombie.targetId = null;
  }
  sendToPlayer(playerId, 'playerDown', {
    baseId: player.baseId,
    baseClaimed: Boolean(player.baseId),
  });
  broadcast('playerDown', { id: playerId, name: player.name }, playerId);
}

function respawnPlayer(client, requestedBaseId) {
  const player = players.get(client.id);
  if (!player) return;
  let base = null;
  if (requestedBaseId) {
    const candidate = bases.get(requestedBaseId);
    if (candidate && canAccessBase(player, candidate)) base = candidate;
  }
  let x = 0;
  let z = 4;
  if (base) {
    x = base.x + Math.sin(base.rotation) * (base.d / 2 + 2.6);
    z = base.z + Math.cos(base.rotation) * (base.d / 2 + 2.6);
  } else {
    x = 2;
    z = 6;
  }
  player.x = x;
  player.z = z;
  player.y = 0;
  player.rotation = 0;
  player.health = player.maxHealth;
  player.dead = false;
  player.lastDamageAt = Date.now() + 4000;

  sendToPlayer(client.id, 'playerRespawn', {
    x, z, health: player.health, maxHealth: player.maxHealth, baseId: base?.id || null,
  });
  broadcast('playerRespawned', { id: client.id, x, z }, client.id);
}

function updateZombies(now) {
  const delta = ZOMBIE_TICK_MS / 1000;
  for (const zombie of zombies.values()) {
    if (zombie.dead) {
      if (zombie.respawnAt && now >= zombie.respawnAt) resetZombie(zombie, now);
      continue;
    }

    let target = zombie.targetId ? players.get(zombie.targetId) : null;
    if (target && (target.dead || Math.hypot(target.x - zombie.x, target.z - zombie.z) > 30)) target = null;

    if (!target) {
      let nearest = null;
      let nearestDistance = 22;
      for (const player of players.values()) {
        if (player.dead) continue;
        const distance = Math.hypot(player.x - zombie.x, player.z - zombie.z);
        if (distance < nearestDistance) { nearest = player; nearestDistance = distance; }
      }
      if (nearest) {
        target = nearest;
        enterZombieTarget(zombie, nearest);
      } else {
        zombie.targetId = null;
        zombie.state = 'wander';
      }
    }

    if (target) {
      const dx = target.x - zombie.x;
      const dz = target.z - zombie.z;
      const distance = Math.hypot(dx, dz);
      zombie.rotation = Math.atan2(dx, dz);
      if (distance > 1.65) {
        const speed = ZOMBIE_CHASE_SPEED[zombie.tier] * delta;
        zombie.x += (dx / distance) * speed;
        zombie.z += (dz / distance) * speed;
      } else if (now - zombie.lastAttackAt > 1150) {
        zombie.lastAttackAt = now;
        damagePlayer(target.id, ZOMBIE_DAMAGE[zombie.tier], zombie.id);
      }
      zombie.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, zombie.x));
      zombie.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, zombie.z));
      continue;
    }

    if (now > zombie.wanderUntil) {
      const angle = Math.random() * Math.PI * 2;
      const range = 5 + Math.random() * 8;
      zombie.wanderX = zombie.spawnX + Math.cos(angle) * range;
      zombie.wanderZ = zombie.spawnZ + Math.sin(angle) * range;
      zombie.wanderUntil = now + randomInt(5000, 12000);
    }
    const dx = zombie.wanderX - zombie.x;
    const dz = zombie.wanderZ - zombie.z;
    const distance = Math.hypot(dx, dz);
    if (distance > .4) {
      const speed = ZOMBIE_SPEED[zombie.tier] * delta;
      zombie.x += (dx / distance) * speed;
      zombie.z += (dz / distance) * speed;
      zombie.rotation = Math.atan2(dx, dz);
    }
  }

  let changed = false;
  for (const player of players.values()) {
    if (player.dead) continue;
    if (now - player.lastDamageAt < 14_000) continue;
    if (player.health >= player.maxHealth) continue;
    player.health = Math.min(player.maxHealth, player.health + .16);
    changed = true;
    if (Math.round(player.health) !== Math.round(player.health - .16)) {
      sendToPlayer(player.id, 'playerHealth', {
        health: player.health, maxHealth: player.maxHealth, regen: true,
      });
    }
  }

  if (clients.size > 0) broadcast('zombieState', { zombies: zombieSnapshot(), at: now });
}

// ---------------------------------------------------------------------------
// Clans
// ---------------------------------------------------------------------------
function clanSummary(clan) {
  return {
    id: clan.id,
    name: clan.name,
    tag: clan.tag,
    color: clan.color,
    leaderId: clan.leaderId,
    members: [...clan.members],
  };
}

function broadcastClans() {
  broadcast('clanState', { clans: [...clans.values()].map(clanSummary) });
}

function sendClanNotice(playerId, text) {
  sendToPlayer(playerId, 'clanNotice', { text });
}

function removeFromClan(playerId) {
  const player = players.get(playerId);
  if (!player?.clanId) return;
  const clan = clans.get(player.clanId);
  player.clanId = null;
  if (!clan) return;
  clan.members.delete(playerId);
  clan.invites.delete(playerId);

  if (clan.members.size === 0) {
    clans.delete(clan.id);
  } else if (clan.leaderId === playerId) {
    clan.leaderId = clan.members.values().next().value;
    const nextLeader = players.get(clan.leaderId);
    sendClanNotice(clan.leaderId, `You are now the leader of ${clan.name}.`);
    if (nextLeader) nextLeader.clanId = clan.id;
  }
  broadcastClans();
}

function handleClanMessage(client, message) {
  const player = players.get(client.id);
  if (!player) return;

  if (message.type === 'clanCreate') {
    if (player.clanId) return sendClanNotice(client.id, 'Leave your current clan first.');
    const name = cleanText(message.name, 20);
    const tag = cleanText(message.tag, 4).toUpperCase();
    if (name.length < 3 || tag.length < 2) return sendClanNotice(client.id, 'Clan name or tag is too short.');
    if ([...clans.values()].some((clan) => clan.tag === tag || clan.name.toLowerCase() === name.toLowerCase())) {
      return sendClanNotice(client.id, 'That clan name or tag is already taken.');
    }
    const clan = {
      id: `clan-${clanSequence++}`,
      name,
      tag,
      color: CLAN_COLORS[clans.size % CLAN_COLORS.length],
      leaderId: client.id,
      members: new Set([client.id]),
      invites: new Set(),
    };
    clans.set(clan.id, clan);
    player.clanId = clan.id;
    broadcastClans();
    sendClanNotice(client.id, `Clan ${tag} founded.`);
    return;
  }

  if (message.type === 'clanInvite') {
    const clan = clans.get(player.clanId);
    if (!clan || clan.leaderId !== client.id) return sendClanNotice(client.id, 'Only the clan leader can invite survivors.');
    const target = players.get(message.targetId);
    if (!target || target.id === client.id) return sendClanNotice(client.id, 'That survivor is unavailable.');
    if (target.clanId) return sendClanNotice(client.id, 'That survivor is already in a clan.');
    clan.invites.add(target.id);
    sendToPlayer(target.id, 'clanInvite', {
      clanId: clan.id, name: clan.name, tag: clan.tag, color: clan.color, fromName: player.name,
    });
    sendClanNotice(client.id, `Invitation sent to ${target.name}.`);
    return;
  }

  if (message.type === 'clanAccept') {
    if (player.clanId) return;
    const clan = clans.get(message.clanId);
    if (!clan || !clan.invites.has(client.id)) return sendClanNotice(client.id, 'That invitation has expired.');
    clan.invites.delete(client.id);
    clan.members.add(client.id);
    player.clanId = clan.id;
    broadcastClans();
    sendClanNotice(client.id, `You joined ${clan.name} [${clan.tag}].`);
    broadcast('clanNotice', { text: `${player.name} joined clan ${clan.tag}.` });
    return;
  }

  if (message.type === 'clanLeave') {
    const clan = clans.get(player.clanId);
    if (!clan) return;
    removeFromClan(client.id);
    return;
  }

  if (message.type === 'clanKick') {
    const clan = clans.get(player.clanId);
    if (!clan || clan.leaderId !== client.id) return sendClanNotice(client.id, 'Only the clan leader can remove members.');
    if (!clan.members.has(message.targetId)) return;
    removeFromClan(message.targetId);
    sendClanNotice(message.targetId, `You were removed from clan ${clan.tag}.`);
    return;
  }

  if (message.type === 'clanDisband') {
    const clan = clans.get(player.clanId);
    if (!clan || clan.leaderId !== client.id) return sendClanNotice(client.id, 'Only the clan leader can disband the clan.');
    for (const memberId of clan.members) {
      const member = players.get(memberId);
      if (member) member.clanId = null;
      sendClanNotice(memberId, `Clan ${clan.tag} has been disbanded.`);
    }
    clans.delete(clan.id);
    broadcastClans();
  }
}

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------
function handleMessage(client, message) {
  if (String(message.type || '').startsWith('clan')) {
    handleClanMessage(client, message);
    return;
  }

  if (message.type === 'baseClaim' || message.type === 'baseRelease'
    || message.type === 'chestOpen' || message.type === 'chestStore' || message.type === 'chestTake') {
    handleBaseMessage(client, message);
    return;
  }

  if (message.type === 'resourceHarvest') {
    handleResourceMessage(client, message);
    return;
  }

  if (message.type === 'respawnRequest') {
    respawnPlayer(client, message.baseId || null);
    return;
  }

  if (message.type === 'playerHeal') {
    const current = players.get(client.id);
    if (!current || current.dead) return;
    const amount = Math.max(0, Math.min(50, Math.floor(cleanNumber(message.amount, 0))));
    if (amount <= 0) return;
    const before = current.health;
    current.health = Math.min(current.maxHealth, current.health + amount);
    current.lastDamageAt = Date.now();
    sendToPlayer(client.id, 'playerHealth', {
      health: current.health,
      maxHealth: current.maxHealth,
      healed: Math.round(current.health - before),
    });
    return;
  }

  if (message.type === 'profileUpdate') {
    const current = players.get(client.id);
    if (!current) return;
    const requestedName = cleanText(message.name, 18);
    if (!requestedName) return;
    current.name = requestedName;
    for (const base of bases.values()) {
      if (base.claimedBy === client.id) base.ownerName = requestedName;
    }
    broadcast('baseState', { bases: baseSnapshot() });
    broadcast('playerProfile', { id: client.id, name: current.name }, client.id);
    return;
  }

  if (message.type === 'playerShoot') {
    const origin = message.origin || {};
    const target = message.target || {};
    const values = [origin.x, origin.y, origin.z, target.x, target.y, target.z];
    if (!values.every(Number.isFinite)) return;
    const weapon = cleanText(message.weapon, 12) || 'ak74';
    const shooter = players.get(client.id);
    if (!shooter || shooter.dead) return;

    broadcast('playerShoot', {
      id: client.id,
      weapon,
      origin: { x: origin.x, y: origin.y, z: origin.z },
      target: { x: target.x, y: target.y, z: target.z },
    }, client.id);

    const template = ITEM_TEMPLATES[weapon];
    const damage = template?.category === 'weapon' ? Math.max(1, template.damage || 20) : 0;
    if (damage > 0) {
      const hit = findZombieHit(origin, target);
      if (hit) damageZombie(hit, damage, client.id);
    }
    return;
  }

  if (message.type === 'grenadeThrow') {
    const origin = message.origin || {};
    const target = message.target || {};
    const values = [origin.x, origin.y, origin.z, target.x, target.y, target.z];
    if (!values.every(Number.isFinite)) return;

    broadcast('grenadeThrow', {
      id: client.id,
      kind: message.kind === 'smoke' ? 'smoke' : 'frag',
      origin: { x: origin.x, y: origin.y, z: origin.z },
      target: { x: target.x, y: target.y, z: target.z },
    }, client.id);
    return;
  }

  if (message.type === 'lootPickup') {
    const current = players.get(client.id);
    const item = loot.get(message.id);
    if (!current || !item) return;
    if (Math.hypot(current.x - item.x, current.z - item.z) > 4.5) return;
    loot.delete(item.id);
    sendToPlayer(client.id, 'lootTaken', { loot: item });
    broadcast('lootRemoved', { id: item.id, by: client.id }, client.id);
    return;
  }

  if (message.type === 'lootDrop') {
    const current = players.get(client.id);
    if (!current) return;
    const template = ITEM_TEMPLATES[message.itemId];
    if (!template) return;
    const maxStack = template.maxStack || 1;
    const quantity = Math.max(1, Math.min(maxStack, Math.floor(cleanNumber(message.quantity, 1))));
    const angle = Math.random() * Math.PI * 2;
    const distance = .8 + Math.random() * 1.2;
    const item = {
      id: `loot-${lootSequence++}`,
      itemId: message.itemId,
      quantity,
      x: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, current.x + Math.cos(angle) * distance)),
      z: Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, current.z + Math.sin(angle) * distance)),
      zoneId: 'dropped',
      tier: 1,
      spawnedAt: Date.now(),
    };
    loot.set(item.id, item);
    broadcast('lootSpawned', { loot: item });
    return;
  }

  if (message.type !== 'playerMove') return;
  const current = players.get(client.id);
  if (!current || current.dead) return;

  current.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, cleanNumber(message.x, current.x)));
  current.y = Math.max(0, Math.min(40, cleanNumber(message.y, current.y)));
  current.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, cleanNumber(message.z, current.z)));
  current.rotation = cleanNumber(message.rotation, current.rotation);

  broadcast('playerMoved', {
    id: client.id,
    x: current.x,
    y: current.y,
    z: current.z,
    rotation: current.rotation,
  }, client.id);
}

function removeClient(id) {
  if (!clients.has(id)) return;
  const player = players.get(id);
  if (player?.baseId) {
    const base = bases.get(player.baseId);
    if (base?.claimedBy === id) releaseBase(base, 'owner disconnected');
  }
  for (const zombie of zombies.values()) {
    if (zombie.targetId === id) zombie.targetId = null;
  }
  removeFromClan(id);
  clients.delete(id);
  players.delete(id);
  broadcast('playerLeft', { id });
}

async function serveFile(request, response) {
  const requestPath = request.url === '/' ? '/index.html' : new URL(request.url, 'http://localhost').pathname;
  const isCharacterReference = requestPath === '/character.png';
  const safePath = isCharacterReference ? path.join(__dirname, 'character.png') : path.normalize(path.join(publicDir, requestPath));
  if (!isCharacterReference && !safePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const contents = await readFile(safePath);
    const extension = path.extname(safePath).toLowerCase();
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(contents);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = createServer(serveFile);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. The Dayza server may already be running at http://localhost:${PORT}.`);
    console.error(`Use a different port with: $env:PORT=3001; npm.cmd start`);
    process.exitCode = 1;
    return;
  }
  console.error('Dayza server error:', error);
  process.exitCode = 1;
});

server.on('upgrade', (request, socket) => {
  const key = request.headers['sec-websocket-key'];
  if (!key || request.headers.upgrade?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }

  const accept = createHash('sha1').update(`${key}${WS_GUID}`).digest('base64');
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '\r\n',
  ].join('\r\n'));

  const id = `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const client = { id, socket, buffer: Buffer.alloc(0) };
  const player = makePlayer(id);
  clients.set(id, client);
  players.set(id, player);

  socket.on('data', (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    try {
      consumeFrames(client);
    } catch {
      closeFrame(socket);
    }
  });
  socket.on('error', () => removeClient(id));
  socket.on('close', () => removeClient(id));

  send(client, 'worldState', {
    selfId: id,
    players: [...players.values()],
    loot: lootSnapshot(),
    airdrops: airdropSnapshot(),
    clans: [...clans.values()].map(clanSummary),
    bases: baseSnapshot(),
    resources: resourceSnapshot(),
    zombies: zombieSnapshot(),
  });
  broadcast('playerJoined', player, id);
});

// WebSocket framing is read from the socket buffer, so it lives below the
// world functions to keep the data flow easy to follow.
function consumeFrames(client) {
  while (client.buffer.length >= 2) {
    const first = client.buffer[0];
    const second = client.buffer[1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let payloadLength = second & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      if (client.buffer.length < 4) return;
      payloadLength = client.buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      if (client.buffer.length < 10) return;
      const length = client.buffer.readBigUInt64BE(2);
      if (length > BigInt(1_000_000)) return closeFrame(client.socket);
      payloadLength = Number(length);
      offset = 10;
    }

    const maskOffset = masked ? 4 : 0;
    const frameLength = offset + maskOffset + payloadLength;
    if (client.buffer.length < frameLength) return;

    let payload = client.buffer.subarray(offset + maskOffset, frameLength);
    if (masked) {
      const mask = client.buffer.subarray(offset, offset + 4);
      payload = Buffer.from(payload);
      for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
    }
    client.buffer = client.buffer.subarray(frameLength);

    if (opcode === 0x8) {
      closeFrame(client.socket);
      return;
    }
    if (opcode === 0x9) {
      client.socket.write(Buffer.from([0x8a, 0x00]));
      continue;
    }
    if (opcode !== 0x1) continue;

    try {
      handleMessage(client, JSON.parse(payload.toString('utf8')));
    } catch {
      // Ignore malformed client messages.
    }
  }
}

fillInitialLoot();
initBases();
initResources();
initZombies();
setInterval(respawnLoot, 45_000).unref();
setInterval(spawnAirdrop, AIRDROP_INTERVAL).unref();
setInterval(() => updateAirdrops(Date.now()), 1000).unref();
setInterval(() => updateZombies(Date.now()), ZOMBIE_TICK_MS).unref();
setInterval(() => updateResources(Date.now()), 1000).unref();

server.listen(PORT, () => {
  console.log(`Dayza multiplayer server running at http://localhost:${PORT}`);
});
