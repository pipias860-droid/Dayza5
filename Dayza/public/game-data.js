// Shared item + loot data used by both the browser client and the Node server.
// Dependency-free so it can be imported in either environment.

export const RARITY = {
  common: '#c9c9c1',
  uncommon: '#8fe08a',
  rare: '#6fb8ff',
  epic: '#c392ff',
  legendary: '#ffb75e',
};

export const CLAN_COLORS = [
  '#d5f55a', '#7bdff2', '#ff8c69', '#c392ff',
  '#ffd166', '#8fe08a', '#ff6b9d', '#9fb7ff',
];

export const ITEM_TEMPLATES = {
  // ---------------------------------------------------------------- weapons
  ak74: {
    short: 'AK74', name: 'AK-74', type: 'ASSAULT RIFLE', category: 'weapon',
    slot: 'primary', model: 'ak74', weight: 3.6, color: '#c9db6b', rarity: 'rare',
    ammoType: 'ammo_762', magSize: 30, reloadTime: 2.5, fireInterval: 96,
    automatic: true, damage: 33, recoil: 0.95,
    description: 'A battle-worn Kalashnikov. Reliable, loud, and still the most common rifle in the exclusion zone.',
  },
  m4a1: {
    short: 'M4', name: 'M4A1', type: 'ASSAULT RIFLE', category: 'weapon',
    slot: 'primary', model: 'm4a1', weight: 3.4, color: '#b7c3c8', rarity: 'epic',
    ammoType: 'ammo_556', magSize: 30, reloadTime: 2.15, fireInterval: 82,
    automatic: true, damage: 31, recoil: 0.72,
    description: 'Western carbine with a crisp trigger and light recoil. Ammunition is scarce.',
  },
  mosin: {
    short: 'MOSIN', name: 'Mosin 91/30', type: 'BOLT-ACTION RIFLE', category: 'weapon',
    slot: 'primary', model: 'mosin', weight: 4.1, color: '#a98963', rarity: 'rare',
    ammoType: 'ammo_762r', magSize: 5, reloadTime: 3.4, fireInterval: 1050,
    automatic: false, damage: 86, recoil: 1.8,
    description: 'An old bolt-action rifle. One shot, one very loud statement.',
  },
  mp5: {
    short: 'MP5', name: 'MP5', type: 'SUBMACHINE GUN', category: 'weapon',
    slot: 'primary', model: 'mp5', weight: 2.9, color: '#9aa6ab', rarity: 'uncommon',
    ammoType: 'ammo_9mm', magSize: 30, reloadTime: 2.0, fireInterval: 76,
    automatic: true, damage: 24, recoil: 0.55,
    description: 'Compact submachine gun. Controllable in close quarters and cheap to feed.',
  },
  makarov: {
    short: 'PM', name: 'Makarov PM', type: 'SIDEARM', category: 'weapon',
    slot: 'secondary', model: 'makarov', weight: 1.0, color: '#8e989b', rarity: 'common',
    ammoType: 'ammo_9mm', magSize: 8, reloadTime: 1.7, fireInterval: 250,
    automatic: false, damage: 22, recoil: 0.5,
    description: 'A small, dependable pistol. Better than a harsh word when things go wrong.',
  },
  glock17: {
    short: 'G17', name: 'Glock 17', type: 'SIDEARM', category: 'weapon',
    slot: 'secondary', model: 'glock17', weight: 0.9, color: '#8d9594', rarity: 'uncommon',
    ammoType: 'ammo_9mm', magSize: 17, reloadTime: 1.55, fireInterval: 150,
    automatic: false, damage: 24, recoil: 0.42,
    description: 'A light polymer-framed pistol with a high-capacity magazine. Common among scavengers.',
  },
  m1911: {
    short: '1911', name: 'M1911', type: 'SIDEARM', category: 'weapon',
    slot: 'secondary', model: 'm1911', weight: 1.15, color: '#767b78', rarity: 'rare',
    ammoType: 'ammo_45', magSize: 7, reloadTime: 1.95, fireInterval: 220,
    automatic: false, damage: 39, recoil: 0.82,
    description: 'A century-old slab of steel in .45 ACP. Slow to feed, but it hits like a truck.',
  },
  sks: {
    short: 'SKS', name: 'SKS', type: 'SEMI-AUTO RIFLE', category: 'weapon',
    slot: 'primary', model: 'sks', weight: 3.9, color: '#8a6846', rarity: 'uncommon',
    ammoType: 'ammo_762', magSize: 10, reloadTime: 2.8, fireInterval: 190,
    automatic: false, damage: 44, recoil: 1.05,
    description: 'A rugged semi-automatic carbine with a fixed magazine. Favoured by hunters and partisans.',
  },
  m14: {
    short: 'M14', name: 'M14 Battle Rifle', type: 'BATTLE RIFLE', category: 'weapon',
    slot: 'primary', model: 'm14', weight: 4.6, color: '#6f5a42', rarity: 'epic',
    ammoType: 'ammo_308', magSize: 20, reloadTime: 2.95, fireInterval: 145,
    automatic: false, damage: 55, recoil: 1.32,
    description: 'A full-power battle rifle from another era. Heavy, accurate, and utterly unforgiving.',
  },
  svd: {
    short: 'SVD', name: 'SVD Dragunov', type: 'MARKSMAN RIFLE', category: 'weapon',
    slot: 'primary', model: 'svd', weight: 4.3, color: '#846847', rarity: 'epic',
    ammoType: 'ammo_762r', magSize: 10, reloadTime: 3.0, fireInterval: 290,
    automatic: false, damage: 74, recoil: 1.55,
    description: 'A designated marksman rifle with a long scope. Built to reach out and touch someone.',
  },
  m24: {
    short: 'M24', name: 'M24 Sniper', type: 'SNIPER RIFLE', category: 'weapon',
    slot: 'primary', model: 'm24', weight: 5.0, color: '#5f6758', rarity: 'legendary',
    ammoType: 'ammo_308', magSize: 5, reloadTime: 3.7, fireInterval: 1150,
    automatic: false, damage: 112, recoil: 2.15,
    description: 'A bolt-action sniper system. One careful shot can end a fight before it starts.',
  },
  ump45: {
    short: 'UMP', name: 'UMP45', type: 'SUBMACHINE GUN', category: 'weapon',
    slot: 'primary', model: 'ump45', weight: 3.1, color: '#4f5554', rarity: 'rare',
    ammoType: 'ammo_45', magSize: 25, reloadTime: 2.25, fireInterval: 105,
    automatic: true, damage: 29, recoil: 0.63,
    description: 'A hard-hitting .45 submachine gun. Slow rate of fire, but every round lands with intent.',
  },
  pp19: {
    short: 'PP19', name: 'PP-19 Vityaz', type: 'SUBMACHINE GUN', category: 'weapon',
    slot: 'primary', model: 'pp19', weight: 2.9, color: '#596361', rarity: 'uncommon',
    ammoType: 'ammo_9mm', magSize: 30, reloadTime: 2.3, fireInterval: 90,
    automatic: true, damage: 25, recoil: 0.5,
    description: 'A compact 9mm SMG based on the Kalashnikov layout. Fast, light, and easy to control.',
  },

  // ------------------------------------------------------------------- ammo
  ammo_762: {
    short: '762', name: '7.62x39mm', type: 'AMMUNITION', category: 'ammo',
    weight: 0.012, color: '#ffb86b', rarity: 'common', stackable: true, maxStack: 180,
    description: 'A handful of steel-cased rifle rounds for the AK platform.',
  },
  ammo_556: {
    short: '556', name: '5.56x45mm', type: 'AMMUNITION', category: 'ammo',
    weight: 0.011, color: '#ffcf7a', rarity: 'uncommon', stackable: true, maxStack: 180,
    description: 'Brass-cased intermediate rifle ammunition. Hard to find outside military sites.',
  },
  ammo_9mm: {
    short: '9MM', name: '9x19mm', type: 'AMMUNITION', category: 'ammo',
    weight: 0.008, color: '#ffd166', rarity: 'common', stackable: true, maxStack: 240,
    description: 'Common pistol and submachine gun ammunition.',
  },
  ammo_762r: {
    short: '54R', name: '7.62x54mmR', type: 'AMMUNITION', category: 'ammo',
    weight: 0.022, color: '#ffa15c', rarity: 'uncommon', stackable: true, maxStack: 120,
    description: 'Rimmed rifle cartridges for old bolt-action rifles and marksman systems.',
  },
  ammo_45: {
    short: '.45', name: '.45 ACP', type: 'AMMUNITION', category: 'ammo',
    weight: 0.014, color: '#e6b06b', rarity: 'uncommon', stackable: true, maxStack: 160,
    description: 'Heavy pistol ammunition. Slow, fat rounds with serious stopping power.',
  },
  ammo_308: {
    short: '.308', name: '.308 Winchester', type: 'AMMUNITION', category: 'ammo',
    weight: 0.025, color: '#e7a35c', rarity: 'rare', stackable: true, maxStack: 100,
    description: 'Full-power rifle ammunition for precision rifles and battle rifles.',
  },

  // --------------------------------------------------------------- resources
  wood: {
    short: 'WOOD', name: 'Scrap Wood', type: 'SALVAGE', category: 'resource',
    weight: 0.8, color: '#9a7448', rarity: 'common', stackable: true, maxStack: 24,
    description: 'Splintered planks and branches. The foundation of every improvised shelter.',
  },
  scrap: {
    short: 'SCRP', name: 'Scrap Metal', type: 'SALVAGE', category: 'resource',
    weight: 0.55, color: '#9aa19d', rarity: 'common', stackable: true, maxStack: 24,
    description: 'Bent sheet metal, wire, and machine parts. Useful for repairs and crude fabrication.',
  },
  nails: {
    short: 'NAIL', name: 'Nails', type: 'SALVAGE', category: 'resource',
    weight: 0.03, color: '#b7bab4', rarity: 'common', stackable: true, maxStack: 80,
    description: 'A fistful of salvaged nails. Sharp enough to fasten wood, or worse.',
  },
  cloth: {
    short: 'CLTH', name: 'Cloth Scraps', type: 'SALVAGE', category: 'resource',
    weight: 0.12, color: '#c4b79e', rarity: 'common', stackable: true, maxStack: 40,
    description: 'Torn fabric recovered from furniture and old clothing. Can be cleaned and reused.',
  },
  rope: {
    short: 'ROPE', name: 'Rope', type: 'SALVAGE', category: 'resource',
    weight: 0.25, color: '#b39a6d', rarity: 'uncommon', stackable: true, maxStack: 12,
    description: 'Braided cordage. Holds a pack together, or a shelter roof down.',
  },
  stone: {
    short: 'STNE', name: 'Sharp Stone', type: 'SALVAGE', category: 'resource',
    weight: 0.7, color: '#858880', rarity: 'common', stackable: true, maxStack: 24,
    description: 'A chipped stone with a useful edge. Crude, heavy, and dependable.',
  },

  // ---------------------------------------------------------------- medical
  bandage: {
    short: 'BNDG', name: 'Bandage', type: 'MEDICAL SUPPLIES', category: 'medical',
    weight: 0.05, color: '#f4f3ee', rarity: 'common', stackable: true, maxStack: 10,
    use: 'consume', description: 'Clean gauze for patching cuts. Stops bleeding and steadies the hands.',
  },
  rags: {
    short: 'RAGS', name: 'Rags', type: 'MEDICAL SUPPLIES', category: 'medical',
    weight: 0.03, color: '#d8d2c2', rarity: 'common', stackable: true, maxStack: 10,
    use: 'consume', description: 'Torn cloth strips. Crude, but better than nothing.',
  },
  morphine: {
    short: 'MORP', name: 'Morphine', type: 'MEDICAL SUPPLIES', category: 'medical',
    weight: 0.04, color: '#8fe08a', rarity: 'rare', stackable: true, maxStack: 4,
    use: 'consume', description: 'A single-use auto-injector. Takes the edge off serious injuries.',
  },
  saline: {
    short: 'SALN', name: 'Saline Bag', type: 'MEDICAL SUPPLIES', category: 'medical',
    weight: 0.5, color: '#7bdff2', rarity: 'rare', stackable: true, maxStack: 4,
    use: 'consume', description: 'Sterile saline and tubing. Used to bring a survivor back from the brink.',
  },

  // ------------------------------------------------------------------- food
  beans: {
    short: 'BEAN', name: 'Canned Beans', type: 'FOOD', category: 'food',
    weight: 0.4, color: '#f0b56b', rarity: 'common', stackable: true, maxStack: 8,
    use: 'consume', description: 'A dented can of beans. Not a meal you dream about, but it keeps you walking.',
  },
  tuna: {
    short: 'TUNA', name: 'Canned Tuna', type: 'FOOD', category: 'food',
    weight: 0.25, color: '#9fc7d6', rarity: 'uncommon', stackable: true, maxStack: 8,
    use: 'consume', description: 'A small can of fish. The label has long since peeled away.',
  },
  apple: {
    short: 'APPL', name: 'Wild Apple', type: 'FOOD', category: 'food',
    weight: 0.15, color: '#e0645e', rarity: 'common', stackable: true, maxStack: 6,
    use: 'consume', description: 'Bruised and a little sour, but fresh food is a luxury out here.',
  },
  water_bottle: {
    short: 'H2O', name: 'Water Bottle', type: 'DRINK', category: 'food',
    weight: 0.5, color: '#7bdff2', rarity: 'common', stackable: true, maxStack: 6,
    use: 'consume', description: 'A plastic bottle of questionable water. It tastes of rust and plastic.',
  },
  canteen: {
    short: 'CNTN', name: 'Field Canteen', type: 'DRINK', category: 'food',
    weight: 0.8, color: '#7bdff2', rarity: 'uncommon', stackable: false,
    use: 'consume', description: 'A metal canteen with a worn canvas cover. Holds enough water for a long walk.',
  },

  // ------------------------------------------------------------------- gear
  backpack_assault: {
    short: 'PACK', name: 'Assault Backpack', type: 'BACKPACK', category: 'gear',
    slot: 'backpack', weight: 1.8, color: '#7f8c68', rarity: 'uncommon',
    capacityBonus: 10, description: 'A sturdy canvas pack with enough room for a day of scavenging.',
  },
  backpack_hiking: {
    short: 'HIKR', name: 'Hiking Backpack', type: 'BACKPACK', category: 'gear',
    slot: 'backpack', weight: 2.4, color: '#517d86', rarity: 'rare',
    capacityBonus: 15, description: 'A tall civilian hiking pack. Ugly, roomy, and worth its weight.',
  },
  plate_carrier: {
    short: 'VEST', name: 'Plate Carrier', type: 'BODY ARMOR', category: 'gear',
    slot: 'body', weight: 6.4, color: '#7d8870', rarity: 'rare', armor: 45,
    description: 'Heavy ceramic plates in a worn carrier. It will not make you invincible.',
  },
  helmet: {
    short: 'HELM', name: 'Combat Helmet', type: 'HEADGEAR', category: 'gear',
    slot: 'head', weight: 2.0, color: '#79816c', rarity: 'uncommon', armor: 25,
    description: 'A scuffed ballistic helmet with a cracked chin strap.',
  },
  beanie: {
    short: 'BEAN', name: 'Wool Beanie', type: 'HEADGEAR', category: 'gear',
    slot: 'head', weight: 0.2, color: '#b09a78', rarity: 'common',
    description: 'A warm knitted cap. Keeps the rain out of your eyes.',
  },

  // -------------------------------------------------------------- throwables
  frag: {
    short: 'FRAG', name: 'Frag Grenade', type: 'THROWABLE', category: 'throwable',
    slot: 'throwable', weight: 0.4, color: '#ff8c69', rarity: 'uncommon', stackable: true,
    maxStack: 6, throwable: 'frag', description: 'A fragmentation grenade. Pull, throw, and get behind something solid.',
  },
  smoke: {
    short: 'SMKE', name: 'Smoke Grenade', type: 'THROWABLE', category: 'throwable',
    slot: 'throwable', weight: 0.45, color: '#9fb7ff', rarity: 'common', stackable: true,
    maxStack: 6, throwable: 'smoke', description: 'A screening smoke grenade. Useful for breaking contact.',
  },

  // ------------------------------------------------------------------- misc
  compass: {
    short: 'CMP', name: 'Field Compass', type: 'NAVIGATION', category: 'misc',
    weight: 0.15, color: '#d5f55a', rarity: 'uncommon', stackable: false,
    description: 'A liquid-filled compass. The needle still points north, even if nothing else does.',
  },
  knife: {
    short: 'KNIF', name: 'Hunting Knife', type: 'TOOL', category: 'misc',
    weight: 0.3, color: '#c9c9c1', rarity: 'common', stackable: false,
    description: 'A fixed-blade hunting knife. Good for cutting, prying, and opening cans.',
  },
  matches: {
    short: 'MTCH', name: 'Matches', type: 'TOOL', category: 'misc',
    weight: 0.05, color: '#ffb86b', rarity: 'common', stackable: true, maxStack: 5,
    description: 'A damp box of matches. There are enough dry ones left to light a fire.',
  },
  radio: {
    short: 'RAD', name: 'Field Radio', type: 'ELECTRONICS', category: 'misc',
    weight: 0.9, color: '#8fe08a', rarity: 'rare', stackable: false,
    description: 'A hand-cranked field radio. Sometimes a voice breaks through the static.',
  },
};

// ------------------------------------------------------------------ crafting
// Recipes are executed by the client. The server only stores the resulting
// items once they are placed in a base stash or dropped in the world.
export const CRAFTING_RECIPES = [
  {
    id: 'bandage', name: 'Field Bandage', category: 'MEDICAL',
    output: { itemId: 'bandage', quantity: 1 },
    cost: { cloth: 2 },
    description: 'Boil and fold salvaged cloth into a clean field dressing.',
  },
  {
    id: 'rags', name: 'Rag Bundle', category: 'MEDICAL',
    output: { itemId: 'rags', quantity: 2 },
    cost: { cloth: 1 },
    description: 'Tear cloth into strips for quick, dirty wound care.',
  },
  {
    id: 'rope', name: 'Braided Rope', category: 'SALVAGE',
    output: { itemId: 'rope', quantity: 1 },
    cost: { cloth: 3 },
    description: 'Twist and braid cloth strips into a serviceable length of cordage.',
  },
  {
    id: 'ammo_9mm', name: '9mm Reloads', category: 'AMMUNITION',
    output: { itemId: 'ammo_9mm', quantity: 12 },
    cost: { scrap: 2, nails: 2 },
    description: 'Hand-seat salvaged primers and cases into a dozen serviceable 9mm rounds.',
  },
  {
    id: 'ammo_762', name: '7.62 Reloads', category: 'AMMUNITION',
    output: { itemId: 'ammo_762', quantity: 12 },
    cost: { scrap: 3, nails: 2 },
    description: 'Recycle steel cases and scavenged powder into rifle ammunition.',
  },
  {
    id: 'ammo_45', name: '.45 Reloads', category: 'AMMUNITION',
    output: { itemId: 'ammo_45', quantity: 10 },
    cost: { scrap: 3, nails: 3 },
    description: 'Heavy handgun cartridges assembled from mixed salvage.',
  },
  {
    id: 'ammo_308', name: '.308 Reloads', category: 'AMMUNITION',
    output: { itemId: 'ammo_308', quantity: 8 },
    cost: { scrap: 4, nails: 3, stone: 1 },
    description: 'Precision rifle rounds. Difficult to assemble, but worth the effort.',
  },
  {
    id: 'backpack_hiking', name: 'Improvised Pack', category: 'GEAR',
    output: { itemId: 'backpack_hiking', quantity: 1 },
    cost: { cloth: 6, rope: 1, nails: 2 },
    description: 'Stitch a roomy frame pack from cloth, cordage, and salvaged hardware.',
  },
  {
    id: 'plate_carrier', name: 'Scrap Plate Carrier', category: 'GEAR',
    output: { itemId: 'plate_carrier', quantity: 1 },
    cost: { scrap: 6, cloth: 4, rope: 1 },
    description: 'Layer scrap plates over a cloth carrier. Heavy, ugly, and better than nothing.',
  },
  {
    id: 'frag', name: 'Pipe Bomb', category: 'THROWABLE',
    output: { itemId: 'frag', quantity: 1 },
    cost: { scrap: 3, nails: 4, cloth: 1 },
    description: 'Pack scrap and nails into a sealed pipe with a crude fuse.',
  },
  {
    id: 'saline', name: 'Field Saline', category: 'MEDICAL',
    output: { itemId: 'saline', quantity: 1 },
    cost: { water_bottle: 1, cloth: 2, stone: 1 },
    description: 'A desperate field transfusion kit assembled from clean water and filtered cloth.',
  },
];

// Each entry: template id, spawn weight, and quantity range.
export const LOOT_TABLES = {
  1: [
    { id: 'beans', weight: 14, min: 1, max: 2 },
    { id: 'tuna', weight: 8, min: 1, max: 1 },
    { id: 'apple', weight: 10, min: 1, max: 2 },
    { id: 'water_bottle', weight: 10, min: 1, max: 1 },
    { id: 'bandage', weight: 12, min: 1, max: 3 },
    { id: 'rags', weight: 10, min: 2, max: 5 },
    { id: 'ammo_9mm', weight: 7, min: 8, max: 30 },
    { id: 'ammo_762', weight: 5, min: 8, max: 25 },
    { id: 'makarov', weight: 3, min: 1, max: 1 },
    { id: 'mp5', weight: 2, min: 1, max: 1 },
    { id: 'beanie', weight: 5, min: 1, max: 1 },
    { id: 'backpack_assault', weight: 3, min: 1, max: 1 },
    { id: 'matches', weight: 6, min: 1, max: 1 },
    { id: 'knife', weight: 4, min: 1, max: 1 },
    { id: 'canteen', weight: 3, min: 1, max: 1 },
    { id: 'glock17', weight: 2, min: 1, max: 1 },
    { id: 'cloth', weight: 9, min: 1, max: 4 },
    { id: 'scrap', weight: 7, min: 1, max: 3 },
    { id: 'nails', weight: 6, min: 2, max: 6 },
    { id: 'wood', weight: 5, min: 1, max: 3 },
  ],
  2: [
    { id: 'ak74', weight: 6, min: 1, max: 1 },
    { id: 'mp5', weight: 5, min: 1, max: 1 },
    { id: 'makarov', weight: 6, min: 1, max: 1 },
    { id: 'ammo_762', weight: 10, min: 15, max: 45 },
    { id: 'ammo_9mm', weight: 9, min: 15, max: 45 },
    { id: 'bandage', weight: 10, min: 1, max: 4 },
    { id: 'morphine', weight: 3, min: 1, max: 1 },
    { id: 'beans', weight: 8, min: 1, max: 2 },
    { id: 'tuna', weight: 6, min: 1, max: 1 },
    { id: 'water_bottle', weight: 8, min: 1, max: 1 },
    { id: 'backpack_assault', weight: 4, min: 1, max: 1 },
    { id: 'backpack_hiking', weight: 2, min: 1, max: 1 },
    { id: 'plate_carrier', weight: 3, min: 1, max: 1 },
    { id: 'helmet', weight: 4, min: 1, max: 1 },
    { id: 'frag', weight: 4, min: 1, max: 2 },
    { id: 'smoke', weight: 3, min: 1, max: 2 },
    { id: 'compass', weight: 3, min: 1, max: 1 },
    { id: 'sks', weight: 3, min: 1, max: 1 },
    { id: 'pp19', weight: 3, min: 1, max: 1 },
    { id: 'glock17', weight: 4, min: 1, max: 1 },
    { id: 'm1911', weight: 3, min: 1, max: 1 },
    { id: 'ammo_45', weight: 7, min: 10, max: 35 },
    { id: 'cloth', weight: 7, min: 2, max: 5 },
    { id: 'scrap', weight: 8, min: 2, max: 5 },
    { id: 'nails', weight: 6, min: 3, max: 8 },
    { id: 'stone', weight: 4, min: 1, max: 3 },
    { id: 'rope', weight: 2, min: 1, max: 1 },
  ],
  3: [
    { id: 'm4a1', weight: 4, min: 1, max: 1 },
    { id: 'mosin', weight: 5, min: 1, max: 1 },
    { id: 'ak74', weight: 8, min: 1, max: 1 },
    { id: 'ammo_556', weight: 7, min: 15, max: 40 },
    { id: 'ammo_762r', weight: 7, min: 10, max: 30 },
    { id: 'ammo_762', weight: 8, min: 20, max: 60 },
    { id: 'frag', weight: 8, min: 1, max: 3 },
    { id: 'smoke', weight: 5, min: 1, max: 2 },
    { id: 'plate_carrier', weight: 7, min: 1, max: 1 },
    { id: 'helmet', weight: 7, min: 1, max: 1 },
    { id: 'saline', weight: 4, min: 1, max: 1 },
    { id: 'morphine', weight: 6, min: 1, max: 1 },
    { id: 'backpack_hiking', weight: 4, min: 1, max: 1 },
    { id: 'radio', weight: 3, min: 1, max: 1 },
    { id: 'svd', weight: 4, min: 1, max: 1 },
    { id: 'm24', weight: 2, min: 1, max: 1 },
    { id: 'm14', weight: 4, min: 1, max: 1 },
    { id: 'ump45', weight: 5, min: 1, max: 1 },
    { id: 'm1911', weight: 5, min: 1, max: 1 },
    { id: 'ammo_308', weight: 8, min: 8, max: 24 },
    { id: 'ammo_45', weight: 8, min: 15, max: 40 },
    { id: 'scrap', weight: 8, min: 3, max: 7 },
    { id: 'cloth', weight: 6, min: 3, max: 7 },
    { id: 'stone', weight: 5, min: 2, max: 5 },
    { id: 'rope', weight: 4, min: 1, max: 2 },
  ],
};

