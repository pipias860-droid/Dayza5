// Shared world layout data. Imported by the browser client and the Node server.
export * from './game-data.js';

export const WORLD_HALF = 500;
export const WORLD_SIZE = WORLD_HALF * 2;

export const POIS = [
  { id: 'camp', name: 'SURVIVOR CAMP', short: 'CAMP', x: 0, z: 0, kind: 'camp', radius: 28 },
  { id: 'station', name: 'YAROSLAV TRAIN STATION', short: 'STATION', x: 0, z: -325, kind: 'train', radius: 95 },
  { id: 'town', name: 'NOVO SELO', short: 'TOWN', x: 165, z: 62, kind: 'town', radius: 105 },
  { id: 'military', name: 'MILITARY CAMP', short: 'MIL', x: -260, z: -215, kind: 'military', radius: 80 },
  { id: 'industrial', name: 'ZAVOD WORKS', short: 'IND', x: -245, z: 225, kind: 'industrial', radius: 90 },
  { id: 'farm', name: 'ZELENO FARM', short: 'FARM', x: 278, z: 228, kind: 'farm', radius: 70 },
  { id: 'village', name: 'KAMENKA', short: 'VIL', x: 344, z: -252, kind: 'village', radius: 48 },
  { id: 'crash', name: 'CRASH SITE', short: 'CRASH', x: -140, z: 360, kind: 'crash', radius: 45 },
  { id: 'checkpoint', name: 'CHECKPOINT', short: 'CP', x: 0, z: -150, kind: 'checkpoint', radius: 30 },
  { id: 'cabin', name: 'FOREST CABIN', short: 'CABIN', x: 402, z: 126, kind: 'cabin', radius: 30 },
  { id: 'pond', name: 'BLACKWATER POND', short: 'POND', x: -330, z: 60, kind: 'pond', radius: 30 },
];

// Road segments. kind controls the surface + minimap weight.
export const ROADS = [
  { id: 'hwy-ns', x1: 0, z1: -300, x2: 0, z2: 430, width: 14, kind: 'highway' },
  { id: 'hwy-ew', x1: -430, z1: 0, x2: 430, z2: 0, width: 12, kind: 'highway' },
  { id: 'town-main', x1: 0, z1: 60, x2: 330, z2: 60, width: 12, kind: 'street' },
  { id: 'town-cross', x1: 150, z1: 0, x2: 150, z2: 142, width: 10, kind: 'street' },
  { id: 'mil-road', x1: -340, z1: -170, x2: 0, z2: -170, width: 9, kind: 'street' },
  { id: 'ind-road', x1: -340, z1: 220, x2: 0, z2: 220, width: 9, kind: 'street' },
  { id: 'farm-road', x1: 260, z1: 60, x2: 260, z2: 232, width: 8, kind: 'street' },
  { id: 'station-east', x1: 60, z1: -300, x2: 392, z2: -300, width: 8, kind: 'street' },
  { id: 'farm-lane', x1: 260, z1: 210, x2: 326, z2: 210, width: 6, kind: 'dirt' },
  { id: 'cabin-trail', x1: 330, z1: 60, x2: 402, z2: 126, width: 5, kind: 'dirt' },
  { id: 'crash-trail', x1: -40, z1: 330, x2: -140, z2: 360, width: 5, kind: 'dirt' },
  { id: 'pond-trail', x1: -330, z1: 0, x2: -330, z2: 60, width: 5, kind: 'dirt' },
  { id: 'pond-east', x1: -330, z1: 60, x2: -278, z2: 70, width: 4, kind: 'dirt' },
];

export const TRACKS = [
  { id: 'track-passenger', z: -338, x1: -470, x2: 470 },
  { id: 'track-freight', z: -350, x1: -470, x2: 470 },
];

// Loot is spawned by the server at these fixed, hand-placed spots.
// Each spot is guaranteed to sit in an open area created by world.js.
export const LOOT_ZONES = [
  {
    id: 'camp', name: 'Survivor Camp', tier: 1,
    spots: [
      [4, 3], [-5, 4], [6, -4], [-6, -3], [0, 9], [-14, 3], [13, -6], [7, 10], [-9, -10], [15, 4],
    ],
  },
  {
    id: 'station-platform', name: 'Station Platform', tier: 2,
    spots: [
      [-55, -328], [-35, -330], [-15, -326], [5, -331], [25, -327], [45, -330], [60, -325],
      [-20, -296], [20, -296], [0, -308], [78, -332], [-78, -332], [12, -318], [-12, -318],
    ],
  },
  {
    id: 'station-freight', name: 'Freight Yard', tier: 3,
    spots: [
      [118, -346], [142, -344], [166, -345], [190, -346], [108, -330], [132, -328], [156, -330],
    ],
  },
  {
    id: 'town', name: 'Novo Selo', tier: 2,
    spots: [
      [70, 51], [95, 70], [120, 51], [140, 69], [165, 51], [185, 67], [210, 51], [230, 70],
      [255, 52], [280, 65], [150, 22], [150, 44], [150, 80], [150, 104], [150, 130],
      [62, 100], [100, 108], [132, 120], [220, 92], [258, 112],
    ],
  },
  {
    id: 'military', name: 'Military Camp', tier: 3,
    spots: [
      [-295, -210], [-275, -220], [-250, -225], [-225, -210], [-270, -245], [-300, -240],
      [-240, -250], [-210, -220], [-310, -230], [-205, -245],
    ],
  },
  {
    id: 'checkpoint', name: 'Checkpoint', tier: 2,
    spots: [[3, -148], [-4, -157], [8, -160], [-8, -142], [0, -166]],
  },
  {
    id: 'industrial', name: 'Zavod Works', tier: 2,
    spots: [
      [-250, 210], [-225, 200], [-280, 220], [-300, 235], [-310, 255], [-285, 270],
      [-260, 280], [-220, 262], [-195, 230], [-320, 215], [-330, 250], [-240, 255],
      [-205, 205], [-180, 250],
    ],
  },
  {
    id: 'farm', name: 'Zeleno Farm', tier: 1,
    spots: [
      [260, 230], [275, 214], [285, 230], [305, 220], [250, 242], [315, 245], [270, 252],
      [300, 246], [255, 200], [310, 205],
    ],
  },
  {
    id: 'village', name: 'Kamenka', tier: 1,
    spots: [[330, -262], [355, -266], [376, -246], [345, -236], [315, -246], [360, -280]],
  },
  {
    id: 'crash', name: 'Crash Site', tier: 3,
    spots: [[-150, 350], [-130, 370], [-160, 366], [-120, 355], [-140, 380], [-165, 352]],
  },
  {
    id: 'cabin', name: 'Forest Cabin', tier: 1,
    spots: [[398, 118], [405, 125], [392, 130], [410, 120]],
  },
  {
    id: 'wilds', name: 'Wilderness', tier: 1,
    spots: [[-380, 380], [340, 330], [-360, -380], [390, -390], [210, -380], [-420, 60]],
  },
];

// ---------------------------------------------------------------------------
// Claimable shelters. Each entry becomes a furnished house in world.js with a
// stash chest inside. The server treats the centre of the house as the claim
// zone and as the owner's respawn point.
// ---------------------------------------------------------------------------
export const BASE_HOUSES = [
  {
    id: 'base-farmhouse', name: 'DROWNED FARMHOUSE', short: 'FARMHOUSE',
    x: 60, z: 212, rotation: .25, w: 10, d: 9, h: 3.2, wall: 'brick', roofRise: 2.3,
    claimRadius: 10,
  },
  {
    id: 'base-cabin', name: 'PINE HOLLOW CABIN', short: 'HOLLOW',
    x: -100, z: 62, rotation: -.4, w: 9, d: 8, h: 3.0, wall: 'wood', roofRise: 2.5,
    claimRadius: 9,
  },
  {
    id: 'base-shed', name: 'RAILWAY SHED', short: 'SHED',
    x: 82, z: -232, rotation: .1, w: 8.5, d: 7.5, h: 2.9, wall: 'metal', roofRise: 1.9,
    claimRadius: 9,
  },
  {
    id: 'base-mill', name: 'OLD MILL HOUSE', short: 'MILL',
    x: -118, z: 330, rotation: 2.4, w: 10, d: 9, h: 3.2, wall: 'brick', roofRise: 2.2,
    claimRadius: 10,
  },
  {
    id: 'base-lodge', name: 'HUNTER\u2019S LODGE', short: 'LODGE',
    x: 308, z: 342, rotation: -.8, w: 9.5, d: 9, h: 3.1, wall: 'wood', roofRise: 2.6,
    claimRadius: 10,
  },
  {
    id: 'base-cottage', name: 'LAKESIDE COTTAGE', short: 'COTTAGE',
    x: -280, z: 26, rotation: 1.5, w: 9, d: 8, h: 3.0, wall: 'wood', roofRise: 2.4,
    claimRadius: 9,
  },
];

// Every constructed building in Novo Selo can become a survivor base. These
// markers share the town geometry in world.js; the server owns the claim state.
export const TOWN_BUILDINGS = [
  { id: 'town-house-01', name: 'NOVO SELO HOUSE 01', short: 'HOUSE 01', x: 80, z: 35, rotation: 0, w: 10, d: 9, h: 3.3, wall: 'brick', roofRise: 2.4, claimRadius: 9 },
  { id: 'town-house-02', name: 'NOVO SELO HOUSE 02', short: 'HOUSE 02', x: 105, z: 33, rotation: 0, w: 9, d: 9, h: 3.1, wall: 'wood', roofRise: 2.1, claimRadius: 9 },
  { id: 'town-house-03', name: 'NOVO SELO HOUSE 03', short: 'HOUSE 03', x: 132, z: 34, rotation: 0, w: 10, d: 9, h: 3.5, wall: 'brick', roofRise: 2.4, claimRadius: 9 },
  { id: 'town-grocery', name: 'NOVO SELO GROCERY', short: 'GROCERY', x: 180, z: 35, rotation: 0, w: 16, d: 11, h: 3.8, wall: 'concrete', flatRoof: true, claimRadius: 12 },
  { id: 'town-clinic', name: 'NOVO SELO CLINIC', short: 'CLINIC', x: 214, z: 35, rotation: 0, w: 12, d: 10, h: 3.5, wall: 'concrete', flatRoof: true, claimRadius: 10 },
  { id: 'town-house-04', name: 'NOVO SELO HOUSE 04', short: 'HOUSE 04', x: 250, z: 33, rotation: 0, w: 10, d: 9, h: 3.2, wall: 'wood', roofRise: 2.4, claimRadius: 9 },
  { id: 'town-house-05', name: 'NOVO SELO HOUSE 05', short: 'HOUSE 05', x: 85, z: 92, rotation: Math.PI, w: 10, d: 9, h: 3.3, wall: 'brick', roofRise: 2.4, claimRadius: 9 },
  { id: 'town-house-06', name: 'NOVO SELO HOUSE 06', short: 'HOUSE 06', x: 115, z: 93, rotation: Math.PI, w: 9, d: 9, h: 3.2, wall: 'wood', roofRise: 2.2, claimRadius: 9 },
  { id: 'town-bar', name: 'NOVO SELO BAR', short: 'BAR', x: 168, z: 94, rotation: Math.PI, w: 14, d: 10, h: 3.6, wall: 'wood', flatRoof: true, claimRadius: 11 },
  { id: 'town-house-07', name: 'NOVO SELO HOUSE 07', short: 'HOUSE 07', x: 220, z: 92, rotation: Math.PI, w: 10, d: 9, h: 3.3, wall: 'brick', roofRise: 2.4, claimRadius: 9 },
  { id: 'town-house-08', name: 'NOVO SELO HOUSE 08', short: 'HOUSE 08', x: 255, z: 92, rotation: Math.PI, w: 10, d: 9, h: 3.1, wall: 'wood', roofRise: 2.2, claimRadius: 9 },
  { id: 'town-church', name: 'NOVO SELO CHURCH', short: 'CHURCH', x: 205, z: 112, rotation: Math.PI, w: 14, d: 22, h: 6.2, wall: 'brick', roofRise: 4.4, claimRadius: 15 },
];

// ---------------------------------------------------------------------------
// Harvestable resource nodes. The server owns remaining uses + respawn timers
// so co-op players see the same depleted nodes.
// ---------------------------------------------------------------------------
export const RESOURCE_TYPES = {
  wood: {
    label: 'Fallen Timber', verb: 'CHOP', color: '#9a7448', respawn: 240_000, maxUses: 4,
    yields: [{ id: 'wood', min: 1, max: 3 }, { id: 'nails', min: 0, max: 2 }],
  },
  scrap: {
    label: 'Scrap Pile', verb: 'SALVAGE', color: '#9aa19d', respawn: 240_000, maxUses: 4,
    yields: [{ id: 'scrap', min: 1, max: 3 }, { id: 'nails', min: 0, max: 3 }],
  },
  stone: {
    label: 'Stone Outcrop', verb: 'MINE', color: '#858880', respawn: 240_000, maxUses: 3,
    yields: [{ id: 'stone', min: 1, max: 3 }],
  },
  cloth: {
    label: 'Abandoned Cache', verb: 'SEARCH', color: '#c4b79e', respawn: 240_000, maxUses: 3,
    yields: [{ id: 'cloth', min: 1, max: 3 }, { id: 'rope', min: 0, max: 1 }],
  },
};

export const RESOURCE_NODES = [
  { id: 'res-01', kind: 'wood', x: -30, z: 20, rotation: .4 },
  { id: 'res-02', kind: 'wood', x: 28, z: -18, rotation: 1.1 },
  { id: 'res-03', kind: 'scrap', x: -24, z: -24, rotation: -.2 },
  { id: 'res-04', kind: 'scrap', x: 30, z: 26, rotation: .8 },
  { id: 'res-05', kind: 'stone', x: -40, z: 5, rotation: 2.1 },
  { id: 'res-06', kind: 'stone', x: 38, z: -6, rotation: .3 },
  { id: 'res-07', kind: 'cloth', x: -18, z: 30, rotation: 1.4 },
  { id: 'res-08', kind: 'cloth', x: 22, z: 32, rotation: -.6 },

  { id: 'res-09', kind: 'wood', x: 100, z: -270, rotation: .7 },
  { id: 'res-10', kind: 'scrap', x: 120, z: -290, rotation: .1 },
  { id: 'res-11', kind: 'cloth', x: 60, z: -290, rotation: 2.3 },
  { id: 'res-12', kind: 'stone', x: 150, z: -270, rotation: .9 },

  { id: 'res-13', kind: 'scrap', x: 70, z: 80, rotation: .2 },
  { id: 'res-14', kind: 'cloth', x: 110, z: 60, rotation: 1.8 },
  { id: 'res-15', kind: 'wood', x: 150, z: 140, rotation: -.4 },
  { id: 'res-16', kind: 'stone', x: 200, z: 140, rotation: .6 },

  { id: 'res-17', kind: 'scrap', x: -190, z: -210, rotation: 1.2 },
  { id: 'res-18', kind: 'stone', x: -170, z: -230, rotation: -.3 },
  { id: 'res-19', kind: 'cloth', x: -230, z: -180, rotation: .4 },
  { id: 'res-20', kind: 'wood', x: -300, z: -170, rotation: 2.7 },

  { id: 'res-21', kind: 'scrap', x: -170, z: 190, rotation: 1.0 },
  { id: 'res-22', kind: 'scrap', x: -200, z: 300, rotation: -.5 },
  { id: 'res-23', kind: 'stone', x: -350, z: 240, rotation: .8 },
  { id: 'res-24', kind: 'wood', x: -300, z: 310, rotation: 1.7 },

  { id: 'res-25', kind: 'wood', x: 230, z: 210, rotation: .3 },
  { id: 'res-26', kind: 'cloth', x: 300, z: 250, rotation: 2.2 },
  { id: 'res-27', kind: 'stone', x: 340, z: 260, rotation: -.9 },

  { id: 'res-28', kind: 'wood', x: 390, z: -280, rotation: .5 },
  { id: 'res-29', kind: 'scrap', x: 300, z: -300, rotation: 1.4 },
  { id: 'res-30', kind: 'cloth', x: 380, z: -230, rotation: -.2 },

  { id: 'res-31', kind: 'scrap', x: -90, z: 350, rotation: 1.9 },
  { id: 'res-32', kind: 'stone', x: -180, z: 380, rotation: .4 },
  { id: 'res-33', kind: 'cloth', x: -100, z: 390, rotation: -.7 },

  { id: 'res-34', kind: 'wood', x: -330, z: 90, rotation: .6 },
  { id: 'res-35', kind: 'stone', x: -300, z: 40, rotation: 1.3 },
  { id: 'res-36', kind: 'wood', x: 400, z: -60, rotation: 2.0 },
  { id: 'res-37', kind: 'scrap', x: -400, z: 300, rotation: -.1 },
  { id: 'res-38', kind: 'stone', x: 100, z: -400, rotation: .7 },
  { id: 'res-39', kind: 'cloth', x: 420, z: 200, rotation: 1.6 },
];

// ---------------------------------------------------------------------------
// Zombie population. The server spawns `count` walkers per zone and keeps them
// wandering / chasing until killed. Tier scales health, speed and loot quality.
// ---------------------------------------------------------------------------
export const ZOMBIE_ZONES = [
  {
    id: 'z-station', name: 'Station Walkers', tier: 2, count: 5,
    spots: [[-60, -310], [0, -300], [60, -305], [90, -330], [-30, -330]],
  },
  {
    id: 'z-town', name: 'Novo Selo Infected', tier: 2, count: 6,
    spots: [[90, 70], [150, 100], [220, 70], [280, 100], [180, 120], [120, 130]],
  },
  {
    id: 'z-military', name: 'Military Infected', tier: 3, count: 6,
    spots: [[-300, -230], [-240, -240], [-220, -210], [-280, -200], [-320, -250], [-260, -250]],
  },
  {
    id: 'z-industrial', name: 'Zavod Infected', tier: 2, count: 5,
    spots: [[-220, 230], [-280, 250], [-310, 210], [-190, 270], [-250, 290]],
  },
  {
    id: 'z-farm', name: 'Farm Infected', tier: 1, count: 4,
    spots: [[250, 240], [290, 220], [320, 250], [270, 270]],
  },
  {
    id: 'z-village', name: 'Kamenka Infected', tier: 1, count: 4,
    spots: [[330, -250], [360, -260], [380, -240], [320, -230]],
  },
  {
    id: 'z-crash', name: 'Crash Site Infected', tier: 3, count: 5,
    spots: [[-140, 350], [-120, 370], [-160, 370], [-130, 340], [-150, 385]],
  },
  {
    id: 'z-checkpoint', name: 'Checkpoint Infected', tier: 2, count: 4,
    spots: [[0, -170], [10, -150], [-10, -140], [20, -180]],
  },
  {
    id: 'z-wilds', name: 'Wilderness Walkers', tier: 1, count: 5,
    spots: [[-350, 350], [350, 350], [-350, -350], [350, -400], [420, 0]],
  },
  {
    id: 'z-cabin', name: 'Forest Infected', tier: 2, count: 3,
    spots: [[400, 120], [420, 150], [390, 150]],
  },
];

export const PLAYER_MAX_HEALTH = 100;
