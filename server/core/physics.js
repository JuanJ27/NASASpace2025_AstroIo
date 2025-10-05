const { GAME_CONFIG } = require('./gameState');

/** Limitar valor entre mínimo y máximo */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** NEW: radio efectivo = 20 en la entrada de nivel + crecimiento dentro del nivel */
function effectiveRadius(player) {
  const entry = Number.isFinite(player.levelEntrySize) ? player.levelEntrySize : player.size;
  const base  = GAME_CONFIG.PLAYER_INITIAL_SIZE || 20; // “visual 20”
  const grown = player.size - entry;                   // cuánto creció desde que entró
  return Math.max(1, base + grown);
}

/** Verificar si dos círculos se superponen */
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = r1 + r2;
  return distanceSquared < (radiusSum * radiusSum);
}

/** Verificar si dos objetos están cerca */
function isNearby(x1, y1, x2, y2, maxDistance) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return (dx * dx + dy * dy) < (maxDistance * maxDistance);
}

/** Calcular velocidad basada en tamaño (usa radio efectivo) */
function calculateSpeed(player) {
  const baseSpeed = player.isBot ? GAME_CONFIG.BOT_SPEED : GAME_CONFIG.BASE_SPEED;
  return baseSpeed * (20 / effectiveRadius(player));
}

/** Actualizar posición del jugador */
function updatePlayerPosition(player, deltaTime) {
  if (!player.target || !player.isAlive) return;

  const dx = player.target.x - player.x;
  const dy = player.target.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 1) {
    const speed = calculateSpeed(player);
    const moveDistance = speed * (deltaTime / 16.67); // Normalizar a 60 FPS
    const moveX = (dx / distance) * moveDistance;
    const moveY = (dy / distance) * moveDistance;

    player.x = clamp(player.x + moveX, 0, GAME_CONFIG.WORLD_WIDTH);
    player.y = clamp(player.y + moveY, 0, GAME_CONFIG.WORLD_HEIGHT);
  }
}

/** Verificar si un jugador puede comer a otro (usa radio efectivo) */
function canEat(eater, target) {
  if (!eater.isAlive || !target.isAlive) return false;
  const THRESH = GAME_CONFIG.EAT_SIZE_MULTIPLIER || 1.1;
  return effectiveRadius(eater) >= effectiveRadius(target) * Math.min(THRESH, 1.05);
}

/** Calcular distancia entre dos puntos */
function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

module.exports = {
  clamp,
  circlesOverlap,
  isNearby,
  calculateSpeed,
  updatePlayerPosition,
  canEat,
  distance,
  effectiveRadius // ← exportado
};
