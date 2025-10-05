const { gameState, GAME_CONFIG, orbIdCounter } = require('./gameState');
const { circlesOverlap, canEat, effectiveRadius } = require('./physics'); // ← import effectiveRadius
const { growPlayer, respawnPlayer, getPlayerLevel } = require('./player');

/** Verificar colisiones de jugador con orbes */
function checkOrbCollisions(player) {
  if (!player.isAlive) return;

  const orbsToRemove = [];

  for (let i = gameState.orbs.length - 1; i >= 0; i--) {
    const orb = gameState.orbs[i];

    // ▼ use effective radius instead of raw size
    if (circlesOverlap(player.x, player.y, effectiveRadius(player), orb.x, orb.y, orb.size)) {
      growPlayer(player, GAME_CONFIG.PLAYER_GROWTH_FROM_ORB);
      orbsToRemove.push(orb.id);
      gameState.orbs.splice(i, 1);
      spawnOrb();
    }
  }

  // Actualizar nivel del jugador (opcional)
  const level = getPlayerLevel(player.size);
  player.levelKey = level.key;
  player.levelName = level.name;

  return orbsToRemove;
}

/** Verificar colisiones entre jugadores */
function checkPlayerCollisions(io) {
  const players = Object.values(gameState.players);
  const removedPlayers = [];

  for (let i = 0; i < players.length; i++) {
    const p1 = players[i];
    if (!p1.isAlive) continue;

    for (let j = i + 1; j < players.length; j++) {
      const p2 = players[j];
      if (!p2.isAlive) continue;

      const INFLATE = 2;
      if (circlesOverlap(
            p1.x, p1.y, effectiveRadius(p1) + INFLATE,
            p2.x, p2.y, effectiveRadius(p2) + INFLATE
          )) {

        if (canEat(p1, p2)) {
          const growthAmount = p2.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          growPlayer(p1, growthAmount);
          p2.isAlive = false;

          if (p2.isBot) {
            setTimeout(() => { if (gameState.players[p2.id]) respawnPlayer(p2); }, GAME_CONFIG.BOT_RESPAWN_DELAY_MS);
          } else {
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
          const growthAmount = p1.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          growPlayer(p2, growthAmount);
          p1.isAlive = false;

          if (p1.isBot) {
            setTimeout(() => { if (gameState.players[p1.id]) respawnPlayer(p1); }, GAME_CONFIG.BOT_RESPAWN_DELAY_MS);
          } else {
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

/** Crear nuevo orbe */
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
