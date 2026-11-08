import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.js';
import { createWorld } from './world.js';
import {
  buildWeaponModel, createSurvivor, createZombie, makeShell, setAvatarLabelText,
} from './models.js';
import {
  CRAFTING_RECIPES, ITEM_TEMPLATES, PLAYER_MAX_HEALTH, RARITY, RESOURCE_TYPES,
} from './world-data.js';

const $ = (selector) => document.querySelector(selector);
const sceneRoot = $('#scene-root');
const startScreen = $('#start-screen');
const enterButton = $('#enter-button');
const connectionLabel = $('#connection-label');
const statusDot = $('.status-dot');
const playerCount = $('#player-count');
const positionX = $('#position-x');
const positionZ = $('#position-z');
const movementState = $('#movement-state');
const viewMode = $('#view-mode');
const weaponName = $('#weapon-name');
const crosshair = $('#crosshair');
const interactionPrompt = $('#interaction-prompt');
const interactionText = $('#interaction-text');
const lootFeed = $('#loot-feed');
const minimap = $('#minimap');
const minimapRegion = $('#minimap-region');
const teamIndicator = $('#team-indicator');
const ammoMag = $('#ammo-mag');
const ammoReserve = $('#ammo-reserve');
const ammoType = $('#ammo-type');
const reloadFill = $('#reload-fill');
const reloadLabel = $('#reload-label');
const healthFill = $('#health-fill');
const healthValue = $('#health-value');
const healthState = $('#health-state');
const healthHint = $('#health-hint');
const damageVignette = $('#damage-vignette');
const threatIndicator = $('#threat-indicator');
const baseStatus = $('#base-status');
const baseStatusName = $('#base-status-name');
const baseStatusDetail = $('#base-status-detail');
const deathOverlay = $('#death-overlay');
const deathSummary = $('#death-summary');
const deathFootnote = $('#death-footnote');
const respawnBaseButton = $('#respawn-base');
const respawnCampButton = $('#respawn-camp');

const inventoryOverlay = $('#inventory-overlay');
const inventoryClose = $('#inventory-close');
const inventorySlots = $('#inventory-slots');
const inventoryWeight = $('#inventory-weight');
const inventoryCapacity = $('#inventory-capacity');
const inventoryCount = $('#inventory-count');
const selectedItemCode = $('#selected-item-code');
const selectedItemName = $('#selected-item-name');
const selectedItemType = $('#selected-item-type');
const selectedItemRarity = $('#selected-item-rarity');
const selectedItemDescription = $('#selected-item-description');
const selectedItemWeight = $('#selected-item-weight');
const selectedItemAmmo = $('#selected-item-ammo');
const inventoryAction = $('#inventory-action');
const inventoryDrop = $('#inventory-drop');
const equippedPrimary = $('#equipped-primary');
const equippedSecondary = $('#equipped-secondary');
const equippedPrimaryAmmo = $('#equipped-primary-ammo');
const equippedSecondaryAmmo = $('#equipped-secondary-ammo');
const equippedBody = $('#equipped-body');
const equippedBodyStat = $('#equipped-body-stat');
const equippedHead = $('#equipped-head');
const equippedBackpack = $('#equipped-backpack');
const equippedBackpackStat = $('#equipped-backpack-stat');

const profileOverlay = $('#profile-overlay');
const profileOpen = $('#profile-open');
const profileClose = $('#profile-close');
const profileNameInput = $('#profile-name-input');
const profileSave = $('#profile-save');
const profileAvatarLetter = $('#profile-avatar-letter');
const profileId = $('#profile-id');
const profilePlaytime = $('#profile-playtime');
const profileLoadoutItems = $('#profile-loadout-items');
const profileLooted = $('#profile-looted');

const clanOverlay = $('#clan-overlay');
const clanClose = $('#clan-close');
const clanSelf = $('#clan-self');
const clanRoster = $('#clan-roster');
const clanActions = $('#clan-actions');
const clanInvites = $('#clan-invites');
const clanCreatePanel = $('#clan-create-panel');
const clanCreateForm = $('#clan-create-form');
const clanNameInput = $('#clan-name-input');
const clanTagInput = $('#clan-tag-input');
const clanList = $('#clan-list');
const clanCount = $('#clan-count');
const clanSelfCount = $('#survivor-count');
const survivorList = $('#survivor-list');
const clanInvitePopup = $('#clan-invite-popup');
const clanInviteName = $('#clan-invite-name');
const clanInviteFrom = $('#clan-invite-from');
const clanInviteAccept = $('#clan-invite-accept');
const clanInviteDecline = $('#clan-invite-decline');

const mapOverlay = $('#map-overlay');
const mapOpen = $('#map-open');
const mapClose = $('#map-close');
const fullMap = $('#full-map');
const errorToast = $('#connection-error');

const craftOverlay = $('#craft-overlay');
const craftClose = $('#craft-close');
const craftResources = $('#craft-resources');
const craftRecipes = $('#craft-recipes');
const craftCount = $('#craft-count');
const chestOverlay = $('#chest-overlay');
const chestClose = $('#chest-close');
const chestTitle = $('#chest-title');
const chestPackSlots = $('#chest-pack-slots');
const chestSlots = $('#chest-slots');
const chestPackCount = $('#chest-pack-count');
const chestStorageCount = $('#chest-storage-count');
const chestStorageLabel = $('#chest-storage-label');
const chestFooterText = $('#chest-footer-text');

// ---------------------------------------------------------------------------
// Renderer, lighting, world
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color('#aebbb6');
scene.fog = new THREE.Fog('#aebbb6', 110, 470);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.08, 900);
camera.position.set(8, 6, 12);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
sceneRoot.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight('#e4efe6', '#2c3a40', 1.9);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight('#fff1d6', 3.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 240;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = .025;
scene.add(sun);
scene.add(sun.target);

const world = createWorld(scene);

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------
const INVENTORY_SIZE = 24;
const inventoryItems = new Array(INVENTORY_SIZE).fill(null);
const equipped = { primary: null, secondary: null, throwable: null, body: null, head: null, backpack: null };
const players = new Map();
const lootMeshes = new Map();
const airdropMeshes = new Map();
const zombieMeshes = new Map();
const serverBases = new Map();
const resourceStates = new Map();
const keys = new Set();
const movementVelocity = new THREE.Vector3();
const upAxis = new THREE.Vector3(0, 1, 0);
const clock = new THREE.Clock();
const sessionStartedAt = performance.now();

let selfId = null;
let localPlayer = null;
let hasEntered = false;
let yaw = 0;
let pitch = -.18;
let networkTimer = 0;
let isFirstPerson = false;
let isAiming = false;
let inventoryOpen = false;
let profileOpenState = false;
let clanOpenState = false;
let mapOpenState = false;
let selectedInventoryIndex = -1;
let verticalVelocity = 0;
let isGrounded = true;
let triggerHeld = false;
let activeSlot = 'primary';
let lastShotAt = 0;
let recoilKick = 0;
let recoilPitch = 0;
let reloadState = null;
let shellTimer = 0;
let nearestLoot = null;
let nearestInteraction = null;
let lootSecured = 0;
let health = PLAYER_MAX_HEALTH;
let isDead = false;
let zombieKills = 0;
let openChestBaseId = null;
let chestContents = [];
let chestCapacity = 12;
let craftingOpenState = false;
let chestOpenState = false;
let respawnBaseId = null;
let lastDamageFlashAt = 0;
let lastThreatUpdate = 0;
let lastBaseStatusUpdate = 0;
let currentClans = [];
let pendingInvites = [];
let activeInvite = null;
let lastMinimapDraw = 0;

let profileName = `RANGER-${Math.floor(100 + Math.random() * 900)}`;
let survivorId = `DZ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
try {
  const storedName = (localStorage.getItem('dayza.profileName') || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 18);
  profileName = storedName || profileName;
  survivorId = localStorage.getItem('dayza.survivorId') || survivorId;
  localStorage.setItem('dayza.survivorId', survivorId);
} catch {
  // Local storage may be disabled; the profile still works for this session.
}

const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
const socketListeners = new Map();
let socketConnected = false;

function onSocket(event, listener) {
  const listeners = socketListeners.get(event) || [];
  listeners.push(listener);
  socketListeners.set(event, listeners);
}

function emitSocketEvent(event, payload) {
  (socketListeners.get(event) || []).forEach((listener) => listener(payload));
}

socket.addEventListener('open', () => {
  socketConnected = true;
  emitSocketEvent('connect');
});
socket.addEventListener('close', () => {
  socketConnected = false;
  emitSocketEvent('disconnect');
});
socket.addEventListener('error', () => emitSocketEvent('connect_error'));
socket.addEventListener('message', (event) => {
  try {
    const message = JSON.parse(event.data);
    emitSocketEvent(message.type, message.type === 'playerLeft' ? message.id : message);
  } catch {
    // Ignore malformed server messages.
  }
});

function sendMessage(type, payload = {}) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...payload }));
}

function showToast(text) {
  errorToast.textContent = text;
  errorToast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => errorToast.classList.remove('visible'), 3600);
}

function addLootFeed(text, color = '#d5f55a') {
  const row = document.createElement('div');
  row.className = 'loot-toast';
  row.style.setProperty('--item-color', color);
  row.textContent = text;
  lootFeed.appendChild(row);
  window.setTimeout(() => row.remove(), 3900);
  while (lootFeed.children.length > 5) lootFeed.firstElementChild.remove();
}

// ---------------------------------------------------------------------------
// Inventory + items
// ---------------------------------------------------------------------------
let itemSequence = 1;

function makeItem(templateId, quantity = 1) {
  const template = ITEM_TEMPLATES[templateId];
  if (!template) return null;
  return {
    uid: `item-${itemSequence++}`,
    templateId,
    quantity,
    mag: template.magSize ? template.magSize : null,
  };
}

function itemTemplate(item) {
  return item ? ITEM_TEMPLATES[item.templateId] : null;
}

function itemWeight(item) {
  const template = itemTemplate(item);
  return template ? template.weight * item.quantity : 0;
}

function inventoryTotalWeight() {
  return inventoryItems.reduce((total, item) => total + itemWeight(item), 0);
}

function backpackBonus() {
  return equipped.backpack ? (itemTemplate(equipped.backpack)?.capacityBonus || 0) : 0;
}

function weightLimit() {
  return 20 + backpackBonus() * 1.4;
}

function canStoreItem(templateId, quantity = 1) {
  const template = ITEM_TEMPLATES[templateId];
  if (!template) return false;
  let room = 0;
  for (const item of inventoryItems) {
    if (!item) {
      room += template.stackable ? (template.maxStack || 1) : 1;
    } else if (template.stackable && item.templateId === templateId) {
      room += Math.max(0, (template.maxStack || 1) - item.quantity);
    }
    if (room >= quantity) return true;
  }
  return room >= quantity;
}

function addItem(templateId, quantity = 1) {
  const template = ITEM_TEMPLATES[templateId];
  if (!template) return null;
  let remaining = quantity;
  let primary = null;

  if (template.stackable) {
    for (const item of inventoryItems) {
      if (!item || item.templateId !== templateId) continue;
      const space = Math.max(0, (template.maxStack || 1) - item.quantity);
      if (!space) continue;
      const moved = Math.min(space, remaining);
      item.quantity += moved;
      remaining -= moved;
      primary = primary || item;
      if (!remaining) break;
    }
  }

  while (remaining > 0) {
    const index = inventoryItems.findIndex((item) => !item);
    if (index === -1) break;
    const moved = template.stackable ? Math.min(template.maxStack || 1, remaining) : 1;
    const item = makeItem(templateId, moved);
    inventoryItems[index] = item;
    primary = primary || item;
    remaining -= moved;
    if (!template.stackable) break;
  }

  return primary;
}

function findItemByTemplate(templateId) {
  return inventoryItems.find((item) => item?.templateId === templateId) || null;
}

function slotOfItem(item) {
  return inventoryItems.indexOf(item);
}

function isEquipped(item) {
  return Boolean(item) && Object.values(equipped).includes(item);
}

function equipSlotFor(item) {
  const template = itemTemplate(item);
  if (!template) return null;
  if (template.category === 'weapon') return template.slot === 'secondary' ? 'secondary' : 'primary';
  if (template.category === 'throwable') return 'throwable';
  if (['body', 'head', 'backpack'].includes(template.slot)) return template.slot;
  return null;
}

function equipItem(item) {
  const slot = equipSlotFor(item);
  if (!slot) return;
  equipped[slot] = item;
  if (slot === 'primary' || slot === 'secondary' || slot === 'throwable') {
    activeSlot = slot;
    reloadState = null;
    refreshWeaponModel();
  }
  renderInventory();
  updateProfilePanel();
}

function clearEquipped(item) {
  for (const key of Object.keys(equipped)) {
    if (equipped[key] === item) {
      equipped[key] = null;
      if (key === activeSlot) refreshWeaponModel();
    }
  }
}

function consumeOne(item) {
  const index = slotOfItem(item);
  if (index === -1) return;
  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    clearEquipped(item);
    inventoryItems[index] = null;
    if (selectedInventoryIndex === index) selectedInventoryIndex = -1;
  }
  renderInventory();
  updateProfilePanel();
}

function useConsumable(item) {
  const template = itemTemplate(item);
  if (!template?.use) return;
  if (template.category === 'medical') {
    const boost = item.templateId === 'morphine' || item.templateId === 'saline' ? 22 : 12;
    applyHeal(boost);
    addLootFeed(`USED ${template.name.toUpperCase()} · +${boost} HP`, template.color);
  } else if (template.category === 'food') {
    applyHeal(4);
    addLootFeed(`CONSUMED ${template.name.toUpperCase()} · +4 HP`, template.color);
  } else {
    addLootFeed(`${template.name.toUpperCase()} — NO FUNCTION YET`, template.color);
    return;
  }
  consumeOne(item);
}

function applyHeal(amount) {
  const before = health;
  health = Math.min(PLAYER_MAX_HEALTH, health + amount);
  const gained = Math.round(health - before);
  if (gained > 0) sendMessage('playerHeal', { amount: gained });
  updateHealthHud();
}

function dropItem(item) {
  const template = itemTemplate(item);
  if (!template) return;
  const index = slotOfItem(item);
  clearEquipped(item);
  inventoryItems[index] = null;
  if (selectedInventoryIndex === index) selectedInventoryIndex = -1;
  sendMessage('lootDrop', { itemId: item.templateId, quantity: item.quantity });
  addLootFeed(`DROPPED ${template.name.toUpperCase()} ×${item.quantity}`, template.color);
  renderInventory();
  updateProfilePanel();
}

function reserveFor(item) {
  const template = itemTemplate(item);
  if (!template?.ammoType) return 0;
  return inventoryItems.reduce((total, entry) => {
    if (!entry || entry.templateId !== template.ammoType) return total;
    return total + entry.quantity;
  }, 0);
}

function ammoCountText(item) {
  const template = itemTemplate(item);
  if (!template?.magSize || !item) return 'NO WEAPON';
  return `${item.mag ?? template.magSize} / ${reserveFor(item)} RDS`;
}

function renderInventory() {
  inventorySlots.innerHTML = '';
  for (let index = 0; index < INVENTORY_SIZE; index += 1) {
    const item = inventoryItems[index];
    const template = itemTemplate(item);
    const rarityColor = template ? RARITY[template.rarity] || RARITY.common : '#d5f55a';
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `inventory-slot${item ? '' : ' empty'}${index === selectedInventoryIndex ? ' selected' : ''}${isEquipped(item) ? ' equipped' : ''}`;
    slot.setAttribute('aria-label', item ? template.name : 'Empty inventory slot');
    slot.style.setProperty('--item-color', rarityColor);
    slot.addEventListener('click', () => {
      selectedInventoryIndex = index;
      renderInventory();
    });
    slot.addEventListener('dragover', (event) => event.preventDefault());
    slot.addEventListener('drop', (event) => {
      event.preventDefault();
      const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
      if (!Number.isInteger(sourceIndex) || sourceIndex === index || !inventoryItems[sourceIndex]) return;
      [inventoryItems[sourceIndex], inventoryItems[index]] = [inventoryItems[index], inventoryItems[sourceIndex]];
      selectedInventoryIndex = index;
      renderInventory();
    });

    if (item) {
      slot.draggable = true;
      slot.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', String(index)));
      slot.innerHTML = `<span class="item-code">${template.short}</span><span class="item-name">${template.name}</span>${item.quantity > 1 ? `<span class="item-qty">×${item.quantity}</span>` : ''}${isEquipped(item) ? '<span class="equip-badge">EQUIPPED</span>' : ''}`;
    }
    inventorySlots.appendChild(slot);
  }

  const totalWeight = inventoryTotalWeight();
  const limit = weightLimit();
  inventoryWeight.textContent = `${totalWeight.toFixed(1)} / ${limit.toFixed(1)} KG`;
  inventoryWeight.style.color = totalWeight > limit ? '#ff9b9b' : '';
  const used = inventoryItems.filter(Boolean).length;
  inventoryCount.textContent = `${used} / ${INVENTORY_SIZE}`;
  inventoryCapacity.textContent = `${INVENTORY_SIZE} SLOTS${backpackBonus() ? ` (+${backpackBonus()} KG)` : ''}`;

  const primaryTemplate = itemTemplate(equipped.primary);
  const secondaryTemplate = itemTemplate(equipped.secondary);
  equippedPrimary.textContent = primaryTemplate ? primaryTemplate.name.toUpperCase() : 'EMPTY';
  equippedSecondary.textContent = secondaryTemplate ? secondaryTemplate.name.toUpperCase() : 'EMPTY';
  equippedPrimaryAmmo.textContent = ammoCountText(equipped.primary);
  equippedSecondaryAmmo.textContent = ammoCountText(equipped.secondary);
  equippedBody.textContent = equipped.body ? itemTemplate(equipped.body).name.toUpperCase() : 'EMPTY';
  equippedBodyStat.textContent = equipped.body ? `ARMOR ${itemTemplate(equipped.body).armor || 0}` : 'NO ARMOR';
  equippedHead.textContent = equipped.head ? itemTemplate(equipped.head).name.toUpperCase() : 'EMPTY';
  equippedBackpack.textContent = equipped.backpack ? itemTemplate(equipped.backpack).name.toUpperCase() : 'EMPTY';
  equippedBackpackStat.textContent = equipped.backpack ? `+${backpackBonus()} KG CAPACITY` : 'NO STORAGE';
  equipSlotFor(equipped.primary) && (equippedPrimary.parentElement.classList.remove('empty'));
  if (!equipped.primary) equippedPrimary.parentElement.classList.add('empty');
  if (!equipped.secondary) equippedSecondary.parentElement.classList.add('empty');
  if (!equipped.body) equippedBody.parentElement.classList.add('empty');
  if (!equipped.head) equippedHead.parentElement.classList.add('empty');
  if (!equipped.backpack) equippedBackpack.parentElement.classList.add('empty');

  const selectedItem = inventoryItems[selectedInventoryIndex] || null;
  const selectedTemplate = itemTemplate(selectedItem);
  if (!selectedItem) {
    selectedItemCode.textContent = '— — —';
    selectedItemName.textContent = 'EMPTY SLOT';
    selectedItemType.textContent = 'NO ITEM SELECTED';
    selectedItemRarity.textContent = '—';
    selectedItemRarity.style.setProperty('--rarity-color', 'var(--muted)');
    selectedItemDescription.textContent = 'Select an item in your field pack to inspect it.';
    selectedItemWeight.textContent = '—';
    selectedItemAmmo.textContent = '—';
    inventoryAction.disabled = true;
    inventoryDrop.disabled = true;
    inventoryAction.textContent = 'EQUIP';
    return;
  }

  const rarity = RARITY[selectedTemplate.rarity] || RARITY.common;
  selectedItemCode.textContent = selectedTemplate.short;
  selectedItemCode.style.color = rarity;
  selectedItemName.textContent = selectedTemplate.name.toUpperCase();
  selectedItemType.textContent = selectedTemplate.type;
  selectedItemRarity.textContent = selectedTemplate.rarity.toUpperCase();
  selectedItemRarity.style.setProperty('--rarity-color', rarity);
  selectedItemDescription.textContent = selectedTemplate.description;
  selectedItemWeight.textContent = `${(selectedTemplate.weight * selectedItem.quantity).toFixed(2)} KG`;
  selectedItemAmmo.textContent = selectedTemplate.magSize
    ? `${selectedItem.mag ?? selectedTemplate.magSize} / ${reserveFor(selectedItem)}`
    : selectedTemplate.ammoType ? `${selectedItem.quantity} RDS` : '—';
  inventoryAction.disabled = false;
  inventoryDrop.disabled = false;

  const slot = equipSlotFor(selectedItem);
  if (slot && equipped[slot] === selectedItem) inventoryAction.textContent = 'EQUIPPED';
  else if (slot) inventoryAction.textContent = 'EQUIP';
  else if (selectedTemplate.use) inventoryAction.textContent = 'USE';
  else inventoryAction.textContent = 'INSPECT';
}

inventoryAction.addEventListener('click', () => {
  const item = inventoryItems[selectedInventoryIndex];
  if (!item) return;
  const template = itemTemplate(item);
  if (equipSlotFor(item)) {
    equipItem(item);
  } else if (template.use) {
    useConsumable(item);
  } else {
    addLootFeed(`${template.name.toUpperCase()} — NO USE`, template.color);
  }
});

inventoryDrop.addEventListener('click', () => {
  const item = inventoryItems[selectedInventoryIndex];
  if (item) dropItem(item);
});

inventoryClose.addEventListener('click', () => toggleInventory(false));
inventoryOverlay.addEventListener('click', (event) => {
  if (event.target === inventoryOverlay) toggleInventory(false);
});

function toggleInventory(nextState = !inventoryOpen) {
  if (nextState && (!hasEntered || isDead)) return;
  if (nextState) {
    if (profileOpenState) toggleProfile(false);
    if (clanOpenState) toggleClan(false);
    if (mapOpenState) toggleMap(false);
    if (craftingOpenState) toggleCrafting(false);
    if (chestOpenState) toggleChest(false);
  }
  inventoryOpen = nextState;
  inventoryOverlay.classList.toggle('open', inventoryOpen);
  inventoryOverlay.setAttribute('aria-hidden', String(!inventoryOpen));
  if (inventoryOpen) {
    isAiming = false;
    triggerHeld = false;
    keys.clear();
    document.exitPointerLock?.();
    renderInventory();
  }
}

function updateVitals() {
  updateHealthHud();
}

function currentBaseForSelf() {
  if (!selfId) return null;
  for (const base of serverBases.values()) {
    if (base.claimedBy === selfId) return base;
  }
  return null;
}

function updateHealthHud() {
  const ratio = THREE.MathUtils.clamp(health / PLAYER_MAX_HEALTH, 0, 1);
  healthFill.style.width = `${Math.round(ratio * 100)}%`;
  healthValue.textContent = String(Math.ceil(health));
  healthFill.classList.toggle('hurt', ratio <= .65 && ratio > .25);
  healthFill.classList.toggle('critical', ratio <= .25);
  healthState.classList.toggle('critical', ratio <= .25);
  healthState.classList.toggle('hurt', ratio <= .65 && ratio > .25);
  if (isDead) {
    healthState.textContent = 'SIGNAL LOST';
    healthHint.textContent = 'AWAITING RESPAWN';
  } else if (ratio <= .25) {
    healthState.textContent = 'CRITICAL';
    healthHint.textContent = 'SEEK SHELTER NOW';
  } else if (ratio <= .65) {
    healthState.textContent = 'WOUNDED';
    healthHint.textContent = 'USE MEDICAL SUPPLIES';
  } else {
    healthState.textContent = 'STABLE';
    healthHint.textContent = currentBaseForSelf() ? 'SHELTER SECURED' : 'VITALS MONITORED';
  }

  const profileStatus = $('#profile-status');
  if (ratio > .65) {
    profileStatus.textContent = 'HEALTHY';
    profileStatus.style.color = 'var(--lime)';
  } else if (ratio > .3) {
    profileStatus.textContent = 'WOUNDED';
    profileStatus.style.color = '#ffd166';
  } else {
    profileStatus.textContent = isDead ? 'DECEASED' : 'CRITICAL';
    profileStatus.style.color = '#ff8c69';
  }
}

function flashDamage() {
  const now = performance.now();
  if (now - lastDamageFlashAt < 90) return;
  lastDamageFlashAt = now;
  damageVignette.classList.add('active');
  window.setTimeout(() => damageVignette.classList.remove('active'), 160);
}

// ---------------------------------------------------------------------------
// Crafting, stashes, shelter status
// ---------------------------------------------------------------------------
function inventoryCountOf(templateId) {
  return inventoryItems.reduce((total, item) => (item?.templateId === templateId ? total + item.quantity : total), 0);
}

function removeInventoryQuantity(templateId, quantity) {
  let remaining = quantity;
  for (let index = 0; index < inventoryItems.length && remaining > 0; index += 1) {
    const item = inventoryItems[index];
    if (!item || item.templateId !== templateId) continue;
    const taken = Math.min(item.quantity, remaining);
    item.quantity -= taken;
    remaining -= taken;
    if (item.quantity <= 0) {
      clearEquipped(item);
      inventoryItems[index] = null;
      if (selectedInventoryIndex === index) selectedInventoryIndex = -1;
    }
  }
  return quantity - remaining;
}

function canCraft(recipe) {
  if (!Object.entries(recipe.cost).every(([id, amount]) => inventoryCountOf(id) >= amount)) return false;
  return canStoreItem(recipe.output.itemId, recipe.output.quantity);
}

function craftRecipe(recipe) {
  if (!canCraft(recipe)) {
    showToast('Missing materials or free pack space');
    return;
  }
  for (const [id, amount] of Object.entries(recipe.cost)) removeInventoryQuantity(id, amount);
  const item = addItem(recipe.output.itemId, recipe.output.quantity);
  if (!item) {
    showToast('Field pack is full');
    renderCrafting();
    return;
  }
  const template = ITEM_TEMPLATES[recipe.output.itemId];
  const slot = equipSlotFor(item);
  if (slot && !equipped[slot]) equipItem(item);
  addLootFeed(`CRAFTED · ${template.name.toUpperCase()}${recipe.output.quantity > 1 ? ` ×${recipe.output.quantity}` : ''}`, RARITY[template.rarity] || '#d5f55a');
  renderInventory();
  updateProfilePanel();
  renderCrafting();
}

function renderCrafting() {
  craftResources.innerHTML = Object.keys(RESOURCE_TYPES).map((resourceId) => {
    const template = ITEM_TEMPLATES[resourceId];
    const count = inventoryCountOf(resourceId);
    return `<div class="craft-resource" style="--resource-color:${RESOURCE_TYPES[resourceId].color}"><i></i><span>${(template?.name || resourceId).toUpperCase()}<strong>${count}</strong></span></div>`;
  }).join('');

  let ready = 0;
  craftRecipes.innerHTML = '';
  for (const recipe of CRAFTING_RECIPES) {
    const canMake = canCraft(recipe);
    if (canMake) ready += 1;
    const outputTemplate = ITEM_TEMPLATES[recipe.output.itemId];
    const card = document.createElement('article');
    card.className = `craft-card${canMake ? ' ready' : ''}`;
    const cost = Object.entries(recipe.cost).map(([id, amount]) => {
      const have = inventoryCountOf(id);
      const missing = have < amount;
      return `<span class="${missing ? 'missing' : ''}">${(ITEM_TEMPLATES[id]?.short || id).toUpperCase()} ${have}/${amount}</span>`;
    }).join('');
    card.innerHTML = `
      <div class="craft-card-head"><h3>${recipe.name.toUpperCase()}</h3><span class="craft-level">${recipe.category}</span></div>
      <p>${recipe.description}</p>
      <div class="craft-cost">${cost}</div>
      <button type="button" ${canMake ? '' : 'disabled'}>CRAFT ${outputTemplate ? outputTemplate.name.toUpperCase() : ''}</button>`;
    card.querySelector('button').addEventListener('click', () => craftRecipe(recipe));
    craftRecipes.appendChild(card);
  }
  craftCount.textContent = `${ready} / ${CRAFTING_RECIPES.length} READY`;
}

function toggleCrafting(nextState = !craftingOpenState) {
  if (nextState && !hasEntered) return;
  if (nextState) {
    if (inventoryOpen) toggleInventory(false);
    if (craftingOpenState) return;
    if (profileOpenState) toggleProfile(false);
    if (clanOpenState) toggleClan(false);
    if (mapOpenState) toggleMap(false);
    if (chestOpenState) toggleChest(false);
    if (isDead) return;
  }
  craftingOpenState = nextState;
  craftOverlay.classList.toggle('open', craftingOpenState);
  craftOverlay.setAttribute('aria-hidden', String(!craftingOpenState));
  if (craftingOpenState) {
    isAiming = false;
    triggerHeld = false;
    keys.clear();
    document.exitPointerLock?.();
    renderCrafting();
  }
}

function chestSlot(item, emptyLabel, onClick) {
  const template = itemTemplate(item);
  const slot = document.createElement('button');
  slot.type = 'button';
  slot.className = `inventory-slot${item ? '' : ' empty'}`;
  slot.style.setProperty('--item-color', template ? RARITY[template.rarity] || RARITY.common : '#d5f55a');
  if (item) {
    slot.innerHTML = `<span class="item-code">${template.short}</span><span class="item-name">${template.name}</span>${item.quantity > 1 ? `<span class="item-qty">×${item.quantity}</span>` : ''}`;
    slot.addEventListener('click', onClick);
  } else {
    slot.textContent = emptyLabel || '';
  }
  return slot;
}

function renderChest() {
  chestPackSlots.innerHTML = '';
  let used = 0;
  inventoryItems.forEach((item) => {
    if (!item) return;
    used += 1;
    const template = itemTemplate(item);
    const slot = chestSlot(item, null, () => {
      if (!openChestBaseId) return;
      pendingChestStore = { id: item.uid, quantity: item.quantity };
      sendMessage('chestStore', { baseId: openChestBaseId, itemId: item.templateId, quantity: item.quantity });
    });
    slot.title = `Store ${template.name}`;
    chestPackSlots.appendChild(slot);
  });
  for (let i = used; i < INVENTORY_SIZE; i += 1) chestPackSlots.appendChild(chestSlot(null));
  chestPackCount.textContent = `${used} / ${INVENTORY_SIZE}`;

  chestSlots.innerHTML = '';
  for (let index = 0; index < chestCapacity; index += 1) {
    const entry = chestContents[index];
    if (!entry) {
      chestSlots.appendChild(chestSlot(null));
      continue;
    }
    const item = { uid: `chest-${index}`, templateId: entry.itemId, quantity: entry.quantity, mag: null };
    const slot = chestSlot(item, null, () => {
      if (!openChestBaseId) return;
      sendMessage('chestTake', { baseId: openChestBaseId, index });
    });
    slot.title = 'Take item';
    chestSlots.appendChild(slot);
  }
  chestStorageCount.textContent = `${chestContents.length} / ${chestCapacity}`;
  const base = serverBases.get(openChestBaseId);
  chestTitle.textContent = base ? `${base.name} STASH` : 'STASH';
  chestStorageLabel.textContent = base?.ownerName ? `${base.ownerName} STASH` : 'STASH CONTENTS';
}

let pendingChestStore = null;

function toggleChest(nextState = !chestOpenState) {
  if (nextState && (!hasEntered || isDead)) return;
  if (nextState) {
    if (inventoryOpen) toggleInventory(false);
    if (craftingOpenState) toggleCrafting(false);
    if (profileOpenState) toggleProfile(false);
    if (clanOpenState) toggleClan(false);
    if (mapOpenState) toggleMap(false);
    if (!openChestBaseId) return;
  }
  chestOpenState = nextState;
  chestOverlay.classList.toggle('open', chestOpenState);
  chestOverlay.setAttribute('aria-hidden', String(!chestOpenState));
  if (chestOpenState) {
    isAiming = false;
    triggerHeld = false;
    keys.clear();
    document.exitPointerLock?.();
    renderChest();
  } else {
    openChestBaseId = null;
    chestContents = [];
    pendingChestStore = null;
  }
}

function openChest(baseId) {
  openChestBaseId = baseId;
  pendingChestStore = null;
  chestContents = [];
  sendMessage('chestOpen', { baseId });
}

function applyBaseState(list) {
  if (!Array.isArray(list)) return;
  serverBases.clear();
  for (const base of list) {
    serverBases.set(base.id, base);
    const color = base.claimedBy === selfId ? '#d5f55a'
      : base.ownerClanId && selfClan()?.id === base.ownerClanId ? selfClan().color : '#7bdff2';
    world.setBaseClaim(base.id, base.ownerName, color);
  }
  updateBaseStatus();
  updateHealthHud();
  if (chestOpenState) renderChest();
}

function nearestBaseToLocal(maxDistance = 34) {
  if (!localPlayer) return null;
  let best = null;
  let bestDistance = maxDistance;
  for (const base of serverBases.values()) {
    const distance = Math.hypot(localPlayer.position.x - base.x, localPlayer.position.z - base.z);
    if (distance < bestDistance) { bestDistance = distance; best = { base, distance }; }
  }
  return best;
}

function updateBaseStatus() {
  const owned = currentBaseForSelf();
  const near = nearestBaseToLocal();
  baseStatus.classList.remove('claimed', 'owner');
  if (owned) {
    baseStatus.classList.add('claimed');
    baseStatusName.textContent = owned.name;
    baseStatusDetail.textContent = `YOUR SHELTER · ${owned.short || ''}`.trim();
    return;
  }
  if (near) {
    const { base, distance } = near;
    if (base.claimedBy && base.ownerClanId && selfClan()?.id === base.ownerClanId) {
      baseStatus.classList.add('owner');
      baseStatusName.textContent = base.name;
      baseStatusDetail.textContent = 'CLAN SHELTER';
    } else if (base.claimedBy) {
      baseStatusName.textContent = base.name;
      baseStatusDetail.textContent = `CLAIMED BY ${base.ownerName || 'SURVIVOR'}`;
    } else {
      baseStatusName.textContent = base.name;
      baseStatusDetail.textContent = distance < base.claimRadius + 7 ? 'E TO CLAIM SHELTER' : 'UNCLAIMED SHELTER';
    }
    return;
  }
  baseStatusName.textContent = 'NO BASE';
  baseStatusDetail.textContent = 'FIND A HOUSE TO CLAIM';
}

craftClose.addEventListener('click', () => toggleCrafting(false));
craftOverlay.addEventListener('click', (event) => {
  if (event.target === craftOverlay) toggleCrafting(false);
});
chestClose.addEventListener('click', () => toggleChest(false));
chestOverlay.addEventListener('click', (event) => {
  if (event.target === chestOverlay) toggleChest(false);
});

// ---------------------------------------------------------------------------
// Weapons, ammunition, reloading
// ---------------------------------------------------------------------------
const weaponRoot = new THREE.Group();
weaponRoot.visible = false;
camera.add(weaponRoot);
let currentWeaponModel = null;

function activeWeaponItem() {
  let item = equipped[activeSlot];
  if (!item) {
    for (const slot of ['primary', 'secondary', 'throwable']) {
      if (equipped[slot]) { activeSlot = slot; item = equipped[slot]; break; }
    }
  }
  return item || null;
}

function activeWeaponTemplate() {
  return itemTemplate(activeWeaponItem());
}

function refreshWeaponModel() {
  weaponRoot.clear();
  currentWeaponModel = null;
  const item = activeWeaponItem();
  const template = itemTemplate(item);
  if (item && template) {
    const modelId = template.model || template.throwable;
    if (modelId) {
      currentWeaponModel = buildWeaponModel(modelId);
      weaponRoot.add(currentWeaponModel);
    }
    weaponName.textContent = template.name.toUpperCase();
  } else {
    weaponName.textContent = 'UNARMED';
  }
  updateAmmoHud();
}

function updateAmmoHud() {
  const item = activeWeaponItem();
  const template = itemTemplate(item);
  if (!item || !template) {
    ammoMag.textContent = '—';
    ammoReserve.textContent = '—';
    ammoType.textContent = 'NO WEAPON';
    reloadLabel.textContent = 'UNARMED';
    reloadFill.style.width = '0%';
    return;
  }
  if (template.category === 'throwable') {
    ammoMag.textContent = String(item.quantity);
    ammoReserve.textContent = '×';
    ammoType.textContent = template.type;
    reloadLabel.textContent = 'THROWABLE READY';
    reloadFill.style.width = '0%';
    return;
  }
  ammoMag.textContent = String(item.mag ?? 0);
  ammoReserve.textContent = String(reserveFor(item));
  const ammoTemplate = ITEM_TEMPLATES[template.ammoType];
  ammoType.textContent = ammoTemplate ? ammoTemplate.name.toUpperCase() : 'AMMUNITION';
  if (!reloadState) {
    reloadLabel.textContent = (item.mag ?? 0) > 0 ? 'READY' : 'EMPTY — PRESS R';
    reloadFill.style.width = '0%';
  }
}

function removeAmmo(templateId, amount) {
  let remaining = amount;
  for (let index = 0; index < inventoryItems.length && remaining > 0; index += 1) {
    const item = inventoryItems[index];
    if (!item || item.templateId !== templateId) continue;
    const taken = Math.min(item.quantity, remaining);
    item.quantity -= taken;
    remaining -= taken;
    if (item.quantity <= 0) {
      inventoryItems[index] = null;
      if (selectedInventoryIndex === index) selectedInventoryIndex = -1;
    }
  }
  return amount - remaining;
}

function beginReload() {
  if (reloadState || !hasEntered || inventoryOpen) return;
  const item = activeWeaponItem();
  const template = itemTemplate(item);
  if (!item || !template || template.category !== 'weapon' || !template.magSize) return;
  if (slotOfItem(item) === -1) return;
  if ((item.mag ?? 0) >= template.magSize) return;
  if (reserveFor(item) <= 0) {
    showToast(`No ${ITEM_TEMPLATES[template.ammoType]?.name || 'ammunition'} left`);
    return;
  }
  reloadState = {
    item,
    template,
    startedAt: performance.now(),
    duration: template.reloadTime * 1000,
  };
  reloadLabel.textContent = 'RELOADING';
  reloadLabel.classList.add('active');
  triggerHeld = false;
}

function finishReload() {
  if (!reloadState) return;
  const { item, template } = reloadState;
  const need = template.magSize - (item.mag ?? 0);
  const available = reserveFor(item);
  const taken = removeAmmo(template.ammoType, Math.min(need, available));
  item.mag = (item.mag ?? 0) + taken;
  reloadState = null;
  reloadLabel.classList.remove('active');
  addLootFeed(`RELOADED ${template.name.toUpperCase()} · ${item.mag}/${template.magSize}`, '#d5f55a');
  updateAmmoHud();
  renderInventory();
}

const shotRaycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

function flashMuzzle() {
  const muzzle = currentWeaponModel?.userData.muzzle;
  const muzzleLight = currentWeaponModel?.userData.muzzleLight;
  if (!muzzle) return;
  muzzle.visible = true;
  if (muzzleLight) muzzleLight.intensity = 5;
  window.setTimeout(() => {
    muzzle.visible = false;
    if (muzzleLight) muzzleLight.intensity = 0;
  }, 55);
}

function addTracer(start, end, color = '#d5f55a') {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: .9 });
  const tracer = new THREE.Line(geometry, material);
  scene.add(tracer);
  window.setTimeout(() => {
    scene.remove(tracer);
    geometry.dispose();
    material.dispose();
  }, 90);
}

function addExplosion(position, color = '#ff8c69') {
  const flash = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffbf69', transparent: true, opacity: .9 }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(.12, .32, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .75, side: THREE.DoubleSide }));
  const light = new THREE.PointLight(color, 7, 9, 2);
  flash.position.copy(position);
  ring.position.copy(position);
  ring.rotation.x = -Math.PI / 2;
  light.position.copy(position);
  scene.add(flash, ring, light);

  const startTime = performance.now();
  const animateExplosion = () => {
    const progress = (performance.now() - startTime) / 360;
    if (progress >= 1) {
      scene.remove(flash, ring, light);
      flash.geometry.dispose();
      flash.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      return;
    }
    const eased = 1 - Math.pow(1 - progress, 2);
    flash.scale.setScalar(1 + eased * 2.4);
    ring.scale.setScalar(1 + eased * 5.5);
    flash.material.opacity = 1 - progress;
    ring.material.opacity = .75 * (1 - progress);
    light.intensity = 7 * (1 - progress);
    requestAnimationFrame(animateExplosion);
  };
  requestAnimationFrame(animateExplosion);
}

function spawnGrenadeProjectile(start, end, kind = 'frag') {
  const color = kind === 'smoke' ? '#9fb7ff' : '#29302d';
  const grenade = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: .18 }));
  grenade.position.copy(start);
  grenade.castShadow = true;
  scene.add(grenade);
  const startTime = performance.now();
  const duration = 680;
  const animateGrenade = () => {
    const progress = Math.min((performance.now() - startTime) / duration, 1);
    grenade.position.lerpVectors(start, end, progress);
    grenade.position.y += Math.sin(Math.PI * progress) * 4.2;
    grenade.rotation.x += .22;
    grenade.rotation.z += .16;
    if (progress < 1) {
      requestAnimationFrame(animateGrenade);
      return;
    }
    scene.remove(grenade);
    grenade.geometry.dispose();
    grenade.material.dispose();
    addExplosion(end, kind === 'smoke' ? '#9fb7ff' : '#ff8c69');
  };
  requestAnimationFrame(animateGrenade);
}

function throwGrenade() {
  const item = equipped.throwable;
  const template = itemTemplate(item);
  if (!item || !template) {
    showToast('No throwable equipped');
    return;
  }
  const now = performance.now();
  if (now - lastShotAt < 800) return;
  lastShotAt = now;

  const origin = camera.position.clone();
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const target = origin.clone().addScaledVector(direction, 18);
  target.y = Math.max(.4, groundHeightAt(target.x, target.z) + .3);
  const kind = template.throwable === 'smoke' ? 'smoke' : 'frag';
  spawnGrenadeProjectile(origin, target, kind);
  sendMessage('grenadeThrow', {
    kind,
    origin: { x: origin.x, y: origin.y, z: origin.z },
    target: { x: target.x, y: target.y, z: target.z },
  });
  consumeOne(item);
  updateAmmoHud();
}

function fireWeapon() {
  if (!hasEntered || inventoryOpen || !document.pointerLockElement) return;
  const item = activeWeaponItem();
  const template = itemTemplate(item);
  if (!item || !template) {
    showToast('You are unarmed');
    return;
  }
  if (template.category === 'throwable') {
    throwGrenade();
    return;
  }
  if (template.category !== 'weapon') return;
  if (reloadState) return;
  const now = performance.now();
  if (now - lastShotAt < template.fireInterval) return;
  lastShotAt = now;

  if ((item.mag ?? 0) <= 0) {
    showToast('Magazine empty — press R to reload');
    beginReload();
    return;
  }

  item.mag -= 1;
  recoilKick += .04 + template.recoil * .035;
  recoilPitch += .025 + template.recoil * .03;
  flashMuzzle();
  shotRaycaster.setFromCamera(screenCenter, camera);
  const targets = [];
  players.forEach((avatar) => {
    if (avatar === localPlayer) return;
    avatar.traverse((part) => { if (part.isMesh) targets.push(part); });
  });
  zombieMeshes.forEach((entry) => {
    entry.root.traverse((part) => { if (part.isMesh) targets.push(part); });
  });
  const hit = shotRaycaster.intersectObjects(targets, false)[0];
  const origin = shotRaycaster.ray.origin.clone();
  const end = hit ? hit.point.clone() : origin.clone().addScaledVector(shotRaycaster.ray.direction, 90);
  addTracer(origin, end, template.rarity === 'epic' ? '#b7c3c8' : '#ffd98a');
  sendMessage('playerShoot', {
    weapon: item.templateId,
    origin: { x: origin.x, y: origin.y, z: origin.z },
    target: { x: end.x, y: end.y, z: end.z },
  });
  updateAmmoHud();
  if (item.mag <= 0) window.setTimeout(beginReload, 220);
}

function selectWeaponSlot(slot) {
  if (!equipped[slot]) {
    showToast(`No ${slot.toUpperCase()} equipped`);
    return;
  }
  activeSlot = slot;
  reloadState = null;
  reloadLabel.classList.remove('active');
  refreshWeaponModel();
  addLootFeed(`READY · ${weaponName.textContent}`, '#d5f55a');
}

function animateWeapon(delta) {
  if (!isFirstPerson) return;
  const speed = movementVelocity.length();
  const bobAmount = THREE.MathUtils.clamp(speed / 9, 0, 1);
  weaponRoot.userData.bobTime = (weaponRoot.userData.bobTime || 0) + delta * (5 + speed * .7);
  const bobTime = weaponRoot.userData.bobTime;
  recoilKick *= Math.exp(-18 * delta);
  recoilPitch *= Math.exp(-21 * delta);
  const aimOffset = isAiming ? new THREE.Vector3(-.33, .09, .18) : new THREE.Vector3();
  const target = aimOffset.clone().add(new THREE.Vector3(
    Math.sin(bobTime * 1.7) * .012 * bobAmount,
    Math.abs(Math.cos(bobTime * 1.7)) * .018 * bobAmount,
    recoilKick,
  ));
  weaponRoot.position.lerp(target, 1 - Math.exp(-12 * delta));
  const reloadProgress = reloadState
    ? THREE.MathUtils.clamp((performance.now() - reloadState.startedAt) / reloadState.duration, 0, 1)
    : 0;
  const reloadDip = reloadState ? Math.sin(Math.PI * reloadProgress) * .55 : 0;
  weaponRoot.rotation.x = recoilPitch + reloadDip;
  weaponRoot.rotation.z = Math.sin(bobTime) * .025 * bobAmount + (reloadState ? Math.sin(reloadProgress * Math.PI * 4) * .12 : 0);
  weaponRoot.position.y -= reloadDip * .18;
}

function updateCombat(delta) {
  if (reloadState) {
    const progress = THREE.MathUtils.clamp((performance.now() - reloadState.startedAt) / reloadState.duration, 0, 1);
    reloadFill.style.width = `${Math.round(progress * 100)}%`;
    if (progress >= 1) finishReload();
  }

  if (triggerHeld && !inventoryOpen && document.pointerLockElement && hasEntered) {
    const template = activeWeaponTemplate();
    if (template?.automatic) fireWeapon();
  }

  animateWeapon(delta);
  if (!reloadState && reloadLabel.classList.contains('active')) reloadLabel.classList.remove('active');
  if (!reloadState) {
    const item = activeWeaponItem();
    const template = itemTemplate(item);
    if (template?.category === 'weapon') {
      reloadLabel.textContent = (item.mag ?? 0) > 0 ? 'READY' : 'EMPTY — PRESS R';
    }
  }
}

// ---------------------------------------------------------------------------
// Loot objects in the world
// ---------------------------------------------------------------------------
const lootBeaconGeometry = new THREE.CylinderGeometry(.16, .32, 3.2, 8, 1, true);

function lootGroundY(x, z) {
  return groundHeightAt(x, z) + .28;
}

function createLootMesh(loot) {
  if (lootMeshes.has(loot.id)) return;
  const template = ITEM_TEMPLATES[loot.itemId];
  if (!template) return;
  const color = RARITY[template.rarity] || RARITY.common;
  const group = new THREE.Group();
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(.42, .3, .34),
    new THREE.MeshStandardMaterial({ color: template.color, roughness: .72, metalness: .08 }),
  );
  crate.castShadow = true;
  crate.receiveShadow = true;
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(.44, .055, .36),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .35, roughness: .6 }),
  );
  band.position.y = .06;
  const beacon = new THREE.Mesh(lootBeaconGeometry, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: .13, side: THREE.DoubleSide, depthWrite: false,
  }));
  beacon.position.y = 1.5;
  group.add(crate, band, beacon);
  group.position.set(loot.x, lootGroundY(loot.x, loot.z), loot.z);
  group.rotation.y = Math.random() * Math.PI;
  group.userData = { lootId: loot.id, lootData: loot, baseY: group.position.y, phase: Math.random() * Math.PI * 2 };
  scene.add(group);
  lootMeshes.set(loot.id, group);
}

function removeLootMesh(id) {
  const mesh = lootMeshes.get(id);
  if (!mesh) return;
  scene.remove(mesh);
  mesh.traverse((child) => {
    if (child.geometry && child.geometry !== lootBeaconGeometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
  lootMeshes.delete(id);
  if (nearestLoot?.id === id) nearestLoot = null;
}

function updateLootMeshes(delta, time) {
  lootMeshes.forEach((mesh) => {
    mesh.rotation.y += delta * .35;
    mesh.position.y = mesh.userData.baseY + Math.sin(time * 1.6 + mesh.userData.phase) * .045;
  });
}

function createAirdropMesh(drop) {
  if (airdropMeshes.has(drop.id)) {
    const existing = airdropMeshes.get(drop.id);
    existing.userData.airdropData = { ...drop };
    return;
  }

  const group = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.35, .85, 1.05), new THREE.MeshStandardMaterial({ color: '#4f5139', roughness: .84, metalness: .08 }));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.42, .12, 1.12), new THREE.MeshStandardMaterial({ color: '#7e7250', roughness: .78, metalness: .05 }));
  lid.position.y = .5;
  const strapA = new THREE.Mesh(new THREE.BoxGeometry(.08, .96, 1.12), new THREE.MeshStandardMaterial({ color: '#c59c4e', roughness: .55, metalness: .28 }));
  const strapB = strapA.clone();
  strapA.position.x = -.34;
  strapB.position.x = .34;
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 2.4, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ff8c69', transparent: true, opacity: .2, depthWrite: false }));
  beacon.position.y = 1.8;
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(3.1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e7e1c5', roughness: .9, side: THREE.DoubleSide }));
  canopy.position.y = 5.2;
  const canopyBand = new THREE.Mesh(new THREE.TorusGeometry(2.3, .06, 8, 24), new THREE.MeshStandardMaterial({ color: '#bf6b4c', roughness: .8 }));
  canopyBand.position.y = 4.8;
  const lines = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({ color: '#d8d0b5', transparent: true, opacity: .68 });
  for (const [x, z] of [[-2.1, -1.45], [2.1, -1.45], [-2.1, 1.45], [2.1, 1.45]]) {
    lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 4.75, z),
      new THREE.Vector3(0, .85, 0),
    ]), lineMaterial));
  }
  group.add(crate, lid, strapA, strapB, beacon, canopy, canopyBand, lines);
  group.position.set(drop.x, groundHeightAt(drop.x, drop.z) + (drop.state === 'landed' ? 0 : drop.y), drop.z);
  group.userData = { airdropData: { ...drop }, beacon, canopy, canopyBand, lines, phase: Math.random() * Math.PI * 2 };
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  scene.add(group);
  airdropMeshes.set(drop.id, group);
}

function removeAirdropMesh(id) {
  const mesh = airdropMeshes.get(id);
  if (!mesh) return;
  scene.remove(mesh);
  mesh.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
  airdropMeshes.delete(id);
}

function updateAirdropMeshes(delta, time) {
  airdropMeshes.forEach((mesh) => {
    const drop = mesh.userData.airdropData;
    const floor = groundHeightAt(drop.x, drop.z);
    const flightProgress = drop.state === 'incoming' && drop.landAt > drop.spawnedAt
      ? THREE.MathUtils.clamp((Date.now() - drop.spawnedAt) / (drop.landAt - drop.spawnedAt), 0, 1)
      : 1;
    const altitude = drop.state === 'landed' ? 0 : Math.max(0, 34 * (1 - flightProgress));
    mesh.position.y = floor + altitude;
    mesh.rotation.y += delta * .08;
    mesh.userData.canopy.visible = drop.state !== 'landed';
    mesh.userData.canopyBand.visible = drop.state !== 'landed';
    mesh.userData.lines.visible = drop.state !== 'landed';
    mesh.userData.beacon.material.opacity = drop.state === 'landed' ? .12 + Math.sin(time * 2.5 + mesh.userData.phase) * .06 : 0;
  });
}

function findNearestLoot() {
  if (!localPlayer) return null;
  let best = null;
  let bestDistance = 3.8;
  lootMeshes.forEach((mesh) => {
    const dx = mesh.position.x - localPlayer.position.x;
    const dz = mesh.position.z - localPlayer.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { id: mesh.userData.lootId, distance };
    }
  });
  return best;
}

function tryPickupLoot() {
  if (!nearestLoot || !localPlayer) return;
  const loot = lootMeshes.get(nearestLoot.id)?.userData;
  if (!loot) return;
  const item = loot.lootData;
  const template = ITEM_TEMPLATES[item.itemId];
  if (!template) return;
  if (!canStoreItem(item.itemId, item.quantity) || inventoryTotalWeight() + template.weight * item.quantity > weightLimit() + 5) {
    showToast('Field pack is full');
    return;
  }
  sendMessage('lootPickup', { id: item.id });
}

// ---------------------------------------------------------------------------
// Infected rendering
// ---------------------------------------------------------------------------
function upsertZombie(data) {
  let entry = zombieMeshes.get(data.id);
  if (!entry) {
    const root = createZombie({ tier: data.tier || 1, name: data.name || 'INFECTED' });
    root.position.set(data.x, 0, data.z);
    root.rotation.y = data.rotation || 0;
    root.userData.id = data.id;
    scene.add(root);
    entry = {
      root,
      target: new THREE.Vector3(data.x, 0, data.z),
      targetRotation: data.rotation || 0,
      health: data.health,
      maxHealth: data.maxHealth || 1,
      tier: data.tier || 1,
    };
    zombieMeshes.set(data.id, entry);
  }
  entry.target.set(Number(data.x) || 0, 0, Number(data.z) || 0);
  entry.targetRotation = Number(data.rotation) || 0;
  entry.health = Number(data.health) || 0;
  entry.maxHealth = Number(data.maxHealth) || entry.maxHealth || 1;
  entry.root.userData.setHealth(entry.health / entry.maxHealth);
}

function removeZombieMesh(id) {
  const entry = zombieMeshes.get(id);
  if (!entry) return;
  scene.remove(entry.root);
  entry.root.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material?.map && child.isSprite) {
      child.material.map.dispose();
      child.material.dispose();
    }
  });
  zombieMeshes.delete(id);
}

function syncZombies(list) {
  if (!Array.isArray(list)) return;
  const seen = new Set();
  for (const data of list) {
    if (!data?.id) continue;
    seen.add(data.id);
    upsertZombie(data);
  }
  for (const id of [...zombieMeshes.keys()]) {
    if (!seen.has(id)) removeZombieMesh(id);
  }
}

function updateZombieMeshes(delta) {
  zombieMeshes.forEach((entry) => {
    const previous = entry.root.position.clone();
    entry.root.position.lerp(entry.target, 1 - Math.pow(.001, delta));
    const speed = previous.distanceTo(entry.root.position) / Math.max(delta, .001) * 1.3;
    entry.root.rotation.y = dampAngle(entry.root.rotation.y, entry.targetRotation, 9, delta);
    animateAvatar(entry.root, delta, speed);
  });
}

function updateThreat(now) {
  if (now - lastThreatUpdate < 260) return;
  lastThreatUpdate = now;
  let nearby = 0;
  let closest = Infinity;
  if (localPlayer) {
    zombieMeshes.forEach((entry) => {
      const distance = Math.hypot(entry.root.position.x - localPlayer.position.x, entry.root.position.z - localPlayer.position.z);
      if (distance < 32) nearby += 1;
      if (distance < closest) closest = distance;
    });
  }
  threatIndicator.classList.remove('clear', 'near', 'close', 'swarm');
  if (!nearby) {
    threatIndicator.classList.add('clear');
    threatIndicator.textContent = 'ZONE CLEAR';
  } else if (closest < 9) {
    threatIndicator.classList.add('swarm');
    threatIndicator.textContent = `SWARM · ${nearby} INFECTED`;
  } else if (closest < 18) {
    threatIndicator.classList.add('close');
    threatIndicator.textContent = `CONTACT · ${nearby} INFECTED`;
  } else {
    threatIndicator.classList.add('near');
    threatIndicator.textContent = `${nearby} WALKER${nearby === 1 ? '' : 'S'} NEARBY`;
  }
}

// ---------------------------------------------------------------------------
// Minimap + full map
// ---------------------------------------------------------------------------
const MAP_RES = 1000;
const mapBase = document.createElement('canvas');
mapBase.width = MAP_RES;
mapBase.height = MAP_RES;
const mapScale = MAP_RES / (world.map.half * 2);

function toMapX(x) { return (x + world.map.half) * mapScale; }
function toMapY(z) { return (z + world.map.half) * mapScale; }

function poiColor(poi) {
  switch (poi.kind) {
    case 'camp': return '#d5f55a';
    case 'military': return '#c45a4b';
    case 'train': return '#c7a23c';
    case 'crash': return '#ffb75e';
    case 'industrial': return '#b8743a';
    default: return '#e8dcc0';
  }
}

function drawMapBase() {
  const ctx = mapBase.getContext('2d');
  ctx.fillStyle = '#46513c';
  ctx.fillRect(0, 0, MAP_RES, MAP_RES);
  ctx.globalAlpha = .28;
  ctx.fillStyle = '#586044';
  for (let i = 0; i < 80; i += 1) {
    const x = Math.random() * MAP_RES;
    const y = Math.random() * MAP_RES;
    ctx.beginPath();
    ctx.arc(x, y, 10 + Math.random() * 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const prop of world.map.props) {
    if (prop.kind !== 'tree') continue;
    ctx.fillStyle = Math.random() > .5 ? '#3c4a34' : '#425039';
    ctx.fillRect(toMapX(prop.x) - 1, toMapY(prop.z) - 1, 2.4, 2.4);
  }

  for (const road of world.map.roads) {
    ctx.strokeStyle = road.kind === 'dirt' ? '#7a6a4d' : road.kind === 'highway' ? '#5d615e' : '#676b64';
    ctx.lineWidth = Math.max(2, road.width * mapScale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(toMapX(road.x1), toMapY(road.z1));
    ctx.lineTo(toMapX(road.x2), toMapY(road.z2));
    ctx.stroke();
  }

  for (const track of world.map.tracks) {
    ctx.strokeStyle = '#333a35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(toMapX(track.x1), toMapY(track.z));
    ctx.lineTo(toMapX(track.x2), toMapY(track.z));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(213,213,197,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const building of world.map.buildings) {
    const w = building.w * mapScale;
    const d = building.d * mapScale;
    ctx.save();
    ctx.translate(toMapX(building.x), toMapY(building.z));
    ctx.rotate(-(building.rotation || 0));
    if (building.kind === 'tent') ctx.fillStyle = '#6f7455';
    else if (building.kind === 'warehouse' || building.kind === 'container') ctx.fillStyle = '#59605b';
    else if (building.kind === 'tower') ctx.fillStyle = '#7a6c50';
    else if (building.kind === 'wreck') ctx.fillStyle = '#4a4038';
    else if (building.kind === 'base') ctx.fillStyle = '#7d8f54';
    else ctx.fillStyle = '#77705f';
    ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.strokeStyle = 'rgba(18,23,22,.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2, -d / 2, w, d);
    ctx.restore();
  }

  for (const prop of world.map.props) {
    if (prop.kind !== 'vehicle' && prop.kind !== 'sandbag' && prop.kind !== 'rock') continue;
    ctx.fillStyle = prop.kind === 'vehicle' ? '#4b514d' : prop.kind === 'rock' ? '#6a6b61' : '#77725d';
    ctx.save();
    ctx.translate(toMapX(prop.x), toMapY(prop.z));
    ctx.rotate(-(prop.rotation || 0));
    ctx.fillRect(-prop.w * mapScale / 2, -prop.d * mapScale / 2, prop.w * mapScale, prop.d * mapScale);
    ctx.restore();
  }

  for (const poi of world.map.pois) {
    ctx.strokeStyle = poiColor(poi);
    ctx.globalAlpha = .5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(toMapX(poi.x), toMapY(poi.z), poi.radius * mapScale * .5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawWorldMarkers(ctx, offsetX, offsetY, scale, includeLabels = false) {
  for (const node of world.resourceNodes) {
    const state = resourceStates.get(node.id);
    if (state && state.remaining <= 0) continue;
    const type = RESOURCE_TYPES[node.kind];
    ctx.fillStyle = type?.color || '#9a7448';
    ctx.fillRect((node.x - offsetX) * scale - 1.5, (node.z - offsetY) * scale - 1.5, 3, 3);
  }

  serverBases.forEach((base) => {
    const x = (base.x - offsetX) * scale;
    const y = (base.z - offsetY) * scale;
    const color = base.claimedBy ? (base.claimedBy === selfId ? '#d5f55a' : '#7bdff2') : '#c4cf8c';
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(6,10,12,.85)';
    ctx.lineWidth = 1.2;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.strokeRect(-4, -4, 8, 8);
    ctx.fillStyle = base.claimedBy ? color : '#e8e5cf';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(3, -10);
    ctx.lineTo(-3, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (includeLabels) {
      ctx.fillStyle = color;
      ctx.font = '600 11px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(base.claimedBy ? `${base.name} / ${base.ownerName}` : `${base.name} / UNCLAIMED`, x, y - 14);
    }
  });

  zombieMeshes.forEach((entry) => {
    const x = (entry.root.position.x - offsetX) * scale;
    const y = (entry.root.position.z - offsetY) * scale;
    ctx.fillStyle = '#ff5c4d';
    ctx.strokeStyle = 'rgba(10,4,4,.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  lootMeshes.forEach((mesh) => {
    const x = (mesh.position.x - offsetX) * scale;
    const y = (mesh.position.z - offsetY) * scale;
    ctx.fillStyle = '#ffb75e';
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  });

  players.forEach((avatar) => {
    const isSelf = avatar === localPlayer;
    const clan = clanOfPlayer(avatar.userData.id);
    let color = isSelf ? '#ffffff' : avatar.userData.isTeam ? (clan?.color || '#d5f55a') : '#ff8c69';
    const x = (avatar.position.x - offsetX) * scale;
    const y = (avatar.position.z - offsetY) * scale;
    ctx.save();
    ctx.translate(x, y);
    if (isSelf) {
      ctx.rotate(-avatar.rotation.y + Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 2.5);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(6,10,12,.9)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (includeLabels && avatar.userData.name) {
        ctx.fillStyle = color;
        ctx.font = '600 13px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(avatar.userData.name, 0, -10);
      }
    }
    ctx.restore();
  });

  if (includeLabels) {
    for (const poi of world.map.pois) {
      const x = (poi.x - offsetX) * scale;
      const y = (poi.z - offsetY) * scale;
      ctx.fillStyle = poiColor(poi);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 13px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(poi.name, x, y - 10);
    }
  }
}

function drawMinimap(time) {
  const ctx = minimap.getContext('2d');
  const size = minimap.width;
  ctx.fillStyle = '#2c3529';
  ctx.fillRect(0, 0, size, size);
  if (!localPlayer) return;

  const viewUnits = 210;
  const scale = size / viewUnits;
  const px = localPlayer.position.x;
  const pz = localPlayer.position.z;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-px, -pz);
  ctx.drawImage(mapBase, -world.map.half, -world.map.half, world.map.half * 2, world.map.half * 2);
  ctx.restore();

  ctx.save();
  ctx.translate(size / 2 - px * scale, size / 2 - pz * scale);
  drawWorldMarkers(ctx, 0, 0, scale, false);
  ctx.restore();

  ctx.strokeStyle = 'rgba(213,245,90,.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * .42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#d5f55a';
  ctx.font = '700 12px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('N', size / 2, 18);

  let nearestPoi = null;
  let nearest = Infinity;
  for (const poi of world.map.pois) {
    const distance = Math.hypot(px - poi.x, pz - poi.z);
    if (distance < nearest) { nearest = distance; nearestPoi = poi; }
  }
  minimapRegion.textContent = nearestPoi ? nearestPoi.name : 'WILDERNESS';
}

function drawFullMap() {
  const ctx = fullMap.getContext('2d');
  const size = fullMap.width;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(mapBase, 0, 0, size, size);
  const scale = size / (world.map.half * 2);
  ctx.save();
  ctx.translate(world.map.half * scale, world.map.half * scale);
  drawWorldMarkers(ctx, 0, 0, scale, true);
  ctx.restore();

  ctx.strokeStyle = 'rgba(244,243,238,.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(8,13,17,.7)';
  ctx.fillRect(12, 12, 190, 34);
  ctx.fillStyle = '#d5f55a';
  ctx.font = '600 14px "DM Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('CHERNOZEM // 1000 × 1000', 24, 34);
}

drawMapBase();

// ---------------------------------------------------------------------------
// Clans + overlays
// ---------------------------------------------------------------------------
function clanOfPlayer(playerId) {
  if (!playerId) return null;
  return currentClans.find((clan) => clan.members.includes(playerId)) || null;
}

function selfClan() {
  return clanOfPlayer(selfId);
}

function isTeammate(playerId) {
  if (!selfId || playerId === selfId) return false;
  const clan = selfClan();
  return Boolean(clan && clan.members.includes(playerId));
}

function updateTeamVisuals() {
  const clan = selfClan();
  teamIndicator.classList.toggle('clan', Boolean(clan));
  if (clan) {
    teamIndicator.textContent = `[${clan.tag}] ${clan.name} · ${clan.members.length} OPERATORS`;
    teamIndicator.style.setProperty('--team-color', clan.color);
  } else {
    teamIndicator.textContent = 'NO CLAN · C TO CREATE';
    teamIndicator.style.removeProperty('--team-color');
  }

  players.forEach((avatar) => {
    const teammate = isTeammate(avatar.userData.id);
    const playerClan = clanOfPlayer(avatar.userData.id);
    avatar.userData.isTeam = teammate;
    if (avatar.userData.marker) {
      avatar.userData.marker.visible = teammate;
      avatar.userData.marker.material.color.set(teammate && playerClan ? playerClan.color : '#ffffff');
    }
    if (avatar.userData.label && avatar !== localPlayer) {
      const name = avatar.userData.name || 'SURVIVOR';
      setAvatarLabelText(avatar.userData.label, teammate ? `[${playerClan.tag}] ${name}` : name, teammate && playerClan ? playerClan.color : '#f4f3ee');
    }
  });
  renderClanOverlay();
}

function renderClanOverlay() {
  const clan = selfClan();
  const leader = clan?.leaderId === selfId;
  if (clan) {
    clanSelf.style.setProperty('--team-color', clan.color);
    clanSelf.innerHTML = `<strong>[${clan.tag}] ${clan.name}</strong>${leader ? 'CLAN LEADER' : 'CLAN MEMBER'} · ${clan.members.length} MEMBER${clan.members.length === 1 ? '' : 'S'}<small>${leader ? 'You control invitations and removals.' : 'Your leader manages the roster.'}</small>`;
    clanRoster.innerHTML = clan.members.map((memberId) => {
      const member = players.get(memberId);
      const name = member?.userData.name || players.get(memberId)?.name || memberId;
      const memberLeader = memberId === clan.leaderId;
      const kick = leader && memberId !== selfId ? `<button type="button" data-kick="${memberId}">REMOVE</button>` : '';
      return `<div class="clan-member${memberLeader ? ' leader' : ''}"><div><strong>${name}</strong><span>${memberLeader ? 'LEADER' : 'MEMBER'}</span></div>${kick}</div>`;
    }).join('');
    clanActions.innerHTML = `<button type="button" class="danger" data-action="leave">LEAVE CLAN</button>${leader ? '<button type="button" class="danger" data-action="disband">DISBAND CLAN</button>' : ''}`;
    clanCreatePanel.style.display = 'none';
  } else {
    clanSelf.style.removeProperty('--team-color');
    clanSelf.innerHTML = '<strong>NO CLAN</strong>Fight alone or found a team. Clan members see each other on the map and overhead.<small>Clan tags and colors are assigned by the server.</small>';
    clanRoster.innerHTML = '';
    clanActions.innerHTML = '';
    clanCreatePanel.style.display = '';
  }

  if (pendingInvites.length) {
    clanInvites.innerHTML = `<div class="inventory-section-title">INVITATIONS</div>${pendingInvites.map((invite, index) => `<div class="clan-invite-row"><span>[${invite.tag}] ${invite.name}<br><small>from ${invite.fromName}</small></span><button type="button" data-accept="${index}">JOIN</button></div>`).join('')}`;
  } else {
    clanInvites.innerHTML = '';
  }

  clanCount.textContent = String(currentClans.length).padStart(2, '0');
  clanList.innerHTML = currentClans.length
    ? currentClans.map((entry) => `<div class="clan-card" style="--clan-color:${entry.color}"><i class="clan-swatch"></i><div><strong>[${entry.tag}] ${entry.name}</strong><small>${entry.members.length} MEMBER${entry.members.length === 1 ? '' : 'S'} · ${entry.leaderId === selfId ? 'YOUR CLAN' : 'ACTIVE'}</small></div></div>`).join('')
    : '<div class="clan-self">No clans founded yet. Be the first.</div>';

  const online = [...players.values()].filter((avatar) => avatar.userData.id !== selfId);
  clanSelfCount.textContent = String(online.length).padStart(2, '0');
  survivorList.innerHTML = online.length
    ? online.map((avatar) => {
      const id = avatar.userData.id;
      const playerClan = clanOfPlayer(id);
      const label = playerClan ? `[${playerClan.tag}] ${avatar.userData.name}` : avatar.userData.name;
      const canInvite = leader && !playerClan && !clan?.members.includes(id);
      return `<div class="survivor-row"><strong>${label}</strong>${canInvite ? `<button type="button" data-invite="${id}">INVITE</button>` : `<span>${playerClan ? 'CLANNED' : 'SOLO'}</span>`}</div>`;
    }).join('')
    : '<div class="clan-self">No other survivors online.</div>';
}

function toggleClan(nextState = !clanOpenState) {
  if (nextState && (!hasEntered || isDead)) return;
  if (nextState) {
    if (inventoryOpen) toggleInventory(false);
    if (profileOpenState) toggleProfile(false);
    if (mapOpenState) toggleMap(false);
    if (craftingOpenState) toggleCrafting(false);
    if (chestOpenState) toggleChest(false);
  }
  clanOpenState = nextState;
  clanOverlay.classList.toggle('open', clanOpenState);
  clanOverlay.setAttribute('aria-hidden', String(!clanOpenState));
  if (clanOpenState) {
    isAiming = false;
    triggerHeld = false;
    keys.clear();
    document.exitPointerLock?.();
    renderClanOverlay();
  }
}

function toggleMap(nextState = !mapOpenState) {
  if (nextState && (!hasEntered || isDead)) return;
  if (nextState) {
    if (inventoryOpen) toggleInventory(false);
    if (profileOpenState) toggleProfile(false);
    if (clanOpenState) toggleClan(false);
    if (craftingOpenState) toggleCrafting(false);
    if (chestOpenState) toggleChest(false);
  }
  mapOpenState = nextState;
  mapOverlay.classList.toggle('open', mapOpenState);
  mapOverlay.setAttribute('aria-hidden', String(!mapOpenState));
  if (mapOpenState) {
    isAiming = false;
    triggerHeld = false;
    keys.clear();
    document.exitPointerLock?.();
    drawFullMap();
  }
}

clanClose.addEventListener('click', () => toggleClan(false));
clanOverlay.addEventListener('click', (event) => {
  if (event.target === clanOverlay) toggleClan(false);
});
clanActions.addEventListener('click', (event) => {
  const action = event.target.closest('button')?.dataset.action;
  if (action === 'leave') sendMessage('clanLeave');
  if (action === 'disband' && window.confirm('Disband your clan?')) sendMessage('clanDisband');
});
clanRoster.addEventListener('click', (event) => {
  const targetId = event.target.closest('button')?.dataset.kick;
  if (targetId) sendMessage('clanKick', { targetId });
});
survivorList.addEventListener('click', (event) => {
  const targetId = event.target.closest('button')?.dataset.invite;
  if (targetId) sendMessage('clanInvite', { targetId });
});
clanInvites.addEventListener('click', (event) => {
  const index = Number(event.target.closest('button')?.dataset.accept);
  if (!Number.isInteger(index) || !pendingInvites[index]) return;
  sendMessage('clanAccept', { clanId: pendingInvites[index].clanId });
  pendingInvites.splice(index, 1);
  clanInvitePopup.classList.remove('open');
  activeInvite = null;
  renderClanOverlay();
});
clanCreateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = clanNameInput.value.trim();
  const tag = clanTagInput.value.trim();
  if (name.length < 3 || tag.length < 2) {
    showToast('Clan name needs 3+ characters and tag 2+');
    return;
  }
  sendMessage('clanCreate', { name, tag });
  clanNameInput.value = '';
  clanTagInput.value = '';
});
clanInviteAccept.addEventListener('click', () => {
  if (!activeInvite) return;
  sendMessage('clanAccept', { clanId: activeInvite.clanId });
  pendingInvites = pendingInvites.filter((invite) => invite.clanId !== activeInvite.clanId);
  activeInvite = null;
  clanInvitePopup.classList.remove('open');
  renderClanOverlay();
});
clanInviteDecline.addEventListener('click', () => {
  if (activeInvite) pendingInvites = pendingInvites.filter((invite) => invite.clanId !== activeInvite.clanId);
  activeInvite = null;
  clanInvitePopup.classList.remove('open');
  renderClanOverlay();
});

mapOpen.addEventListener('click', () => toggleMap(true));
mapClose.addEventListener('click', () => toggleMap(false));
mapOverlay.addEventListener('click', (event) => {
  if (event.target === mapOverlay) toggleMap(false);
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
function updateProfilePanel() {
  profileNameInput.value = profileName;
  profileAvatarLetter.textContent = profileName.slice(0, 1).toUpperCase() || 'S';
  profileId.textContent = survivorId;
  const elapsedSeconds = Math.floor((performance.now() - sessionStartedAt) / 1000);
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');
  profilePlaytime.textContent = `${hours}:${minutes}:${seconds}`;
  profileLooted.textContent = String(lootSecured).padStart(2, '0');
  profileLoadoutItems.innerHTML = '';
  const cards = [
    ['PRIMARY', equipped.primary],
    ['SECONDARY', equipped.secondary],
    ['THROWABLE', equipped.throwable],
    ['BODY ARMOR', equipped.body],
    ['BACKPACK', equipped.backpack],
  ];
  cards.forEach(([label, item]) => {
    const template = itemTemplate(item);
    const card = document.createElement('div');
    card.className = 'profile-loadout-item';
    card.style.borderColor = template ? `${RARITY[template.rarity] || '#d5f55a'}55` : '';
    card.innerHTML = `<span>${label}</span>${template ? template.name.toUpperCase() : 'EMPTY'}`;
    profileLoadoutItems.appendChild(card);
  });
  updateVitals();
}

function toggleProfile(nextState = !profileOpenState) {
  if (nextState && (!hasEntered || isDead)) return;
  if (nextState) {
    if (inventoryOpen) toggleInventory(false);
    if (clanOpenState) toggleClan(false);
    if (mapOpenState) toggleMap(false);
    if (craftingOpenState) toggleCrafting(false);
    if (chestOpenState) toggleChest(false);
  }
  profileOpenState = nextState;
  profileOverlay.classList.toggle('open', profileOpenState);
  profileOverlay.setAttribute('aria-hidden', String(!profileOpenState));
  if (profileOpenState) {
    isAiming = false;
    triggerHeld = false;
    keys.clear();
    document.exitPointerLock?.();
    updateProfilePanel();
  }
}

profileOpen.addEventListener('click', () => toggleProfile(true));
profileClose.addEventListener('click', () => toggleProfile(false));
profileOverlay.addEventListener('click', (event) => {
  if (event.target === profileOverlay) toggleProfile(false);
});
profileSave.addEventListener('click', () => {
  const nextName = profileNameInput.value.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 18);
  if (!nextName) return;
  profileName = nextName;
  try { localStorage.setItem('dayza.profileName', profileName); } catch { /* session-only */ }
  if (localPlayer) {
    localPlayer.userData.name = profileName;
    if (localPlayer.userData.label) setAvatarLabelText(localPlayer.userData.label, profileName, '#d5f55a');
  }
  sendMessage('profileUpdate', { name: profileName });
  updateProfilePanel();
});

// ---------------------------------------------------------------------------
// Survivor avatars
// ---------------------------------------------------------------------------
function createAvatar(data, isLocal = false) {
  const root = createSurvivor({
    name: isLocal ? profileName : data.name || 'SURVIVOR',
    accent: data.color || '#d5f55a',
    isLocal,
  });
  root.position.set(data.x, Math.max(0, data.y || 0), data.z);
  root.rotation.y = data.rotation || 0;
  root.userData = {
    ...root.userData,
    id: data.id,
    name: isLocal ? profileName : data.name || 'SURVIVOR',
    isLocal,
    target: new THREE.Vector3(data.x, Math.max(0, data.y || 0), data.z),
    targetRotation: data.rotation || 0,
    walkPhase: Math.random() * Math.PI * 2,
    currentSpeed: 0,
    isTeam: false,
  };
  scene.add(root);
  players.set(data.id, root);
  if (isLocal) localPlayer = root;
  updateTeamVisuals();
  return root;
}

function removeAvatar(id) {
  const avatar = players.get(id);
  if (!avatar) return;
  scene.remove(avatar);
  players.delete(id);
  if (localPlayer === avatar) localPlayer = null;
  updateTeamVisuals();
}

function setAvatarName(avatar, name) {
  avatar.userData.name = name;
  if (avatar.userData.label) {
    setAvatarLabelText(avatar.userData.label, name, avatar.userData.isLocal ? '#d5f55a' : '#f4f3ee');
  }
  updateTeamVisuals();
}

function syncCount() {
  playerCount.textContent = String(players.size).padStart(2, '0');
}

function dampAngle(current, target, speed, delta) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-speed * delta));
}

function animateAvatar(avatar, delta, speed) {
  const { parts } = avatar.userData;
  if (!parts) return;
  const movementAmount = THREE.MathUtils.clamp(speed / 6, 0, 1);
  avatar.userData.currentSpeed = speed;
  avatar.userData.walkPhase += delta * (5.2 + speed * 1.1);

  const swing = Math.sin(avatar.userData.walkPhase) * .62 * movementAmount;
  const bounce = Math.abs(Math.cos(avatar.userData.walkPhase)) * .035 * movementAmount;
  parts.leftLeg.rotation.x = swing;
  parts.rightLeg.rotation.x = -swing;
  const leftRest = parts.leftArm.userData.restX || 0;
  const rightRest = parts.rightArm.userData.restX || 0;
  const leftSwing = (parts.leftArm.userData.swingScale ?? .72) * swing;
  const rightSwing = (parts.rightArm.userData.swingScale ?? .72) * swing;
  parts.leftArm.rotation.x = leftRest - leftSwing;
  parts.rightArm.rotation.x = rightRest + rightSwing;
  parts.rig.position.y = bounce;
  parts.rig.rotation.z = Math.sin(avatar.userData.walkPhase * .5) * .018 * movementAmount;
}

function updateRemoteAvatars(delta) {
  players.forEach((avatar) => {
    if (avatar === localPlayer) return;
    const previousPosition = avatar.position.clone();
    avatar.position.lerp(avatar.userData.target, 1 - Math.pow(.0008, delta));
    const remoteSpeed = previousPosition.distanceTo(avatar.position) / Math.max(delta, .001) * 1.35;
    avatar.rotation.y = dampAngle(avatar.rotation.y, avatar.userData.targetRotation, 10, delta);
    animateAvatar(avatar, delta, remoteSpeed);
  });
}

// ---------------------------------------------------------------------------
// Surface height + movement collision
// ---------------------------------------------------------------------------
function overlayOpen() {
  return inventoryOpen || profileOpenState || clanOpenState || mapOpenState || craftingOpenState || chestOpenState || isDead;
}

function groundHeightAt(x, z) {
  let height = 0;
  for (const surface of world.surfaces) {
    if (x >= surface.minX && x <= surface.maxX && z >= surface.minZ && z <= surface.maxZ) {
      if (surface.y > height) height = surface.y;
    }
  }
  return height;
}

function resolveCollisions(position) {
  const radius = .38;
  const feet = position.y;
  const head = feet + 1.82;
  for (const box of world.colliders) {
    if (feet + .12 >= box.maxY || head <= box.minY) continue;
    const closestX = Math.max(box.minX, Math.min(position.x, box.maxX));
    const closestZ = Math.max(box.minZ, Math.min(position.z, box.maxZ));
    let dx = position.x - closestX;
    let dz = position.z - closestZ;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= radius * radius) continue;

    if (distanceSq > 0.000001) {
      const distance = Math.sqrt(distanceSq);
      const push = radius - distance;
      position.x += (dx / distance) * push;
      position.z += (dz / distance) * push;
    } else {
      const left = position.x - box.minX;
      const right = box.maxX - position.x;
      const front = position.z - box.minZ;
      const back = box.maxZ - position.z;
      const smallest = Math.min(left, right, front, back);
      if (smallest === left) position.x = box.minX - radius;
      else if (smallest === right) position.x = box.maxX + radius;
      else if (smallest === front) position.z = box.minZ - radius;
      else position.z = box.maxZ + radius;
    }
  }
}

function formatCoordinate(value) {
  const sign = value < 0 ? '-' : '+';
  return `${sign}${Math.abs(value).toFixed(1).padStart(5, '0')}`;
}

function updateLocal(delta) {
  if (!localPlayer || !hasEntered || overlayOpen()) {
    if (localPlayer) animateAvatar(localPlayer, delta, 0);
    return;
  }

  const direction = new THREE.Vector3();
  if (keys.has('KeyW')) direction.z -= 1;
  if (keys.has('KeyS')) direction.z += 1;
  if (keys.has('KeyA')) direction.x -= 1;
  if (keys.has('KeyD')) direction.x += 1;

  const hasMovementInput = direction.lengthSq() > 0;
  const sprinting = hasMovementInput && keys.has('KeyW') && (keys.has('ShiftLeft') || keys.has('ShiftRight'));
  const aiming = isAiming;
  const targetSpeed = aiming ? 2.6 : sprinting ? 10.5 : 5.3;
  const acceleration = isGrounded ? (sprinting ? 10 : 14) : 4.8;

  if (isGrounded && keys.has('Space')) {
    verticalVelocity = 6.4;
    isGrounded = false;
  }

  if (hasMovementInput) {
    direction.normalize().applyAxisAngle(upAxis, yaw);
    movementVelocity.lerp(direction.multiplyScalar(targetSpeed), 1 - Math.exp(-acceleration * delta));
  } else if (isGrounded) {
    movementVelocity.lerp(new THREE.Vector3(), 1 - Math.exp(-18 * delta));
  }

  localPlayer.position.addScaledVector(movementVelocity, delta);
  localPlayer.position.x = THREE.MathUtils.clamp(localPlayer.position.x, -world.map.half + 4, world.map.half - 4);
  localPlayer.position.z = THREE.MathUtils.clamp(localPlayer.position.z, -world.map.half + 4, world.map.half - 4);
  resolveCollisions(localPlayer.position);

  verticalVelocity -= 20 * delta;
  localPlayer.position.y += verticalVelocity * delta;
  const support = groundHeightAt(localPlayer.position.x, localPlayer.position.z);
  if (verticalVelocity <= 0 && localPlayer.position.y <= support) {
    localPlayer.position.y = support;
    verticalVelocity = 0;
    isGrounded = true;
  } else {
    isGrounded = false;
  }

  const currentSpeed = movementVelocity.length();
  const isMoving = currentSpeed > .18;
  if (isMoving) {
    const targetRotation = Math.atan2(movementVelocity.x, movementVelocity.z);
    localPlayer.rotation.y = dampAngle(localPlayer.rotation.y, targetRotation, 14, delta);
  } else if (isFirstPerson) {
    localPlayer.rotation.y = dampAngle(localPlayer.rotation.y, yaw + Math.PI, 12, delta);
  }

  animateAvatar(localPlayer, delta, currentSpeed);
  movementState.textContent = !isGrounded ? 'AIRBORNE' : sprinting ? 'SPRINT' : isMoving ? 'WALK' : 'IDLE';

  positionX.textContent = formatCoordinate(localPlayer.position.x);
  positionZ.textContent = formatCoordinate(localPlayer.position.z);
  networkTimer += delta;
  if (networkTimer >= .05) {
    sendMessage('playerMove', {
      x: localPlayer.position.x,
      y: localPlayer.position.y,
      z: localPlayer.position.z,
      rotation: localPlayer.rotation.y,
    });
    networkTimer = 0;
  }
}

function cameraObstructed(position) {
  for (const box of world.cameraBoxes) {
    if (position.x > box.min.x && position.x < box.max.x
      && position.y > box.min.y && position.y < box.max.y
      && position.z > box.min.z && position.z < box.max.z) return true;
  }
  return false;
}

function updateCamera(delta) {
  if (!localPlayer) return;

  weaponRoot.visible = isFirstPerson && !overlayOpen();
  const targetFov = isFirstPerson && isAiming ? 44 : isAiming ? 52 : 58;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-10 * delta));
  camera.updateProjectionMatrix();
  crosshair.classList.toggle('visible', Boolean(document.pointerLockElement) && !overlayOpen());

  if (isFirstPerson) {
    localPlayer.visible = false;
    const eyePosition = localPlayer.position.clone().add(new THREE.Vector3(0, 1.63, 0));
    camera.position.lerp(eyePosition, 1 - Math.exp(-22 * delta));
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    camera.rotation.z = 0;
    return;
  }

  localPlayer.visible = true;
  const focus = localPlayer.position.clone().add(new THREE.Vector3(0, 1.42, 0));
  const distance = isAiming ? 4.6 : 7.4;
  const height = Math.max(.35, 1.5 - pitch * 3.4);
  let offset = new THREE.Vector3(Math.sin(yaw) * distance, height, Math.cos(yaw) * distance);
  let targetCamera = focus.clone().add(offset);
  if (cameraObstructed(targetCamera)) {
    for (let amount = .85; amount >= .2; amount -= .1) {
      const candidate = focus.clone().addScaledVector(offset, amount);
      if (!cameraObstructed(candidate)) { targetCamera = candidate; break; }
      targetCamera = candidate;
    }
  }
  targetCamera.y = Math.max(groundHeightAt(targetCamera.x, targetCamera.z) + .35, targetCamera.y);
  camera.position.lerp(targetCamera, 1 - Math.pow(.0009, delta));
  camera.lookAt(focus);
}

function updateSun() {
  if (!localPlayer) return;
  sun.position.set(localPlayer.position.x - 45, 78, localPlayer.position.z + 38);
  sun.target.position.set(localPlayer.position.x, 0, localPlayer.position.z);
  sun.target.updateMatrixWorld();
}

function findNearestResource() {
  if (!localPlayer) return null;
  let best = null;
  let bestDistance = 4.2;
  for (const node of world.resourceNodes) {
    const state = resourceStates.get(node.id);
    if (state && state.remaining <= 0) continue;
    const distance = Math.hypot(localPlayer.position.x - node.x, localPlayer.position.z - node.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { node, distance };
    }
  }
  return best;
}

function baseAccessibleToSelf(base) {
  if (!base) return false;
  if (base.claimedBy === selfId) return true;
  return Boolean(base.ownerClanId && selfClan()?.id === base.ownerClanId);
}

function findBaseInteraction() {
  if (!localPlayer) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const base of serverBases.values()) {
    const centerDistance = Math.hypot(localPlayer.position.x - base.x, localPlayer.position.z - base.z);
    if (base.claimedBy && !baseAccessibleToSelf(base)) continue;
    if (!base.claimedBy && centerDistance > base.claimRadius + 7) continue;
    if (base.claimedBy && centerDistance > base.claimRadius + 8) continue;

    const chestX = base.chestWorld?.x ?? base.x;
    const chestZ = base.chestWorld?.z ?? base.z;
    const chestDistance = Math.hypot(localPlayer.position.x - chestX, localPlayer.position.z - chestZ);
    if (base.claimedBy && chestDistance < 2.9) {
      if (chestDistance < bestDistance) {
        bestDistance = chestDistance;
        best = { type: 'chest', base, distance: chestDistance, label: `OPEN ${base.short || 'SHELTER'} STASH` };
      }
      continue;
    }
    if (!base.claimedBy && centerDistance < base.claimRadius + 7 && centerDistance < bestDistance) {
      bestDistance = centerDistance;
      best = { type: 'claim', base, distance: centerDistance, label: `CLAIM ${base.name}` };
    }
  }
  return best;
}

function handleInteract() {
  if (!nearestInteraction || isDead) return;
  if (nearestInteraction.type === 'loot') {
    tryPickupLoot();
    return;
  }
  if (nearestInteraction.type === 'resource') {
    sendMessage('resourceHarvest', { nodeId: nearestInteraction.node.id });
    return;
  }
  if (nearestInteraction.type === 'chest') {
    openChest(nearestInteraction.base.id);
    return;
  }
  if (nearestInteraction.type === 'claim') {
    sendMessage('baseClaim', { baseId: nearestInteraction.base.id });
  }
}

function updateInteraction() {
  nearestLoot = hasEntered && !overlayOpen() ? findNearestLoot() : null;
  nearestInteraction = null;
  if (!hasEntered || overlayOpen()) {
    interactionPrompt.classList.remove('visible');
    return;
  }

  if (nearestLoot) {
    const mesh = lootMeshes.get(nearestLoot.id);
    const template = ITEM_TEMPLATES[mesh?.userData.lootData?.itemId];
    nearestInteraction = { type: 'loot', label: template ? `PICK UP ${template.name.toUpperCase()}` : 'SEARCH' };
  } else {
    const resource = findNearestResource();
    if (resource) {
      const type = RESOURCE_TYPES[resource.node.kind];
      nearestInteraction = {
        type: 'resource',
        node: resource.node,
        label: `${type?.verb || 'HARVEST'} ${(type?.label || 'RESOURCE').toUpperCase()}`,
      };
    } else {
      const baseInteraction = findBaseInteraction();
      if (baseInteraction) nearestInteraction = baseInteraction;
    }
  }

  if (nearestInteraction) {
    interactionText.textContent = nearestInteraction.label || 'INTERACT';
    interactionPrompt.classList.add('visible');
  } else {
    interactionPrompt.classList.remove('visible');
  }
}


// ---------------------------------------------------------------------------
// Network synchronization
// ---------------------------------------------------------------------------
function resetNetworkState() {
  players.forEach((avatar) => scene.remove(avatar));
  players.clear();
  localPlayer = null;
  for (const id of [...lootMeshes.keys()]) removeLootMesh(id);
  for (const id of [...airdropMeshes.keys()]) removeAirdropMesh(id);
  for (const id of [...zombieMeshes.keys()]) removeZombieMesh(id);
  serverBases.clear();
  resourceStates.clear();
  chestContents = [];
  openChestBaseId = null;
  if (chestOpenState) toggleChest(false);
  if (craftingOpenState) toggleCrafting(false);
  nearestInteraction = null;
  nearestLoot = null;
}

function applyResourceSnapshot(list) {
  if (!Array.isArray(list)) return;
  resourceStates.clear();
  for (const node of list) {
    resourceStates.set(node.id, { ...node });
    world.setResourceState(node.id, node.remaining, node.maxUses);
  }
}

function handleWorldState(message) {
  resetNetworkState();
  selfId = message.selfId || null;
  currentClans = Array.isArray(message.clans) ? message.clans : [];
  pendingInvites = [];
  activeInvite = null;
  clanInvitePopup.classList.remove('open');

  const roster = Array.isArray(message.players) ? message.players : [];
  const selfData = roster.find((entry) => entry.id === selfId);
  if (selfData) createAvatar({ ...selfData, name: profileName }, true);
  for (const entry of roster) {
    if (entry.id === selfId) continue;
    createAvatar(entry);
  }
  for (const entry of message.loot || []) createLootMesh(entry);
  for (const entry of message.airdrops || []) createAirdropMesh(entry);
  applyBaseState(message.bases || []);
  applyResourceSnapshot(message.resources || []);
  syncZombies(message.zombies || []);
  health = selfData?.health ?? PLAYER_MAX_HEALTH;
  isDead = Boolean(selfData?.dead);
  if (isDead) showDeathScreen({ baseClaimed: Boolean(currentBaseForSelf()) });
  else deathOverlay.classList.remove('open');

  updateTeamVisuals();
  syncCount();
  refreshWeaponModel();
  renderInventory();
  updateProfilePanel();
  updateHealthHud();
  updateBaseStatus();
  drawMinimap(clock.elapsedTime);
  if (mapOpenState) drawFullMap();
}

onSocket('connect', () => {
  socketConnected = true;
  connectionLabel.textContent = 'ONLINE';
  statusDot.classList.add('online');
  sendMessage('profileUpdate', { name: profileName });
  if (hasEntered) addLootFeed('LINK ESTABLISHED', '#d5f55a');
});

onSocket('disconnect', () => {
  socketConnected = false;
  connectionLabel.textContent = 'OFFLINE';
  statusDot.classList.remove('online');
  showToast('Connection lost — reconnecting is required');
});

onSocket('connect_error', () => {
  socketConnected = false;
  connectionLabel.textContent = 'CONNECTION ERROR';
  statusDot.classList.remove('online');
  showToast('Could not reach the Dayza server');
});

onSocket('worldState', handleWorldState);

onSocket('playerJoined', (player) => {
  if (!player?.id || player.id === selfId || players.has(player.id)) return;
  createAvatar(player);
  syncCount();
  if (hasEntered) addLootFeed(`${player.name || 'SURVIVOR'} ENTERED THE ZONE`, player.color || '#7bdff2');
});

onSocket('playerProfile', (message) => {
  const avatar = players.get(message.id);
  if (!avatar) return;
  if (avatar === localPlayer) {
    profileName = message.name || profileName;
    updateProfilePanel();
  }
  setAvatarName(avatar, message.name || 'SURVIVOR');
});

onSocket('playerMoved', (message) => {
  if (message.id === selfId) return;
  const avatar = players.get(message.id);
  if (!avatar) return;
  avatar.userData.target.set(
    Number(message.x) || 0,
    Math.max(0, Number(message.y) || 0),
    Number(message.z) || 0,
  );
  avatar.userData.targetRotation = Number(message.rotation) || 0;
});

onSocket('playerShoot', (message) => {
  if (!message.origin || !message.target) return;
  const start = new THREE.Vector3(message.origin.x, message.origin.y, message.origin.z);
  const end = new THREE.Vector3(message.target.x, message.target.y, message.target.z);
  addTracer(start, end, '#ffcf7a');
});

onSocket('grenadeThrow', (message) => {
  if (!message.origin || !message.target) return;
  spawnGrenadeProjectile(
    new THREE.Vector3(message.origin.x, message.origin.y, message.origin.z),
    new THREE.Vector3(message.target.x, message.target.y, message.target.z),
    message.kind === 'smoke' ? 'smoke' : 'frag',
  );
});

onSocket('playerLeft', (id) => {
  const avatar = players.get(id);
  if (avatar && hasEntered) addLootFeed(`${avatar.userData.name || 'SURVIVOR'} LEFT THE ZONE`, '#c9c9c1');
  removeAvatar(id);
  syncCount();
});

onSocket('lootSpawned', (message) => {
  if (!message.loot) return;
  createLootMesh(message.loot);
  if (message.loot.zoneId === 'dropped') {
    const template = ITEM_TEMPLATES[message.loot.itemId];
    if (template) addLootFeed(`FIELD DROP · ${template.name.toUpperCase()}`, RARITY[template.rarity] || '#c9c9c1');
  }
});

onSocket('lootRemoved', (message) => {
  if (message.id) removeLootMesh(message.id);
});

onSocket('airdropIncoming', (message) => {
  if (!message.airdrop) return;
  createAirdropMesh(message.airdrop);
  addLootFeed(`AIRDROP INBOUND · ${message.airdrop.name}`, '#ffcf7a');
});

onSocket('airdropLanded', (message) => {
  if (!message.airdrop) return;
  createAirdropMesh(message.airdrop);
  addLootFeed(`AIRDROP LANDED · ${message.airdrop.name}`, '#ff8c69');
});

onSocket('airdropRemoved', (message) => {
  if (message.id) removeAirdropMesh(message.id);
});

onSocket('lootTaken', (message) => {
  const loot = message.loot;
  if (!loot) return;
  removeLootMesh(loot.id);
  const template = ITEM_TEMPLATES[loot.itemId];
  if (!template) return;
  const item = addItem(loot.itemId, loot.quantity);
  if (!item) {
    sendMessage('lootDrop', { itemId: loot.itemId, quantity: loot.quantity });
    showToast('Field pack full — item dropped at your feet');
    return;
  }
  lootSecured += 1;
  const slot = equipSlotFor(item);
  if (slot && !equipped[slot]) equipItem(item);
  addLootFeed(`SECURED · ${template.name.toUpperCase()}${loot.quantity > 1 ? ` ×${loot.quantity}` : ''}`, RARITY[template.rarity] || '#d5f55a');
  updateAmmoHud();
  renderInventory();
  updateProfilePanel();
});

onSocket('clanState', (message) => {
  currentClans = Array.isArray(message.clans) ? message.clans : [];
  if (selfClan()) {
    pendingInvites = [];
    activeInvite = null;
    clanInvitePopup.classList.remove('open');
  }
  updateTeamVisuals();
  renderClanOverlay();
});

onSocket('clanInvite', (message) => {
  if (!message.clanId) return;
  if (!pendingInvites.some((invite) => invite.clanId === message.clanId)) {
    pendingInvites.push({
      clanId: message.clanId,
      name: message.name || 'UNKNOWN',
      tag: message.tag || '???',
      color: message.color || '#d5f55a',
      fromName: message.fromName || 'A SURVIVOR',
    });
  }
  activeInvite = { ...message };
  clanInviteName.textContent = `[${message.tag || '???'}] ${message.name || 'UNKNOWN CLAN'}`;
  clanInviteFrom.textContent = `${message.fromName || 'A survivor'} invited you to join their clan.`;
  clanInvitePopup.classList.add('open');
  renderClanOverlay();
  addLootFeed(`CLAN INVITE · [${message.tag || '???'}] ${message.name || 'UNKNOWN'}`, '#d5f55a');
});

onSocket('clanNotice', (message) => {
  if (message.text) showToast(message.text);
});

// ---------------------------------------------------------------------------
// Survival network events
// ---------------------------------------------------------------------------
onSocket('baseState', (message) => applyBaseState(message.bases));

onSocket('baseClaimed', (message) => {
  if (message.base?.name) addLootFeed(`SHELTER CLAIMED · ${message.base.name.toUpperCase()}`, '#d5f55a');
  updateBaseStatus();
});

onSocket('baseNotice', (message) => {
  if (message.text) showToast(message.text);
});

onSocket('resourceState', (message) => {
  if (!message.id) return;
  resourceStates.set(message.id, {
    id: message.id,
    remaining: message.remaining,
    maxUses: message.maxUses,
  });
  world.setResourceState(message.id, message.remaining, message.maxUses);
});

onSocket('resourceHarvested', (message) => {
  const harvested = [];
  for (const drop of message.items || []) {
    const item = addItem(drop.itemId, drop.quantity);
    if (!item) {
      sendMessage('lootDrop', { itemId: drop.itemId, quantity: drop.quantity });
      showToast('Pack full — surplus dropped at your feet');
      continue;
    }
    const template = ITEM_TEMPLATES[drop.itemId];
    harvested.push(`${template?.name || drop.itemId} ×${drop.quantity}`);
  }
  resourceStates.set(message.nodeId, {
    id: message.nodeId,
    remaining: message.remaining,
    maxUses: resourceStates.get(message.nodeId)?.maxUses || 1,
  });
  world.setResourceState(message.nodeId, message.remaining, resourceStates.get(message.nodeId)?.maxUses || 1);
  if (harvested.length) addLootFeed(`HARVESTED · ${harvested.join(' · ').toUpperCase()}`, '#d5f55a');
  renderInventory();
  updateProfilePanel();
  if (craftingOpenState) renderCrafting();
});

onSocket('zombieState', (message) => {
  syncZombies(message.zombies || []);
});

onSocket('zombieKilled', (message) => {
  removeZombieMesh(message.id);
  const selfKill = message.by === selfId;
  if (selfKill) {
    zombieKills += 1;
    addLootFeed(`INFECTED DOWN · ${zombieKills} TOTAL`, '#ff8c69');
  } else {
    const killer = players.get(message.by);
    if (killer) addLootFeed(`${killer.userData.name || 'SURVIVOR'} KILLED AN INFECTED`, '#c9c9c1');
  }
  if (message.x !== undefined && message.z !== undefined) updateBaseStatus();
});

onSocket('zombieHit', (message) => {
  const entry = zombieMeshes.get(message.id);
  if (entry && message.maxHealth) entry.root.userData.setHealth(message.health / message.maxHealth);
  if (document.pointerLockElement) {
    crosshair.style.transform = 'translate(-50%, -50%) scale(1.55)';
    window.setTimeout(() => { crosshair.style.transform = ''; }, 80);
  }
});

onSocket('killNotice', (message) => {
  if (message.name) addLootFeed(`${message.name} ELIMINATED`, '#ff8c69');
});

onSocket('playerHealth', (message) => {
  if (typeof message.health !== 'number') return;
  health = message.health;
  if (message.source) flashDamage();
  updateHealthHud();
});

onSocket('playerDown', (message) => {
  if (message.id && message.id !== selfId) {
    const avatar = players.get(message.id);
    addLootFeed(`${avatar?.userData.name || message.name || 'SURVIVOR'} WAS KILLED`, '#ff6b6b');
    if (avatar) avatar.visible = false;
    return;
  }
  if (isDead) return;
  isDead = true;
  health = 0;
  triggerHeld = false;
  isAiming = false;
  keys.clear();
  movementVelocity.set(0, 0, 0);
  document.exitPointerLock?.();
  scatterDeathLoot();
  showDeathScreen(message);
  updateHealthHud();
  addLootFeed('YOU WERE OVERRUN · FIELD PACK SCATTERED', '#ff6b6b');
});

onSocket('playerRespawn', (message) => {
  isDead = false;
  health = message.health ?? PLAYER_MAX_HEALTH;
  respawnBaseId = null;
  deathOverlay.classList.remove('open');
  deathOverlay.setAttribute('aria-hidden', 'true');
  if (localPlayer) {
    localPlayer.visible = true;
    localPlayer.position.set(message.x ?? 2, 0, message.z ?? 6);
    movementVelocity.set(0, 0, 0);
    verticalVelocity = 0;
    isGrounded = true;
  }
  updateHealthHud();
  updateBaseStatus();
  requestPointerLock();
  addLootFeed(message.baseId ? 'RESPAWNED AT SHELTER' : 'RESPAWNED AT SURVIVOR CAMP', '#d5f55a');
});

onSocket('playerRespawned', (message) => {
  const avatar = players.get(message.id);
  if (!avatar) return;
  avatar.visible = true;
  avatar.userData.target.set(Number(message.x) || 2, 0, Number(message.z) || 6);
});

onSocket('chestState', (message) => {
  const baseId = message.baseId || message.id;
  if (!baseId) return;
  if (openChestBaseId && baseId !== openChestBaseId) return;
  openChestBaseId = baseId;
  chestContents = Array.isArray(message.items) ? message.items : [];
  chestCapacity = message.capacity || 12;
  chestStorageLabel.textContent = message.ownerName ? `${message.ownerName} STASH` : 'STASH CONTENTS';
  chestFooterText.textContent = message.claimedBy === selfId
    ? 'SECURED SHELTER STASH · OWNER ACCESS'
    : 'CLAN SHELTER STASH · SHARED ACCESS';
  if (!chestOpenState) toggleChest(true);
  renderChest();
});

onSocket('chestStored', (message) => {
  if (pendingChestStore) {
    const item = inventoryItems.find((entry) => entry?.uid === pendingChestStore.id);
    if (item) {
      item.quantity -= message.quantity;
      if (item.quantity <= 0) {
        const index = inventoryItems.indexOf(item);
        clearEquipped(item);
        inventoryItems[index] = null;
        if (selectedInventoryIndex === index) selectedInventoryIndex = -1;
      }
    }
    pendingChestStore = null;
  }
  const template = ITEM_TEMPLATES[message.itemId];
  if (template) addLootFeed(`STASHED · ${template.name.toUpperCase()} ×${message.quantity}`, '#7bdff2');
  renderInventory();
  updateProfilePanel();
  renderChest();
});

onSocket('chestTaken', (message) => {
  if (!message.item) return;
  const item = addItem(message.item.itemId, message.item.quantity);
  if (!item) {
    sendMessage('chestStore', {
      baseId: openChestBaseId,
      itemId: message.item.itemId,
      quantity: message.item.quantity,
    });
    showToast('Field pack is full');
    return;
  }
  const template = ITEM_TEMPLATES[message.item.itemId];
  if (template) addLootFeed(`TAKEN · ${template.name.toUpperCase()} ×${message.item.quantity}`, RARITY[template.rarity] || '#d5f55a');
  const slot = equipSlotFor(item);
  if (slot && !equipped[slot]) equipItem(item);
  renderInventory();
  updateProfilePanel();
  updateAmmoHud();
  renderChest();
});

onSocket('chestNotice', (message) => {
  if (message.text) showToast(message.text);
});

function scatterDeathLoot() {
  const candidates = inventoryItems
    .map((item, index) => (item ? { item, index } : null))
    .filter(Boolean);
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (const { item, index } of candidates.slice(0, 3)) {
    const template = itemTemplate(item);
    sendMessage('lootDrop', { itemId: item.templateId, quantity: item.quantity });
    clearEquipped(item);
    inventoryItems[index] = null;
    if (selectedInventoryIndex === index) selectedInventoryIndex = -1;
    if (template) addLootFeed(`LOST · ${template.name.toUpperCase()}`, RARITY[template.rarity] || '#c9c9c1');
  }
  renderInventory();
  updateProfilePanel();
}

function showDeathScreen(message = {}) {
  const base = currentBaseForSelf();
  respawnBaseId = base?.id || message.baseId || null;
  deathSummary.textContent = base
    ? `Your body gave out in the zone. ${base.name} is still yours — respawn there or fall back to the survivor camp.`
    : 'The zone took another survivor. Your field pack was scattered. Fall back to the survivor camp and rebuild.';
  respawnBaseButton.disabled = !respawnBaseId;
  respawnBaseButton.textContent = base ? `RESPAWN AT ${(base.short || base.name).toUpperCase()}` : 'NO CLAIMED SHELTER';
  deathFootnote.textContent = base
    ? 'SHELTER RESPAWN AVAILABLE · FIELD PACK CONTENTS PARTIALLY LOST'
    : 'NO CLAIMED SHELTER · CAMP RESPAWN AVAILABLE';
  deathOverlay.classList.add('open');
  deathOverlay.setAttribute('aria-hidden', 'false');
  updateHealthHud();
}

respawnBaseButton.addEventListener('click', () => {
  if (!respawnBaseId) return;
  respawnBaseButton.disabled = true;
  sendMessage('respawnRequest', { baseId: respawnBaseId });
});

respawnCampButton.addEventListener('click', () => {
  respawnCampButton.disabled = true;
  sendMessage('respawnRequest', {});
  window.setTimeout(() => { respawnCampButton.disabled = false; }, 1200);
});

// ---------------------------------------------------------------------------
// Starting loadout
// ---------------------------------------------------------------------------
function seedStartingLoadout() {
  addItem('ak74', 1);
  addItem('makarov', 1);
  addItem('ammo_762', 60);
  addItem('ammo_9mm', 16);
  addItem('bandage', 2);
  addItem('beans', 1);
  addItem('water_bottle', 1);
  addItem('knife', 1);
  addItem('beanie', 1);
  addItem('backpack_assault', 1);
  addItem('cloth', 6);
  addItem('scrap', 4);
  addItem('nails', 8);
  addItem('wood', 4);
  addItem('stone', 2);

  equipped.primary = findItemByTemplate('ak74');
  equipped.secondary = findItemByTemplate('makarov');
  equipped.head = findItemByTemplate('beanie');
  equipped.backpack = findItemByTemplate('backpack_assault');
  activeSlot = 'primary';

  refreshWeaponModel();
  renderInventory();
  updateProfilePanel();
  updateHealthHud();
  syncCount();
  updateTeamVisuals();
}

seedStartingLoadout();

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space']);

function requestPointerLock() {
  if (!hasEntered || overlayOpen() || document.pointerLockElement === renderer.domElement) return;
  try {
    const request = renderer.domElement.requestPointerLock();
    if (request?.catch) request.catch(() => {});
  } catch {
    // Pointer lock can be denied when the document is not focused.
  }
}

function closeTopOverlay() {
  if (chestOpenState) return toggleChest(false);
  if (craftingOpenState) return toggleCrafting(false);
  if (inventoryOpen) return toggleInventory(false);
  if (profileOpenState) return toggleProfile(false);
  if (clanOpenState) return toggleClan(false);
  if (mapOpenState) return toggleMap(false);
  return false;
}

enterButton.addEventListener('click', () => {
  if (!socketConnected) {
    showToast('Waiting for the Dayza server connection…');
    return;
  }
  hasEntered = true;
  startScreen.classList.add('hidden');
  updateProfilePanel();
  renderInventory();
  addLootFeed('WELCOME TO CHERNOZEM', '#d5f55a');
  requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === renderer.domElement;
  if (!locked) {
    triggerHeld = false;
    isAiming = false;
    keys.clear();
  }
});

document.addEventListener('pointerlockerror', () => {
  showToast('Click the world to capture the mouse');
});

window.addEventListener('blur', () => {
  keys.clear();
  triggerHeld = false;
  isAiming = false;
});

document.addEventListener('mousemove', (event) => {
  if (!hasEntered || document.pointerLockElement !== renderer.domElement || overlayOpen()) return;
  const sensitivity = isAiming ? .0014 : .0021;
  yaw -= event.movementX * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * sensitivity, -1.18, 1.08);
});

renderer.domElement.addEventListener('mousedown', (event) => {
  if (!hasEntered || overlayOpen()) return;
  if (document.pointerLockElement !== renderer.domElement) {
    requestPointerLock();
    return;
  }
  if (event.button === 0) {
    triggerHeld = true;
    fireWeapon();
  } else if (event.button === 2) {
    isAiming = true;
  }
});

document.addEventListener('mouseup', (event) => {
  if (event.button === 0) triggerHeld = false;
  if (event.button === 2) isAiming = false;
});

document.addEventListener('contextmenu', (event) => {
  if (hasEntered) event.preventDefault();
});

window.addEventListener('keydown', (event) => {
  if (!hasEntered) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target?.isContentEditable) return;

  const code = event.code;
  if (code === 'Escape') {
    if (closeTopOverlay()) return;
    if (document.pointerLockElement) document.exitPointerLock();
    return;
  }
  if (code === 'Tab') {
    event.preventDefault();
    toggleInventory();
    return;
  }
  if (code === 'KeyM') {
    event.preventDefault();
    toggleMap();
    return;
  }
  if (code === 'KeyC') {
    event.preventDefault();
    toggleClan();
    return;
  }
  if (code === 'KeyP') {
    event.preventDefault();
    toggleProfile();
    return;
  }
  if (code === 'KeyB') {
    event.preventDefault();
    toggleCrafting();
    return;
  }

  if (overlayOpen()) return;

  if (movementKeys.has(code)) {
    if (code === 'Space') event.preventDefault();
    keys.add(code);
    return;
  }
  if (event.repeat) return;

  if (code === 'KeyE') handleInteract();
  if (code === 'KeyR') beginReload();
  if (code === 'KeyG') throwGrenade();
  if (code === 'KeyV') {
    isFirstPerson = !isFirstPerson;
    isAiming = false;
    addLootFeed(isFirstPerson ? 'FIRST PERSON' : 'THIRD PERSON', '#c9c9c1');
  }
  if (code === 'Digit1') selectWeaponSlot('primary');
  if (code === 'Digit2') selectWeaponSlot('secondary');
  if (code === 'Digit3') selectWeaponSlot('throwable');
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), .05);
  const time = clock.elapsedTime;

  updateLocal(delta);
  updateRemoteAvatars(delta);
  updateZombieMeshes(delta);
  if (hasEntered) {
    updateCombat(delta);
    updateInteraction();
    updateSun();
  }
  updateLootMeshes(delta, time);
  updateAirdropMeshes(delta, time);
  world.update(delta, time);
  updateCamera(delta);

  const mode = isFirstPerson ? 'FIRST PERSON' : 'THIRD PERSON';
  if (viewMode.textContent !== mode) viewMode.textContent = mode;

  const now = performance.now();
  if (hasEntered) {
    updateThreat(now);
    if (now - lastBaseStatusUpdate > 500) {
      lastBaseStatusUpdate = now;
      updateBaseStatus();
    }
  }
  if (now - lastMinimapDraw > 90) {
    drawMinimap(time);
    if (mapOpenState) drawFullMap();
    lastMinimapDraw = now;
  }

  renderer.render(scene, camera);
}

drawMinimap(0);
animate();





