# Dayza // Chernov Exclusion Zone

A zero-dependency, browser-based multiplayer survival prototype built with Three.js and a hand-rolled Node.js WebSocket server. The world is a 1000 × 1000 metre exclusion zone with a train station, towns, claimable shelters, harvestable resources, an infected population, world loot, clans, a minimap, a field-pack inventory, and weapon reloading.

## Run it

```bash
npm.cmd start
```

Open `http://localhost:3000`. Three.js is loaded from a browser CDN; no package install is required.

On Windows PowerShell, `npm start` can be blocked because the system disables `npm.ps1`. `npm.cmd start` is the equivalent command and works without changing your PowerShell policy. If port 3000 is already in use, the server is probably already running; otherwise use `$env:PORT=3001; npm.cmd start` and open `http://localhost:3001`.

Open a second browser tab (or another machine on the same network) to test multiplayer, looting, shelter ownership, and clans.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| `SHIFT` | Sprint (forward) |
| `SPACE` | Jump |
| Left mouse | Fire / throw |
| Right mouse | Aim |
| `E` | Pick up loot / harvest a resource / open a stash / claim a shelter |
| `R` | Reload |
| `1` / `2` / `3` | Select primary / secondary / throwable |
| `B` | Open the field crafting bench |
| `G` | Throw the equipped throwable |
| `TAB` | Open the field-pack inventory |
| `M` | Open the full zone map |
| `C` | Open the clan panel |
| `P` | Open the survivor profile |
| `V` | Toggle first / third person |
| `ESC` | Close the current panel or release the mouse |

Click the world after closing a panel to capture the mouse again.

## What is in the world

- **1000 × 1000 metre map** with a survivor camp, Yaroslav train station and freight yard, Novo Selo town, a military camp, Zavod industrial works, Zeleno farm, Kamenka village, a crash site, a forest cabin, a checkpoint, a pond and dock, and woodland outposts.
- **Roads, rail lines, moving trains, station platforms, warehouses, houses, containers, tents, watchtowers, sandbags, wrecks, campfires, smoke, and instanced forests/rocks.**
- **World loot** at fixed loot zones across the map. Loot rarity and tier give better gear at military, freight, and crash-site locations.
- **Server-authoritative loot** spawning, pickup, dropping, decay, and respawn.
- **Six claimable shelters** — Drowned Farmhouse, Pine Hollow Cabin, Railway Shed, Old Mill House, Hunter's Lodge, and Lakeside Cottage. Walk inside, press `E`, and the house becomes your respawn point. Claim flags, signs, and map markers update for everyone.
- **Stash chests** in every claimable shelter. Owners and clan members can store up to 12 stacks and take them back out.
- **Town bases**: every constructed building in Novo Selo can be claimed with `E`, becomes a respawn point, and gets its own stash chest and ownership marker.
- **Harvestable resources** — fallen timber, scrap piles, stone outcrops, and abandoned cloth caches — with server-owned remaining uses and respawn timers. Wood, scrap, nails, cloth, rope, and stone feed the crafting bench.
- **Field crafting** with 11 blueprints for medical supplies, ammunition, backpacks, armor, rope, and grenades.
- **Infected population** with walker, infected, and brute tiers. Zombies wander their zones, chase nearby survivors, attack in melee, drop loot when killed, and respawn over time.
- **Server-authoritative health, damage, regeneration, death, and respawn.** Medical items heal; dying scatters part of your field pack and lets you respawn at your claimed shelter or the survivor camp.
- **24-slot inventory** with item rarity, descriptions, weight limits, backpack capacity, drag-and-drop reordering, equipment slots, and consumable use.
- **Weapon handling** with magazine and reserve ammo, per-weapon reload times, automatic and semi-automatic fire, recoil, tracers, muzzle flashes, and first-person weapon models. The arsenal includes pistols, SMGs, rifles, and sniper rifles.
- **Clans** with leader-controlled invitations, a roster, kick/leave/disband actions, assignable colours and tags, team markers, overhead labels, and team-coloured minimap dots.
- **Canvas minimap** with loot, shelter, resource, infected, player, and clan markers, plus a closest-region readout and a full `M` map with POI labels.
- **Profile panel** with editable display name, survivor ID, playtime, loot secured count, health status, and current loadout.
- **Low-poly survivor and infected models** with layered clothing, armor, backpacks, headgear, slung rifles, exposed wounds, health bars, and walk animations.
- **Airdrops** land every five minutes at a random high-value location and scatter tier-3 loot around the crate.
- **Resource nodes** respawn four minutes after they are fully depleted.

## Prototype notes

- Inventory contents, ammo counts, and equipment are kept in the browser for this prototype. Loot, clans, shelters, chest contents, resource depletion, infected positions and damage, player health, and respawns are synchronized by the server.
- Shots are broadcast to other players for tracers and are raycast server-side against infected for authoritative damage.
- Three.js comes from a CDN, so the client needs internet access even though the game server itself has no dependencies.
- The server can be reached over WebSocket at the same origin as the page; no build step or bundler is involved.
