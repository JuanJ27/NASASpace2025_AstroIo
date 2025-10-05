const { gameState, GAME_CONFIG, botIdCounter } = require('./gameState');
const { createBot } = require('./player');
const { updatePlayerPosition } = require('./physics');
const { checkOrbCollisions } = require('./collisions');

/**
 * Inicializar bots
 */
function initializeBots() {
  for (let i = 0; i < GAME_CONFIG.NUM_BOTS; i++) {
    const botId = `bot_${botIdCounter()}`;
    const botName = `Bot ${i + 1}`;
    const bot = createBot(botId, botName);
    gameState.players[botId] = bot;
  }
  console.log(`🤖 Initialized ${GAME_CONFIG.NUM_BOTS} bots`);
}

/**
 * Actualizar comportamiento de bots
 */
function updateBots(deltaTime) {
  Object.values(gameState.players).forEach(bot => {
    if (!bot.isBot || !bot.isAlive) return;

    // Actualizar posición
    updatePlayerPosition(bot, deltaTime);

    // Verificar colisiones con orbes
    checkOrbCollisions(bot);

    // IA simple: cambiar objetivo ocasionalmente
    if (Math.random() < 0.01) { // 1% de probabilidad cada frame
      bot.target = {
        x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
        y: Math.random() * GAME_CONFIG.WORLD_HEIGHT
      };
    }

    // Buscar orbe más cercano
    const nearestOrb = findNearestOrb(bot);
    if (nearestOrb && Math.random() < 0.3) { // 30% de probabilidad
      bot.target = { x: nearestOrb.x, y: nearestOrb.y };
    }

    // Huir de jugadores más grandes
    const threat = findNearestThreat(bot);
    if (threat) {
      // Huir en dirección opuesta
      const dx = bot.x - threat.x;
      const dy = bot.y - threat.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        bot.target = {
          x: bot.x + (dx / distance) * 200,
          y: bot.y + (dy / distance) * 200
        };
      }
    }
  });
}

/**
 * Encontrar orbe más cercano
 */
function findNearestOrb(bot) {
  let nearest = null;
  let minDist = Infinity;

  for (const orb of gameState.orbs) {
    const dx = orb.x - bot.x;
    const dy = orb.y - bot.y;
    const dist = dx * dx + dy * dy;

    if (dist < minDist && dist < 300 * 300) { // Radio de búsqueda 300px
      minDist = dist;
      nearest = orb;
    }
  }

  return nearest;
}

/**
 * Encontrar jugador peligroso más cercano
 */
function findNearestThreat(bot) {
  let nearest = null;
  let minDist = Infinity;

  for (const player of Object.values(gameState.players)) {
    if (player.id === bot.id || !player.isAlive) continue;
    
    // Es amenaza si es más grande
    if (player.size >= bot.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER) {
      const dx = player.x - bot.x;
      const dy = player.y - bot.y;
      const dist = dx * dx + dy * dy;

      if (dist < minDist && dist < 400 * 400) { // Radio de detección 400px
        minDist = dist;
        nearest = player;
      }
    }
  }

  return nearest;
}

module.exports = {
  initializeBots,
  updateBots,
  findNearestOrb,
  findNearestThreat
};