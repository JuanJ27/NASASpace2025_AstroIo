const { GAME_CONFIG } = require('./gameState');
const { getLevelForSize } = require('../../shared/levelsConfig');

/**
 * Crear un nuevo jugador
 */
function createPlayer(id, name) {
  const p = {
    id,
    name,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size: GAME_CONFIG.PLAYER_INITIAL_SIZE,
    color: getRandomColor(),
    target: { 
      x: Math.random() * GAME_CONFIG.WORLD_WIDTH, 
      y: Math.random() * GAME_CONFIG.WORLD_HEIGHT 
    },
    speed: GAME_CONFIG.BASE_SPEED || 5,
    isBot: false,
    isAlive: true,
    score: 0,
    joinTime: Date.now()
  };

  // ▼ NEW: baseline (where the current level starts) and level index
  const lvl = getLevelForSize(p.size);
  p.levelEntrySize = p.size;           // “start at 20” baseline
  p.levelIndex     = lvl.clientLevel;  // remember which level we’re in

  return p;
}

/**
 * Crear un bot
 */
function createBot(id, name) {
  const p = {
    id,
    name: name || `Bot_${id}`,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size: GAME_CONFIG.BOT_INITIAL_SIZE || 18,
    color: getRandomColor(),
    target: {
      x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
      y: Math.random() * GAME_CONFIG.WORLD_HEIGHT
    },
    speed: GAME_CONFIG.BOT_SPEED || 3.8,
    isBot: true,
    isAlive: true,
    score: 0,
    joinTime: Date.now()
  };

  // ▼ NEW baseline + level index for bots too
  const lvl = getLevelForSize(p.size);
  p.levelEntrySize = p.size;
  p.levelIndex     = lvl.clientLevel;

  return p;
}

/**
 * Obtener color aleatorio
 */
function getRandomColor() {
  const colors = [
    '#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F',
    '#BB8FCE','#85C1E2','#F8B739','#52D726','#FF69B4','#00CED1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calcular el nivel del jugador según su tamaño
 */
function getPlayerLevel(size) {
  if (size < 200) return { key: 'solar', name: 'Solar System', index: 0 };
  if (size < 400) return { key: 'galaxy', name: 'Galaxy', index: 1 };
  if (size < 600) return { key: 'cluster', name: 'Cluster', index: 2 };
  if (size < 800) return { key: 'supercluster', name: 'Supercluster', index: 3 };
  return { key: 'cosmicweb', name: 'Cosmic Web', index: 4 };
}

/**
 * Verificar si un jugador puede comer a otro
 */
function canEat(eater, target) {
  return eater.size >= target.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER;
}

/**
 * Hacer crecer al jugador
 */
function growPlayer(player, amount) {
  // level before growth
  const before = getLevelForSize(player.size).clientLevel;

  player.size += amount;
  player.score += Math.floor(amount);

  // speed is recalculated in physics with effective radius; keep a safe default here
  player.speed = GAME_CONFIG.BASE_SPEED * (20 / Math.max(1, player.size));

  // level after growth: if changed, reset baseline so “effective = 20” at entry
  const after = getLevelForSize(player.size).clientLevel;
  if (after !== before) {
    player.levelEntrySize = player.size; // snapshot at new level entry
    player.levelIndex     = after;
  }
  return player;
}

/**
 * Respawnear jugador
 */
function respawnPlayer(player) {
  player.x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
  player.y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;
  player.size = GAME_CONFIG.PLAYER_INITIAL_SIZE;
  player.isAlive = true;
  player.speed = GAME_CONFIG.BASE_SPEED;
  player.target = { x: player.x, y: player.y };

  // ▼ NEW: also reset baseline + level index on respawn
  const lvl = getLevelForSize(player.size);
  player.levelEntrySize = player.size;
  player.levelIndex     = lvl.clientLevel;

  return player;
}

module.exports = {
  createPlayer,
  createBot,
  getRandomColor,
  getPlayerLevel,
  canEat,
  growPlayer,
  respawnPlayer
};
