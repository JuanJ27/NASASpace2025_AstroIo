const { gameState, GAME_CONFIG, orbIdCounter } = require('./gameState');
const { circlesOverlap, canEat } = require('./physics');
const { growPlayer, respawnPlayer, getPlayerLevel } = require('./player');

/**
 * Verificar colisiones de jugador con orbes
 */
function checkOrbCollisions(player) {
  if (!player.isAlive) return;

  const orbsToRemove = [];

  for (let i = gameState.orbs.length - 1; i >= 0; i--) {
    const orb = gameState.orbs[i];
    
    if (circlesOverlap(player.x, player.y, player.size, orb.x, orb.y, orb.size)) {
      // El jugador come el orbe
      growPlayer(player, GAME_CONFIG.PLAYER_GROWTH_FROM_ORB);
      orbsToRemove.push(orb.id);
      gameState.orbs.splice(i, 1);
      
      // Crear nuevo orbe
      spawnOrb();
    }
  }

  // Actualizar nivel del jugador
  const level = getPlayerLevel(player.size);
  player.levelKey = level.key;
  player.levelName = level.name;

  return orbsToRemove;
}

/**
 * Verificar colisiones entre jugadores
 * @param {SocketIO.Server} io - Socket.IO server instance (NUEVO)
 */
function checkPlayerCollisions(io) {
  const players = Object.values(gameState.players);
  const removedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    const p1 = players[i];
    if (!p1.isAlive) continue;

    for (let j = i + 1; j < players.length; j++) {
      const p2 = players[j];
      if (!p2.isAlive) continue;

      const INFLATE = 2; // pixels of radius
      if (circlesOverlap(p1.x, p1.y, p1.size + INFLATE, p2.x, p2.y, p2.size + INFLATE)) {
        // Determinar quién come a quién
        if (canEat(p1, p2)) {
          // p1 come a p2
          const growthAmount = p2.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          growPlayer(p1, growthAmount);
          
          // p2 muere
          p2.isAlive = false;
          
          if (p2.isBot) {
            // Respawnear bot después de un delay
            setTimeout(() => {
              if (gameState.players[p2.id]) {
                respawnPlayer(p2);
              }
            }, GAME_CONFIG.BOT_RESPAWN_DELAY_MS);
          } else {
            // Jugador humano - emitir gameOver (NUEVO)
            if (io) {
              io.to(p2.id).emit('gameOver', {
                message: `You were eaten by ${p1.name}!`,
                killedBy: p1.name,
                finalSize: Math.floor(p2.size),
                survivalTime: Date.now() - (p2.joinTime || Date.now())
              });
            }
            removedPlayers.push(p2.id);
            console.log(`💀 ${p2.name} was eaten by ${p1.name}`);
          }
          
        } else if (canEat(p2, p1)) {
          // p2 come a p1
          const growthAmount = p1.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          growPlayer(p2, growthAmount);
          
          // p1 muere
          p1.isAlive = false;
          
          if (p1.isBot) {
            setTimeout(() => {
              if (gameState.players[p1.id]) {
                respawnPlayer(p1);
              }
            }, GAME_CONFIG.BOT_RESPAWN_DELAY_MS);
          } else {
            // Jugador humano - emitir gameOver (NUEVO)
            if (io) {
              io.to(p1.id).emit('gameOver', {
                message: `You were eaten by ${p2.name}!`,
                killedBy: p2.name,
                finalSize: Math.floor(p1.size),
                survivalTime: Date.now() - (p1.joinTime || Date.now())
              });
            }
            removedPlayers.push(p1.id);
            console.log(`💀 ${p1.name} was eaten by ${p2.name}`);
          }
        }
      }
    }
  }

  return removedPlayers;
}

/**
 * Crear nuevo orbe
 */
function spawnOrb() {
  const colors = ['#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];
  
  const orb = {
    id: `orb_${orbIdCounter()}`,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size: GAME_CONFIG.ORB_SIZE,
    color: colors[Math.floor(Math.random() * colors.length)]
  };
  
  gameState.orbs.push(orb);
  return orb;
}

module.exports = {
  checkOrbCollisions,
  checkPlayerCollisions,
  spawnOrb
};