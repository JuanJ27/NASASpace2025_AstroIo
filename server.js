/**
 * AstroIo - Enhanced Agar.io Clone Backend
 * 
 * Features:
 * - Timestamp-based 60 FPS game loop
 * - Player names with validation
 * - Delta updates for performance
 * - Optimized collision detection
 * - Enhanced error handling
 * - Comprehensive logging
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game Configuration
const GAME_CONFIG = {
  WORLD_WIDTH: 2000,
  WORLD_HEIGHT: 2000,
  NUM_ORBS: 200,
  ORB_SIZE: 5,
  PLAYER_INITIAL_SIZE: 20,
  MAX_PLAYERS: 5,
  TARGET_FPS: 60,
  UPDATE_INTERVAL: 1000 / 60, // 16.67ms
  BASE_SPEED: 5,
  EAT_SIZE_MULTIPLIER: 1.1,
  PLAYER_GROWTH_FROM_ORB: 1,
  PLAYER_GROWTH_FROM_PLAYER: 0.5,
  MAX_NAME_LENGTH: 20
};

// Game State
const gameState = {
  players: {},
  orbs: [],
  playerCount: 0,
  lastUpdate: Date.now()
};

// Orb ID counter for consistent tracking
let orbIdCounter = 0;

// Logging utility
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Append to test.log
  try {
    fs.appendFileSync(path.join(__dirname, 'test.log'), logMessage + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

/**
 * Validate player name
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  
  if (trimmed.length > GAME_CONFIG.MAX_NAME_LENGTH) {
    return { valid: false, error: `Name too long (max ${GAME_CONFIG.MAX_NAME_LENGTH} characters)` };
  }
  
  if (!/^[a-zA-Z0-9_\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, and underscores' };
  }
  
  return { valid: true, name: trimmed };
}

/**
 * Initialize game world with random orbs
 */
function initializeOrbs() {
  gameState.orbs = [];
  for (let i = 0; i < GAME_CONFIG.NUM_ORBS; i++) {
    gameState.orbs.push(createRandomOrb());
  }
  log(`Initialized ${GAME_CONFIG.NUM_ORBS} orbs`);
}

/**
 * Create a random orb at a random position
 */
function createRandomOrb() {
  return {
    id: `orb_${orbIdCounter++}`,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size: GAME_CONFIG.ORB_SIZE
  };
}

/**
 * Create a new player with random starting position
 */
function createPlayer(id, name = 'Player') {
  return {
    id: id,
    name: name,
    x: Math.random() * GAME_CONFIG.WORLD_WIDTH,
    y: Math.random() * GAME_CONFIG.WORLD_HEIGHT,
    size: GAME_CONFIG.PLAYER_INITIAL_SIZE,
    targetX: 0,
    targetY: 0,
    speed: GAME_CONFIG.BASE_SPEED,
    lastUpdate: Date.now()
  };
}

/**
 * Calculate movement speed based on player size
 */
function calculateSpeed(size) {
  return GAME_CONFIG.BASE_SPEED * (GAME_CONFIG.PLAYER_INITIAL_SIZE / size);
}

/**
 * Check if two circles overlap (collision detection)
 */
function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (r1 + r2);
}

/**
 * Optimized: Check if objects are within interaction distance
 */
function isNearby(x1, y1, x2, y2, maxDistance) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return (dx * dx + dy * dy) < (maxDistance * maxDistance);
}

/**
 * Update player position based on target (mouse position)
 */
function updatePlayerPosition(player, deltaTime) {
  if (!player) return;

  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > 5) {
    const speed = calculateSpeed(player.size);
    const normalizedDx = (dx / distance) * speed * (deltaTime / 16.67);
    const normalizedDy = (dy / distance) * speed * (deltaTime / 16.67);

    player.x += normalizedDx;
    player.y += normalizedDy;

    // Keep player within world bounds
    player.x = Math.max(player.size, Math.min(GAME_CONFIG.WORLD_WIDTH - player.size, player.x));
    player.y = Math.max(player.size, Math.min(GAME_CONFIG.WORLD_HEIGHT - player.size, player.y));
  }
}

/**
 * Check and handle player eating orbs (optimized with distance check)
 */
function checkOrbCollisions(player) {
  if (!player) return;

  const interactionRadius = player.size + 50; // Only check nearby orbs
  
  for (let i = gameState.orbs.length - 1; i >= 0; i--) {
    const orb = gameState.orbs[i];
    
    // Quick distance check first
    if (!isNearby(player.x, player.y, orb.x, orb.y, interactionRadius)) {
      continue;
    }
    
    // Precise collision check
    if (circlesOverlap(player.x, player.y, player.size, orb.x, orb.y, orb.size)) {
      player.size += GAME_CONFIG.PLAYER_GROWTH_FROM_ORB;
      gameState.orbs.splice(i, 1);
      gameState.orbs.push(createRandomOrb());
    }
  }
}

/**
 * Check and handle player eating other players (optimized)
 */
function checkPlayerCollisions() {
  const playerIds = Object.keys(gameState.players);
  
  for (let i = 0; i < playerIds.length; i++) {
    const player1 = gameState.players[playerIds[i]];
    if (!player1) continue;

    for (let j = i + 1; j < playerIds.length; j++) {
      const player2 = gameState.players[playerIds[j]];
      if (!player2) continue;

      // Quick distance check
      const maxDistance = player1.size + player2.size + 50;
      if (!isNearby(player1.x, player1.y, player2.x, player2.y, maxDistance)) {
        continue;
      }

      // Precise collision check
      if (circlesOverlap(player1.x, player1.y, player1.size, player2.x, player2.y, player2.size)) {
        if (player1.size >= player2.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER) {
          player1.size += player2.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          notifyPlayerEaten(player2.id, player2.name, player1.name);
          delete gameState.players[player2.id];
          gameState.playerCount--;
          log(`${player1.name} ate ${player2.name}`);
        } else if (player2.size >= player1.size * GAME_CONFIG.EAT_SIZE_MULTIPLIER) {
          player2.size += player1.size * GAME_CONFIG.PLAYER_GROWTH_FROM_PLAYER;
          notifyPlayerEaten(player1.id, player1.name, player2.name);
          delete gameState.players[player1.id];
          gameState.playerCount--;
          log(`${player2.name} ate ${player1.name}`);
        }
      }
    }
  }
}

/**
 * Notify a player that they've been eaten
 */
function notifyPlayerEaten(playerId, playerName, eatenBy) {
  io.to(playerId).emit('gameOver', {
    message: `You were eaten by ${eatenBy}!`,
    eatenBy: eatenBy
  });
}

/**
 * Timestamp-based game loop for precise 60 FPS
 */
let lastLoopTime = Date.now();
let frameCount = 0;
let fpsUpdateTime = Date.now();

// Track last state for delta updates
let lastState = {
  players: {},
  orbs: []
};

function gameLoop() {
  const now = Date.now();
  try {
    const deltaTime = now - lastLoopTime;
    lastLoopTime = now;

    // Update FPS counter
    frameCount++;
    if (now - fpsUpdateTime >= 1000) {
      // log(`FPS: ${frameCount}`, 'debug');
      frameCount = 0;
      fpsUpdateTime = now;
    }

    // Update all player positions
    Object.values(gameState.players).forEach(player => {
      updatePlayerPosition(player, deltaTime);
      checkOrbCollisions(player);
    });

    // Check player vs player collisions
    checkPlayerCollisions();

    // Calculate delta updates (only send changed data)
    const delta = {
      players: {},
      orbs: [],
      removedOrbs: [],
      removedPlayers: []
    };

    // Find changed or new players
    Object.entries(gameState.players).forEach(([id, player]) => {
      const lastPlayer = lastState.players[id];
      if (!lastPlayer ||
          lastPlayer.x !== player.x ||
          lastPlayer.y !== player.y ||
          lastPlayer.size !== player.size ||
          lastPlayer.name !== player.name ||
          lastPlayer.targetX !== player.targetX ||
          lastPlayer.targetY !== player.targetY) {
        delta.players[id] = { ...player };
      }
    });

    // Find removed players
    Object.keys(lastState.players).forEach(id => {
      if (!gameState.players[id]) {
        delta.removedPlayers.push(id);
      }
    });

    // Find changed or new orbs (by comparing IDs)
    const lastOrbMap = new Map(lastState.orbs.map(o => [o.id, o]));
    const currentOrbMap = new Map(gameState.orbs.map(o => [o.id, o]));
    
    gameState.orbs.forEach(orb => {
      const lastOrb = lastOrbMap.get(orb.id);
      if (!lastOrb) {
        // New orb
        delta.orbs.push({ ...orb });
      }
    });

    // Find removed orbs
    lastState.orbs.forEach(orb => {
      if (!currentOrbMap.has(orb.id)) {
        delta.removedOrbs.push(orb.id);
      }
    });

    // Only broadcast if there are changes
    if (Object.keys(delta.players).length > 0 || 
        delta.orbs.length > 0 || 
        delta.removedOrbs.length > 0 ||
        delta.removedPlayers.length > 0) {
      io.emit('gameState', delta);
    }

    // Update lastState with deep copies
    lastState.players = JSON.parse(JSON.stringify(gameState.players));
    lastState.orbs = JSON.parse(JSON.stringify(gameState.orbs));

  } catch (error) {
    log(`Error in game loop: ${error.message}`, 'error');
    console.error(error);
  }

  // Schedule next frame for precise timing
  const elapsed = Date.now() - now;
  const nextFrameDelay = Math.max(0, GAME_CONFIG.UPDATE_INTERVAL - elapsed);
  setTimeout(gameLoop, nextFrameDelay);
}

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  log(`Player connected: ${socket.id}`);

  // Check if game is full
  if (gameState.playerCount >= GAME_CONFIG.MAX_PLAYERS) {
    socket.emit('gameFull', { message: 'Game is full. Maximum 5 players allowed.' });
    socket.disconnect();
    log(`Connection rejected (game full): ${socket.id}`, 'warn');
    return;
  }

  // Store socket reference for name validation
  let playerName = 'Player';
  let playerInitialized = false;

  // Handle name setting
  socket.on('setName', (name) => {
    try {
      const validation = validateName(name);
      
      if (!validation.valid) {
        log(`Invalid name from ${socket.id}: ${validation.error}`, 'warn');
        socket.emit('nameError', { error: validation.error });
        return;
      }

      playerName = validation.name;
      
      // Create player with validated name
      const player = createPlayer(socket.id, playerName);
      gameState.players[socket.id] = player;
      gameState.playerCount++;
      playerInitialized = true;

      // Send initial game config to client
      socket.emit('init', {
        playerId: socket.id,
        worldWidth: GAME_CONFIG.WORLD_WIDTH,
        worldHeight: GAME_CONFIG.WORLD_HEIGHT
      });

      log(`Player joined: ${playerName} (${socket.id}) - Total: ${gameState.playerCount}`);
    } catch (error) {
      log(`Error setting name for ${socket.id}: ${error.message}`, 'error');
    }
  });

  // Handle player movement input
  socket.on('move', (data) => {
    try {
      const player = gameState.players[socket.id];
      if (player && data && typeof data.x === 'number' && typeof data.y === 'number') {
        // Validate coordinates are within reasonable bounds
        if (data.x >= 0 && data.x <= GAME_CONFIG.WORLD_WIDTH && 
            data.y >= 0 && data.y <= GAME_CONFIG.WORLD_HEIGHT) {
          player.targetX = data.x;
          player.targetY = data.y;
        }
      }
    } catch (error) {
      log(`Error handling move for ${socket.id}: ${error.message}`, 'error');
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    log(`Player disconnected: ${playerName} (${socket.id})`);
    if (gameState.players[socket.id]) {
      delete gameState.players[socket.id];
      gameState.playerCount--;
      log(`Player removed: ${playerName} - Total: ${gameState.playerCount}`);
    }
  });
});

// Initialize game
initializeOrbs();

// Start timestamp-based game loop
log('Starting game loop with timestamp-based 60 FPS');
setTimeout(gameLoop, GAME_CONFIG.UPDATE_INTERVAL);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`=== AstroIo Server Started ===`);
  log(`Port: ${PORT}`);
  log(`World: ${GAME_CONFIG.WORLD_WIDTH}x${GAME_CONFIG.WORLD_HEIGHT}`);
  log(`Max Players: ${GAME_CONFIG.MAX_PLAYERS}`);
  log(`Target FPS: ${GAME_CONFIG.TARGET_FPS}`);
  log(`URL: http://localhost:${PORT}`);
  log(`=============================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('Server shutting down...');
  server.close(() => {
    log('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`, 'error');
  console.error(reason);
});
