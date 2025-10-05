const { GAME_CONFIG } = require('./gameState');

/**
 * Crear un nuevo jugador
 */
function createPlayer(id, name) {
  return {
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
    joinTime: Date.now() // ← NUEVO: timestamp de cuando se unió
  };
}

/**
 * Crear un bot
 */
function createBot(id, name) {
  return {
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
    joinTime: Date.now() // ← NUEVO
  };
}

/**
 * Obtener color aleatorio
 */
function getRandomColor() {
  const colors = [
    '#FF6B6B', // Rojo
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul
    '#FFA07A', // Salmón
    '#98D8C8', // Verde agua
    '#F7DC6F', // Amarillo
    '#BB8FCE', // Púrpura
    '#85C1E2', // Azul claro
    '#F8B739', // Naranja
    '#52D726', // Verde lima
    '#FF69B4', // Rosa
    '#00CED1'  // Cian oscuro
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
  // El jugador debe ser al menos 10% más grande
  return eater.size >= target.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER;
}

/**
 * Hacer crecer al jugador
 */
function growPlayer(player, amount) {
  player.size += amount;
  player.score += Math.floor(amount);
  
  // Actualizar velocidad (más grande = más lento)
  player.speed = GAME_CONFIG.BASE_SPEED * (20 / player.size);
  
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