const { gameState, GAME_CONFIG } = require('../core/gameState');
const { createPlayer } = require('../core/player');
const { spawnSupercumuloBots } = require('../core/bots'); // ⭐ IMPORTAR NUEVA FUNCIÓN

// helper clamp (top of file or reuse existing one)
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function handleConnection(io, socket) {
  console.log(`Player connected: ${socket.id}`);

  if (gameState.humanCount >= GAME_CONFIG.MAX_HUMAN_PLAYERS) {
    socket.emit('gameFull', { 
      message: 'Game is full. Maximum 5 players allowed.' 
    });
    socket.disconnect();
    console.warn(`Connection rejected (game full): ${socket.id}`);
    return;
  }

  let playerName = 'Player';

  // Set name
  socket.on('setName', (name) => {
    const validation = validateName(name);
    if (!validation.valid) {
      socket.emit('nameError', { error: validation.error });
      return;
    }
    
    playerName = validation.name;
    const player = createPlayer(socket.id, playerName);
    gameState.players[socket.id] = player;
    gameState.humanCount++;

    socket.emit('init', {
      playerId: socket.id,
      worldWidth: GAME_CONFIG.WORLD_WIDTH,
      worldHeight: GAME_CONFIG.WORLD_HEIGHT
    });

    console.log(`Player joined: ${playerName} (${socket.id})`);
  });

  // Quantum Tunnel
  socket.on('quantumTunnel', (payload = {}) => {
    try {
      const p = gameState.players[socket.id];
      if (!p || p.isAlive === false) return;

      const to = payload.to || {};
      const W = GAME_CONFIG.WORLD_WIDTH;
      const H = GAME_CONFIG.WORLD_HEIGHT;

      // simple rate limit (avoid abuse & spam)
      const now = Date.now();
      if (p._lastTeleportAt && (now - p._lastTeleportAt) < 800) return; // 0.8s min gap
      p._lastTeleportAt = now;

      // snap
      p.x = clamp(to.x ?? p.x, 0, W);
      p.y = clamp(to.y ?? p.y, 0, H);
      // stop any velocity to avoid jitter back toward old path
      p.vx = 0;
      p.vy = 0;

      // optionally: mark dirty immediately if you have a dirty-flag system
      // otherwise the main game loop will include this in the next delta
    } catch (e) {
      console.warn('quantumTunnel handler error:', e);
    }
  });

  // ⭐ NUEVO EVENTO: Spawn de bots de Supercúmulo
  socket.on('reachedSupercumulo', (data) => {
    try {
      const player = gameState.players[socket.id];
      if (!player || !player.isAlive) {
        console.warn(`❌ Player ${socket.id} not found or not alive`);
        return;
      }

      // Verificar que realmente llegó a 200
      if (player.size < 200) {
        console.warn(`⚠️ Player ${player.name} tried to spawn bots at size ${player.size} (< 200)`);
        return;
      }

      // Verificar que no haya spawneado ya (evitar spam)
      if (player._supercumuloBotsSpawned) {
        console.warn(`⚠️ Player ${player.name} already spawned Supercumulo bots`);
        return;
      }

      console.log(`🌌 Player ${player.name} reached Supercumulo (size: ${player.size})`);

      // Spawnear los 4 bots
      const spawnResult = spawnSupercumuloBots(socket.id);

      // Marcar como ya spawneado
      player._supercumuloBotsSpawned = true;

      // ⭐ NUEVO: Activar evento de atracción gravitacional
      gameState.gravitationalEvent = {
        active: true,
        center: spawnResult.diamondCenter,
        startTime: Date.now(),
        duration: 5000, // 5 segundos de atracción
        attractionRadius: 70, // Radio de detención (pixels)
        attractionSpeed: 150 // Velocidad de atracción (pixels/segundo)
      };

      // ⭐⭐⭐ AGREGAR ESTO AQUÍ ⭐⭐⭐
      // Eliminar todos los bots normales (no estáticos)
      let botsRemoved = 0;
      Object.keys(gameState.players).forEach(playerId => {
        const p = gameState.players[playerId];
        if (p.isBot && !p.isStaticBot && !p.isSupercumuloBot) {
          delete gameState.players[playerId];
          botsRemoved++;
        }
      });
      console.log(`🗑️ Removed ${botsRemoved} normal bots for gravitational event`);

      // Marcar que no se deben generar más bots
      gameState._botsDisabled = true;
      // ⭐⭐⭐ FIN DEL CÓDIGO NUEVO ⭐⭐⭐

      // Enviar evento a TODOS los clientes
      io.emit('gravitationalPull', {
        center: spawnResult.diamondCenter,
        duration: 5000,
        message: '🌌 Gravitational anomaly detected! All units being pulled...'
      });

      // Enviar confirmación al cliente
      socket.emit('supercumuloBotsSpawned', {
        success: true,
        bots: spawnResult.bots,
        corner: spawnResult.corner,
        message: `4 Cluster Bots spawned at ${spawnResult.corner.name}`
      });

      console.log(`✅ Supercumulo bots spawned successfully for ${player.name}`);
      console.log(`🌀 Gravitational event activated at (${spawnResult.diamondCenter.x}, ${spawnResult.diamondCenter.y})`);

    } catch (e) {
      console.error('❌ reachedSupercumulo handler error:', e);
      socket.emit('supercumuloBotsSpawned', {
        success: false,
        error: e.message
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id];
      gameState.humanCount = Math.max(0, gameState.humanCount - 1);
      console.log(`Player removed: ${playerName}`);
    }
  });
}

function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (trimmed.length > GAME_CONFIG.MAX_NAME_LENGTH) {
    return { valid: false, error: `Name too long (max ${GAME_CONFIG.MAX_NAME_LENGTH})` };
  }
  if (!/^[a-zA-Z0-9_\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, and underscores' };
  }
  return { valid: true, name: trimmed };
}

module.exports = { handleConnection };