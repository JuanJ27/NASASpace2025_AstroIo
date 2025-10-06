const { gameState } = require('./gameState');

/**
 * Actualizar evento gravitacional
 * Mueve automáticamente a todos los jugadores hacia el centro del rombo
 */
function updateGravitationalEvent(deltaTime) {
  if (!gameState.gravitationalEvent || !gameState.gravitationalEvent.active) {
    // ⭐ NUEVO: Si el evento terminó pero hay jugadores congelados, mantenerlos quietos Y creciendo
    if (gameState.gravitationalEvent && gameState.gravitationalEvent.ended) {
      Object.values(gameState.players).forEach(player => {
        if (player._frozenByGravity && !player.isStaticBot) {
          // ⭐ LÍMITE: Solo crecer hasta +10 puntos desde el tamaño inicial
          const MAX_GROWTH = 10;
          const initialSize = player._sizeWhenFrozen || player.size;
          const currentGrowth = player.size - initialSize;
          
          if (currentGrowth < MAX_GROWTH) {
            // Auto-crecimiento: +1 por segundo (limitado a 10 total)
            const growthAmount = Math.min(deltaTime, MAX_GROWTH - currentGrowth);
            player.size += growthAmount;
            
            // Log cada 2 tamaños para ver el progreso
            if (Math.floor(player.size) % 2 === 0 && player.size % 1 < deltaTime) {
              console.log(`🌱 ${player.name} growing: ${Math.floor(player.size)} (+${currentGrowth.toFixed(1)}/${MAX_GROWTH})`);
            }
          } else {
            // Ya alcanzó el límite de crecimiento
            if (!player._maxGrowthReached) {
              player._maxGrowthReached = true;
              console.log(`✅ ${player.name} reached max growth: ${Math.floor(player.size)} (started at ${Math.floor(initialSize)})`);
            }
          }
          
          // Mantener completamente quieto
          player.target = { x: player.x, y: player.y };
          player.vx = 0;
          player.vy = 0;
        }
      });
    }
    return;
  }

  const event = gameState.gravitationalEvent;
  const now = Date.now();
  const elapsed = now - event.startTime;

  // Terminar evento si pasó la duración
  if (elapsed >= event.duration) {
    console.log('🌀 Gravitational event ended - Freezing all players permanently');
    event.active = false;
    event.ended = true; // ⭐ NUEVO: Marcar como terminado
    
    // Congelar todos los jugadores en su posición final PERMANENTEMENTE
    Object.values(gameState.players).forEach(player => {
      if (player.isAlive && !player.isStaticBot) {
        player._frozenByGravity = true;
        player._sizeWhenFrozen = player.size; // ⭐ GUARDAR tamaño inicial para límite de crecimiento
        player.target = { x: player.x, y: player.y }; // Target = posición actual
        player.speed = 0; // Sin velocidad
        player.vx = 0; // Sin velocidad X
        player.vy = 0; // Sin velocidad Y
        console.log(`❄️ Player ${player.name} frozen at (${player.x.toFixed(0)}, ${player.y.toFixed(0)}) with size ${Math.floor(player.size)}`);
      }
    });
    return;
  }

  // Atraer a todos los jugadores vivos hacia el centro
  Object.values(gameState.players).forEach(player => {
    // No mover bots estáticos del rombo
    if (player.isStaticBot) {
      return;
    }

    if (!player.isAlive) {
      return;
    }

    // Calcular dirección hacia el centro
    const dx = event.center.x - player.x;
    const dy = event.center.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Si está cerca del centro, detenerlo
    if (distance <= event.attractionRadius) {
      player._reachedGravityCenter = true;
      player._frozenByGravity = true; // ⭐ NUEVO: Congelar cuando llega al centro
      player._sizeWhenFrozen = player.size; // ⭐ GUARDAR tamaño cuando llega al centro
      player.target = { x: player.x, y: player.y };
      player.vx = 0;
      player.vy = 0;
      return;
    }

    // Mover hacia el centro
    const speed = event.attractionSpeed * deltaTime;
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;

    player.x += moveX;
    player.y += moveY;

    // Actualizar target para que apunte al centro
    player.target = {
      x: event.center.x,
      y: event.center.y
    };

    // Marcar como siendo atraído
    player._beingPulled = true;
  });
}

module.exports = {
  updateGravitationalEvent
};