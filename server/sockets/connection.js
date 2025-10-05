const { gameState, GAME_CONFIG } = require('../core/gameState');
const { createPlayer } = require('../core/player');

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

  // inside io.on('connection', socket => { ... }) or your connection handler:
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