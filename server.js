/**
 * AstroIo - Enhanced Agar.io Clone Backend (Levels + Bots)
 */
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// Game Configuration
// -----------------------------------------------------------------------------
const GAME_CONFIG = {
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  NUM_ORBS: 200,
  ORB_SIZE: 5,
  PLAYER_INITIAL_SIZE: 20,
  TARGET_FPS: 60,
  UPDATE_INTERVAL: 1000 / 60,
  BASE_SPEED: 5,
  EAT_SIZE_MULTIPLIER: 1.1,
  PLAYER_GROWTH_FROM_ORB: 1,
  PLAYER_GROWTH_FROM_PLAYER: 0.5,
  MAX_NAME_LENGTH: 20,
  MAX_HUMAN_PLAYERS: 5,

  // Bots
  NUM_BOTS: 6,
  BOT_INITIAL_SIZE: 18,
  BOT_SPEED: 3.8,
  BOT_RESPAWN_DELAY_MS: 400,
};

// Levels
const LEVELS = [
  { min:   0, max: 199.999, key: 'solar',  name: 'Solar System' },
  { min: 200, max: 399.999, key: 'galaxy', name: 'Galaxy' },
  { min: 400, max: 599.999, key: 'cluster', name: 'Cluster' },
  { min: 600, max: 799.999, key: 'supercluster', name: 'Supercluster' },
  { min: 800, max: 9999, key: 'cosmicweb', name: 'Cosmic Web' },
];

// -----------------------------------------------------------------------------
// Game State
// -----------------------------------------------------------------------------
const gameState = {
  players: {},     // id -> player
  orbs: [],
  lastUpdate: Date.now(),
  humanCount: 0
};

let orbIdCounter = 0;
let botIdCounter = 0;

// Logging
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(line);
  try { fs.appendFileSync(path.join(__dirname, 'test.log'), line + '\n'); } catch {}
}

// Helpers
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function nowMs(){ return Date.now(); }

// -----------------------------------------------------------------------------
// World init
// -----------------------------------------------------------------------------
function initializeOrbs() {
  gameState.orbs = [];
  for (let i = 0; i < GAME_CONFIG.NUM_ORBS; i++) gameState.orbs.push(createRandomOrb());
  log(`Initialized ${GAME_CONFIG.NUM_ORBS} orbs`);
}
function createRandomOrb() {
  return {
    id: `orb_${orbIdCounter++}`,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size: GAME_CONFIG.ORB_SIZE,
    color: pickOrbColor()
  };
}
function pickOrbColor() {
  // nebulosa de colores
  const palette = [ '#ff5a5a', '#ffb84d', '#ffd54d', '#8cf2a0', '#6bd9ff', '#a98bff', '#ff7ae6' ];
  return palette[(Math.random()*palette.length)|0];
}

// Levels
function levelForSize(size) {
  for (const L of LEVELS) if (size >= L.min && size <= L.max) return L;
  return LEVELS[LEVELS.length-1];
}

// Players
function createPlayer(id, name = 'Player', overrides = {}) {
  const size = overrides.size ?? GAME_CONFIG.PLAYER_INITIAL_SIZE;
  return {
    id, name,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size,
    targetX: 0, targetY: 0,
    speed: GAME_CONFIG.BASE_SPEED,
    lastUpdate: nowMs(),
    isBot: !!overrides.isBot,
    bot: overrides.bot || null, // {vx, vy, wanderAt}
    levelKey: levelForSize(size).key,
    levelName: levelForSize(size).name
  };
}

function calculateSpeed(player) {
  const base = player.isBot ? GAME_CONFIG.BOT_SPEED : GAME_CONFIG.BASE_SPEED;
  return base * (GAME_CONFIG.PLAYER_INITIAL_SIZE / player.size);
}

// Collisions
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2, dy = y1 - y2;
  return (dx*dx + dy*dy) < (r1 + r2) * (r1 + r2);
}
function isNearby(x1, y1, x2, y2, maxDistance) {
  const dx = x1 - x2, dy = y1 - y2;
  return (dx*dx + dy*dy) < maxDistance*maxDistance;
}

// Movement
function updatePlayerPosition(player, dt) {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 5) {
    const sp = calculateSpeed(player);
    const k = sp * (dt / 16.67);
    player.x += (dx / dist) * k;
    player.y += (dy / dist) * k;
    player.x = clamp(player.x, player.size, GAME_CONFIG.WORLD_WIDTH - player.size);
    player.y = clamp(player.y, player.size, GAME_CONFIG.WORLD_HEIGHT - player.size);
  }
}

// Orbs eat
function checkOrbCollisions(player) {
  const R = player.size + 50;
  for (let i = gameState.orbs.length - 1; i >= 0; i--) {
    const orb = gameState.orbs[i];
    if (!isNearby(player.x, player.y, orb.x, orb.y, R)) continue;
    if (circlesOverlap(player.x, player.y, player.size, orb.x, orb.y, orb.size)) {
      // Growth ONLY happens here (or on player eat) => no spontaneous growth
      player.size += GAME_CONFIG.PLAYER_GROWTH_FROM_ORB;
      const removed = gameState.orbs.splice(i,1)[0];
      void removed; // just for clarity
      gameState.orbs.push(createRandomOrb());
    }
  }
}

// Player vs Player (bots too)
function respawnBot(bot) {
  setTimeout(() => {
    bot.size = GAME_CONFIG.BOT_INITIAL_SIZE;
    bot.x = Math.random()*GAME_CONFIG.WORLD_WIDTH;
    bot.y = Math.random()*GAME_CONFIG.WORLD_HEIGHT;
    // give it a new random drift
    bot.bot.vx = (Math.random()*2-1) * GAME_CONFIG.BOT_SPEED;
    bot.bot.vy = (Math.random()*2-1) * GAME_CONFIG.BOT_SPEED;
  }, GAME_CONFIG.BOT_RESPAWN_DELAY_MS);
}
function notifyPlayerEaten(maybeSocketId, playerName, eatenBy) {
  // Only notify real players
  if (io.sockets.sockets.get(maybeSocketId)) {
    io.to(maybeSocketId).emit('gameOver', { message: `You were eaten by ${eatenBy}!`, eatenBy });
  }
}
function checkPlayerCollisions() {
  const ids = Object.keys(gameState.players);
  for (let i = 0; i < ids.length; i++) {
    const A = gameState.players[ids[i]];
    if (!A) continue;
    for (let j = i+1; j < ids.length; j++) {
      const B = gameState.players[ids[j]];
      if (!B) continue;
      if (!isNearby(A.x, A.y, B.x, B.y, A.size + B.size + 50)) continue;
      if (circlesOverlap(A.x, A.y, A.size, B.x, B.y, B.size)) {
        if (A.size >= B.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER) {
          A.size += B.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          if (B.isBot) {
            respawnBot(B); // keep same id; just reset later
            B.size = 0.01; // temporarily hide tiny until respawn triggers
          } else {
            notifyPlayerEaten(B.id, B.name, A.name);
            delete gameState.players[B.id];
            gameState.humanCount--;
          }
          log(`${A.name} ate ${B.name}`);
        } else if (B.size >= A.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER) {
          B.size += A.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          if (A.isBot) {
            respawnBot(A);
            A.size = 0.01;
          } else {
            notifyPlayerEaten(A.id, A.name, B.name);
            delete gameState.players[A.id];
            gameState.humanCount--;
          }
          log(`${B.name} ate ${A.name}`);
        }
      }
    }
  }
}

// Bots
function spawnBots() {
  for (let i = 0; i < GAME_CONFIG.NUM_BOTS; i++) {
    const id = `bot_${botIdCounter++}`;
    const bot = createPlayer(id, `★ Bot ${i+1}`, {
      isBot: true,
      size: GAME_CONFIG.BOT_INITIAL_SIZE,
      bot: { vx: (Math.random()*2-1)*GAME_CONFIG.BOT_SPEED, vy: (Math.random()*2-1)*GAME_CONFIG.BOT_SPEED, wanderAt: nowMs() + 1500 + Math.random()*2000 }
    });
    gameState.players[id] = bot;
  }
  log(`Spawned ${GAME_CONFIG.NUM_BOTS} bots (yellow stars)`);
}
function updateBots(dt) {
  const t = nowMs();
  for (const p of Object.values(gameState.players)) {
    if (!p.isBot) continue;
    // Random drift with boundary bounce + occasional retarget
    if (t > p.bot.wanderAt) {
      p.bot.vx = (Math.random()*2-1) * GAME_CONFIG.BOT_SPEED;
      p.bot.vy = (Math.random()*2-1) * GAME_CONFIG.BOT_SPEED;
      p.bot.wanderAt = t + 1200 + Math.random()*1800;
    }
    const sp = calculateSpeed(p) * (dt/16.67);
    p.x += p.bot.vx * (dt/16.67);
    p.y += p.bot.vy * (dt/16.67);
    // bounce
    if (p.x < p.size || p.x > GAME_CONFIG.WORLD_WIDTH - p.size) p.bot.vx *= -1;
    if (p.y < p.size || p.y > GAME_CONFIG.WORLD_HEIGHT - p.size) p.bot.vy *= -1;
    p.x = clamp(p.x, p.size, GAME_CONFIG.WORLD_WIDTH - p.size);
    p.y = clamp(p.y, p.size, GAME_CONFIG.WORLD_HEIGHT - p.size);
    // bots nibble orbs as well
    checkOrbCollisions(p);
  }
}

// -----------------------------------------------------------------------------
// Delta state
// -----------------------------------------------------------------------------
let lastLoopTime = nowMs();
let frameCount = 0;
let fpsUpdateTime = nowMs();

let lastState = { players: {}, orbs: [] };

function gameLoop() {
  const start = nowMs();
  try {
    const dt = start - lastLoopTime;
    lastLoopTime = start;

    frameCount++;
    if (start - fpsUpdateTime >= 1000) {
      frameCount = 0; fpsUpdateTime = start;
    }

    // Update players (humans)
    Object.values(gameState.players).forEach(p => {
      if (p.isBot) return;
      updatePlayerPosition(p, dt);
      checkOrbCollisions(p);
      // Update level flag
      const L = levelForSize(p.size);
      p.levelKey = L.key; p.levelName = L.name;
    });

    // Update bots
    updateBots(dt);

    // Player vs Player
    checkPlayerCollisions();

    // Build delta
    const delta = { players: {}, orbs: [], removedOrbs: [], removedPlayers: [] };
    // players changed/new
    for (const [id, p] of Object.entries(gameState.players)) {
      const prev = lastState.players[id];
      if (!prev ||
          prev.x !== p.x || prev.y !== p.y ||
          prev.size !== p.size || prev.name !== p.name ||
          prev.levelKey !== p.levelKey) {
        delta.players[id] = { ...p };
      }
    }
    // removed players
    for (const id of Object.keys(lastState.players)) {
      if (!gameState.players[id]) delta.removedPlayers.push(id);
    }
    // orbs added
    const lastOrbMap = new Map(lastState.orbs.map(o => [o.id, o]));
    const currOrbMap = new Map(gameState.orbs.map(o => [o.id, o]));
    for (const o of gameState.orbs) if (!lastOrbMap.get(o.id)) delta.orbs.push({ ...o });
    // orbs removed
    for (const o of lastState.orbs) if (!currOrbMap.has(o.id)) delta.removedOrbs.push(o.id);

    if (Object.keys(delta.players).length || delta.orbs.length || delta.removedOrbs.length || delta.removedPlayers.length) {
      io.emit('gameState', delta);
    }

    // deep copies
    lastState.players = JSON.parse(JSON.stringify(gameState.players));
    lastState.orbs = JSON.parse(JSON.stringify(gameState.orbs));

  } catch (e) {
    log(`Error in game loop: ${e.message}`, 'error');
    console.error(e);
  }

  const elapsed = nowMs() - start;
  setTimeout(gameLoop, Math.max(0, GAME_CONFIG.UPDATE_INTERVAL - elapsed));
}

// -----------------------------------------------------------------------------
// Sockets (humans only count towards limit)
// -----------------------------------------------------------------------------
io.on('connection', (socket) => {
  log(`Player connected: ${socket.id}`);

  if (gameState.humanCount >= GAME_CONFIG.MAX_HUMAN_PLAYERS) {
    socket.emit('gameFull', { message: 'Game is full. Maximum 5 players allowed.' });
    socket.disconnect(); log(`Connection rejected (game full): ${socket.id}`, 'warn');
    return;
    }

  let playerName = 'Player';

  socket.on('setName', (name) => {
    try {
      const validation = validateName(name);
      if (!validation.valid) {
        socket.emit('nameError', { error: validation.error });
        return;
      }
      playerName = validation.name;
      const player = createPlayer(socket.id, playerName);
      gameState.players[socket.id] = player;
      gameState.humanCount++;

      // init for client
      socket.emit('init', { playerId: socket.id, worldWidth: GAME_CONFIG.WORLD_WIDTH, worldHeight: GAME_CONFIG.WORLD_HEIGHT });
      log(`Player joined: ${playerName} (${socket.id}) - Humans: ${gameState.humanCount}`);
    } catch (e) {
      log(`Error setName ${socket.id}: ${e.message}`, 'error');
    }
  });

  socket.on('move', (data) => {
    try {
      const p = gameState.players[socket.id];
      if (p && data && typeof data.x === 'number' && typeof data.y === 'number') {
        if (data.x >= 0 && data.x <= GAME_CONFIG.WORLD_WIDTH && data.y >= 0 && data.y <= GAME_CONFIG.WORLD_HEIGHT) {
          p.targetX = data.x; p.targetY = data.y;
        }
      }
    } catch (e) {
      log(`Error move ${socket.id}: ${e.message}`, 'error');
    }
  });

  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id];
      gameState.humanCount = Math.max(0, gameState.humanCount - 1);
      log(`Player removed: ${playerName} - Humans: ${gameState.humanCount}`);
    } else {
      log(`Player disconnected w/o record: ${socket.id}`);
    }
  });
});

// Name validation
function validateName(name) {
  if (!name || typeof name !== 'string') return { valid: false, error: 'Name must be a string' };
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Name cannot be empty' };
  if (trimmed.length > GAME_CONFIG.MAX_NAME_LENGTH) return { valid: false, error: `Name too long (max ${GAME_CONFIG.MAX_NAME_LENGTH} characters)` };
  if (!/^[a-zA-Z0-9_\s]+$/.test(trimmed)) return { valid: false, error: 'Name can only contain letters, numbers, spaces, and underscores' };
  return { valid: true, name: trimmed };
}

// Init
initializeOrbs();
spawnBots();
log('Starting game loop (levels+bots)');
setTimeout(gameLoop, GAME_CONFIG.UPDATE_INTERVAL);

// Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`=== AstroIo Server Started ===`);
  log(`Port: ${PORT}`);
  log(`World: ${GAME_CONFIG.WORLD_WIDTH}x${GAME_CONFIG.WORLD_HEIGHT}`);
  log(`Max Humans: ${GAME_CONFIG.MAX_HUMAN_PLAYERS}`);
});

// Graceful
process.on('SIGINT', () => { log('Server shutting down...'); server.close(() => process.exit(0)); });
process.on('uncaughtException', e => { log(`Uncaught: ${e.message}`, 'error'); console.error(e); });
process.on('unhandledRejection', r => { log(`Rejection: ${r}`, 'error'); console.error(r); });
