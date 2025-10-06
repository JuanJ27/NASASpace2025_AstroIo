const { gameState, GAME_CONFIG } = require('../core/gameState');

function handleMovement(socket) {
  socket.on('move', (target) => {
    const player = gameState.players[socket.id];
    
    if (!player) {
      console.warn(`Move event from non-existent player: ${socket.id}`);
      return;
    }

    // ⭐⭐⭐ NUEVO: Rechazar movimientos de jugadores congelados ⭐⭐⭐
    if (player._frozenByGravity) {
      // Jugador congelado, ignorar comandos de movimiento
      return;
    }
    // ⭐⭐⭐ FIN DEL CÓDIGO NUEVO ⭐⭐⭐

    // Validar coordenadas
    if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
      console.warn(`Invalid move target from ${socket.id}:`, target);
      return;
    }

    // Limitar coordenadas al mundo
    player.target = {
      x: Math.max(0, Math.min(GAME_CONFIG.WORLD_WIDTH, target.x)),
      y: Math.max(0, Math.min(GAME_CONFIG.WORLD_HEIGHT, target.y))
    };
  });
}

module.exports = { handleMovement };