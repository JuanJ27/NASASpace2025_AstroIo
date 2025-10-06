require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Core modules
// ─────────────────────────────────────────────────────────────────────────────
const { GAME_CONFIG, gameState } = require('./server/core/gameState');
const { handleConnection } = require('./server/sockets/connection');
const { handleMovement } = require('./server/sockets/movement');
const { updatePlayerPosition } = require('./server/core/physics');
const { checkOrbCollisions, checkPlayerCollisions } = require('./server/core/collisions');
const { initializeBots, updateBots } = require('./server/core/bots');
const { getPlayerLevel } = require('./server/core/player');

// Hazards (server authoritative) — LAZY activation only
const {
enableHazardsForLevel3,
disableHazards,
areHazardsActive,
updateHazards,
getHazardsSnapshot
} = require('./server/core/hazards');

// Galaxy Hazards (Level 3: Galaxias 120-159)
const {
  enableGalaxyHazards,
  disableGalaxyHazards,
  areGalaxyHazardsActive,
  updateGalaxyHazards,
  getGalaxyHazardsSnapshot
} = require('./server/core/hazardsGalaxy');

// Pull hazard band from shared/levelsConfig
const { getLevelForSize } = require('./shared/levelsConfig');

function getHazardBandFromConfig() {
const cfg = require('./shared/levelsConfig').LEVELS_CONFIG || [];
const s3 = cfg.find(e => e.level === 1 && e.sublevel === 3);
const s4 = cfg.find(e => e.level === 1 && e.sublevel === 4);
if (s3 && s4) return { min: Math.min(s3.min, s4.min), max: Math.max(s3.max, s4.max) };

const c2 = cfg.find(e => e.clientLevel === 2);
const c3 = cfg.find(e => e.clientLevel === 3);
if (c2 && c3) return { min: Math.min(c2.min, c3.min), max: Math.max(c3.max, c2.max) };

return { min: 27, max: 119 };
}

const HAZARD_RANGE = getHazardBandFromConfig();

// Galaxy Level hazard range (size 120-159)
const GALAXY_HAZARD_RANGE = { min: 120, max: 159 };


// (optional) shared band check if you prefer to lazy-init when someone hits L3
// const { getLevelForSize } = require('./shared/levelsConfig');

// ─────────────────────────────────────────────────────────────────────────────
// Express / Socket setup
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
cors: { origin: '*', methods: ['GET', 'POST'] },
transports: ['websocket', 'polling'],
allowEIO3: true
});

io.engine.on('initial_headers', (headers) => {
console.log('📡 SocketIO headers:', headers);
});

io.engine.on('connection_error', (err) => {
console.error('❌ SocketIO connection error:', err);
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const USER = process.env.USER || '';

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
if (NODE_ENV === 'development') {
console.log('••••• Entrando en modo desarrollo •••• ' + USER);

const devFiles = {
ginkgo: 'ginkgo_dev.html',
juan: 'juanjo_dev.html',
juanjo: 'juanjo_dev.html',
tomas: 'tomas_dev.html',
darwin: 'darwin_dev.html',
profe: 'profe_dev.html'
};

const key = (USER || '').toLowerCase();
const devFile = devFiles[key] || 'index.html';
const filePath = path.join(__dirname, 'public', 'worlds', devFile);
console.log(`🔧 DEV MODE: ${devFile} for ${USER}`);
res.sendFile(filePath);
} else {
const filePath = path.join(__dirname, 'public', 'index.html');
console.log('🚀 PROD MODE: index.html');
res.sendFile(filePath);
}
});

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
// Shared assets
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO handlers
// ─────────────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
handleConnection(io, socket);
handleMovement(socket);
});

// ─────────────────────────────────────────────────────────────────────────────
// Game loop state
// ─────────────────────────────────────────────────────────────────────────────
let lastLoopTime = Date.now();
let lastState = { players: {}, orbs: [] };
let frameCount = 0;
let fpsUpdateTime = Date.now();

// (optional) track hazards signature (not strictly required)
let lastHazardsSig = '';

// ─────────────────────────────────────────────────────────────────────────────
// Game Loop
// ─────────────────────────────────────────────────────────────────────────────
function gameLoop() {
const start = Date.now();

try {
const dt = start - lastLoopTime; // ms since last frame
lastLoopTime = start;

// FPS counter (optional)
frameCount++;
if (start - fpsUpdateTime >= 1000) {
frameCount = 0;
fpsUpdateTime = start;
}

// Update human players
Object.values(gameState.players).forEach((player) => {
if (player.isBot) return;

updatePlayerPosition(player, dt);
checkOrbCollisions(player);

// Keep level meta in sync
const level = getPlayerLevel(player.size);
player.levelKey = level.key;
player.levelName = level.name;
});

// Update bots
updateBots(dt);

// Player vs Player collisions
const removedPlayers = checkPlayerCollisions(io);

// ── LAZY hazards activation:
// Activate ONLY when any player is inside your L1-Sub3 (27–39) or L1-Sub4 (40–119).
let anyInHazardBands = false;
for (const p of Object.values(gameState.players)) {
if (!p || !p.isAlive) continue;
if (p.size >= HAZARD_RANGE.min && p.size <= HAZARD_RANGE.max) {
anyInHazardBands = true;
break;
}
}

if (anyInHazardBands && !areHazardsActive()) {
enableHazardsForLevel3();
console.log('☄️ Hazards ENABLED (player in Sub3/Sub4 band).');
} else if (!anyInHazardBands && areHazardsActive()) {
disableHazards();
console.log('☄️ Hazards DISABLED (no players in Sub3/Sub4).');
}

// Tick hazards (does nothing if inactive)
updateHazards(dt, io);

    // ── LAZY Galaxy hazards activation (Level 3: 120-159):
    let anyInGalaxyBand = false;
    for (const p of Object.values(gameState.players)) {
      if (!p || !p.isAlive) continue;
      if (p.size >= GALAXY_HAZARD_RANGE.min && p.size <= GALAXY_HAZARD_RANGE.max) {
        anyInGalaxyBand = true;
        break;
      }
    }

    if (anyInGalaxyBand && !areGalaxyHazardsActive()) {
      enableGalaxyHazards();
      console.log('🌌 Galaxy Hazards ENABLED (player in Galaxy band 120-159).');
    } else if (!anyInGalaxyBand && areGalaxyHazardsActive()) {
      disableGalaxyHazards();
      console.log('🌌 Galaxy Hazards DISABLED (no players in Galaxy band).');
    }

    // Tick galaxy hazards (orbital movement + physics)
    updateGalaxyHazards(dt, io);

// Build delta
const delta = {
players: {},
orbs: [],
removedOrbs: [],
removedPlayers: [],
      hazards: getHazardsSnapshot(), // { blackHole, whiteHole, asteroids }
      galaxyHazards: getGalaxyHazardsSnapshot() // { active, superMassiveBlackHole, quasar, darkMatter }
};

// Changed/new players
for (const [id, player] of Object.entries(gameState.players)) {
const prev = lastState.players[id];
if (
!prev ||
prev.x !== player.x ||
prev.y !== player.y ||
prev.size !== player.size ||
prev.name !== player.name ||
prev.levelKey !== player.levelKey ||
prev.isAlive !== player.isAlive
) {
delta.players[id] = { ...player };
}
}

// Removed players
for (const id of Object.keys(lastState.players)) {
if (!gameState.players[id]) {
delta.removedPlayers.push(id);
}
}

// Added/removed orbs
const lastOrbMap = new Map(lastState.orbs.map((o) => [o.id, o]));
const currOrbMap = new Map(gameState.orbs.map((o) => [o.id, o]));

for (const orb of gameState.orbs) {
if (!lastOrbMap.get(orb.id)) delta.orbs.push({ ...orb });
}
for (const orb of lastState.orbs) {
if (!currOrbMap.has(orb.id)) delta.removedOrbs.push(orb.id);
}

// Players removed due to collisions
delta.removedPlayers.push(...removedPlayers);

// (Optional) hazards change signature (not required to emit)
const hz = delta.hazards || { asteroids: [] };
const hazardsSig =
`${hz.blackHole ? 1 : 0}:${hz.whiteHole ? 1 : 0}:${(hz.asteroids && hz.asteroids.length) || 0}`;
const hazardsChanged = hazardsSig !== lastHazardsSig;
if (hazardsChanged) lastHazardsSig = hazardsSig;

// Emit if anything meaningful changed
if (
Object.keys(delta.players).length ||
delta.orbs.length ||
delta.removedOrbs.length ||
delta.removedPlayers.length ||
(hz && (hz.asteroids?.length || hz.blackHole || hz.whiteHole))
) {
io.emit('gameState', delta);
}

// Sync lastState (deep copy)
lastState.players = JSON.parse(JSON.stringify(gameState.players));
lastState.orbs = JSON.parse(JSON.stringify(gameState.orbs));

// Remove dead human players after notifying them
removedPlayers.forEach((id) => {
if (gameState.players[id] && !gameState.players[id].isBot) {
delete gameState.players[id];
gameState.humanCount = Math.max(0, gameState.humanCount - 1);
}
});
} catch (err) {
console.error('❌ Error in game loop:', err.message);
console.error(err);
}

// Schedule next tick
const elapsed = Date.now() - start;
setTimeout(gameLoop, Math.max(0, GAME_CONFIG.UPDATE_INTERVAL - elapsed));
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────────────────────────
initializeBots(); // bots are back 🙂
gameLoop();

server.listen(PORT, () => {
console.log('═══════════════════════════════════════════════════');
console.log('🚀 AstroIo Server Started');
console.log(`📍 URL: http://localhost:${PORT}`);
console.log(`🌍 Environment: ${NODE_ENV}`);
if (NODE_ENV === 'development') console.log(`👤 Developer: ${USER}`);
console.log(`🎮 Max Players: ${GAME_CONFIG.MAX_PLAYERS}`);
console.log(`🌎 World Size: ${GAME_CONFIG.WORLD_WIDTH}x${GAME_CONFIG.WORLD_HEIGHT}`);
console.log(`⚫ Orbs: ${GAME_CONFIG.NUM_ORBS}`);
console.log(`🤖 Bots: ${GAME_CONFIG.NUM_BOTS}`);
console.log('═══════════════════════════════════════════════════');
});