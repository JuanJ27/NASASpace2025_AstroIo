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
 * ============================================
 * NUEVA FUNCIÓN: Spawn de 4 bots especiales en Supercúmulo
 * Aparecen en una de las 3 esquinas MÁS ALEJADAS del jugador
 * ============================================
 */
/**
 * ============================================
 * NUEVA FUNCIÓN: Spawn de 4 bots especiales en Supercúmulo
 * Aparecen en una de las 3 esquinas MÁS ALEJADAS del jugador
 * Formación en rombo DENTRO de la caja, completamente visibles
 * ============================================
 */
function spawnSupercumuloBots(playerId) {
  const player = gameState.players[playerId];
  if (!player) {
    console.error(`❌ Player ${playerId} not found for Supercumulo spawn`);
    return [];
  }

  console.log(`🌌 Spawning 4 Supercumulo bots for player ${player.name}`);

  // Margen de seguridad para que los bots NO se salgan ni se vean cortados
  const MARGIN = 400;           // Suficiente espacio desde bordes
  const BOT_SIZE = 120;         // Bots grandes pero no gigantes
  const DIAMOND_OFFSET = 180;   // Rombo bien espaciado

  // Definir las 4 esquinas DENTRO del mundo (con margen de seguridad)
  const corners = [
    { 
      x: MARGIN, 
      y: MARGIN, 
      name: 'top-left' 
    },
    { 
      x: GAME_CONFIG.WORLD_WIDTH - MARGIN, 
      y: MARGIN, 
      name: 'top-right' 
    },
    { 
      x: MARGIN, 
      y: GAME_CONFIG.WORLD_HEIGHT - MARGIN, 
      name: 'bottom-left' 
    },
    { 
      x: GAME_CONFIG.WORLD_WIDTH - MARGIN, 
      y: GAME_CONFIG.WORLD_HEIGHT - MARGIN, 
      name: 'bottom-right' 
    }
  ];

  // Calcular distancia a cada esquina
  const cornersWithDistance = corners.map(corner => {
    const dx = corner.x - player.x;
    const dy = corner.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { ...corner, distance };
  });

  // Ordenar por distancia (de mayor a menor)
  cornersWithDistance.sort((a, b) => b.distance - a.distance);

  // Tomar las 3 esquinas MÁS ALEJADAS
  const farthestCorners = cornersWithDistance.slice(0, 3);

  // Elegir una esquina aleatoria de las 3 más alejadas
  const selectedCorner = farthestCorners[Math.floor(Math.random() * farthestCorners.length)];

  console.log(`📍 Selected corner: ${selectedCorner.name} (distance: ${selectedCorner.distance.toFixed(2)})`);

  // Crear 4 bots en formación de ROMBO cerca de la esquina seleccionada
  const spawnedBots = [];
  
  // ⭐ SKINS DE GALAXIAS para cada bot del rombo
  const galaxySkins = [
    { key: 'exotic_galaxy', name: 'Exotic' },      // Norte
    { key: 'pequeña_espiral', name: 'Spiral' },    // Este
    { key: 'enana_irregular', name: 'Dwarf' },     // Sur
    { key: 'galaxia_agujero', name: 'BlackHole' }  // Oeste
  ];
  
  // Formación de rombo (diamante): Norte, Este, Sur, Oeste
  const formations = [
    { dx: 0, dy: -DIAMOND_OFFSET, name: 'North' },      // Norte
    { dx: DIAMOND_OFFSET, dy: 0, name: 'East' },        // Este
    { dx: 0, dy: DIAMOND_OFFSET, name: 'South' },       // Sur
    { dx: -DIAMOND_OFFSET, dy: 0, name: 'West' }        // Oeste
  ];

  formations.forEach((formation, index) => {
    const botId = `supercumulo_bot_${playerId}_${index}_${Date.now()}`;
    const galaxySkin = galaxySkins[index];
    const botName = `${galaxySkin.name}`;
    
    // Posición del bot en el rombo
    const botX = selectedCorner.x + formation.dx;
    const botY = selectedCorner.y + formation.dy;

    // Verificar que el bot esté completamente dentro de los límites
    const clampedX = Math.max(BOT_SIZE, Math.min(GAME_CONFIG.WORLD_WIDTH - BOT_SIZE, botX));
    const clampedY = Math.max(BOT_SIZE, Math.min(GAME_CONFIG.WORLD_HEIGHT - BOT_SIZE, botY));
    
    const bot = {
      id: botId,
      name: botName,
      x: clampedX,
      y: clampedY,
      size: BOT_SIZE,
      color: '#B19CD9', // Color púrpura para bots especiales
      textureKey: galaxySkin.key, // ⭐ NUEVA PROPIEDAD: Skin de galaxia específica
      target: { 
        x: clampedX,  // Target = posición actual = NO SE MUEVE
        y: clampedY 
      },
      speed: 0, // Velocidad 0 = COMPLETAMENTE ESTÁTICOS
      isBot: true,
      isSupercumuloBot: true, // Flag especial
      isStaticBot: true, // Bot estático
      isAlive: true,
      score: 0,
      joinTime: Date.now(),
      levelEntrySize: BOT_SIZE,
      levelIndex: 5 // Nivel Supercúmulo
    };

    gameState.players[botId] = bot;
    spawnedBots.push({
      id: botId,
      name: botName,
      position: formation.name,
      textureKey: galaxySkin.key // ⭐ Incluir la skin en la respuesta
    });

    console.log(`  ✨ Created ${botName} (${galaxySkin.key}) at ${formation.name} (${bot.x.toFixed(0)}, ${bot.y.toFixed(0)})`);
  });

  return {
    bots: spawnedBots,
    corner: {
      x: selectedCorner.x,
      y: selectedCorner.y,
      name: selectedCorner.name
    },
    // ⭐ NUEVO: Centro del rombo para la atracción gravitacional
    diamondCenter: {
      x: selectedCorner.x,
      y: selectedCorner.y
    }
  };
}

/**
 * Actualizar comportamiento de bots
 */
function updateBots(deltaTime) {
  // ⭐⭐⭐ AGREGAR ESTO AL INICIO DE LA FUNCIÓN ⭐⭐⭐
  // No actualizar ni respawnear bots si están deshabilitados
  if (gameState._botsDisabled) {
    // Solo actualizar bots estáticos del rombo
    Object.values(gameState.players).forEach(bot => {
      if (bot.isBot && bot.isStaticBot && bot.isAlive) {
        checkOrbCollisions(bot);
      }
    });
    return;
  }
  // ⭐⭐⭐ FIN DEL CÓDIGO NUEVO ⭐⭐⭐
  Object.values(gameState.players).forEach(bot => {
    if (!bot.isBot || !bot.isAlive) return;

    // ⭐ Los bots estáticos NO SE MUEVEN
    if (bot.isStaticBot) {
      // No actualizar posición, no buscar orbes, completamente estáticos
      // Solo verificar colisiones con orbes (pueden ser comidos)
      checkOrbCollisions(bot);
      return;
    }

    // Los bots de Supercúmulo tienen comportamiento especial (pero este caso ya no se usa)
    if (bot.isSupercumuloBot && !bot.isStaticBot) {
      // Comportamiento más pasivo, solo se mueven lentamente
      updatePlayerPosition(bot, deltaTime);
      checkOrbCollisions(bot);
      return;
    }

    // Actualizar posición (bots normales)
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
  findNearestThreat,
  spawnSupercumuloBots // ⭐ NUEVA FUNCIÓN EXPORTADA
};